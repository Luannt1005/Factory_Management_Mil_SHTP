export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { hasPageAccess } from '@/lib/auth-server';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const code = searchParams.get('code');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const visitorPool = await getVisitorDbConnection();

        let whereClause = 'WHERE 1=1';
        const queryParams: any[] = [];
        let paramCount = 0;

        if (startDate && endDate) {
            whereClause += ` AND r."startDate"::date >= $${paramCount+1}::date AND r."startDate"::date <= $${paramCount+2}::date`;
            queryParams.push(startDate, endDate);
            paramCount += 2;
        } else if (startDate) {
            whereClause += ` AND r."startDate"::date >= $${paramCount+1}::date`;
            queryParams.push(startDate);
            paramCount += 1;
        } else if (endDate) {
            whereClause += ` AND r."startDate"::date <= $${paramCount+1}::date`;
            queryParams.push(endDate);
            paramCount += 1;
        }

        if (code) {
            whereClause += ` AND r."visitorCode" ILIKE $${paramCount+1}`;
            queryParams.push(`%${code}%`);
            paramCount += 1;
        }

        if (status) {
            whereClause += ` AND r.status = $${paramCount+1}`;
            queryParams.push(status);
            paramCount += 1;
        }

        const countQuery = `SELECT COUNT(*) FROM "IntervieweeRequest" r ${whereClause}`;
        const { rows: countRows } = await visitorPool.query(countQuery, queryParams);
        const total = parseInt(countRows[0].count);

        const { rows } = await visitorPool.query(`
            SELECT 
                r.id,
                r."visitorCode" as visitor_code,
                r."osName" as os_name,
                r."intervieweeName" as interviewee_name,
                r."jobTitle" as job_title,
                r."interviewDepartment" as interview_department,
                r."interviewerName" as interviewer_name,
                r."startDate" as start_date,
                r."startTime" as start_time,
                r."interviewArea" as interview_area,
                r.status,
                r."createdAt" as created_at
            FROM "IntervieweeRequest" r
            ${whereClause}
            ORDER BY r."createdAt" DESC
            LIMIT $${paramCount+1} OFFSET $${paramCount+2}
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
        console.error('Fetch interviewee requests error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const visitorPool = await getVisitorDbConnection();
        
        const { rowCount } = await visitorPool.query(
            'UPDATE "IntervieweeRequest" SET status=$1, "updatedAt"=NOW() WHERE id=$2',
            [status, id]
        );

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }



        return NextResponse.json({ message: 'Status updated successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Update interviewee request status error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
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
        
        await visitorPool.query('DELETE FROM "IntervieweeRequest" WHERE id = ANY($1)', [ids]);

        return NextResponse.json({ message: 'Requests deleted successfully' }, { status: 200 });

    } catch (err: any) {
        console.error('Delete interviewee requests error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
