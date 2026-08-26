export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

async function getOrCreateVisitorProfile(user: any, pool: any) {
    const email = formatEmail(user.email || user.username);
    if (!email) return null;
    
    const name = user.name || user.full_name || user.email || user.username || 'Unknown User';
    const role = user.role || 'USER';
    const department = user.department || 'Unknown';

    const { rows } = await pool.query(
        'SELECT id FROM "User" WHERE email = $1',
        [email]
    );

    if (rows.length > 0) {
        // Keep name and department in sync
        await pool.query(
            'UPDATE "User" SET department = $1, name = $2 WHERE id = $3',
            [department, name, rows[0].id]
        );
        return rows[0].id;
    }

    const { rows: newProfiles } = await pool.query(
        `INSERT INTO "User" (id, email, name, password, role, department, "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, 'BRIDGE_AUTO_GENERATED', $3, $4, NOW()) 
         RETURNING id`,
        [email, name, role, department]
    );

    return newProfiles[0].id;
}

const formatEmail = (email: string | null | undefined) => { if (!email || typeof email !== 'string') return 'unknown@ttigroup.com.vn'; return email.includes('@') ? email : `@ttigroup.com.vn`; };

export async function POST(request: Request) {
    let visitorPool;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const {
            visitors, startDate, endDate,
            purposeOfVisit, visitorCategory, details, roomIds,
            visitingSite, purposeDetail, functionalDept, department, bu
        } = body;

        // Enhance details with host department info
        const enhancedDetails = {
            ...details,
            bu: bu || null,
            functionalDept: functionalDept || null,
            department: department || null
        };

        const primaryVisitor = visitors && visitors.length > 0 ? visitors[0] : { name: '', title: '', company: '' };
        const visitorName = primaryVisitor.name;
        const visitorTitle = primaryVisitor.title;
        const currentCompany = primaryVisitor.company;

        visitorPool = await getVisitorDbConnection();

        await visitorPool.query('BEGIN');

        // Generate Custom ID with Prefix
        let catPrefix = 'V'; // Default for MIL / TTI EXPAT
        if (visitorCategory === 'Vendor') {
            catPrefix = 'VV';
        } else if (visitorCategory === 'Contractor') {
            catPrefix = 'VC';
        } else if (visitorCategory === 'Interviewee') {
            catPrefix = 'VI';
        }

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const datePrefix = `${catPrefix}${dd}${mm}${yy}`;

        // Find the last sequence for today
        const { rows: lastReq } = await visitorPool.query(
            `SELECT id FROM "VisitorRequest" WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`,
            [`${datePrefix}_%`]
        );

        let sequence = 1;
        if (lastReq.length > 0) {
            const lastId = lastReq[0].id;
            const lastSeqStr = lastId.split('_')[1];
            if (lastSeqStr) {
                sequence = parseInt(lastSeqStr) + 1;
            }
        }
        
        const newRequestId = `${datePrefix}_${String(sequence).padStart(2, '0')}`;

        const submitterId = await getOrCreateVisitorProfile(session.user, visitorPool);
        const isInterviewee = visitorCategory === 'Interviewee';
        const initialStatus = isInterviewee ? 'COMPLETE' : 'IN PROCESS';

        const { rows: visitorRequests } = await visitorPool.query(
            `INSERT INTO "VisitorRequest" 
             (id, "submitterId", "visitorName", "visitorTitle", "currentCompany", "startDate", "endDate", "purposeOfVisit", "visitorCategory", details, status, "updatedAt", "visitingSite", "purposeDetail", visitors)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12, $13, $14)
             RETURNING id`,
            [newRequestId, submitterId, visitorName, visitorTitle, currentCompany, new Date(startDate), new Date(endDate || startDate), purposeOfVisit || (isInterviewee ? 'Interview' : ''), visitorCategory, JSON.stringify(enhancedDetails), initialStatus, visitingSite, purposeDetail || '', JSON.stringify(visitors || [])]
        );

        const visitorRequestId = visitorRequests[0].id;

        const isExpat = visitorCategory === 'MIL/TTI Expat / SHTP Business trip';
        const powerAutomateUrl = process.env.POWER_AUTOMATE_FOR_LEAVE_URL;
        const powerAutomateVPUrl = process.env.POWER_AUTOMATE_VP_APPROVAL_URL;
        const powerAutomateNotificationUrl = process.env.POWER_AUTOMATE_EMAIL_NOTIFICATION_URL;

        if (isExpat && roomIds && roomIds.length > 0) {
            const { rows: allRoomsCountRow } = await visitorPool.query('SELECT COUNT(*) FROM "RoomArea" WHERE "isActive" = true');
            const totalRooms = parseInt(allRoomsCountRow[0].count);
            const isVPApproval = (roomIds.length / totalRooms) > 0.6;

            const { rows: rooms } = await visitorPool.query(
                'SELECT id, name, "approverEmail" FROM "RoomArea" WHERE id = ANY($1::text[])',
                [roomIds]
            );

            const roomsPayload = [];

            // Add Host Department Approvals if selected
            if (functionalDept && department) {
                const { rows: hostDepts } = await visitorPool.query(
                    'SELECT functional_host_email, department_host_email, functional_host_name, department_host_name FROM "HostDepartment" WHERE functional_dept = $1 AND department = $2 AND is_active = true LIMIT 1',
                    [functionalDept, department]
                );

                if (hostDepts.length > 0) {
                    const hostDept = hostDepts[0];
                    
                    // Functional Host Approval
                    if (hostDept.functional_host_email) {
                        const { rows: funcApprovalRows } = await visitorPool.query(
                            `INSERT INTO "RequestApproval" (id, "requestId", "roomAreaId", "approverEmail", status, "updatedAt")
                             VALUES (gen_random_uuid(), $1, NULL, $2, 'PENDING', NOW())
                             RETURNING id`,
                            [visitorRequestId, hostDept.functional_host_email]
                        );
                        roomsPayload.push({
                            approval_id: funcApprovalRows[0].id,
                            approver_email: hostDept.functional_host_email,
                            room_name: `Host: ${functionalDept} (${hostDept.functional_host_name})`
                        });
                    }

                    // Department Host Approval
                    if (hostDept.department_host_email) {
                        const { rows: deptApprovalRows } = await visitorPool.query(
                            `INSERT INTO "RequestApproval" (id, "requestId", "roomAreaId", "approverEmail", status, "updatedAt")
                             VALUES (gen_random_uuid(), $1, NULL, $2, 'PENDING', NOW())
                             RETURNING id`,
                            [visitorRequestId, hostDept.department_host_email]
                        );
                        roomsPayload.push({
                            approval_id: deptApprovalRows[0].id,
                            approver_email: hostDept.department_host_email,
                            room_name: `Host: ${department} (${hostDept.department_host_name})`
                        });
                    }
                }
            }

            // 1. Standard loop for each room (always run this)
            for (const room of rooms) {
                const { rows: approvalRows } = await visitorPool.query(
                    `INSERT INTO "RequestApproval" (id, "requestId", "roomAreaId", "approverEmail", status, "updatedAt")
                     VALUES (gen_random_uuid(), $1, $2, $3, 'PENDING', NOW())
                     RETURNING id`,
                    [visitorRequestId, room.id, room.approverEmail]
                );

                const approvalId = approvalRows[0].id;

                roomsPayload.push({
                    approval_id: approvalId,
                    approver_email: room.approverEmail,
                    room_name: room.name
                });
            }

            // Trigger Power Automate ONCE with payload containing rooms and VP variables
            if (powerAutomateUrl && roomsPayload.length > 0) {
                try {
                    await fetch(powerAutomateUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            requestDetails: {
                                id: visitorRequestId,
                                visitor_name: visitorName + (visitors && visitors.length > 1 ? ` (+ ${visitors.length - 1} others)` : ''),
                                visitorTitle: visitorTitle,
                                currentCompany: currentCompany,
                                startDate: startDate,
                                endDate: endDate,
                                purposeOfVisit: purposeOfVisit,
                                submitterName: session.user.name || (session.user as any).username,
                                submitterEmail: formatEmail((session.user as any).username || session.user.email),
                                visitorCategory: visitorCategory,
                                visitors_list: visitors,
                                is_vp_approval: (isVPApproval && rooms.length > 0) ? true : false,
                                visitingSite: visitingSite || "",
                                mealRegistration: details?.mealRegistration || "",
                                costCenter: details?.costCenter || ""
                            },
                            rooms: roomsPayload
                        }),
                    });
                    console.log(`Power Automate triggered successfully for unified room approval.`);
                } catch (paError) {
                    console.error(`Failed to trigger unified Power Automate:`, paError);
                }
            }
        } else if (isInterviewee) {
            // Direct notification for Interviewee (No approval required)
            const hookUrl = powerAutomateUrl || powerAutomateNotificationUrl;
            if (hookUrl) {
                try {
                    const namesList = (visitors && visitors.length > 0) ? visitors.map((v: any) => v.name).join(', ') : visitorName;
                    const titlesList = (visitors && visitors.length > 0) ? visitors.map((v: any) => `${v.name} (${v.title || 'Candidate'} - ${v.interviewDepartment || v.company || ''})`).join('; ') : `${visitorName} (${visitorTitle})`;
                    const paResponse = await fetch(hookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            requestDetails: {
                                id: visitorRequestId,
                                visitor_name: namesList,
                                visitorTitle: titlesList,
                                currentCompany: currentCompany || "Candidate",
                                startDate: startDate,
                                endDate: endDate || startDate,
                                purposeOfVisit: "Interview",
                                submitterName: session.user.name || (session.user as any).username,
                                submitterEmail: formatEmail(session.user.email || (session.user as any).username),
                                visitorCategory: 'Interviewee',
                                visitors_list: visitors,
                                is_vp_approval: false,
                                visitingSite: visitingSite || "",
                                mealRegistration: enhancedDetails?.mealRegistration || "",
                                costCenter: enhancedDetails?.costCenter || "",
                                interviewerName: visitors?.[0]?.interviewerName || '',
                                startTime: enhancedDetails?.startTime || '',
                                interviewArea: purposeDetail || enhancedDetails?.interviewArea || '',
                                interviewDepartment: visitors?.[0]?.interviewDepartment || ''
                            },
                            rooms: []
                        })
                    });
                    if (!paResponse.ok) {
                        const errText = await paResponse.text();
                        console.error(`Power Automate returned error ${paResponse.status} for Interviewee:`, errText);
                    } else {
                        console.log(`Power Automate triggered successfully for Interviewee: ${visitorRequestId}`);
                    }
                } catch (e) {
                    console.error('Failed to notify Power Automate for interviewee group request:', e);
                }
            }
        } else if (!isExpat) {
            // For Vendor, Contractor, etc., insert a single approval record for Supervisor Approval
            const submitterEmail = formatEmail((session.user as any).username || session.user.email);
            const { rows: approvalRows } = await visitorPool.query(
                `INSERT INTO "RequestApproval" (id, "requestId", "roomAreaId", "approverEmail", status, "updatedAt")
                 VALUES (gen_random_uuid(), $1, NULL, $2, 'PENDING', NOW())
                 RETURNING id`,
                [visitorRequestId, submitterEmail] // Initially set to submitter's email, will be routed to manager in Power Automate
            );

            const approvalId = approvalRows[0].id;

            if (powerAutomateUrl) {
                try {
                    const paResponse = await fetch(powerAutomateUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            requestDetails: {
                                id: visitorRequestId,
                                visitor_name: visitorName + (visitors && visitors.length > 1 ? ` (+ ${visitors.length - 1} others)` : ''),
                                visitorTitle: visitorTitle,
                                currentCompany: currentCompany,
                                startDate: startDate,
                                endDate: endDate,
                                purposeOfVisit: purposeOfVisit,
                                submitterName: session.user.name || (session.user as any).username,
                                visitorCategory: visitorCategory,
                                submitterEmail: submitterEmail,
                                visitors_list: visitors,
                                is_vp_approval: false,
                                visitingSite: visitingSite || "",
                                mealRegistration: details?.mealRegistration || "",
                                costCenter: details?.costCenter || ""
                            },
                            rooms: [
                                {
                                    approval_id: approvalId,
                                    approver_email: submitterEmail,
                                    room_name: `${visitorCategory} Approval (Supervisor)`
                                }
                            ]
                        }),
                    });
                    if (!paResponse.ok) {
                        const errText = await paResponse.text();
                        console.error(`Power Automate returned error ${paResponse.status} for Vendor/Contractor:`, errText);
                    } else {
                        console.log(`Power Automate triggered successfully for supervisor approval: ${submitterEmail}`);
                    }
                } catch (paError) {
                    console.error(`Failed to trigger Power Automate for supervisor approval:`, paError);
                }
            }
        }

        await visitorPool.query('COMMIT');

        // Trigger email notification webhook if configured
        /*
        if (powerAutomateNotificationUrl) {
            try {
                const paResponse = await fetch(powerAutomateNotificationUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        record_type: 'new_request_notification',
                        request_id: newRequestId,
                        visitor_category: visitorCategory,
                        submitter_name: session.user.name || (session.user as any).username || session.user.email,
                        submitter_email: formatEmail(session.user.email || (session.user as any).username),
                        start_date: startDate,
                        end_date: endDate,
                        visitor_name: visitorName,
                        company: currentCompany
                    })
                });
                if (!paResponse.ok) {
                    console.error('Power Automate Email Hook Failed:', paResponse.status, await paResponse.text());
                } else {
                    console.log('Email notification sent successfully to Power Automate.');
                }
            } catch (e) {
                console.error('Failed to trigger notification webhook:', e);
            }
        }
        */

        return NextResponse.json({ message: 'Request created successfully', id: visitorRequestId }, { status: 201 });

    } catch (error: any) {
        if (visitorPool) await visitorPool.query('ROLLBACK');
        console.error('Create request error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search');
        const tab = searchParams.get('tab');
        const category = searchParams.get('category');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const visitorPool = await getVisitorDbConnection();
        const submitterId = await getOrCreateVisitorProfile(session.user, visitorPool);

        let whereClause = 'WHERE r."submitterId" = $1';
        const queryParams: any[] = [submitterId];
        let paramCount = 2;

        if (tab === 'interviewee' || category === 'Interviewee') {
            whereClause += ` AND r."visitorCategory" = 'Interviewee'`;
        } else if (tab === 'general') {
            whereClause += ` AND r."visitorCategory" != 'Interviewee'`;
        }

        if (startDate && endDate) {
            whereClause += ` AND (r."startDate" <= $${paramCount+1} AND r."endDate" >= $${paramCount})`;
            queryParams.push(startDate, endDate);
            paramCount += 2;
        }

        if (search) {
            whereClause += ` AND (r.id ILIKE $${paramCount} OR r."visitorName" ILIKE $${paramCount} OR r."currentCompany" ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
            paramCount++;
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) FROM "VisitorRequest" r ${whereClause}`;
        const { rows: countRows } = await visitorPool.query(countQuery, queryParams);
        const total = parseInt(countRows[0].count);

        // Fetch requests for this submitter with approvals
        const { rows } = await visitorPool.query(`
            SELECT 
                r.id,
                r.status,
                r."visitorName" as visitor_name,
                r."visitorTitle" as visitor_title,
                r."currentCompany" as current_company,
                r."startDate" as start_date,
                r."endDate" as end_date,
                r."purposeOfVisit" as purpose_of_visit,
                r."visitorCategory" as visitor_category,
                r."visitingSite" as visiting_site,
                r."purposeDetail" as purpose_detail,
                r.details,
                r.visitors,
                r."createdAt" as created_at,
                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', a.id,
                            'status', a.status,
                            'approver_email', a."approverEmail",
                            'room_areas', CASE WHEN ra.id IS NOT NULL THEN json_build_object('name', ra.name, 'category', ra.category) ELSE NULL END
                        )
                    ), '[]'::json)
                    FROM "RequestApproval" a
                    LEFT JOIN "RoomArea" ra ON a."roomAreaId" = ra.id
                    WHERE a."requestId" = r.id
                ) as request_approvals
            FROM "VisitorRequest" r
            ${whereClause}
            ORDER BY r."createdAt" DESC
            LIMIT $${paramCount} OFFSET $${paramCount+1}
        `, [...queryParams, limit, offset]);

        return NextResponse.json({ 
            requests: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch requests error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
