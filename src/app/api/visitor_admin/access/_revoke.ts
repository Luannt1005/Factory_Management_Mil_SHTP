import type { getVisitorDbConnection } from '@/lib/visitor-db';
import { HikCentralError, deletePerson, findPersonIdByCode, findPersonsByCard, isPersonNotFoundError, removePersonFromAccessLevel } from '@/lib/hikcentral/client';
import type { AccessAssignmentRow } from '@/types/visitor-access.types';
import { ASSIGNMENT_COLUMNS, errorMessage } from './_shared';

type VisitorPool = Awaited<ReturnType<typeof getVisitorDbConnection>>;

/**
 * The stored person no longer exists on HikCentral (deleted outside this page). Before the record is
 * closed, make sure nothing still gives this visitor access with this card:
 * - the card held by someone else while this assignment is active: inconsistent, refuse;
 * - an active assignment whose visitor code still exists under another person ID (re-created on the
 *   platform): delete that person, as a normal revoke would.
 * A failed assignment never gave access, so it is closed without touching the platform.
 */
async function revokeMissingPerson(row: AccessAssignmentRow): Promise<void> {
    if (row.status !== 'active') return;

    const holders = await findPersonsByCard(row.card_no);
    const visitorCode = row.visitor_code.toUpperCase();
    const other = holders.find((h) => h.personCode.toUpperCase() !== visitorCode);
    if (other) {
        throw new HikCentralError(
            'held-by-other',
            `Card ${row.card_no} is held by ${other.personName || other.personCode} (${other.personCode}) on HikCentral. Check the card in Card lookup.`
        );
    }

    const currentId = await findPersonIdByCode(row.visitor_code);
    if (currentId) await deletePerson(currentId);
}

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
            try {
                await deletePerson(row.person_id);
            } catch (err) {
                if (!isPersonNotFoundError(err)) throw err;
                console.warn(`[access-door] person ${row.person_id} of ${row.visitor_code} no longer exists on HikCentral; checking card ${row.card_no}`);
                await revokeMissingPerson(row);
            }
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
