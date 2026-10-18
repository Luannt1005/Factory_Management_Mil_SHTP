export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { deletePerson, getApplicationStatus, removePersonFromAccessLevel } from '@/lib/hikcentral/client';
import { fromAssignmentRow } from '@/features/visitor/cards/utils/accessDoor';
import type { AccessAssignmentRow, AccessCheckResponse } from '@/types/visitor-access.types';
import { ASSIGNMENT_COLUMNS, accessErrorResponse, authorizeAccessDoor, errorMessage } from '../../_shared';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/visitor_admin/access/assignments/[id]
 * Body: { action: 'revoke' | 'check' }
 *  - revoke: deletes the person in HikCentral (frees the card; removed from its access level first when it had one)
 *  - check: device-side applying failures reported by HikCentral for this visitor
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const auth = await authorizeAccessDoor();
    if ('error' in auth) return auth.error;

    const { id } = await context.params;
    if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Invalid assignment id' }, { status: 400 });

    let action: unknown;
    try {
        action = ((await request.json()) as { action?: unknown }).action;
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    if (action !== 'revoke' && action !== 'check') {
        return NextResponse.json({ error: 'action must be "revoke" or "check"' }, { status: 400 });
    }

    try {
        const pool = await getVisitorDbConnection();
        const { rows } = await pool.query<AccessAssignmentRow>(
            `SELECT ${ASSIGNMENT_COLUMNS} FROM visitor_access_assignments WHERE id = $1`,
            [id]
        );
        const row = rows[0];
        if (!row) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

        if (action === 'check') {
            const result: AccessCheckResponse = await getApplicationStatus(row.visitor_name);
            return NextResponse.json(result, { status: 200 });
        }

        // ---- revoke ----
        if (row.status !== 'active' && row.status !== 'failed') {
            return NextResponse.json({ error: `This assignment is already ${row.status}` }, { status: 409 });
        }
        if (row.person_id) {
            if (row.privilege_group_id) {
                try {
                    await removePersonFromAccessLevel(row.privilege_group_id, row.person_id);
                } catch (err) {
                    // Deleting the person below also drops its access levels; only the delete must succeed
                    console.warn('[access-door] remove from access level failed, deleting the person anyway:', err);
                }
            }
            try {
                await deletePerson(row.person_id);
            } catch (err) {
                await pool.query(
                    'UPDATE visitor_access_assignments SET last_error = $2, updated_at = NOW() WHERE id = $1',
                    [id, `Revoke failed: ${errorMessage(err)}`]
                );
                throw err;
            }
        }

        const { rows: updated } = await pool.query<AccessAssignmentRow>(
            `UPDATE visitor_access_assignments
             SET status = 'revoked', revoked_by = $2, revoked_at = NOW(), last_error = NULL, updated_at = NOW()
             WHERE id = $1
             RETURNING ${ASSIGNMENT_COLUMNS}`,
            [id, auth.user]
        );
        return NextResponse.json({ assignment: fromAssignmentRow(updated[0]) }, { status: 200 });
    } catch (err) {
        return accessErrorResponse(err, `PATCH ${String(action)}`);
    }
}
