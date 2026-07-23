export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDbConnection } from "@/lib/db";
import { invalidateCachePrefix } from "@/lib/cache";
import { isAuthenticated, unauthorizedResponse, getCurrentUser } from "@/lib/auth-server";

/**
 * Get existing Emp IDs from database
 */
async function getExistingEmployees(client: any): Promise<Map<string, { id: string; is_direct: string | null }>> {
  const result = await client.query("SELECT id, emp_id, is_direct FROM employees");

  const employees = new Map<string, { id: string; is_direct: string | null }>();
  result.rows.forEach((row: any) => {
    if (row.emp_id) {
      employees.set(row.emp_id, { id: row.id, is_direct: row.is_direct });
    }
  });

  return employees;
}

/**
 * POST /api/import_excel
 * Import employees from Excel file to Azure SQL
 */
export async function POST(req: Request) {
  if (!await isAuthenticated()) {
    return unauthorizedResponse();
  }
  const currentUser = await getCurrentUser();
  console.log(`🔐 POST /api/import_excel accessed by: ${currentUser}`);

  let client: any = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: "Invalid Excel file" },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: true
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 }
      );
    }

    const pool = await getDbConnection();
    client = await pool.connect();
    await client.query('BEGIN');

    // Get existing Emp IDs
    const existingEmployees = await getExistingEmployees(client);

    // Filter rows based on requested criteria
    const validRows = rows.filter((row: any) => {
      const location = String(row["Location"] || "").trim().toUpperCase();
      const type = String(row["DL/IDL/Staff"] || "").trim().toUpperCase();
      const bu = String(row["BU"] || "").trim().toUpperCase();
      const buOrg2 = String(row["BU Org 2"] || row["BU Org 2 "] || "").trim().toUpperCase();

      return (["SHTP", "DDK", "SHTP-3F", "SHTP-5F"].includes(location)) &&
             (type === "IDL" || type === "STAFF") &&
             bu === "MILWAUKEE" &&
             buOrg2 === "POWER TOOL";
    });

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: "No matching records found after filtering." },
        { status: 400 }
      );
    }

    // Get Emp IDs from import file for "Full Sync" check
    const newEmpIds = new Set(
      validRows
        .map((row: any) => row["Emp ID"])
        .filter((id: any) => id !== null && id !== undefined && String(id).trim() !== '')
        .map((id: any) => String(id).trim())
    );

    // Find Emp IDs to delete (in database but not in new file)
    const dbIdsToDelete: string[] = [];
    existingEmployees.forEach((empInfo, empId) => {
      if (!newEmpIds.has(empId) && String(empId).trim() !== "500011") {
        dbIdsToDelete.push(empInfo.id);
      }
    });

    let savedCount = 0;
    let deletedCount = 0;

    // 1. Process Insert/Update
    for (const row of validRows as any[]) {
      const rawId = row["Emp ID"];
      if (rawId === null || rawId === undefined || String(rawId).trim() === '') continue;

      const empId = String(rawId).trim();
      
      if (empId === "500011") continue; // Never update 500011

      const existingEmp = existingEmployees.get(empId);
      const dbId = existingEmp?.id;

      const safeString = (val: any) => (val === null || val === undefined) ? null : String(val);

      const full_name = safeString(row["FullName "] || row["FullName"] || row["Full Name"]);
      const job_title = safeString(row["Job Title"]);
      const dept = safeString(row["Dept"]);
      const bu = safeString(row["BU"]);
      const bu_org_3 = safeString(row["BU Org 3"] || row["BU Org 3 "]);
      const dl_idl_staff = safeString(row["DL/IDL/Staff"]);
      const location = safeString(row["Location"]);
      const employee_type = safeString(row["Employee Type"]);
      const line_manager = safeString(row["Line Manager"]);
      const is_direct = safeString(row["Is Direct"] || "YES");
      const joining_date = safeString(row["Joining\r\n Date"] || row["Joining Date"]);
      const status = safeString(row["Status"] || row["status"]);

      const last_working_day = safeString(
        row["Last Working\r\nDay"] ||
        row["Last Working Day"] ||
        row["Last Working\r\n Day"] ||
        row["last_working_day"] ||
        row["Resignation Date"] ||
        row["LWD"]
      );

      if (dbId) {
        // UPDATE
        const setClauses: string[] = [];
        const queryParams: any[] = [dbId];
        let pIndex = 2; // $1 is dbId

        if (last_working_day !== null) { setClauses.push(`last_working_day = $${pIndex++}`); queryParams.push(last_working_day); }
        if (status !== null) { setClauses.push(`status = $${pIndex++}`); queryParams.push(status); } else { setClauses.push(`status = $${pIndex++}`); queryParams.push("Active"); }
        if (job_title !== null) { setClauses.push(`job_title = $${pIndex++}`); queryParams.push(job_title); }
        if (dl_idl_staff !== null) { setClauses.push(`dl_idl_staff = $${pIndex++}`); queryParams.push(dl_idl_staff); }
        
        // Conditional line manager update
        // Skip update if Excel is "No" OR if Database is already "No"
        const excelIsDirect = String(row["Is Direct"] || "YES").trim().toUpperCase();
        const dbIsDirect = String(existingEmp?.is_direct || "YES").trim().toUpperCase();

        if (excelIsDirect !== "NO" && dbIsDirect !== "NO") {
          if (line_manager !== null) { setClauses.push(`line_manager = $${pIndex++}`); queryParams.push(line_manager); }
        }

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        await client.query(`
          UPDATE employees SET
            ${setClauses.join(', ')}
          WHERE id = $1
        `, queryParams);
      } else {
        // INSERT
        await client.query(`
          INSERT INTO employees (
            emp_id, full_name, job_title, dept, bu, bu_org_3, dl_idl_staff, 
            location, employee_type, line_manager, is_direct, joining_date, last_working_day, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
        `, [
          empId, full_name, job_title, dept, bu, bu_org_3, dl_idl_staff, location, employee_type, line_manager, is_direct, joining_date, last_working_day, status || "Active"
        ]);
      }
      savedCount++;
    }

    // 2. Delete removed employees
    if (dbIdsToDelete.length > 0) {
      // Chunk deletions to avoid parameter limits (2100 params max)
      const CHUNK_SIZE = 1000;
      for (let i = 0; i < dbIdsToDelete.length; i += CHUNK_SIZE) {
        const chunk = dbIdsToDelete.slice(i, i + CHUNK_SIZE);
        const listStr = chunk.map(id => `'${id}'`).join(',');
        await client.query(`DELETE FROM employees WHERE id IN (${listStr})`);
        deletedCount += chunk.length;
      }
    }

    await client.query('COMMIT');
    client.release();

    // Invalidate cache
    invalidateCachePrefix('employees');

    return NextResponse.json({
      success: true,
      total: rows.length,
      saved: savedCount,
      deleted: deletedCount
    });

  } catch (err: any) {
    console.error("Import error:", err);
    if (client) {
      try { await client.query('ROLLBACK'); client.release(); } catch (e) { console.error("Rollback failed:", e); }
    }
    return NextResponse.json(
      { error: err.message || "Failed to import file" },
      { status: 500 }
    );
  }
}