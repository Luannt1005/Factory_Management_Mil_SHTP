import type { PoolClient } from 'pg';
import { getDbConnection } from '@/lib/db';
import { getEmployeeDb } from '@/lib/employee-db';
import { getCachedData, invalidateCachePrefix } from '@/lib/cache';
import type { EmployeeEdit, EmployeeEditableField, EmployeeRecord } from '@/types/employee-source.types';

/**
 * Employee data for Orgchart / Headcount.
 *
 * - HR rows come from the employee master database (read only), limited to the scope the
 *   org chart always had: BU Milwaukee, IDL + Staff.
 * - The app's own changes live in Orgchart_TTI_Mil:
 *     employee_overrides   - per emp_id edits on HR rows (location, is direct, line manager approval...);
 *                            a NULL column means "use HR's value", hidden = removed from the app
 *     employee_manual_rows - rows HR doesn't know (open headcount, manually added people)
 * Rows are returned in the legacy `employees` shape so existing consumers keep working.
 */

export const EMPLOYEE_SCOPE = {
    types: ['IDL', 'Staff'],
    businessUnits: ['Milwaukee'],
} as const;

const CACHE_KEY = 'employees_source';
const CACHE_TTL = 15 * 60 * 1000;

const OVERRIDE_FIELDS: EmployeeEditableField[] = [
    'full_name', 'job_title', 'dept', 'bu', 'bu_org_3', 'dl_idl_staff', 'location', 'employee_type',
    'line_manager', 'is_direct', 'joining_date', 'line_manager_status', 'pending_line_manager', 'requester',
];
const MANUAL_FIELDS: EmployeeEditableField[] = ['emp_id', ...OVERRIDE_FIELDS];

const HR_STATUS: Record<string, string> = { active: 'Active', resigned: 'Resigned', future: 'Future' };

/** "000818" -> "818" (ids are compared without leading zeros everywhere in the app) */
export function normalizeEmpId(value: string | null | undefined): string {
    return String(value ?? '').trim().replace(/^0+/, '');
}

interface HrRow {
    emp_id: string;
    full_name: string | null;
    office_email: string | null;
    display_name: string | null;
    cost_center: string | null;
    title_name: string | null;
    dept_name: string | null;
    bu: string | null;
    function_name: string | null;
    dl_idl_staff: string | null;
    status: string | null;
    line_manager_id: string | null;
    manager_name: string | null;
    joining_serial: string | null;
    resigned_serial: string | null;
}

type OverrideRow = { emp_id: string; hidden: boolean } & Record<EmployeeEditableField, string | null>;
type ManualRow = { id: string; status: string | null; last_working_day: string | null } & Record<EmployeeEditableField, string | null>;

// ===============================
// Reading
// ===============================

async function readHrRows(): Promise<HrRow[]> {
    // Dates are returned as Excel serial day numbers, the format the legacy table stored
    const result = await getEmployeeDb().query<HrRow>(
        `SELECT e.emp_id, e.full_name, NULLIF(trim(e.office_email), '') AS office_email,
                NULLIF(trim(e.display_name), '') AS display_name,
                COALESCE(NULLIF(trim(e.cost_center), ''), NULLIF(trim(d.cost_center), '')) AS cost_center, t.title_name, d.dept_name, e."emp_BU" AS bu, f.function_name,
                e.dl_idl_staff, e.status, e.line_manager_id, m.full_name AS manager_name,
                (e.joining_date - DATE '1899-12-30')::text AS joining_serial,
                (e.resigned_date - DATE '1899-12-30')::text AS resigned_serial
           FROM final.employees e
           LEFT JOIN final.titles t ON t.title_id = e.title_id
           LEFT JOIN final.departments d ON d.dept_id = e.dept_id
           LEFT JOIN final.functions f ON f.function_id = e.function_id
           LEFT JOIN final.employees m ON m.emp_id = e.line_manager_id
          WHERE e.dl_idl_staff = ANY($1) AND e."emp_BU" = ANY($2)`,
        [EMPLOYEE_SCOPE.types, EMPLOYEE_SCOPE.businessUnits]
    );
    return result.rows;
}

function fromHr(row: HrRow, override: OverrideRow | undefined): EmployeeRecord {
    const pick = (field: EmployeeEditableField, hrValue: string | null) => override?.[field] ?? hrValue;
    return {
        id: row.emp_id,
        emp_id: row.emp_id,
        full_name: pick('full_name', row.full_name),
        job_title: pick('job_title', row.title_name),
        dept: pick('dept', row.dept_name),
        bu: pick('bu', row.bu),
        bu_org_3: pick('bu_org_3', row.function_name),
        dl_idl_staff: pick('dl_idl_staff', row.dl_idl_staff),
        location: pick('location', null),
        employee_type: pick('employee_type', null),
        line_manager: pick('line_manager', row.line_manager_id ? `${row.line_manager_id}:${row.manager_name ?? ''}` : null),
        joining_date: pick('joining_date', row.joining_serial),
        last_working_day: row.resigned_serial,
        line_manager_status: override?.line_manager_status ?? null,
        pending_line_manager: override?.pending_line_manager ?? null,
        is_direct: pick('is_direct', 'YES'),
        requester: override?.requester ?? null,
        status: HR_STATUS[String(row.status).toLowerCase()] ?? row.status,
        email: row.office_email,
        display_name: row.display_name,
        cost_center: row.cost_center,
        source: 'hr',
    };
}

