export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { normalizeCardSettings, validatePresetName } from '@/features/visitor/cards/utils/cardPresetSettings';
import type { CardPresetRow } from '@/types/visitor-card.types';
import { authorizeCardPresets, presetErrorResponse, PRESET_COLUMNS } from './_shared';

/**
 * GET /api/visitor_admin/card-presets
 * Shared badge presets (built-in presets live in the client and are not stored here)
 */
export async function GET() {
    const auth = await authorizeCardPresets();
    if ('error' in auth) return auth.error;

    try {
        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query<CardPresetRow>(
            `SELECT ${PRESET_COLUMNS} FROM visitor_card_presets ORDER BY LOWER(name) ASC`
        );
        return NextResponse.json({ presets: rows }, { status: 200 });
    } catch (err) {
        return presetErrorResponse(err, 'GET');
    }
}

/**
 * POST /api/visitor_admin/card-presets
 * Body: { name, settings }
 */
export async function POST(request: Request) {
    const auth = await authorizeCardPresets();
    if ('error' in auth) return auth.error;

    try {
        const body: unknown = await request.json();
        const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
        const name = validatePresetName(input.name);
        if (!name) {
            return NextResponse.json({ error: 'Preset name is required (max 120 characters)' }, { status: 400 });
        }
        const settings = normalizeCardSettings(input.settings);

        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query<CardPresetRow>(
            `INSERT INTO visitor_card_presets (name, settings, created_by)
             VALUES ($1, $2::jsonb, $3)
             RETURNING ${PRESET_COLUMNS}`,
            [name, JSON.stringify(settings), auth.user]
        );
        return NextResponse.json({ preset: rows[0] }, { status: 201 });
    } catch (err) {
        return presetErrorResponse(err, 'POST');
    }
}
