# db-migration.md — Database Migration & Schema Skill

> **Skill Name:** `db-migration`  
> **Purpose:** Guidelines for creating, executing, and recording idempotent database migrations across the dual PostgreSQL databases.

---

## 1. Dual Database Routing

Before writing a migration script, determine the target database:

| Target Domain | Target DB Name | Connection Pool File |
|---|---|---|
| Users, Roles, OrgNodes, Headcount, SheetData | `Orgchart_TTI_Mil` | `src/lib/db.ts` |
| VisitorRequests, Approvals, Rooms, Gate Check-In | `Visitor_database` | `src/lib/visitor-db.ts` |

---

## 2. Migration Script Conventions

1. **Location:** Store migration scripts under `scripts/` (e.g., `scripts/add_power_automate_run_id.js`).
2. **Idempotence:** Always use `IF NOT EXISTS` or check column existence before adding columns or tables:
   ```sql
   DO $$
   BEGIN
       IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name='VisitorRequest' AND column_name='new_column'
       ) THEN
           ALTER TABLE "VisitorRequest" ADD COLUMN new_column TEXT;
       END IF;
   END $$;
   ```
3. **Execution Pattern:**
   ```bash
   node scripts/my_migration_script.js
   ```
4. **Safety Verification:** Verify query parameters and ensure client connections are closed via `pool.end()`.
