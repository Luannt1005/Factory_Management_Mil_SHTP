require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

/**
 * Creates visitor_card_prints: which visitor cards were confirmed as printed in the Visitor Card Studio.
 * One row per visitor code (reprints update the same row). Adds a new table only, no existing table changes.
 * Safe to re-run (IF NOT EXISTS). Run manually: node scripts/create_visitor_card_prints.js
 *
 * Run this BEFORE deploying the code that reads it: Check-in/out, Admin Settings and Print Cards query this table.
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
        console.log('Creating visitor_card_prints table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visitor_card_prints (
                visitor_code VARCHAR(64) PRIMARY KEY,
                print_count INT NOT NULL DEFAULT 1,
                first_printed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_printed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_printed_by TEXT
            );
        `);
        console.log('Successfully created visitor_card_prints.');
    } catch (e) {
        console.error('Migration error:', e.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
