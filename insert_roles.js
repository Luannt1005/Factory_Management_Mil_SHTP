import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:idmc@10.147.36.55:5432/Orgchart_TTI_Mil',
});

async function run() {
  try {
    await pool.query(`
      INSERT INTO app_roles (name, app_module, description, permissions) 
      SELECT 'Security', 'Visitor', 'Can view check-in/out, can check-in without card number. Cannot check-out or reset status.', '["/visitoradmin", "/visitoradmin/checkinout"]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM app_roles WHERE name = 'Security');

      INSERT INTO app_roles (name, app_module, description, permissions) 
      SELECT 'Receptionist', 'Visitor', 'Can view check-in/out, can check-in and check-out. Cannot reset status.', '["/visitoradmin", "/visitoradmin/checkinout"]'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM app_roles WHERE name = 'Receptionist');
    `);
    console.log("Roles inserted successfully");
  } catch (err) {
    console.error("Error inserting roles:", err);
  } finally {
    pool.end();
  }
}

run();
