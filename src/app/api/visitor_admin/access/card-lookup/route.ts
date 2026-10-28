export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { findPersonsByCard, HikCentralError, removeCardFromPerson } from '@/lib/hikcentral/client';
import { CARD_NO_PATTERN, fromAssignmentRow } from '@/features/visitor/cards/utils/accessDoor';
import type { AccessAssignmentRow, CardLookupResponse, CardReleaseResponse } from '@/types/visitor-access.types';
import { ASSIGNMENT_COLUMNS, accessErrorResponse, authorizeAccessDoor } from '../_shared';
import { revokeAssignmentRow } from '../_revoke';

const HISTORY_LIMIT = 10;

/**
 * GET /api/visitor_admin/access/card-lookup?cardNo=
 * Who holds a card: the HikCentral person (employee or visitor) carrying it, plus the Access Door
 * history of the card.
 */
export async function GET(request: Request) {
    const auth = await authorizeAccessDoor();
    if ('error' in auth) return auth.error;

    const cardNo = (new URL(request.url).searchParams.get('cardNo') || '').trim();
    if (!CARD_NO_PATTERN.test(cardNo)) {
        return NextResponse.json({ error: 'Card number must be 1-20 letters or digits' }, { status: 400 });
    }

    try {
        const pool = await getVisitorDbConnection();
        const [hik, db] = await Promise.allSettled([
            findPersonsByCard(cardNo),
            pool.query<AccessAssignmentRow>(
                `SELECT ${ASSIGNMENT_COLUMNS} FROM visitor_access_assignments
                 WHERE card_no = $1 ORDER BY assigned_at DESC LIMIT ${HISTORY_LIMIT}`,
                [cardNo]
            ),
        ]);

        let hikError: string | null = null;
        if (hik.status === 'rejected') {
            hikError = hik.reason instanceof HikCentralError ? hik.reason.message : 'Could not reach HikCentral';
            if (!(hik.reason instanceof HikCentralError)) console.error('[access-door] card lookup HikCentral error:', hik.reason);
        }
        // The history table may not exist yet; the HikCentral answer is still useful on its own
        if (db.status === 'rejected' && hik.status === 'rejected') throw db.reason;

        const response: CardLookupResponse = {
            cardNo,
            holders: hik.status === 'fulfilled' ? hik.value : [],
            hikError,
            history: db.status === 'fulfilled' ? db.value.rows.map(fromAssignmentRow) : [],
        };
        return NextResponse.json(response, { status: 200 });
    } catch (err) {
        return accessErrorResponse(err, 'GET card-lookup');
    }
}

/**
 * POST /api/visitor_admin/access/card-lookup
 * Body: { cardNo, personId } - releases the card from its current holder:
 *  - a visitor given the card by Access Door is revoked (person deleted, record "revoked")
 *  - anyone else (employees) keeps their person; only this card is removed from it
 * The holder is re-checked on HikCentral first so a stale screen cannot release the wrong card.
 */
export async function POST(request: Request) {
    const auth = await authorizeAccessDoor();
    if ('error' in auth) return auth.error;

    let input: { cardNo?: unknown; personId?: unknown };
    try {
        input = (await request.json()) as { cardNo?: unknown; personId?: unknown };
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const cardNo = typeof input.cardNo === 'string' ? input.cardNo.trim() : '';
    const personId = typeof input.personId === 'string' ? input.personId.trim().slice(0, 64) : '';
    if (!CARD_NO_PATTERN.test(cardNo) || !personId) {
        return NextResponse.json({ error: 'cardNo and personId are required' }, { status: 400 });
    }

    try {
        const holder = (await findPersonsByCard(cardNo)).find((h) => h.personId === personId);
        if (!holder) {
            return NextResponse.json({ error: `Card ${cardNo} is no longer held by this person. Look it up again.` }, { status: 409 });
        }

        const pool = await getVisitorDbConnection();
        let visitorRow: AccessAssignmentRow | undefined;
        try {
            const { rows } = await pool.query<AccessAssignmentRow>(
                `SELECT ${ASSIGNMENT_COLUMNS} FROM visitor_access_assignments
                 WHERE status IN ('active', 'failed') AND (person_id = $1 OR (card_no = $2 AND visitor_code = $3))
                 ORDER BY assigned_at DESC LIMIT 1`,
                [personId, cardNo, holder.personCode]
            );
            visitorRow = rows[0];
        } catch (err) {
            // Without the history table the holder is treated as a non-visitor (card removal only)
            console.warn('[access-door] card release: assignment lookup failed:', err);
        }

        let result: CardReleaseResponse;
        if (visitorRow) {
            await revokeAssignmentRow(pool, visitorRow, auth.user);
            result = { mode: 'visitor-revoked' };
        } else {
            await removeCardFromPerson(personId, cardNo);
            result = { mode: 'card-removed' };
        }
        console.info(`[access-door] card ${cardNo} released from ${holder.personCode || personId} (${result.mode}) by ${auth.user}`);
        return NextResponse.json(result, { status: 200 });
    } catch (err) {
        return accessErrorResponse(err, 'POST card-lookup (release)');
    }
}
