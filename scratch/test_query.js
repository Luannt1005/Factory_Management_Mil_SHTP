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
        
        console.log("Testing SQL query to expand visitors JSON...");
        const res = await client.query(`
            SELECT 
                r.id AS "requestId",
                r."visitorCategory" AS "visitorCategory",
                r."startDate" AS "startDate",
                r."endDate" AS "endDate",
                r.status AS "requestStatus",
                v.elem->>'name' AS "visitorName",
                v.elem->>'title' AS "visitorTitle",
                v.elem->>'company' AS "visitorCompany",
                (v.idx::int - 1) AS "visitorIndex",
                r."visitingSite" AS "visitingSite",
                r."purposeOfVisit" AS "purposeOfVisit",
                c.id AS "checkInOutId",
                c."checkInTime" AS "checkInTime",
                c."checkOutTime" AS "checkOutTime",
                COALESCE(c.status, 'PENDING') AS "checkInOutStatus",
                r.id || '-V' || v.idx AS "visitorCode"
            FROM "VisitorRequest" r
            CROSS JOIN LATERAL json_array_elements(
                CASE 
                    WHEN r.visitors IS NULL OR r.visitors = '' THEN '[]'::json 
                    ELSE r.visitors::json 
                END
            ) WITH ORDINALITY v(elem, idx)
            LEFT JOIN "VisitorCheckInOut" c ON r.id = c."requestId" AND (v.idx::int - 1) = c."visitorIndex"
            LIMIT 5;
        `);
        
        console.log("Query completed successfully. Sample rows:", res.rows);
        client.release();
    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await pool.end();
    }
}

run();
