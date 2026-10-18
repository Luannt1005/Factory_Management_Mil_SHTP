export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { normalizeCardSettings, validatePresetName } from '@/features/visitor/cards/utils/cardPresetSettings';
import type { CardPresetRow } from '@/types/visitor-card.types';
import { authorizeCardPresets, presetErrorResponse, PRESET_COLUMNS } from '../_shared';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PUT /api/visitor_admin/card-presets/[id]
 * Body: { name?, settings? } - rename and/or overwrite the stored settings
 */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const auth = await authorizeCardPresets('write');
    if ('error' in auth) return auth.error;

    const { id } = await context.params;
    if (!UUID_PATTERN.test(id)) {
        return NextResponse.json({ error: 'Invalid preset id' }, { status: 400 });
    }

    try {
        const body: unknown = await request.json();
        const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};

        let name: string | null = null;
        if (input.name !== undefined) {
            name = validatePresetName(input.name);
            if (!name) {
                return NextResponse.json({ error: 'Preset name is required (max 120 characters)' }, { status: 400 });
            }
        }
        const settingsJson = input.settings !== undefined ? JSON.stringify(normalizeCardSettings(input.settings)) : null;

        if (name === null && settingsJson === null) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query<CardPresetRow>(
            `UPDATE visitor_card_presets
             SET name = COALESCE($2, name),
                 settings = COALESCE($3::jsonb, settings),
                 updated_at = NOW()
             WHERE id = $1
             RETURNING ${PRESET_COLUMNS}`,
            [id, name, settingsJson]
        );
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
        }
        return NextResponse.json({ preset: rows[0] }, { status: 200 });
    } catch (err) {
        return presetErrorResponse(err, 'PUT');
    }
}

/**
 * DELETE /api/visitor_admin/card-presets/[id]
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
    const auth = await authorizeCardPresets('write');
    if ('error' in auth) return auth.error;

    const { id } = await context.params;
    if (!UUID_PATTERN.test(id)) {
        return NextResponse.json({ error: 'Invalid preset id' }, { status: 400 });
    }

    try {
        const visitorPool = await getVisitorDbConnection();
        const { rowCount } = await visitorPool.query('DELETE FROM visitor_card_presets WHERE id = $1', [id]);
        if (!rowCount) {
            return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Preset deleted' }, { status: 200 });
    } catch (err) {
        return presetErrorResponse(err, 'DELETE');
    }
}
