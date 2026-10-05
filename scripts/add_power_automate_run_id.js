require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.VISITOR_DB_USER || process.env.DB_USER || 'postgres',
    password: process.env.VISITOR_DB_PASSWORD || process.env.DB_PASSWORD || 'idmc',
    host: process.env.VISITOR_DB_SERVER || process.env.DB_SERVER || '10.147.36.55',
    port: parseInt(process.env.VISITOR_DB_PORT || process.env.DB_PORT || '5432', 10),
    database: 'Visitor_database',
    ssl: false
});

async function run() {
    try {
        console.log("Checking and adding power_automate_run_id column to VisitorRequest...");
        await pool.query(`
            ALTER TABLE "VisitorRequest" 
            ADD COLUMN IF NOT EXISTS power_automate_run_id TEXT;
        `);
        console.log("Successfully added power_automate_run_id column to VisitorRequest.");

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_visitor_request_power_automate_run_id 
            ON "VisitorRequest" (power_automate_run_id);
        `);
        console.log("Successfully created index idx_visitor_request_power_automate_run_id.");

        // Verification
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'VisitorRequest' AND column_name = 'power_automate_run_id';
        `);
        console.log("Verified column in VisitorRequest:");
        console.table(res.rows);
    } catch (e) {
        console.error("Migration error:", e.message);
    } finally {
        await pool.end();
    }
}

run();
