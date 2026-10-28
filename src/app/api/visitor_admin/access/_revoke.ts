import type { getVisitorDbConnection } from '@/lib/visitor-db';
import { deletePerson, removePersonFromAccessLevel } from '@/lib/hikcentral/client';
import type { AccessAssignmentRow } from '@/types/visitor-access.types';
import { ASSIGNMENT_COLUMNS, errorMessage } from './_shared';

type VisitorPool = Awaited<ReturnType<typeof getVisitorDbConnection>>;

/**
 * Revokes a visitor's card: removes the person from its access level (when it had one) and deletes
 * it in HikCentral, which frees the card, then marks the record "revoked".
 * A failed delete is stored as last_error on the record and re-thrown.
 */
export async function revokeAssignmentRow(pool: VisitorPool, row: AccessAssignmentRow, user: string): Promise<AccessAssignmentRow> {
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
                [row.id, `Revoke failed: ${errorMessage(err)}`]
            );
            throw err;
        }
    }

    const { rows } = await pool.query<AccessAssignmentRow>(
        `UPDATE visitor_access_assignments
         SET status = 'revoked', revoked_by = $2, revoked_at = NOW(), last_error = NULL, updated_at = NOW()
         WHERE id = $1
         RETURNING ${ASSIGNMENT_COLUMNS}`,
        [row.id, user]
    );
    return rows[0];
}
