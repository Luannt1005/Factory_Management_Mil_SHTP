import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
    user: process.env.VISITOR_DB_USER || process.env.DB_USER || 'postgres',
    password: process.env.VISITOR_DB_PASSWORD || process.env.DB_PASSWORD || 'idmc',
    host: process.env.VISITOR_DB_SERVER || process.env.DB_SERVER || '10.147.36.55',
    port: parseInt(process.env.VISITOR_DB_PORT || process.env.DB_PORT || '5432', 10),
    database: 'Visitor_database',
    ssl: false,
});

async function run() {
    try {
        const client = await pool.connect();
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS "IntervieweeRequest" (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "visitorCode" VARCHAR(50) UNIQUE NOT NULL,
                "osName" VARCHAR(200) NOT NULL,
                "intervieweeName" VARCHAR(200) NOT NULL,
                "jobTitle" VARCHAR(200),
                "interviewDepartment" VARCHAR(200),
                "interviewerName" VARCHAR(200),
                "startDate" DATE,
                "startTime" VARCHAR(20),
                "interviewArea" VARCHAR(200),
                status VARCHAR(50) DEFAULT 'IN PROCESS',
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("IntervieweeRequest table created successfully.");
        client.release();
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await pool.end();
    }
}
run();