function fromManual(row: ManualRow): EmployeeRecord {
    return {
        id: row.id,
        emp_id: row.emp_id ?? '',
        full_name: row.full_name,
        job_title: row.job_title,
        dept: row.dept,
        bu: row.bu,
        bu_org_3: row.bu_org_3,
        dl_idl_staff: row.dl_idl_staff,
        location: row.location,
        employee_type: row.employee_type,
        line_manager: row.line_manager,
        joining_date: row.joining_date,
        last_working_day: row.last_working_day,
        line_manager_status: row.line_manager_status,
        pending_line_manager: row.pending_line_manager,
        is_direct: row.is_direct,
        requester: row.requester,
        status: row.status,
        email: null,
        display_name: null,
        cost_center: null,
        source: 'manual',
    };
}

/** All employees in scope (every status), HR merged with the app's edits, sorted by name. Cached 15 min. */
export async function loadEmployeeRecords(): Promise<EmployeeRecord[]> {
    return getCachedData(
        CACHE_KEY,
        async () => {
            const appDb = await getDbConnection();
            const [hrRows, overrides, manualRows] = await Promise.all([
                readHrRows(),
                appDb.query<OverrideRow>('SELECT * FROM employee_overrides'),
                appDb.query<ManualRow>('SELECT * FROM employee_manual_rows'),
            ]);
            const overrideById = new Map(overrides.rows.map((o) => [normalizeEmpId(o.emp_id), o]));

            const records: EmployeeRecord[] = [];
            for (const row of hrRows) {
                const override = overrideById.get(normalizeEmpId(row.emp_id));
                if (override?.hidden) continue;
                records.push(fromHr(row, override));
            }
            manualRows.rows.forEach((row) => records.push(fromManual(row)));
            records.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''));
            console.log(`✅ Employee source: ${hrRows.length} HR rows, ${overrides.rows.length} overrides, ${manualRows.rows.length} manual rows`);
            return records;
        },
        CACHE_TTL
    );
}

/** Active employees, as the legacy `status = 'Active' OR status IS NULL` */
export function isActiveRecord(record: EmployeeRecord): boolean {
    return record.status === 'Active' || record.status === null;
}

export async function findEmployeeRecord(id: string): Promise<EmployeeRecord | null> {
    const records = await loadEmployeeRecords();
    return records.find((r) => r.id === id) ?? records.find((r) => r.source === 'hr' && normalizeEmpId(r.emp_id) === normalizeEmpId(id)) ?? null;
}

export function invalidateEmployeeCaches() {
    invalidateCachePrefix('employees');
    invalidateCachePrefix('orgchart');
}

// ===============================
// Writing (app database only)
// ===============================

function pickFields(edit: EmployeeEdit, allowed: EmployeeEditableField[]): [EmployeeEditableField, string | null][] {
    return allowed.filter((f) => edit[f] !== undefined).map((f) => [f, edit[f] ?? null]);
}

async function upsertOverride(db: Pick<PoolClient, 'query'>, empId: string, fields: [string, string | null][], user: string | null, hidden = false) {
    const columns = fields.map(([f]) => f);
    const values = fields.map(([, v]) => v);
    const insertCols = ['emp_id', 'hidden', 'updated_by', ...columns];
    const placeholders = insertCols.map((_, i) => `$${i + 1}`);
    const updates = ['hidden = EXCLUDED.hidden', 'updated_by = EXCLUDED.updated_by', 'updated_at = now()', ...columns.map((c) => `${c} = EXCLUDED.${c}`)];
    await db.query(
        `INSERT INTO employee_overrides (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})
         ON CONFLICT (emp_id) DO UPDATE SET ${updates.join(', ')}`,
        [empId, hidden, user, ...values]
    );
}

