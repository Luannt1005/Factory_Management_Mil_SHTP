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
        
        console.log("Creating VisitorCheckInOut table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS "VisitorCheckInOut" (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "requestId" VARCHAR(50) NOT NULL,
                "visitorIndex" INT NOT NULL,
                "visitorName" VARCHAR(255) NOT NULL,
                "visitorCode" VARCHAR(100) UNIQUE NOT NULL,
                "checkInTime" TIMESTAMP,
                "checkOutTime" TIMESTAMP,
                status VARCHAR(50) DEFAULT 'PENDING',
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_request FOREIGN KEY ("requestId") REFERENCES "VisitorRequest"(id) ON DELETE CASCADE
            );
        `);
        
        console.log("Creating indexes on VisitorCheckInOut...");
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_checkinout_request_id ON "VisitorCheckInOut"("requestId");
            CREATE INDEX IF NOT EXISTS idx_checkinout_code ON "VisitorCheckInOut"("visitorCode");
            CREATE INDEX IF NOT EXISTS idx_checkinout_status ON "VisitorCheckInOut"(status);
        `);
        
        console.log("VisitorCheckInOut table and indexes successfully created.");
        client.release();
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await pool.end();
    }
}

run();
