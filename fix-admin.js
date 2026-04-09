const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function fix() {
    const pool = new Pool({
        user: 'postgres',
        password: 'idmc',
        host: '10.147.36.55',
        port: 5432,
        database: 'Orgchart_TTI_Mil',
        ssl: false
    });

    try {
        const newHash = await bcrypt.hash('123456', 10);
        console.log('New hash generated:', newHash);
        
        const res = await pool.query('UPDATE users SET password = $1 WHERE username = $2', [newHash, 'admin']);
        console.log('Update result - rows affected:', res.rowCount);
        
        if (res.rowCount === 0) {
            console.log('User admin not found, creating user...');
            await pool.query('INSERT INTO users (id, username, password, full_name, role) VALUES ($1, $2, $3, $4, $5)', 
                [require('uuid').v4(), 'admin', newHash, 'Administrator', 'admin']);
            console.log('User admin created successfully.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

fix();
