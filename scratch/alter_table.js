const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbServer = process.env.DB_SERVER || '10.147.36.55';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'idmc';
const dbName = 'Visitor_database';

const pool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: dbServer,
    port: dbPort,
    database: dbName,
    ssl: false,
});

async function run() {
    try {
        const client = await pool.connect();
        console.log("Altering RequestApproval table to drop NOT NULL constraint on roomAreaId...");
        await client.query('ALTER TABLE "RequestApproval" ALTER COLUMN "roomAreaId" DROP NOT NULL;');
        console.log("Successfully altered column roomAreaId to allow NULL values!");
        client.release();
    } catch (err) {
        console.error("Error during table alteration:", err);
    } finally {
        await pool.end();
    }
}
run();
