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

        if (!(await hasPageAccess('/visitoradmin/checkinout')) && !(await hasPageAccess('/visitoradmin'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date'); // YYYY-MM-DD
        const startDate = searchParams.get('startDate'); // YYYY-MM-DD
        const endDate = searchParams.get('endDate'); // YYYY-MM-DD
        const requestCode = searchParams.get('requestCode');
        const category = searchParams.get('category');
        const checkInOutStatus = searchParams.get('status'); // PENDING, CHECKED_IN, CHECKED_OUT
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '15');
        const offset = (page - 1) * limit;

        const visitorPool = await getVisitorDbConnection();

const flattenVisitorCTE = `WITH FlattenedVisitors AS (
    SELECT 
        r.id::text AS "requestId",
        r.id::text AS "requestCode",
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
        i."visitorCode" AS "requestCode",
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

        let whereConditions: string[] = [];
        const queryParams: any[] = [];
        let paramCount = 1;

        if (date) {
            whereConditions.push(`r."startDate"::date <= $${paramCount}::date AND r."endDate"::date >= $${paramCount}::date`);
            queryParams.push(date);
            paramCount += 1;
        } else if (startDate && endDate) {
            whereConditions.push(`r."startDate"::date <= $${paramCount+1}::date AND r."endDate"::date >= $${paramCount}::date`);
            queryParams.push(startDate, endDate);
            paramCount += 2;
        }

        if (requestCode) {
            whereConditions.push(`r."requestId" ILIKE $${paramCount}`);
            queryParams.push(`%${requestCode}%`);
            paramCount += 1;
        }

        if (category) {
            whereConditions.push(`r."visitorCategory" = $${paramCount}`);
            queryParams.push(category);
            paramCount += 1;
        }

        if (checkInOutStatus) {
            if (checkInOutStatus === 'HISTORY') {
                whereConditions.push(`c.status IN ('CHECKED_IN', 'CHECKED_OUT')`);
            } else {
                whereConditions.push(`COALESCE(c.status, 'PENDING') = $${paramCount}`);
                queryParams.push(checkInOutStatus);
                paramCount += 1;
            }
        }

        if (search) {
            whereConditions.push(`(r."visitorName" ILIKE $${paramCount} OR r."visitorCompany" ILIKE $${paramCount} OR r."visitorCode" ILIKE $${paramCount})`);
            queryParams.push(`%${search}%`);
            paramCount += 1;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const countQuery = `
            ${flattenVisitorCTE}
            SELECT COUNT(*) 
            FROM FlattenedVisitors r
            LEFT JOIN "VisitorCheckInOut" c ON r."requestId" = c."requestId" AND r."visitorIndex" = c."visitorIndex"
            ${whereClause}
        `;
        const { rows: countRows } = await visitorPool.query(countQuery, queryParams);
        const total = parseInt(countRows[0].count);

        // Main Query
        const mainQuery = `
            ${flattenVisitorCTE}
            SELECT 
                r."requestId",
                r."requestCode",
                r."visitorCategory",
                r."startDate",
                r."endDate",
                r."requestStatus",
                r."visitorName",
                r."visitorTitle",
                r."visitorCompany",
                r."visitorIndex",
                r."visitingSite",
                r."purposeOfVisit",
                c.id AS "checkInOutId",
                c."checkInTime",
                c."checkOutTime",
                COALESCE(c.status, 'PENDING') AS "checkInOutStatus",
                c."cardNumber",
                r."visitorCode"
            FROM FlattenedVisitors r
            LEFT JOIN "VisitorCheckInOut" c ON r."requestId" = c."requestId" AND r."visitorIndex" = c."visitorIndex"
            ${whereClause}
            ORDER BY r."createdAt" DESC, r."visitorIndex" ASC
            LIMIT $${paramCount} OFFSET $${paramCount+1}
        `;
        queryParams.push(limit, offset);

        const { rows: visitors } = await visitorPool.query(mainQuery, queryParams);

        // Fetch today's summary stats
        const todayStr = new Date().toISOString().split('T')[0];
        const statsQuery = `
            ${flattenVisitorCTE}
            SELECT 
                COUNT(*) AS total,
                COUNT(CASE WHEN c.status = 'CHECKED_IN' THEN 1 END) AS checked_in,
                COUNT(CASE WHEN c.status = 'CHECKED_OUT' THEN 1 END) AS checked_out,
                COUNT(CASE WHEN c.status IS NULL OR c.status = 'PENDING' THEN 1 END) AS pending
            FROM FlattenedVisitors r
            LEFT JOIN "VisitorCheckInOut" c ON r."requestId" = c."requestId" AND r."visitorIndex" = c."visitorIndex"
            WHERE r."startDate"::date <= $1::date AND r."endDate"::date >= $1::date
        `;
        const { rows: statsRows } = await visitorPool.query(statsQuery, [todayStr]);
        const todayStats = statsRows[0] || { total: 0, checked_in: 0, checked_out: 0, pending: 0 };

        return NextResponse.json({
            visitors,
            todayStats: {
                total: parseInt(todayStats.total || '0'),
                checkedIn: parseInt(todayStats.checked_in || '0'),
                checkedOut: parseInt(todayStats.checked_out || '0'),
                pending: parseInt(todayStats.pending || '0'),
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch check-in/out visitors error:', error);
        require('fs').appendFileSync('c:\\Users\\luan.nguyen\\Desktop\\test org\\Orgchart_TTI_onprem\\scratch\\api_error.log', 'CheckInOut Route Error: ' + error.stack + '\n');
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await hasPageAccess('/visitoradmin/checkinout')) && !(await hasPageAccess('/visitoradmin'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { action, requestId, requestCode, visitorIndex, visitorName, visitorCode, cardNumber } = body;

        if (!action || !requestId || visitorIndex === undefined || !visitorName || !visitorCode) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const visitorPool = await getVisitorDbConnection();
        const cleanCardNumber = (typeof cardNumber === 'string' && cardNumber.trim() !== '') ? cardNumber.trim() : null;
        const effectiveRequestCode = requestCode || requestId;
        const performedBy = (session.user as any)?.username || session.user?.email || (session.user as any)?.id || 'Unknown';
        const performedByName = session.user?.name || (session.user as any)?.full_name || (session.user as any)?.username || session.user?.email || 'Unknown';

        // Ensure history table exists safely
        await visitorPool.query(`
            CREATE TABLE IF NOT EXISTS checkinout_action_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                request_id VARCHAR(100) NOT NULL,
                request_code VARCHAR(100),
                visitor_index INT DEFAULT 0,
                visitor_code VARCHAR(100),
                visitor_name VARCHAR(255),
                action VARCHAR(50) NOT NULL,
                card_number VARCHAR(100),
                performed_by VARCHAR(255) NOT NULL,
                performed_by_name VARCHAR(255),
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        if (action === 'CHECK_IN') {
            // Upsert with checkInTime = NOW()
            await visitorPool.query(`
                INSERT INTO "VisitorCheckInOut" 
                    ("requestId", "visitorIndex", "visitorName", "visitorCode", "checkInTime", status, "updatedAt", "cardNumber")
                VALUES 
                    ($1, $2, $3, $4, NOW(), 'CHECKED_IN', NOW(), $5)
                ON CONFLICT ("visitorCode") 
                DO UPDATE SET 
                    "checkInTime" = NOW(), 
                    status = 'CHECKED_IN',
                    "updatedAt" = NOW(),
                    "cardNumber" = EXCLUDED."cardNumber"
            `, [requestId, visitorIndex, visitorName, visitorCode, cleanCardNumber]);

            try {
                await visitorPool.query(`
                    INSERT INTO checkinout_action_history
                        (request_id, request_code, visitor_index, visitor_code, visitor_name, action, card_number, performed_by, performed_by_name, details, created_at)
                    VALUES
                        ($1, $2, $3, $4, $5, 'CHECK_IN', $6, $7, $8, $9, NOW())
                `, [requestId, effectiveRequestCode, visitorIndex, visitorCode, visitorName, cleanCardNumber, performedBy, performedByName, JSON.stringify({ action: 'CHECK_IN' })]);
            } catch (logErr) {
                console.error('Failed to insert checkinout_action_history for CHECK_IN:', logErr);
            }

            return NextResponse.json({ message: 'Checked in successfully' });
        } else if (action === 'CHECK_OUT') {
            // Upsert with checkOutTime = NOW()
            await visitorPool.query(`
                INSERT INTO "VisitorCheckInOut" 
                    ("requestId", "visitorIndex", "visitorName", "visitorCode", "checkOutTime", status, "updatedAt", "cardNumber")
                VALUES 
                    ($1, $2, $3, $4, NOW(), 'CHECKED_OUT', NOW(), $5)
                ON CONFLICT ("visitorCode") 
                DO UPDATE SET 
                    "checkOutTime" = NOW(), 
                    status = 'CHECKED_OUT',
                    "updatedAt" = NOW(),
                    "cardNumber" = EXCLUDED."cardNumber"
            `, [requestId, visitorIndex, visitorName, visitorCode, cleanCardNumber]);

            try {
                await visitorPool.query(`
                    INSERT INTO checkinout_action_history
                        (request_id, request_code, visitor_index, visitor_code, visitor_name, action, card_number, performed_by, performed_by_name, details, created_at)
                    VALUES
                        ($1, $2, $3, $4, $5, 'CHECK_OUT', $6, $7, $8, $9, NOW())
                `, [requestId, effectiveRequestCode, visitorIndex, visitorCode, visitorName, cleanCardNumber, performedBy, performedByName, JSON.stringify({ action: 'CHECK_OUT' })]);
            } catch (logErr) {
                console.error('Failed to insert checkinout_action_history for CHECK_OUT:', logErr);
            }

            return NextResponse.json({ message: 'Checked out successfully' });
        } else if (action === 'RESET' || action === 'REVERSE') {
            // Remove check in/out record or set to PENDING
            await visitorPool.query(`
                DELETE FROM "VisitorCheckInOut" 
                WHERE "visitorCode" = $1
            `, [visitorCode]);

            try {
                await visitorPool.query(`
                    INSERT INTO checkinout_action_history
                        (request_id, request_code, visitor_index, visitor_code, visitor_name, action, card_number, performed_by, performed_by_name, details, created_at)
                    VALUES
                        ($1, $2, $3, $4, $5, 'REVERSE', $6, $7, $8, $9, NOW())
                `, [requestId, effectiveRequestCode, visitorIndex, visitorCode, visitorName, cleanCardNumber, performedBy, performedByName, JSON.stringify({ action: 'REVERSE', note: 'Reset status to PENDING' })]);
            } catch (logErr) {
                console.error('Failed to insert checkinout_action_history for REVERSE:', logErr);
            }

            return NextResponse.json({ message: 'Reset status to PENDING successfully' });
        } else if (action === 'UPDATE_CARD' || action === 'INPUT_CARD') {
            await visitorPool.query(`
                INSERT INTO "VisitorCheckInOut" 
                    ("requestId", "visitorIndex", "visitorName", "visitorCode", status, "updatedAt", "cardNumber")
                VALUES 
                    ($1, $2, $3, $4, 'PENDING', NOW(), $5)
                ON CONFLICT ("visitorCode") 
                DO UPDATE SET 
                    "updatedAt" = NOW(),
                    "cardNumber" = EXCLUDED."cardNumber"
            `, [requestId, visitorIndex, visitorName, visitorCode, cleanCardNumber]);

            try {
                await visitorPool.query(`
                    INSERT INTO checkinout_action_history
                        (request_id, request_code, visitor_index, visitor_code, visitor_name, action, card_number, performed_by, performed_by_name, details, created_at)
                    VALUES
                        ($1, $2, $3, $4, $5, 'INPUT_CARD', $6, $7, $8, $9, NOW())
                `, [requestId, effectiveRequestCode, visitorIndex, visitorCode, visitorName, cleanCardNumber, performedBy, performedByName, JSON.stringify({ action: 'INPUT_CARD', cardNumber: cleanCardNumber })]);
            } catch (logErr) {
                console.error('Failed to insert checkinout_action_history for INPUT_CARD:', logErr);
            }

            return NextResponse.json({ message: 'Card updated successfully' });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Check-in/out post error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
