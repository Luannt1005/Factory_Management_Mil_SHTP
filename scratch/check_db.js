const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: 'idmc', host: '10.147.36.55', port: 5432, database: 'Orgchart_TTI_Mil' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'").then(res => {
    console.log(res.rows);
    pool.end();
}).catch(err => {
    console.error(err);
    pool.end();
});
