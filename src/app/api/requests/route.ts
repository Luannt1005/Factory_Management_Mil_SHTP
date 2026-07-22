import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

async function getOrCreateVisitorProfile(user: any, visitorPool: any) {
    const email = user.username;
    const name = user.full_name || user.username;

    const { rows: profiles } = await visitorPool.query(
        'SELECT id FROM "User" WHERE email = $1',
        [email]
    );

    if (profiles.length > 0) return profiles[0].id;

    const role = user.role === 'admin' ? 'ADMIN' : 'USER';
    const { rows: newProfiles } = await visitorPool.query(
        `INSERT INTO "User" (id, email, name, password, role, department, "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, 'BRIDGE_AUTO_GENERATED', $3, 'AUTO_SYNC', NOW()) 
         RETURNING id`,
        [email, name, role]
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
            visitingSite, purposeDetail
        } = body;

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

        const { rows: visitorRequests } = await visitorPool.query(
            `INSERT INTO "VisitorRequest" 
             (id, "submitterId", "visitorName", "visitorTitle", "currentCompany", "startDate", "endDate", "purposeOfVisit", "visitorCategory", details, status, "updatedAt", "visitingSite", "purposeDetail", visitors)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'IN PROCESS', NOW(), $11, $12, $13)
             RETURNING id`,
            [newRequestId, submitterId, visitorName, visitorTitle, currentCompany, new Date(startDate), new Date(endDate), purposeOfVisit, visitorCategory, JSON.stringify(details), visitingSite, purposeDetail, JSON.stringify(visitors || [])]
        );

        const visitorRequestId = visitorRequests[0].id;

        const isExpat = visitorCategory === 'MIL/TTI Expat / SHTP Business trip';
        const powerAutomateUrl = process.env.POWER_AUTOMATE_FOR_LEAVE_URL;
        const powerAutomateVPUrl = process.env.POWER_AUTOMATE_VP_APPROVAL_URL;
        const powerAutomateNotificationUrl = process.env.POWER_AUTOMATE_EMAIL_NOTIFICATION_URL;

        if (isExpat && roomIds && roomIds.length > 0) {
            const { rows: allRoomsCountRow } = await visitorPool.query('SELECT COUNT(*) FROM "RoomArea"');
            const totalRooms = parseInt(allRoomsCountRow[0].count);
            const isVPApproval = (roomIds.length / totalRooms) > 0.6;

            const { rows: rooms } = await visitorPool.query(
                'SELECT id, name, "approverEmail" FROM "RoomArea" WHERE id = ANY($1::text[])',
                [roomIds]
            );

            // 1. Standard loop for each room (always run this)
            for (const room of rooms) {
                const { rows: approvalRows } = await visitorPool.query(
                    `INSERT INTO "RequestApproval" (id, "requestId", "roomAreaId", "approverEmail", status, "updatedAt")
                     VALUES (gen_random_uuid(), $1, $2, $3, 'PENDING', NOW())
                     RETURNING id`,
                    [visitorRequestId, room.id, room.approverEmail]
                );

                const approvalId = approvalRows[0].id;

                // Trigger Power Automate per room (department-specific approval)
                if (powerAutomateUrl) {
                    try {
                        await fetch(powerAutomateUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                record: {
                                    approval_id: approvalId,
                                    id: visitorRequestId,
                                    approver_email: room.approverEmail,
                                    room_name: room.name,
                                    visitor_name: visitorName + (visitors && visitors.length > 1 ? ` (+ ${visitors.length - 1} others)` : ''),
                                    visitorTitle: visitorTitle,
                                    currentCompany: currentCompany,
                                    startDate: startDate,
                                    endDate: endDate,
                                    purposeOfVisit: purposeOfVisit,
                                    submitterName: session.user.name || (session.user as any).username,
                                    visitorCategory: visitorCategory,
                                    submitterEmail: formatEmail((session.user as any).username || session.user.email),
                                    visitors_list: visitors
                                }
                            }),
                        });
                        console.log(`Power Automate triggered successfully for room: ${room.name} (${room.approverEmail})`);
                    } catch (paError) {
                        console.error(`Failed to trigger Power Automate for room ${room.name}:`, paError);
                    }
                }
            }

            // 2. If >60%, ALSO trigger for VP Lee Hon Kay
            if (isVPApproval && rooms.length > 0) {
                const vpEmail = 'Luan.Nguyen@ttigroup.com.vn';
                const { rows: approvalRows } = await visitorPool.query(
                    `INSERT INTO "RequestApproval" (id, "requestId", "roomAreaId", "approverEmail", status, "updatedAt")
                     VALUES (gen_random_uuid(), $1, $2, $3, 'PENDING', NOW())
                     RETURNING id`,
                    [visitorRequestId, null, vpEmail]
                );

                const approvalId = approvalRows[0].id;

                if (powerAutomateVPUrl) {
                    try {
                        await fetch(powerAutomateVPUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                record: {
                                    approval_id: approvalId,
                                    id: visitorRequestId,
                                    approver_email: vpEmail,
                                    room_name: 'Multiple Rooms (>60%)',
                                    visitor_name: visitorName + (visitors && visitors.length > 1 ? ` (+ ${visitors.length - 1} others)` : ''),
                                    visitorTitle: visitorTitle,
                                    currentCompany: currentCompany,
                                    startDate: startDate,
                                    endDate: endDate,
                                    purposeOfVisit: purposeOfVisit,
                                    submitterName: session.user.name || (session.user as any).username,
                                    visitorCategory: visitorCategory,
                                    submitterEmail: formatEmail((session.user as any).username || session.user.email),
                                    visitors_list: visitors
                                }
                            }),
                        });
                        console.log(`Power Automate triggered successfully for VP: ${vpEmail}`);
                    } catch (paError) {
                        console.error(`Failed to trigger Power Automate for VP ${vpEmail}:`, paError);
                    }
                } else {
                    console.log(`POWER_AUTOMATE_VP_APPROVAL_URL is not configured. VP email not sent.`);
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
                    await fetch(powerAutomateUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            record: {
                                approval_id: approvalId,
                                id: visitorRequestId,
                                record_type: 'approver_request',
                                approver_email: submitterEmail, // Will be overridden in Power Automate by Supervisor's email
                                room_name: `${visitorCategory} Approval (Supervisor)`,
                                visitor_name: visitorName + (visitors && visitors.length > 1 ? ` (+ ${visitors.length - 1} others)` : ''),
                                visitorTitle: visitorTitle,
                                currentCompany: currentCompany,
                                startDate: startDate,
                                endDate: endDate,
                                purposeOfVisit: purposeOfVisit,
                                submitterName: session.user.name || (session.user as any).username,
                                visitorCategory: visitorCategory,
                                submitterEmail: submitterEmail,
                                visitors_list: visitors
                            }
                        }),
                    });
                    console.log(`Power Automate triggered successfully for supervisor approval: ${submitterEmail}`);
                } catch (paError) {
                    console.error(`Failed to trigger Power Automate for supervisor approval:`, paError);
                }
            }
        }

        await visitorPool.query('COMMIT');

        // Trigger email notification webhook if configured
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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const visitorPool = await getVisitorDbConnection();
        const submitterId = await getOrCreateVisitorProfile(session.user, visitorPool);

        let whereClause = 'WHERE r."submitterId" = $1';
        const queryParams: any[] = [submitterId];
        let paramCount = 2;

        if (startDate && endDate) {
            whereClause += ` AND (r."startDate" <= $${paramCount+1} AND r."endDate" >= $${paramCount})`;
            queryParams.push(startDate, endDate);
            paramCount += 2;
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
