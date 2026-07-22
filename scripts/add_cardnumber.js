require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'Visitor_database',
    ssl: false
});

async function run() {
    try {
        await pool.query('ALTER TABLE "VisitorCheckInOut" ADD COLUMN "cardNumber" VARCHAR(50);');
        console.log("Success");
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log("Column already exists");
        } else {
            console.error("Error:", e.message);
        }
    } finally {
        await pool.end();
    }
}
run();
