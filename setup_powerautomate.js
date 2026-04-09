const { Client } = require('pg');

const connectionString = "postgresql://postgres:idmc@10.147.36.55:5432/Visitor_database";

const sql = `
-- 1. Add extra columns
ALTER TABLE "RequestApproval" ADD COLUMN IF NOT EXISTS visitor_name TEXT;
ALTER TABLE "RequestApproval" ADD COLUMN IF NOT EXISTS room_name TEXT;

-- 2. Create function
CREATE OR REPLACE FUNCTION fill_approval_names()
RETURNS TRIGGER AS $$
BEGIN
    SELECT "visitorName" INTO NEW.visitor_name FROM "VisitorRequest" WHERE id = NEW."requestId";
    SELECT name INTO NEW.room_name FROM "RoomArea" WHERE id = NEW."roomAreaId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS trg_fill_approval_names_v2 ON "RequestApproval";
CREATE TRIGGER trg_fill_approval_names_v2
BEFORE INSERT ON "RequestApproval"
FOR EACH ROW EXECUTE FUNCTION fill_approval_names();

-- 4. Create View
CREATE OR REPLACE VIEW power_automate_approvals AS
SELECT 
    ra.id,
    ra.status,
    ra."approverEmail" as approver_email,
    vr."visitorName" as visitor_name,
    vr."currentCompany" as current_company,
    rm.name as room_name,
    rm.category as room_category
FROM "RequestApproval" ra
JOIN "VisitorRequest" vr ON ra."requestId" = vr.id
JOIN "RoomArea" rm ON ra."roomAreaId" = rm.id;
`;

async function setup() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to On-Prem!');
        await client.query(sql);
        console.log('Database updated: Columns visitor_name and room_name added, Trigger created, and View created.');
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        await client.end();
    }
}

setup();
