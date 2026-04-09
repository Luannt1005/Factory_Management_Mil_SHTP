const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_SERVER,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });
  
  await client.connect();
  
  try {
      await client.query("ALTER TABLE employees ADD COLUMN status VARCHAR(50) DEFAULT 'Active'");
      console.log("Column added.");
  } catch (err) {
      console.error(err.message);
  } finally {
      await client.end();
  }
}
main();
