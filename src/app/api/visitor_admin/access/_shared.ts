import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { hasPageAccess } from '@/lib/auth-server';
import { HikCentralError } from '@/lib/hikcentral/client';
import { isVisitorAdmin } from '@/utils/visitorRoles';

export const ASSIGNMENT_COLUMNS = `id, visitor_code, request_code, visitor_name, company, category, site, card_no, person_id,
    org_index_code, org_name, privilege_group_id, privilege_group_name, begin_time, end_time, status, last_error,
    assigned_by, assigned_at, revoked_by, revoked_at`;

export const SETTINGS_ID = 'default';

/** Access Door is limited to Visitor admins; returns the caller's display name when allowed */
export async function authorizeAccessDoor(): Promise<{ error: NextResponse } | { user: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    if (!isVisitorAdmin(session.user) || !(await hasPageAccess('/visitoradmin'))) {
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

/** Message stored / shown for a failure (HikCentral messages are safe to show; others are generic) */
export function errorMessage(err: unknown): string {
    if (err instanceof HikCentralError) return err.message;
    return 'Unexpected error, see the server log';
}

/** Maps HikCentral / database errors to safe client responses */
export function accessErrorResponse(err: unknown, context: string): NextResponse {
    if (err instanceof HikCentralError) {
        console.error(`[access-door] ${context} HikCentral ${err.code}:`, err.message);
        return NextResponse.json({ error: err.message, hikCode: err.code }, { status: 502 });
    }
    const code = pgErrorCode(err);
    if (code === '42P01') {
        return NextResponse.json({ error: 'Access Door storage is not initialised. Run scripts/create_visitor_access_tables.js' }, { status: 503 });
    }
    if (code === '23505') {
        return NextResponse.json({ error: 'This card or visitor already has an active assignment' }, { status: 409 });
    }
    console.error(`[access-door] ${context} error:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
