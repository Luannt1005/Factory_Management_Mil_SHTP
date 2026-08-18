export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { hasPageAccess } from '@/lib/auth-server';

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
        const code = searchParams.get('code');
        const status = searchParams.get('status');
        const isExport = limit > 1000; // if limit is very high, it's likely an export

        const visitorPool = await getVisitorDbConnection();

        let whereClause = '';
        const conditions: string[] = [];
        const queryParams: any[] = [];
        let paramCount = 1;

        if (startDate && endDate) {
            conditions.push(`(r."startDate" <= $${paramCount+1} AND r."endDate" >= $${paramCount})`);
            queryParams.push(startDate, endDate);
            paramCount += 2;
        }

        if (category) {
            conditions.push(`r."visitorCategory" = $${paramCount}`);
            queryParams.push(category);
            paramCount += 1;
        }

        if (code) {
            conditions.push(`CAST(r.id AS TEXT) ILIKE $${paramCount}`);
            queryParams.push(`${code}%`);
            paramCount += 1;
        }

        if (status) {
            conditions.push(`r.status = $${paramCount}`);
            queryParams.push(status);
            paramCount += 1;
        }

        if (conditions.length > 0) {
            whereClause = `WHERE ${conditions.join(' AND ')}`;
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) FROM "VisitorRequest" r ${whereClause}`;
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
            LIMIT $${paramCount} OFFSET $${paramCount+1}
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

    } catch (error: any) {
        console.error('Fetch requests error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
            await visitorPool.query('BEGIN');

            const { rows: approvalRows } = await visitorPool.query(
                'UPDATE "RequestApproval" SET status=$1 WHERE id=$2 RETURNING "requestId"',
                [status, approvalId]
            );

            if (approvalRows.length > 0) {
                const reqId = approvalRows[0].requestId;
                
                const { rows: allApps } = await visitorPool.query(
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

                    await visitorPool.query(
                        'UPDATE "VisitorRequest" SET status=$1 WHERE id=$2',
                        [finalStatus, reqId]
                    );

                }
            }

            await visitorPool.query('COMMIT');
            return NextResponse.json({ message: 'Room status updated' });
        }

        // Direct request update
        // We only allow updating status right now from Admin page
        if (updates.status) {
            const { rows } = await visitorPool.query(
                'UPDATE "VisitorRequest" SET status=$1 WHERE id=$2 RETURNING *',
                [updates.status, id]
            );



            return NextResponse.json({ message: 'Request updated successfully', data: rows[0] }, { status: 200 });
        }

        return NextResponse.json({ message: 'Nothing updated' }, { status: 200 });

    } catch (err: any) {
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

        if (!(await hasPageAccess('/visitoradmin'))) {
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

    } catch (err: any) {
        console.error('Delete requests error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
