require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Adds RoomArea."approvalMode". Existing rooms get 'send_all', so they keep working as before.
const pool = new Pool({
    user: process.env.VISITOR_DB_USER || process.env.DB_USER,
    password: process.env.VISITOR_DB_PASSWORD || process.env.DB_PASSWORD,
    host: process.env.VISITOR_DB_SERVER || process.env.DB_SERVER,
    port: parseInt(process.env.VISITOR_DB_PORT || process.env.DB_PORT || '5432', 10),
    database: 'Visitor_database',
    ssl: false
});

async function run() {
    try {
        await pool.query(`
            ALTER TABLE "RoomArea"
            ADD COLUMN IF NOT EXISTS "approvalMode" TEXT NOT NULL DEFAULT 'send_all';
        `);
        const res = await pool.query(`SELECT "approvalMode", COUNT(*)::int AS rooms FROM "RoomArea" GROUP BY 1`);
        console.log('RoomArea."approvalMode" is ready:');
        console.table(res.rows);
    } catch (e) {
        console.error('Migration error:', e.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
