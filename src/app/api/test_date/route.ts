import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const pool = await getVisitorDbConnection();
        
        const flattenVisitorCTE = `WITH FlattenedVisitors AS (
    SELECT 
        r.id::text AS "requestId",
        r."visitorCategory",
        r."startDate",
        r."endDate",
        r.status AS "requestStatus",
        r."createdAt",
        v.elem->>'name' AS "visitorName",
        v.elem->>'title' AS "visitorTitle",
        COALESCE(v.elem->>'company', r."currentCompany") AS "visitorCompany",
        (v.idx::int - 1) AS "visitorIndex",
        r."visitingSite",
        r."purposeOfVisit",
        r.id || '-V' || v.idx AS "visitorCode"
    FROM "VisitorRequest" r
    CROSS JOIN LATERAL json_array_elements(
        CASE 
            WHEN r.visitors IS NULL OR r.visitors = '' THEN '[]'::json 
            ELSE r.visitors::json 
        END
    ) WITH ORDINALITY v(elem, idx)
    WHERE r.status IN ('APPROVED', 'COMPLETE')

    UNION ALL

    SELECT 
        i.id::text AS "requestId",
        'Interviewee' AS "visitorCategory",
        i."startDate",
        i."startDate" AS "endDate",
        i.status AS "requestStatus",
        i."createdAt",
        i."intervieweeName" AS "visitorName",
        i."jobTitle" AS "visitorTitle",
        'Candidate' AS "visitorCompany",
        0 AS "visitorIndex",
        i."interviewArea" AS "visitingSite",
        'Interview for ' || i."jobTitle" AS "purposeOfVisit",
        i."visitorCode" AS "visitorCode"
    FROM "IntervieweeRequest" i
)`;

        const mainQuery = `
            ${flattenVisitorCTE}
            SELECT 
                r."requestId",
                r."startDate",
                r."endDate"
            FROM FlattenedVisitors r
            WHERE r."startDate"::date <= $1::date AND r."endDate"::date >= $1::date
        `;
        const { rows } = await pool.query(mainQuery, ['2026-07-14']);
        return NextResponse.json({ returned_rows: rows.length, rows: rows });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, hint: e.hint, detail: e.detail });
    }
}
