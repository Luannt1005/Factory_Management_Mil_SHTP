import { getDbConnection } from "../src/lib/db";
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

async function main() {
  try {
    const pool = await getDbConnection();
    const result = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'status'"
    );
    if (result.rows.length === 0) {
      console.log("Status column not found. Adding it...");
      await pool.query("ALTER TABLE employees ADD COLUMN status VARCHAR(50) DEFAULT 'Active'");
      console.log("Status column added successfully.");
    } else {
      console.log("Status column already exists.");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
