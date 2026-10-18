require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

/**
 * Creates the tables of the Visitor Cards "Access Door" tab (/visitoradmin/cards):
 *  - visitor_access_assignments: every card given to a visitor in HikCentral (audit + which card is in use)
 *  - visitor_access_settings: default departments / access levels
 * Safe to re-run (IF NOT EXISTS). Run manually: node scripts/create_visitor_access_tables.js
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
        console.log('Creating visitor_access_assignments table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visitor_access_assignments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                visitor_code VARCHAR(16) NOT NULL,
                request_code VARCHAR(64),
                visitor_name VARCHAR(256) NOT NULL,
                company VARCHAR(256),
                category VARCHAR(128),
                site VARCHAR(32),
                card_no VARCHAR(32) NOT NULL,
                person_id VARCHAR(64),
                org_index_code VARCHAR(64),
                org_name VARCHAR(256),
                privilege_group_id VARCHAR(64),
                privilege_group_name VARCHAR(128),
                begin_time TIMESTAMPTZ NOT NULL,
                end_time TIMESTAMPTZ NOT NULL,
                status VARCHAR(16) NOT NULL DEFAULT 'active',
                last_error TEXT,
                assigned_by TEXT,
                assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                revoked_by TEXT,
                revoked_at TIMESTAMPTZ,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // Tables created by the first version: department columns, access level optional
        await pool.query(`ALTER TABLE visitor_access_assignments ADD COLUMN IF NOT EXISTS org_index_code VARCHAR(64)`);
        await pool.query(`ALTER TABLE visitor_access_assignments ADD COLUMN IF NOT EXISTS org_name VARCHAR(256)`);
        await pool.query(`ALTER TABLE visitor_access_assignments ALTER COLUMN privilege_group_id DROP NOT NULL`);

        // A physical card and a visitor can each have only one active assignment
        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_visitor_access_active_card
            ON visitor_access_assignments (card_no) WHERE status = 'active';
        `);
        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_visitor_access_active_visitor
            ON visitor_access_assignments (visitor_code) WHERE status = 'active';
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_visitor_access_assigned_at
            ON visitor_access_assignments (assigned_at DESC);
        `);

        console.log('Creating visitor_access_settings table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visitor_access_settings (
                id VARCHAR(32) PRIMARY KEY,
                settings JSONB NOT NULL,
                updated_by TEXT,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('Successfully created the Access Door tables.');

        const res = await pool.query(`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_name IN ('visitor_access_assignments', 'visitor_access_settings')
            ORDER BY table_name, ordinal_position;
        `);
        console.table(res.rows);
    } catch (e) {
        console.error('Migration error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
