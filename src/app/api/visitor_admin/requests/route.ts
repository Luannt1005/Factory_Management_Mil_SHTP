export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import type { PoolClient } from 'pg';
import type { Session } from 'next-auth';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { hasPageAccess } from '@/lib/auth-server';
import { isVisitorAdmin } from '@/utils/visitorRoles';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await hasPageAccess('/visitoradmin'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;
        const category = searchParams.get('category');
        const tab = searchParams.get('tab');
        const code = searchParams.get('code');
        const status = searchParams.get('status');
        const site = searchParams.get('site');
        const submitter = searchParams.get('submitter');
        const completeStartDate = searchParams.get('completeStartDate');
        const completeEndDate = searchParams.get('completeEndDate');
        const isExport = limit > 1000; // if limit is very high, it's likely an export

        const visitorPool = await getVisitorDbConnection();

        let whereClause = '';
        const conditions: string[] = [];
        const queryParams: (string | number | string[])[] = [];
        let paramCount = 1;

        if (startDate && endDate) {
            conditions.push(`(r."startDate"::date <= $${paramCount + 1}::date AND r."endDate"::date >= $${paramCount}::date)`);
            queryParams.push(startDate, endDate);
            paramCount += 2;
        } else if (startDate) {
            conditions.push(`r."startDate"::date = $${paramCount}::date`);
            queryParams.push(startDate);
            paramCount += 1;
        } else if (endDate) {
            conditions.push(`r."startDate"::date = $${paramCount}::date`);
            queryParams.push(endDate);
            paramCount += 1;
        }

        if (tab === 'interviewee' || category === 'Interviewee') {
            conditions.push(`r."visitorCategory" = 'Interviewee'`);
        } else if (category && category !== 'All') {
            const catList = category.split(',').map(c => c.trim()).filter(Boolean);
            if (catList.length === 1) {
                if (catList[0] === 'Vendor' || catList[0] === 'Contractor') {
                    conditions.push(`(r."visitorCategory" = $${paramCount} OR r."visitorCategory" = 'Vendor/Contractor')`);
                    queryParams.push(catList[0]);
                    paramCount += 1;
                } else {
                    conditions.push(`r."visitorCategory" = $${paramCount}`);
                    queryParams.push(catList[0]);
                    paramCount += 1;
                }
            } else if (catList.length > 1) {
                const expanded = new Set(catList);
                if (catList.includes('Vendor') || catList.includes('Contractor')) {
                    expanded.add('Vendor/Contractor');
                }
                const finalList = Array.from(expanded);
                const placeholders = finalList.map((_, i) => `$${paramCount + i}`).join(', ');
                conditions.push(`r."visitorCategory" IN (${placeholders})`);
                queryParams.push(...finalList);
                paramCount += finalList.length;
            }
        } else {
            // Default (tab=general or unspecified): filter out Interviewee
            conditions.push(`r."visitorCategory" != 'Interviewee'`);
        }

        if (code) {
            conditions.push(`CAST(r.id AS TEXT) ILIKE $${paramCount}`);
            queryParams.push(`${code}%`);
            paramCount += 1;
        }

        if (submitter && submitter.trim()) {
            conditions.push(`(p.name ILIKE $${paramCount} OR p.email ILIKE $${paramCount} OR p.department ILIKE $${paramCount})`);
            queryParams.push(`%${submitter.trim()}%`);
            paramCount += 1;
        }

        if (status && status !== 'All') {
            const statusList = status.split(',').map(s => s.trim()).filter(Boolean);
            if (statusList.length === 1) {
                conditions.push(`r.status = $${paramCount}`);
                queryParams.push(statusList[0]);
                paramCount += 1;
            } else if (statusList.length > 1) {
                const placeholders = statusList.map((_, i) => `$${paramCount + i}`).join(', ');
                conditions.push(`r.status IN (${placeholders})`);
                queryParams.push(...statusList);
                paramCount += statusList.length;
            }
        }

        if (site && site !== 'All') {
            const siteList = site.split(',').map(s => s.trim()).filter(Boolean);
            if (siteList.length > 0) {
                const siteConds: string[] = [];
                for (const s of siteList) {
                    if (s === 'SHTP') {
                        siteConds.push(`(r."visitingSite" = $${paramCount} OR r."visitingSite" = 'SHTP/DDK')`);
                        queryParams.push('SHTP');
                        paramCount += 1;
                    } else if (s === 'DDK') {
                        siteConds.push(`(r."visitingSite" = $${paramCount} OR r."visitingSite" = 'SHTP/DDK')`);
                        queryParams.push('DDK');
                        paramCount += 1;
                    } else {
                        siteConds.push(`r."visitingSite" = $${paramCount}`);
                        queryParams.push(s);
                        paramCount += 1;
                    }
                }
                conditions.push(`(${siteConds.join(' OR ')})`);
            }
        }

        if (completeStartDate && completeEndDate) {
            conditions.push(`r.status IN ('COMPLETE', 'APPROVED') AND (r."updatedAt"::date >= $${paramCount}::date AND r."updatedAt"::date <= $${paramCount + 1}::date)`);
            queryParams.push(completeStartDate, completeEndDate);
            paramCount += 2;
        } else if (completeStartDate) {
            conditions.push(`r.status IN ('COMPLETE', 'APPROVED') AND (r."updatedAt"::date = $${paramCount}::date)`);
            queryParams.push(completeStartDate);
            paramCount += 1;
        } else if (completeEndDate) {
            conditions.push(`r.status IN ('COMPLETE', 'APPROVED') AND (r."updatedAt"::date <= $${paramCount}::date)`);
            queryParams.push(completeEndDate);
            paramCount += 1;
        }

        if (conditions.length > 0) {
            whereClause = `WHERE ${conditions.join(' AND ')}`;
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) FROM "VisitorRequest" r LEFT JOIN "User" p ON r."submitterId" = p.id ${whereClause}`;
        const { rows: countRows } = await visitorPool.query(countQuery, queryParams);
        const total = parseInt(countRows[0].count);

        const mainQuery = `
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
                r.power_automate_run_id,
                r."createdAt" as created_at,
                r."updatedAt" as updated_at,
                p.name as profile_name,
                p.department as profile_department,
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
            LEFT JOIN "User" p ON r."submitterId" = p.id
            ${whereClause}
            ORDER BY r."createdAt" DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        queryParams.push(limit, offset);

        const { rows } = await visitorPool.query(mainQuery, queryParams);

        // Format for the frontend
        const formattedRows = rows.map(r => ({
            ...r,
            profiles: { name: r.profile_name, department: r.profile_department }
        }));

        return NextResponse.json({
            requests: formattedRows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Fetch requests error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

const formatEmail = (emailOrUsername?: string | null) => {
    if (!emailOrUsername) return '';
    if (emailOrUsername.includes('@')) return emailOrUsername;
    return `${emailOrUsername}@ttigroup.com.vn`;
};

const buildPowerAutomateRunUrl = (runId?: string | null) => {
    if (!runId) return null;
    return `https://make.powerautomate.com/environments/Default-8b8cc6cf-0eaa-4b64-98e4-6d4672c44930/flows/bffa6e65-ca94-43ee-8416-f14054f729a5/runs/${runId}`;
};

async function sendAdminDecisionWebhook(
    visitorPool: Pick<PoolClient, 'query'>,
    requestId: string,
    decision: string,
    adminUser: Session['user']
) {
    const webhookUrl = process.env.POWER_AUTOMATE_ADMIN_DECISION_URL ||
        'https://default8b8cc6cf0eaa4b6498e46d4672c449.30.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/10/workflows/5bfc3984ba1f44fa965ef3fe5fd2547a/triggers/manual/paths/invoke?api-version=1';

    if (!webhookUrl) return;

    try {
        const { rows: reqRows } = await visitorPool.query(`
            SELECT r.*, u.name as submitter_name, u.email as submitter_email, u.department as submitter_dept
            FROM "VisitorRequest" r
            LEFT JOIN "User" u ON r."submitterId" = u.id
            WHERE r.id = $1
        `, [requestId]);

        if (reqRows.length === 0) return;
        const req = reqRows[0];

        const { rows: appRows } = await visitorPool.query<{ status: string; approverEmail: string; room_name: string | null }>(`
            SELECT ra.status, ra."approverEmail", rm.name as room_name
            FROM "RequestApproval" ra
            LEFT JOIN "RoomArea" rm ON ra."roomAreaId" = rm.id
            WHERE ra."requestId" = $1
        `, [requestId]);

        let parsedVisitors: unknown[] = [];
        try {
            if (typeof req.visitors === 'string') {
                parsedVisitors = JSON.parse(req.visitors);
            } else if (Array.isArray(req.visitors)) {
                parsedVisitors = req.visitors;
            }
        } catch {
            parsedVisitors = [];
        }

        const runId = req.power_automate_run_id || null;
        const runUrl = buildPowerAutomateRunUrl(runId);
        const submitterEmail = formatEmail(req.submitter_email || req.submitterId);

        const payload = {
            event: 'ADMIN_DECISION',
            action: decision,
            status: decision,
            requestId: req.id,
            power_automate_run_id: runId,
            power_automate_run_url: runUrl,
            submitter: {
                id: req.submitterId || '',
                name: req.submitter_name || req.submitterId || 'User',
                email: submitterEmail,
                department: req.submitter_dept || ''
            },
            visitorDetails: {
                visitorName: req.visitorName || '',
                visitorTitle: req.visitorTitle || '',
                currentCompany: req.currentCompany || '',
                visitorCategory: req.visitorCategory || '',
                visitingSite: req.visitingSite || '',
                startDate: req.startDate ? req.startDate.toString() : '',
                endDate: req.endDate ? req.endDate.toString() : '',
                purposeOfVisit: req.purposeOfVisit || '',
                purposeDetail: req.purposeDetail || '',
                totalVisitors: (parsedVisitors && parsedVisitors.length > 0) ? parsedVisitors.length : 1
            },
            visitorsList: parsedVisitors,
            roomApprovals: appRows.map((a) => ({
                roomName: a.room_name || 'Host Department Approval',
                status: a.status,
                approverEmail: a.approverEmail
            })),
            adminDecision: {
                decision: decision,
                updatedBy: adminUser?.name || adminUser?.username || 'Admin',
                adminEmail: adminUser?.email || '',
                comment: '',
                updatedAt: new Date().toISOString()
            }
        };

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`[AdminDecision Webhook] Triggered for req ${requestId} (${decision}) - Status: ${res.status}`);
    } catch (error) {
        console.error('[AdminDecision Webhook] Failed to trigger Power Automate:', error);
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await hasPageAccess('/visitoradmin'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const visitorPool = await getVisitorDbConnection();
        const body = await request.json();
        const { id, type, ...updates } = body;

        if (type === 'ROOM_APPROVAL') {
            const { approvalId, status } = updates;
            // Dedicated client so BEGIN/COMMIT/ROLLBACK run on the same connection
            const client = await visitorPool.connect();
            try {
                await client.query('BEGIN');

                const { rows: approvalRows } = await client.query(
                    'UPDATE "RequestApproval" SET status=$1 WHERE id=$2 RETURNING "requestId"',
                    [status, approvalId]
                );

                if (approvalRows.length > 0) {
                    const reqId = approvalRows[0].requestId;

                    const { rows: allApps } = await client.query(
                        'SELECT status FROM "RequestApproval" WHERE "requestId"=$1',
                        [reqId]
                    );

                    if (allApps.length > 0) {
                        const anyApproved = allApps.some(a => a.status === 'APPROVED');
                        const allRejected = allApps.every(a => a.status === 'REJECTED');
                        const allDone = allApps.every(a => a.status === 'APPROVED' || a.status === 'REJECTED');

                        let finalStatus = 'IN PROCESS';
                        if (allDone) {
                            if (allRejected) finalStatus = 'REJECTED';
                            else if (anyApproved) finalStatus = 'COMPLETE';
                        }

                        await client.query(
                            'UPDATE "VisitorRequest" SET status=$1 WHERE id=$2',
                            [finalStatus, reqId]
                        );

                        if (allDone && (finalStatus === 'COMPLETE' || finalStatus === 'REJECTED' || finalStatus === 'APPROVED')) {
                            await sendAdminDecisionWebhook(client, reqId, finalStatus, session.user);
                        }
                    }
                }

                await client.query('COMMIT');
            } catch (txError) {
                await client.query('ROLLBACK').catch(() => {});
                throw txError;
            } finally {
                client.release();
            }
            return NextResponse.json({ message: 'Room status updated' });
        }

        // Direct request update
        // We only allow updating status right now from Admin page
        if (updates.status) {
            const { rows } = await visitorPool.query(
                'UPDATE "VisitorRequest" SET status=$1 WHERE id=$2 RETURNING *',
                [updates.status, id]
            );

            // Send webhook to Power Automate flow on Approve / Reject / Status update
            await sendAdminDecisionWebhook(visitorPool, id, updates.status, session.user);

            return NextResponse.json({ message: 'Request updated successfully', data: rows[0] }, { status: 200 });
        }

        return NextResponse.json({ message: 'Nothing updated' }, { status: 200 });

    } catch (err) {
        console.error('Update status error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Deleting requests is limited to Visitor admins (not Receptionist / Security)
        if (!(await hasPageAccess('/visitoradmin')) || !isVisitorAdmin(session.user)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        const visitorPool = await getVisitorDbConnection();

        // Use ANY array operator for postgres
        await visitorPool.query('DELETE FROM "VisitorRequest" WHERE id = ANY($1)', [ids]);

        return NextResponse.json({ message: 'Requests deleted successfully' }, { status: 200 });

    } catch (err) {
        console.error('Delete requests error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
