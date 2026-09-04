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

        if (!(await hasPageAccess('/visitoranalytics')) && !(await hasPageAccess('/visitoradmin')) && !(await hasPageAccess('/visitoradmin/checkinout'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const action = searchParams.get('action'); // ALL, INPUT_CARD, CHECK_IN, CHECK_OUT, REVERSE
        const startDate = searchParams.get('startDate'); // YYYY-MM-DD
        const endDate = searchParams.get('endDate'); // YYYY-MM-DD
        const performedBy = searchParams.get('performedBy');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '15', 10);
        const offset = Math.max(0, (page - 1) * limit);

        const visitorPool = await getVisitorDbConnection();

        // Ensure table exists safely
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

        const whereConditions: string[] = [];
        const queryParams: any[] = [];
        let paramCount = 1;

        if (startDate && endDate) {
            whereConditions.push(`created_at >= $${paramCount}::date AND created_at < ($${paramCount + 1}::date + INTERVAL '1 day')`);
            queryParams.push(startDate, endDate);
            paramCount += 2;
        } else if (startDate) {
            whereConditions.push(`created_at >= $${paramCount}::date`);
            queryParams.push(startDate);
            paramCount += 1;
        } else if (endDate) {
            whereConditions.push(`created_at < ($${paramCount}::date + INTERVAL '1 day')`);
            queryParams.push(endDate);
            paramCount += 1;
        }

        if (action && action !== 'ALL') {
            whereConditions.push(`action = $${paramCount}`);
            queryParams.push(action);
            paramCount += 1;
        }

        if (performedBy && performedBy !== 'ALL') {
            whereConditions.push(`performed_by = $${paramCount}`);
            queryParams.push(performedBy);
            paramCount += 1;
        }

        if (search && search.trim() !== '') {
            whereConditions.push(`(
                visitor_name ILIKE $${paramCount} OR 
                visitor_code ILIKE $${paramCount} OR 
                request_id ILIKE $${paramCount} OR 
                request_code ILIKE $${paramCount} OR 
                card_number ILIKE $${paramCount} OR 
                performed_by ILIKE $${paramCount} OR 
                performed_by_name ILIKE $${paramCount}
            )`);
            queryParams.push(`%${search.trim()}%`);
            paramCount += 1;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Count Total
        const countQuery = `
            SELECT COUNT(*) AS count
            FROM checkinout_action_history
            ${whereClause}
        `;
        const { rows: countRows } = await visitorPool.query(countQuery, queryParams);
        const total = parseInt(countRows[0]?.count || '0', 10);

        // Fetch paginated rows
        const dataQuery = `
            SELECT 
                id,
                request_id AS "requestId",
                request_code AS "requestCode",
                visitor_index AS "visitorIndex",
                visitor_code AS "visitorCode",
                visitor_name AS "visitorName",
                action,
                card_number AS "cardNumber",
                performed_by AS "performedBy",
                performed_by_name AS "performedByName",
                details,
                created_at AS "createdAt"
            FROM checkinout_action_history
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        const dataParams = [...queryParams, limit, offset];
        const { rows: logs } = await visitorPool.query(dataQuery, dataParams);

        // Fetch Summary Statistics
        const statsQuery = `
            SELECT 
                COUNT(*) AS total,
                COUNT(CASE WHEN action = 'CHECK_IN' THEN 1 END) AS total_check_in,
                COUNT(CASE WHEN action = 'CHECK_OUT' THEN 1 END) AS total_check_out,
                COUNT(CASE WHEN action = 'INPUT_CARD' THEN 1 END) AS total_input_card,
                COUNT(CASE WHEN action = 'REVERSE' THEN 1 END) AS total_reverse,
                COUNT(DISTINCT performed_by) AS total_operators
            FROM checkinout_action_history
            ${whereClause}
        `;
        const { rows: statsRows } = await visitorPool.query(statsQuery, queryParams);
        const stats = statsRows[0] || {};

        // Fetch distinct operators for filter dropdown
        const operatorsQuery = `
            SELECT 
                performed_by AS "username",
                COALESCE(MAX(performed_by_name), performed_by) AS "name",
                COUNT(*) AS "count"
            FROM checkinout_action_history
            GROUP BY performed_by
            ORDER BY "count" DESC
            LIMIT 50
        `;
        const { rows: operators } = await visitorPool.query(operatorsQuery);

        return NextResponse.json({
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            },
            summary: {
                total: parseInt(stats.total || '0', 10),
                totalCheckIn: parseInt(stats.total_check_in || '0', 10),
                totalCheckOut: parseInt(stats.total_check_out || '0', 10),
                totalInputCard: parseInt(stats.total_input_card || '0', 10),
                totalReverse: parseInt(stats.total_reverse || '0', 10),
                totalOperators: parseInt(stats.total_operators || '0', 10)
            },
            operators
        }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch checkinout action logs error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
