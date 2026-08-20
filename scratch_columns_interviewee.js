const { Client } = require('./node_modules/pg'); 
require('dotenv').config({ path: '.env.local' }); 
const client = new Client({ 
    host: process.env.DB_SERVER, 
    port: process.env.DB_PORT, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: 'Visitor_database' 
}); 
async function run() { 
    await client.connect(); 
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'IntervieweeRequest'");
    console.log(res.rows);
    await client.end(); 
} 
run().catch(console.error);
