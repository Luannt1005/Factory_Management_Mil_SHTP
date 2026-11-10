require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

/**
 * Adds "cardIssuedAt" to "VisitorCheckInOut": when the printed card was handed out at the gate.
 * New nullable column only, no existing data changes. Safe to re-run (IF NOT EXISTS).
 * Run manually: node scripts/add_card_issued_at.js
 *
 * Run this BEFORE deploying the code that reads it: the Check-in/out page selects this column.
 */
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
        console.log('Adding "cardIssuedAt" to "VisitorCheckInOut"...');
        await pool.query(`
            ALTER TABLE "VisitorCheckInOut"
            ADD COLUMN IF NOT EXISTS "cardIssuedAt" TIMESTAMPTZ;
        `);
        console.log('Done.');
    } catch (e) {
        console.error('Migration error:', e.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
