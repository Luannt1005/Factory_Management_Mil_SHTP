require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

/**
 * Orgchart / Headcount now read employees from the employee master database (employee-project-v2).
 * The app's own data stays in Orgchart_TTI_Mil, in two new tables:
 *  - employee_overrides:   per emp_id edits on HR employees (location, is direct, line manager approval...)
 *  - employee_manual_rows: rows HR doesn't have (open headcount, manually added people)
 *
 * --seed copies what only the legacy `employees` table knows (it is left untouched):
 *  - Location of every employee, Is Direct = No (with its line manager), approved line manager changes
 *  - open headcount / manually added rows (emp_id not a plain number)
 * Safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING).
 * Run manually: node scripts/create_employee_overlay_tables.js [--seed]
 */
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'Orgchart_TTI_Mil',
    ssl: false
});

const EDIT_COLUMNS = `
    full_name VARCHAR(256),
    job_title VARCHAR(256),
    dept VARCHAR(256),
    bu VARCHAR(128),
    bu_org_3 VARCHAR(128),
    dl_idl_staff VARCHAR(32),
    location VARCHAR(64),
    employee_type VARCHAR(64),
    line_manager VARCHAR(512),
    is_direct VARCHAR(16),
    joining_date VARCHAR(32),
    line_manager_status VARCHAR(32),
    pending_line_manager VARCHAR(512),
    requester VARCHAR(256)`;

async function run() {
    const seed = process.argv.includes('--seed');
    try {
        console.log('Creating employee_overrides table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_overrides (
                emp_id VARCHAR(32) PRIMARY KEY,
                ${EDIT_COLUMNS},
                hidden BOOLEAN NOT NULL DEFAULT false,
                updated_by VARCHAR(256),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);

        console.log('Creating employee_manual_rows table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_manual_rows (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                emp_id VARCHAR(64),
                ${EDIT_COLUMNS},
                last_working_day VARCHAR(32),
                status VARCHAR(32) DEFAULT 'Active',
                created_by VARCHAR(256),
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);

        if (seed) {
            console.log('Seeding overrides from the legacy employees table...');
            const overrides = await pool.query(`
                INSERT INTO employee_overrides (emp_id, location, is_direct, line_manager, line_manager_status, updated_by)
                SELECT emp_id,
                       NULLIF(trim(location), ''),
                       CASE WHEN upper(is_direct) = 'NO' THEN is_direct END,
                       CASE WHEN upper(is_direct) = 'NO' OR line_manager_status = 'approved' THEN line_manager END,
                       CASE WHEN line_manager_status = 'approved' THEN line_manager_status END,
                       'seed:legacy-employees'
                  FROM employees
                 WHERE emp_id ~ '^[0-9]+$'
                   AND (NULLIF(trim(location), '') IS NOT NULL OR upper(is_direct) = 'NO' OR line_manager_status = 'approved')
                ON CONFLICT (emp_id) DO NOTHING
            `);
            console.log(`  ${overrides.rowCount} overrides added`);

            const manual = await pool.query(`
                INSERT INTO employee_manual_rows (emp_id, full_name, job_title, dept, bu, bu_org_3, dl_idl_staff, location, employee_type,
                                                  line_manager, is_direct, joining_date, last_working_day, status, created_by)
                SELECT e.emp_id, e.full_name, e.job_title, e.dept, e.bu, e.bu_org_3, e.dl_idl_staff, e.location, e.employee_type,
                       e.line_manager, e.is_direct, e.joining_date, e.last_working_day, e.status, 'seed:legacy-employees'
                  FROM employees e
                 WHERE (e.emp_id IS NULL OR e.emp_id !~ '^[0-9]+$' OR e.employee_type = 'hc_open')
                   AND NOT EXISTS (SELECT 1 FROM employee_manual_rows m WHERE m.emp_id = e.emp_id)
            `);
            console.log(`  ${manual.rowCount} manual rows added`);
        }

        console.log('Done.');
    } catch (err) {
        console.error('Failed:', err.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
