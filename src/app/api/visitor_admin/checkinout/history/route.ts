import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if ((session.user as any).role !== 'admin' && (session.user as any).visitor_role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date'); // YYYY-MM-DD
        const category = searchParams.get('category');
        const search = searchParams.get('search'); // Request ID or submitter name
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '15');
        const offset = (page - 1) * limit;

        const visitorPool = await getVisitorDbConnection();

const combinedRequestsCTE = `WITH CombinedRequests AS (
    SELECT 
        r.id::text AS "requestId",
        r.id::text AS "requestCode",
        p.name AS "submitterName",
        r."visitorCategory",
        r."visitingSite",
        r."purposeOfVisit",
        r."startDate",
        r."endDate",
        r.status,
        r."createdAt",
        r.visitors::text AS visitors_json,
        NULL::text AS "visitorCode_override",
        NULL::text AS "intervieweeName",
        NULL::text AS "jobTitle"
    FROM "VisitorRequest" r
    LEFT JOIN "User" p ON r."submitterId" = p.id
    WHERE r.status IN ('APPROVED', 'COMPLETE')

    UNION ALL

    SELECT 
        i.id::text AS "requestId",
        i."visitorCode" AS "requestCode",
        i."osName" AS "submitterName",
        'Interviewee' AS "visitorCategory",
        i."interviewArea" AS "visitingSite",
        'Interview for ' || i."jobTitle" AS "purposeOfVisit",
        i."startDate",
        i."startDate" AS "endDate",
        i.status,
        i."createdAt",
        NULL AS visitors_json,
        i."visitorCode" AS "visitorCode_override",
        i."intervieweeName" AS "intervieweeName",
        i."jobTitle" AS "jobTitle"
    FROM "IntervieweeRequest" i
)`;

        // Default to approved requests
        let whereConditions: string[] = [];
        const queryParams: any[] = [];
        let paramCount = 1;

        if (date) {
            whereConditions.push(`r."startDate"::date <= $${paramCount}::date AND r."endDate"::date >= $${paramCount}::date`);
            queryParams.push(date);
            paramCount += 1;
        }

        if (category) {
            whereConditions.push(`r."visitorCategory" = $${paramCount}`);
            queryParams.push(category);
            paramCount += 1;
        }

        if (search) {
            whereConditions.push(`(r."requestId" ILIKE $${paramCount} OR r."submitterName" ILIKE $${paramCount} OR r."visitorCode_override" ILIKE $${paramCount})`);
            queryParams.push(`%${search}%`);
            paramCount += 1;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const countQuery = `
            ${combinedRequestsCTE}
            SELECT COUNT(*) 
            FROM CombinedRequests r
            ${whereClause}
        `;
        const { rows: countRows } = await visitorPool.query(countQuery, queryParams);
        const total = parseInt(countRows[0].count);

        // Main Query
        const mainQuery = `
            ${combinedRequestsCTE}
            SELECT 
                r."requestId",
                r."requestCode",
                r."submitterName",
                r."visitorCategory",
                r."visitingSite",
                r."purposeOfVisit",
                r."startDate",
                r."endDate",
                r.status,
                r."createdAt",
                (
                    CASE 
                        WHEN r."visitorCategory" = 'Interviewee' THEN
                            (
                                SELECT json_build_array(
                                    json_build_object(
                                        'visitorName', r."intervieweeName",
                                        'visitorTitle', r."jobTitle",
                                        'visitorCompany', 'Candidate',
                                        'visitorCode', r."visitorCode_override",
                                        'checkInOutStatus', COALESCE(c.status, 'PENDING'),
                                        'checkInTime', c."checkInTime",
                                        'checkOutTime', c."checkOutTime",
                                        'visitorIndex', 0
                                    )
                                )
                                FROM (SELECT 1) dummy
                                LEFT JOIN "VisitorCheckInOut" c ON r."requestId" = c."requestId" AND c."visitorIndex" = 0
                            )
                        ELSE
                            (
                                SELECT COALESCE(json_agg(
                                    json_build_object(
                                        'visitorName', v.elem->>'name',
                                        'visitorTitle', v.elem->>'title',
                                        'visitorCompany', COALESCE(v.elem->>'company', (r.visitors_json::json)->0->>'company'),
                                        'visitorCode', r."requestId" || '-V' || v.idx,
                                        'checkInOutStatus', COALESCE(c.status, 'PENDING'),
                                        'checkInTime', c."checkInTime",
                                        'checkOutTime', c."checkOutTime",
                                        'visitorIndex', (v.idx::int - 1)
                                    ) ORDER BY v.idx ASC
                                ), '[]'::json)
                                FROM json_array_elements(
                                    CASE 
                                        WHEN r.visitors_json IS NULL OR r.visitors_json = '' THEN '[]'::json 
                                        ELSE r.visitors_json::json 
                                    END
                                ) WITH ORDINALITY v(elem, idx)
                                LEFT JOIN "VisitorCheckInOut" c ON r."requestId" = c."requestId" AND (v.idx::int - 1) = c."visitorIndex"
                            )
                    END
                ) AS visitors
            FROM CombinedRequests r
            ${whereClause}
            ORDER BY r."createdAt" DESC
            LIMIT $${paramCount} OFFSET $${paramCount+1}
        `;
        queryParams.push(limit, offset);

        const { rows: requests } = await visitorPool.query(mainQuery, queryParams);

        return NextResponse.json({
            requests,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch check-in/out history error:', error);
        require('fs').appendFileSync('c:\\Users\\luan.nguyen\\Desktop\\test org\\Orgchart_TTI_onprem\\scratch\\api_error.log', 'History Route Error: ' + error.stack + '\n');
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
