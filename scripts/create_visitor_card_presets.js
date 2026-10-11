require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

/**
 * Creates the shared "visitor_card_presets" table used by the Visitor Card Studio
 * (/visitoradmin/cards) so every visitor admin shares the same badge presets.
 * Safe to re-run (IF NOT EXISTS). Run manually: node scripts/create_visitor_card_presets.js
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
        console.log('Creating visitor_card_presets table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visitor_card_presets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(120) NOT NULL,
                settings JSONB NOT NULL,
                created_by TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // Preset names are unique (case-insensitive) so the dropdown never shows duplicates
        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_visitor_card_presets_name
            ON visitor_card_presets (LOWER(name));
        `);
        console.log('Successfully created visitor_card_presets.');

        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'visitor_card_presets'
            ORDER BY ordinal_position;
        `);
        console.table(res.rows);
    } catch (e) {
        console.error('Migration error:', e.message);
    } finally {
        await pool.end();
    }
}

run();
