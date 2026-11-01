export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { RawSheetRow } from "@/types/headcount.types";
import { importEmployeeOverrides } from "@/lib/employees/source";
import { isAuthenticated, unauthorizedResponse, getCurrentUser } from "@/lib/auth-server";

/**
 * POST /api/import_excel
 * Employees now come from the employee master database (HR). An Excel file only fills in what HR
 * doesn't have: Location, Is Direct and the line manager of indirect reports (stored as overrides).
 * Response shape is unchanged (deleted is always 0: HR decides who is employed).
 */
export async function POST(req: Request) {
  if (!await isAuthenticated()) {
    return unauthorizedResponse();
  }
  const currentUser = await getCurrentUser();
  console.log(`🔐 POST /api/import_excel accessed by: ${currentUser}`);

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
    const rows = XLSX.utils.sheet_to_json<RawSheetRow>(sheet, {
      defval: null,
      raw: true
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 }
      );
    }

    const safeString = (val: unknown) => (val === null || val === undefined || String(val).trim() === '') ? null : String(val).trim();

    const importRows = rows
      .map((row) => ({
        empId: safeString(row["Emp ID"]) ?? '',
        location: safeString(row["Location"]),
        isDirect: safeString(row["Is Direct"]),
        lineManager: safeString(row["Line Manager"]),
      }))
      .filter((row) => row.empId !== '');

    if (importRows.length === 0) {
      return NextResponse.json(
        { error: "No matching records found after filtering." },
        { status: 400 }
      );
    }

    const { saved, skipped } = await importEmployeeOverrides(importRows, currentUser);

    return NextResponse.json({
      success: true,
      total: rows.length,
      saved,
      skipped,
      deleted: 0
    });

  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "Failed to import file" },
      { status: 500 }
    );
  }
}
