export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { EMPTY_ACCESS_SETTINGS, normalizeAccessSettings } from '@/features/visitor/cards/utils/accessDoor';
import { accessErrorResponse, authorizeAccessDoor, SETTINGS_ID } from '../_shared';

/**
 * GET /api/visitor_admin/access/settings
 * Visitor department and default access levels
 */
export async function GET() {
    const auth = await authorizeAccessDoor();
    if ('error' in auth) return auth.error;

    try {
        const pool = await getVisitorDbConnection();
        const { rows } = await pool.query<{ settings: unknown }>(
            'SELECT settings FROM visitor_access_settings WHERE id = $1',
            [SETTINGS_ID]
        );
        const settings = rows[0] ? normalizeAccessSettings(rows[0].settings) : EMPTY_ACCESS_SETTINGS;
        return NextResponse.json({ settings }, { status: 200 });
    } catch (err) {
        return accessErrorResponse(err, 'GET settings');
    }
}

/**
 * PUT /api/visitor_admin/access/settings
 * Body: AccessSettings
 */
export async function PUT(request: Request) {
    const auth = await authorizeAccessDoor();
    if ('error' in auth) return auth.error;

    try {
        const settings = normalizeAccessSettings(await request.json());
        const pool = await getVisitorDbConnection();
        await pool.query(
            `INSERT INTO visitor_access_settings (id, settings, updated_by, updated_at)
             VALUES ($1, $2::jsonb, $3, NOW())
             ON CONFLICT (id) DO UPDATE SET settings = EXCLUDED.settings, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
            [SETTINGS_ID, JSON.stringify(settings), auth.user]
        );
        return NextResponse.json({ settings }, { status: 200 });
    } catch (err) {
        return accessErrorResponse(err, 'PUT settings');
    }
}
