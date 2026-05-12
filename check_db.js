const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'Orgchart_TTI_Mil',
    ssl: false,
});

async function run() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        const columns = res.rows.map(r => r.column_name);
        console.log("Existing columns in 'users':", columns);

        const neededColumns = ['job_title', 'department', 'location'];
        for (const col of neededColumns) {
            if (!columns.includes(col)) {
                console.log(`Adding column ${col} to users table...`);
                await client.query(`ALTER TABLE users ADD COLUMN ${col} VARCHAR(255);`);
            }
        }
        console.log("Database schema check complete.");
        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}
run();
