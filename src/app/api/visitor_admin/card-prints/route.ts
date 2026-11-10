export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { hasPageAccess } from '@/lib/auth-server';
import { canPrintVisitorCards } from '@/utils/visitorRoles';
import { getVisitorDbConnection } from '@/lib/visitor-db';

/**
 * POST /api/visitor_admin/card-prints { visitorCodes: ["V06102623V1", ...] }
 *
 * Records cards the user confirmed as printed in the Visitor Card Studio.
 * The browser cannot report whether a print job succeeded, so this is the user's confirmation.
 */

const MAX_CODES = 500;
const VISITOR_CODE_PATTERN = /^[A-Z0-9_-]{1,64}$/;

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canPrintVisitorCards(session.user) || !(await hasPageAccess('/visitoradmin'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const raw = (body as { visitorCodes?: unknown } | null)?.visitorCodes;
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_CODES) {
        return NextResponse.json({ error: `visitorCodes must list 1 to ${MAX_CODES} codes` }, { status: 400 });
    }
    const codes = Array.from(new Set(raw.map((code) => (typeof code === 'string' ? code.trim().toUpperCase() : ''))));
    if (codes.some((code) => !VISITOR_CODE_PATTERN.test(code))) {
        return NextResponse.json({ error: 'Invalid visitor code' }, { status: 400 });
    }

    try {
        const pool = await getVisitorDbConnection();
        const printedBy = session.user.username || session.user.email || 'Unknown';
        await pool.query(
            `INSERT INTO visitor_card_prints (visitor_code, last_printed_by)
             SELECT code, $2 FROM unnest($1::text[]) AS code
             ON CONFLICT (visitor_code) DO UPDATE SET
                 print_count = visitor_card_prints.print_count + 1,
                 last_printed_at = NOW(),
                 last_printed_by = EXCLUDED.last_printed_by`,
            [codes, printedBy]
        );
        return NextResponse.json({ saved: codes.length }, { status: 200 });
    } catch (err) {
        console.error('[card-prints] POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
