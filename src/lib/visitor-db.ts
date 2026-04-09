import { Pool } from 'pg';

const dbServer = process.env.DB_SERVER || '10.147.36.55';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'idmc';
const dbName = 'Visitor_database'; // Hardcoded explicitly to match the external visitor project

console.log(`[Visitor DB Config] Server: ${dbServer}, Port: ${dbPort}, User: ${dbUser ? '***' : 'missing'}, DB: ${dbName}`);

const pool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: dbServer,
    port: dbPort,
    database: dbName,
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export async function getVisitorDbConnection() {
    try {
        const client = await pool.connect();
        client.release();
        return pool;
    } catch (err: any) {
        console.error('Visitor Database connection failed:', err.message);
        throw err;
    }
}
