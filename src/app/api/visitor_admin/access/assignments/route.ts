export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import {
    addPerson,
    addPersonToAccessLevel,
    findPersonIdByCode,
    removePersonFromAccessLevel,
    updatePerson,
    type HikPersonInput,
} from '@/lib/hikcentral/client';
import { fromAssignmentRow, personRemark, splitPersonName, toHikDateTime, validateAssignPayload } from '@/features/visitor/cards/utils/accessDoor';
import type { AccessAssignmentRow, AssignCardPayload } from '@/types/visitor-access.types';
import { ASSIGNMENT_COLUMNS, accessErrorResponse, authorizeAccessDoor, errorMessage } from '../_shared';

const LIST_LIMIT = 300;

const INSERT_COLUMNS = `visitor_code, request_code, visitor_name, company, category, site, card_no, person_id,
    org_index_code, org_name, privilege_group_id, privilege_group_name, begin_time, end_time, status, last_error, assigned_by`;

function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function insertValues(p: AssignCardPayload, personId: string | null, status: 'active' | 'failed', lastError: string | null, user: string) {
    return [
        p.visitorCode, p.requestCode, p.visitorName, p.company, p.category, p.site, p.cardNo, personId,
        p.orgIndexCode, p.orgName, p.privilegeGroupId || null, p.privilegeGroupName || null,
        toHikDateTime(p.beginTime), toHikDateTime(p.endTime), status, lastError, user,
    ];
}

const INSERT_PLACEHOLDERS = Array.from({ length: 17 }, (_, i) => `$${i + 1}`).join(', ');

/**
 * GET /api/visitor_admin/access/assignments?scope=active|all&search=
 * Active cards (default) or the full history, newest first
 */
export async function GET(request: Request) {
    const auth = await authorizeAccessDoor();
    if ('error' in auth) return auth.error;

    const params = new URL(request.url).searchParams;
    const scope = params.get('scope') === 'all' ? 'all' : 'active';
    const search = (params.get('search') || '').trim().slice(0, 64);

    const where: string[] = [];
    const values: string[] = [];
    if (scope === 'active') where.push(`status = 'active'`);
    if (search) {
        values.push(`%${escapeLike(search)}%`);
        where.push(`(visitor_code ILIKE $1 OR visitor_name ILIKE $1 OR card_no ILIKE $1 OR company ILIKE $1 OR request_code ILIKE $1 OR org_name ILIKE $1)`);
    }

    try {
        const pool = await getVisitorDbConnection();
        const { rows } = await pool.query<AccessAssignmentRow>(
            `SELECT ${ASSIGNMENT_COLUMNS} FROM visitor_access_assignments
             ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
             ORDER BY assigned_at DESC LIMIT ${LIST_LIMIT}`,
            values
        );
        return NextResponse.json({ assignments: rows.map(fromAssignmentRow) }, { status: 200 });
    } catch (err) {
        return accessErrorResponse(err, 'GET assignments');
    }
}

/**
 * POST /api/visitor_admin/access/assignments
 * Body: AssignCardPayload
 *
 * 1. HikCentral person: personCode = visitor code, visitor name, remark (request / company /
 *    category), the card, the department (orgIndexCode) and the validity. Created, or updated
 *    when the visitor code already exists on the platform.
 * 2. Optional: person added to an access level (only when one is chosen); otherwise the doors
 *    come from the access levels configured for the department on HikCentral.
 * 3. Recorded as the visitor's active assignment (a previous one becomes "replaced").
 */
export async function POST(request: Request) {
    const auth = await authorizeAccessDoor();
    if ('error' in auth) return auth.error;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const validated = validateAssignPayload(body);
    if ('error' in validated) return NextResponse.json({ error: validated.error }, { status: 400 });
    const p = validated.payload;

    let pool: Awaited<ReturnType<typeof getVisitorDbConnection>>;
    let previous: AccessAssignmentRow | undefined;
    try {
        pool = await getVisitorDbConnection();
        const { rows: active } = await pool.query<AccessAssignmentRow>(
            `SELECT ${ASSIGNMENT_COLUMNS} FROM visitor_access_assignments
             WHERE status = 'active' AND (card_no = $1 OR visitor_code = $2)`,
            [p.cardNo, p.visitorCode]
        );
        const holder = active.find((r) => r.card_no === p.cardNo && r.visitor_code !== p.visitorCode);
        if (holder) {
            return NextResponse.json(
                { error: `Card ${p.cardNo} is still held by ${holder.visitor_name} (${holder.visitor_code}). Revoke it first.` },
                { status: 409 }
            );
        }
        previous = active.find((r) => r.visitor_code === p.visitorCode);
        if (
            previous &&
            previous.card_no === p.cardNo &&
            (previous.org_index_code ?? '') === p.orgIndexCode &&
            (previous.privilege_group_id ?? '') === p.privilegeGroupId
        ) {
            return NextResponse.json({ error: `${p.visitorCode} already holds card ${p.cardNo} in this department` }, { status: 409 });
        }
    } catch (err) {
        return accessErrorResponse(err, 'POST assignments (prepare)');
    }

    // ---- HikCentral ----
    const { familyName, givenName } = splitPersonName(p.visitorName);
    const input: HikPersonInput = {
        personCode: p.visitorCode,
        familyName,
        givenName,
        orgIndexCode: p.orgIndexCode,
        cardNo: p.cardNo,
        beginTime: toHikDateTime(p.beginTime),
        endTime: toHikDateTime(p.endTime),
        remark: personRemark(p),
    };

    let personId: string | null = previous?.person_id ?? null;
    try {
        personId = personId ?? (await findPersonIdByCode(p.visitorCode));
        if (personId) await updatePerson(personId, input);
        else personId = await addPerson(input);

        const previousLevel = previous?.privilege_group_id ?? '';
        if (previous?.person_id && previousLevel && previousLevel !== p.privilegeGroupId) {
            try {
                await removePersonFromAccessLevel(previousLevel, previous.person_id);
            } catch (err) {
                console.warn('[access-door] could not remove the previous access level:', err);
            }
        }
        if (p.privilegeGroupId) await addPersonToAccessLevel(p.privilegeGroupId, personId);
    } catch (err) {
        // Keep a trace of the failed attempt (with the person, if it was created) so it can be cleaned up
        try {
            await pool.query(
                `INSERT INTO visitor_access_assignments (${INSERT_COLUMNS}) VALUES (${INSERT_PLACEHOLDERS})`,
                insertValues(p, personId, 'failed', errorMessage(err), auth.user)
            );
        } catch (logErr) {
            console.error('[access-door] could not record the failed assignment:', logErr);
        }
        return accessErrorResponse(err, 'POST assignments (HikCentral)');
    }

    // ---- Record ----
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        if (previous) {
            await client.query(
                `UPDATE visitor_access_assignments SET status = 'replaced', updated_at = NOW() WHERE id = $1`,
                [previous.id]
            );
        }
        const { rows } = await client.query<AccessAssignmentRow>(
            `INSERT INTO visitor_access_assignments (${INSERT_COLUMNS}) VALUES (${INSERT_PLACEHOLDERS})
             RETURNING ${ASSIGNMENT_COLUMNS}`,
            insertValues(p, personId, 'active', null, auth.user)
        );
        await client.query('COMMIT');
        return NextResponse.json({ assignment: fromAssignmentRow(rows[0]) }, { status: 201 });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[access-door] card assigned in HikCentral but not recorded:', p.visitorCode, p.cardNo, err);
        return accessErrorResponse(err, 'POST assignments (record)');
    } finally {
        client.release();
    }
}
