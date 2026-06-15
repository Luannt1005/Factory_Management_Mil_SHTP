const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'idmc',
    host: process.env.DB_SERVER || '10.147.36.55',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'Visitor_database',
    ssl: false,
});

async function migrate() {
    try {
        console.log('Connecting to DB to create RoomCategory table...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "RoomCategory" (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) UNIQUE NOT NULL,
                site_location VARCHAR(50) NOT NULL,
                bu VARCHAR(100) NOT NULL,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            );
        `);

        // Create some default categories to start with
        const categories = [
            { name: 'Common Office', site_location: 'SHTP', bu: 'Share Function' },
            { name: 'AME', site_location: 'SHTP', bu: 'Milwaukee' },
            { name: 'ENG', site_location: 'SHTP', bu: 'Milwaukee' },
            { name: 'EE/MT', site_location: 'SHTP', bu: 'Milwaukee' },
            { name: 'MFG', site_location: 'SHTP', bu: 'Milwaukee' },
            { name: 'Shipping', site_location: 'SHTP', bu: 'Share Function' },
            { name: 'Quality QM', site_location: 'SHTP', bu: 'Share Function' },
            { name: 'MIL/TTI Expat / SHTP Business trip', site_location: 'SHTP', bu: 'Milwaukee' }
        ];

        for (const cat of categories) {
            await pool.query(`
                INSERT INTO "RoomCategory" (name, site_location, bu) 
                VALUES ($1, $2, $3)
                ON CONFLICT (name) DO NOTHING;
            `, [cat.name, cat.site_location, cat.bu]);
        }

        console.log('Table RoomCategory created and seeded successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
