import { Pool } from 'pg';

/**
 * Employee master data (employee-project-v2), synced daily from Cadena + Microsoft Graph by another team.
 * The app only reads it: every session is forced read-only.
 */
const dbServer = process.env.EMPLOYEE_DB_SERVER || '';
const dbPort = parseInt(process.env.EMPLOYEE_DB_PORT || '5432', 10);
const dbUser = process.env.EMPLOYEE_DB_USER || '';
const dbPassword = process.env.EMPLOYEE_DB_PASSWORD || '';
const dbName = process.env.EMPLOYEE_DB_NAME || 'employee-project-v2';

console.log(`[Employee DB Config] Server: ${dbServer || 'missing'}, Port: ${dbPort}, User: ${dbUser ? '***' : 'missing'}, DB: ${dbName}`);

const pool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: dbServer,
    port: dbPort,
    database: dbName,
    ssl: false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    options: '-c default_transaction_read_only=on',
});

export function getEmployeeDb(): Pool {
    if (!dbServer || !dbUser) {
        throw new Error('Employee database is not configured (EMPLOYEE_DB_* in .env.local)');
    }
    return pool;
}
