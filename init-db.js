const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    user: 'postgres',
    password: 'idmc',
    host: '10.147.36.55',
    port: 5432,
    database: 'postgres'
};

async function init() {
    const adminPool = new Pool(dbConfig);
    try {
        const res = await adminPool.query("SELECT 1 FROM pg_database WHERE datname='Visitor_database'");
        if (res.rowCount === 0) {
            console.log("Creating database Visitor_database...");
            await adminPool.query('CREATE DATABASE "Visitor_database"');
        } else {
            console.log("Database Visitor_database already exists.");
        }
    } catch (e) {
        console.log("Warning checking db:", e.message);
    } finally {
        await adminPool.end();
    }

    const visitorPool = new Pool({ ...dbConfig, database: 'Visitor_database' });
    try {
        console.log("Creating schema...");
        const sqlPath = 'c:\\Users\\luan.nguyen\\Desktop\\Visitor App\\Visitor App testing\\supabase_schema.sql';
        const schema = fs.readFileSync(sqlPath, 'utf8');
        // Filter out supabase specific things if necessary or just run
        await visitorPool.query(schema);
        console.log("Schema applied successfully.");
    } catch (e) {
        console.error("Error applying schema:", e);
    } finally {
        await visitorPool.end();
    }
}

init();
