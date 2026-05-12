const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: 'idmc', host: '10.147.36.55', port: 5432, database: 'Orgchart_TTI_Mil' });

async function updateDb() {
    try {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS orgchart_role VARCHAR(50) DEFAULT 'user'");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS visitor_role VARCHAR(50) DEFAULT 'user'");
        // Copy existing role to orgchart_role if it makes sense, or just leave as is.
        // If current role is admin, they are admin of orgchart because previously it was an orgchart admin.
        await pool.query("UPDATE users SET orgchart_role = role WHERE role IS NOT NULL AND role != ''");
        
        console.log("Columns added successfully");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
updateDb();