/** Update one employee: manual rows are changed in place, HR rows get an override. False when not found. */
export async function saveEmployeeEdit(id: string, edit: EmployeeEdit, user: string | null): Promise<boolean> {
    const record = await findEmployeeRecord(id);
    if (!record) return false;
    const db = await getDbConnection();

    if (record.source === 'manual') {
        const fields = pickFields(edit, MANUAL_FIELDS);
        if (fields.length > 0) {
            const sets = fields.map(([f], i) => `${f} = $${i + 2}`);
            await db.query(`UPDATE employee_manual_rows SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, [record.id, ...fields.map(([, v]) => v)]);
        }
    } else {
        const fields = pickFields(edit, OVERRIDE_FIELDS);
        if (fields.length > 0) await upsertOverride(db, record.emp_id, fields, user);
    }
    invalidateEmployeeCaches();
    return true;
}

/** Insert rows HR doesn't have (open headcount, manual additions) in one transaction; returns their ids */
export async function addManualRows(rows: EmployeeEdit[], user: string | null): Promise<string[]> {
    const db = await getDbConnection();
    const client = await db.connect();
    const ids: string[] = [];
    try {
        await client.query('BEGIN');
        for (const row of rows) {
            const fields = pickFields(row, MANUAL_FIELDS);
            const cols = [...fields.map(([f]) => f), 'created_by'];
            const result = await client.query<{ id: string }>(
                `INSERT INTO employee_manual_rows (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id`,
                [...fields.map(([, v]) => v), user]
            );
            ids.push(result.rows[0].id);
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
    invalidateEmployeeCaches();
    return ids;
}

/** Manual rows are deleted; HR employees are only hidden from the app (HR data is never touched) */
export async function removeEmployee(id: string, user: string | null): Promise<boolean> {
    const record = await findEmployeeRecord(id);
    if (!record) return false;
    const db = await getDbConnection();
    if (record.source === 'manual') {
        await db.query('DELETE FROM employee_manual_rows WHERE id = $1', [record.id]);
    } else {
        await upsertOverride(db, record.emp_id, [], user, true);
    }
    invalidateEmployeeCaches();
    return true;
}

/** "Delete all": removes every manual row; HR rows and their edits (location...) stay */
export async function removeAllManualRows(): Promise<number> {
    const db = await getDbConnection();
    const result = await db.query('DELETE FROM employee_manual_rows');
    invalidateEmployeeCaches();
    return result.rowCount ?? 0;
}

/** Approve or reject every pending line manager change */
export async function resolvePendingLineManagers(approve: boolean): Promise<number> {
    const db = await getDbConnection();
    const set = approve
        ? `line_manager = pending_line_manager, line_manager_status = 'approved', pending_line_manager = NULL, requester = NULL`
        : `line_manager_status = 'rejected', pending_line_manager = NULL, requester = NULL`;
    const a = await db.query(`UPDATE employee_overrides SET ${set}, updated_at = now() WHERE line_manager_status = 'pending'`);
    const b = await db.query(`UPDATE employee_manual_rows SET ${set}, updated_at = now() WHERE line_manager_status = 'pending'`);
    invalidateEmployeeCaches();
    return (a.rowCount ?? 0) + (b.rowCount ?? 0);
}

/**
 * Excel import: HR now owns names, titles, departments and status, so a file only fills in what HR
 * doesn't have - Location, Is Direct and (for indirect reports) the line manager. Unknown ids are skipped.
 */
export async function importEmployeeOverrides(
    rows: { empId: string; location: string | null; isDirect: string | null; lineManager: string | null }[],
    user: string | null
): Promise<{ saved: number; skipped: number }> {
    const records = await loadEmployeeRecords();
    const hrIds = new Map(records.filter((r) => r.source === 'hr').map((r) => [normalizeEmpId(r.emp_id), r.emp_id]));
    const db = await getDbConnection();
    const client = await db.connect();
    let saved = 0;
    let skipped = 0;
    try {
        await client.query('BEGIN');
        for (const row of rows) {
            const empId = hrIds.get(normalizeEmpId(row.empId));
            if (!empId) {
                skipped++;
                continue;
            }
            const fields: [string, string | null][] = [];
            if (row.location) fields.push(['location', row.location]);
            if (row.isDirect) fields.push(['is_direct', row.isDirect]);
            if (row.isDirect?.toUpperCase() === 'NO' && row.lineManager) fields.push(['line_manager', row.lineManager]);
            if (fields.length === 0) {
                skipped++;
                continue;
            }
            await upsertOverride(client, empId, fields, user);
            saved++;
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
    invalidateEmployeeCaches();
    return { saved, skipped };
}

// ===============================
// Photos
// ===============================

/** Employee photo from the master database, or null when HR has none */
export async function readEmployeePhoto(empId: string): Promise<{ data: Buffer; contentType: string } | null> {
    const id = normalizeEmpId(empId);
    if (!/^\d{1,10}$/.test(id)) return null;
    const result = await getEmployeeDb().query<{ high_res: Buffer | null; low_res: Buffer | null; content_type: string | null }>(
        `SELECT high_res, low_res, content_type FROM final.images
          WHERE ltrim(emp_id, '0') = $1 AND (high_res IS NOT NULL OR low_res IS NOT NULL)
          LIMIT 1`,
        [id]
    );
    const row = result.rows[0];
    const data = row?.high_res ?? row?.low_res;
    return data ? { data, contentType: row.content_type || 'image/jpeg' } : null;
}
