import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { hasPageAccess } from '@/lib/auth-server';

/** Card presets are managed from Visitor Admin (same access as /visitoradmin/cards) */
export const CARD_PRESETS_PAGE = '/visitoradmin';

export const PRESET_COLUMNS = 'id, name, settings, created_by, created_at, updated_at';

/** Returns an error response when the caller may not manage presets, otherwise the user's display name */
export async function authorizeCardPresets(): Promise<{ error: NextResponse } | { user: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    if (!(await hasPageAccess(CARD_PRESETS_PAGE))) {
        return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { user: session.user.name || session.user.email || 'unknown' };
}

function pgErrorCode(err: unknown): string | undefined {
    if (typeof err === 'object' && err !== null && 'code' in err) {
        const code = (err as { code: unknown }).code;
        return typeof code === 'string' ? code : undefined;
    }
    return undefined;
}

/** Maps database errors to safe client responses (no raw DB messages) */
export function presetErrorResponse(err: unknown, context: string): NextResponse {
    const code = pgErrorCode(err);
    if (code === '23505') {
        return NextResponse.json({ error: 'A preset with this name already exists' }, { status: 409 });
    }
    if (code === '42P01') {
        // Table not created yet (scripts/create_visitor_card_presets.js) - client falls back to local storage
        return NextResponse.json({ error: 'Card preset storage is not initialised' }, { status: 503 });
    }
    console.error(`[card-presets] ${context} error:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
