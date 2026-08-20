const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const client = new Client({
        host: process.env.DB_SERVER,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'Visitor_database'
    });

    await client.connect();
    
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS "MeetingRoom" (
                "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                "floorName" VARCHAR(255) NOT NULL,
                "roomName" VARCHAR(255) NOT NULL,
                "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("MeetingRoom table created successfully");
        
        // Seed some initial data for testing if empty
        const count = await client.query('SELECT COUNT(*) FROM "MeetingRoom"');
        if (parseInt(count.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO "MeetingRoom" ("floorName", "roomName") VALUES
                ('Lầu 1', 'Phòng họp A'),
                ('Lầu 2', 'Phòng họp B'),
                ('Lầu 3', 'Phòng họp VIP')
            `);
            console.log("Seeded initial meeting rooms");
        }
    } catch (e) {
        console.error("Error creating table:", e);
    } finally {
        await client.end();
    }
}

migrate();
