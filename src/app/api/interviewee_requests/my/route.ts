export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const visitorPool = await getVisitorDbConnection();

        // The osName field stores the user's name or email from their session
        const osNameMatch1 = (session.user as any).full_name || '';
        const osNameMatch2 = (session.user as any).username || '';
        const osNameMatch3 = session.user.email || '';

        let whereClause = 'WHERE (r."osName" = $1 OR r."osName" = $2 OR r."osName" = $3)';
        const queryParams: any[] = [osNameMatch1, osNameMatch2, osNameMatch3];
        let paramCount = 3;

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

        if (search) {
            whereClause += ` AND (r."visitorCode" ILIKE $${paramCount+1} OR r."intervieweeName" ILIKE $${paramCount+1})`;
            queryParams.push(`%${search}%`);
            paramCount++;
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
                r."editCount" as edit_count,
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
        console.error('Fetch my interviewee requests error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
