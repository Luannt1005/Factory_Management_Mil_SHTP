export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getCachedData } from "@/lib/cache";
import {
  addManualRows,
  findEmployeeRecord,
  isActiveRecord,
  loadEmployeeRecords,
  removeAllManualRows,
  removeEmployee,
  resolvePendingLineManagers,
  saveEmployeeEdit,
} from "@/lib/employees/source";
import type { EmployeeEdit, EmployeeRecord } from "@/types/employee-source.types";

import { isAuthenticated, unauthorizedResponse, getCurrentUser } from "@/lib/auth-server";

/*
 * Employees come from the employee master database (HR, read only) merged with the app's edits:
 * edits on HR employees are stored as overrides, added rows / open headcount as manual rows
 * (see src/lib/employees/source.ts). Request and response shapes are unchanged.
 */

// Cache TTL: 15 minutes for employee list
const EMPLOYEES_CACHE_TTL = 15 * 60 * 1000;

const SHEET_HEADERS = ["id", "Emp ID", "FullName ", "Job Title", "Dept", "BU", "DL/IDL/Staff", "Location", "Employee Type", "Line Manager", "Is Direct", "Joining\r\n Date", "Last Working\r\nDay"];

// Whitelist of allowed filter params -> employee fields
const FILTER_MAPPING: { [key: string]: keyof EmployeeRecord } = {
  'Dept': 'dept',
  'BU': 'bu',
  'DL/IDL/Staff': 'dl_idl_staff',
  'Job Title': 'job_title',
  'Location': 'location',
  'FullName ': 'full_name',
  'Emp ID': 'emp_id',
  'Employee Type': 'employee_type',
  'Line Manager': 'line_manager',
  'Is Direct': 'is_direct',
  // Approval workflow filters
  'lineManagerStatus': 'line_manager_status',
  'line_manager_status': 'line_manager_status',
  // Common lowercase variations
  'dept': 'dept',
  'bu': 'bu',
  'location': 'location',
  'full_name': 'full_name',
  'emp_id': 'emp_id',
  'job_title': 'job_title',
  'dl_idl_staff': 'dl_idl_staff',
  'employee_type': 'employee_type',
  'line_manager': 'line_manager',
  'is_direct': 'is_direct'
};

// Transform to match expected format
const toSheetRow = (emp: EmployeeRecord) => ({
  id: emp.id,
  "Emp ID": emp.emp_id,
  "FullName ": emp.full_name,
  "Job Title": emp.job_title,
  "Dept": emp.dept,
  "BU": emp.bu,
  "BU Org 3": emp.bu_org_3,
  "DL/IDL/Staff": emp.dl_idl_staff,
  "Location": emp.location,
  "Employee Type": emp.employee_type,
  "Line Manager": emp.line_manager,
  "Is Direct": emp.is_direct,
  "Joining\r\n Date": emp.joining_date,
  "Last Working\r\nDay": emp.last_working_day,
  lineManagerStatus: emp.line_manager_status,
  pendingLineManager: emp.pending_line_manager,
  requester: emp.requester,
  Status: emp.status
});

/** Sheet form data ("Emp ID", "FullName ", ...) -> employee fields; only filled values, like before */
type SheetData = Record<string, string | null | undefined>;
const fromSheetData = (data: SheetData): EmployeeEdit => {
  const edit: EmployeeEdit = {};
  const set = (field: keyof EmployeeEdit, value: string | null | undefined) => {
    if (value) edit[field] = value;
  };
  set('emp_id', data["Emp ID"]);
  set('full_name', data["FullName "] || data["FullName"]);
  set('job_title', data["Job Title"]);
  set('dept', data["Dept"]);
  set('bu', data["BU"]);
  set('dl_idl_staff', data["DL/IDL/Staff"]);
  set('location', data["Location"]);
  set('employee_type', data["Employee Type"]);
  set('line_manager', data["Line Manager"]);
  set('is_direct', data["Is Direct"]);
  set('joining_date', data["Joining\r\n Date"] || data["Joining Date"]);
  return edit;
};

/**
 * GET /api/sheet
 * Fetch employees with optional pagination and filtering
 */
export async function GET(req: Request) {
  if (!await isAuthenticated()) {
    return unauthorizedResponse();
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "0");

    // ======= SINGLE EMPLOYEE FETCH =======
    if (id) {
      const employee = await findEmployeeRecord(id);

      if (!employee) {
        return NextResponse.json(
          { success: false, error: "Employee not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: employee });
    }

    // ======= PAGINATED FETCH =======
    if (page > 0 && limit > 0) {
      const excludedParams = ['page', 'limit', 'id', 'preventCache'];
      const filters: { [key: string]: string } = {};

      searchParams.forEach((value, key) => {
        if (!excludedParams.includes(key) && value.trim() !== '') {
          if (FILTER_MAPPING[key]) {
            filters[key] = value;
          }
        }
      });

      const hasFilters = Object.keys(filters).length > 0;

      // Same rules as the former SQL: exact match for status / type, LIKE '%value%' otherwise
      const matching = (await loadEmployeeRecords()).filter((emp) => {
        if (!isActiveRecord(emp)) return false;
        return Object.entries(filters).every(([key, value]) => {
          const field = FILTER_MAPPING[key];
          const fieldValue = emp[field];
          if (field === 'line_manager_status' || field === 'dl_idl_staff') return fieldValue === value;
          return typeof fieldValue === 'string' && fieldValue.includes(value);
        });
      });

      // Data with pagination (records are already sorted by full name)
      const offset = (page - 1) * limit;
      const transformedEmployees = matching.slice(offset, offset + limit).map(toSheetRow);

      const total = matching.length;
      const totalPages = Math.ceil(total / limit);

      console.log(`📄 Page ${page}: ${transformedEmployees.length} records`);

      const response = NextResponse.json({
        success: true,
        headers: SHEET_HEADERS,
        data: transformedEmployees,
        page,
        limit,
        total,
        totalPages
      });

      response.headers.set(
        "Cache-Control",
        hasFilters ? "no-store" : "public, s-maxage=120, stale-while-revalidate=300"
      );

      return response;
    }

    // ======= FULL DATA FETCH (for Dashboard/Charts) =======
    const cachedResult = await getCachedData(
      'employees_all',
      async () => {
        console.log("📡 Fetching all employees for dashboard...");

        const transformedEmployees = (await loadEmployeeRecords()).filter(isActiveRecord).map(toSheetRow);

        console.log(`✅ Loaded ${transformedEmployees.length} employees`);
        return {
          employees: transformedEmployees,
          headers: SHEET_HEADERS
        };
      },
      EMPLOYEES_CACHE_TTL
    );

    const response = NextResponse.json({
      success: true,
      total: cachedResult.employees.length,
      headers: cachedResult.headers,
      data: cachedResult.employees
    });

    response.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
    return response;

  } catch (error) {
    console.error("GET /api/sheet error:", error);
    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sheet - Add new employee
 */
export async function POST(req: Request) {
  if (!await isAuthenticated()) {
    return unauthorizedResponse();
  }
  const currentUser = await getCurrentUser();
  console.log(`🔐 POST /api/sheet accessed by: ${currentUser}`);

  try {
    const body = await req.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { success: false, error: "Missing action or data" },
        { status: 400 }
      );
    }

    if (action === "bulkAddHeadcount") {
      const { quantity, data } = body;
      console.log(`[bulkAddHeadcount] Received data for ${quantity} positions:`, JSON.stringify(data));

      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid quantity" },
          { status: 400 }
        );
      }

      const timestamp = Date.now();
      const base = fromSheetData(data);
      const rows: EmployeeEdit[] = Array.from({ length: quantity }, (_, i) => ({
        ...base,
        emp_id: `HC-${timestamp}-${i + 1}`,
        full_name: base.full_name || "Vacant Position",
        employee_type: 'hc_open',
        is_direct: base.is_direct || "YES",
      }));
      const insertedCount = (await addManualRows(rows, currentUser)).length;

      return NextResponse.json({
        success: true,
        count: insertedCount,
        message: `Successfully added ${insertedCount} open headcount positions`
      });
    }

    if (action === "add") {
      const edit = fromSheetData(data);
      const [insertedId] = await addManualRows([{
        ...edit,
        emp_id: edit.emp_id || `EMP-${Date.now()}`,
        is_direct: edit.is_direct || "YES",
      }], currentUser);

      return NextResponse.json({
        success: true,
        id: insertedId,
        message: "Employee added successfully"
      });
    }

    // Reject all pending approval requests
    if (action === "rejectAll") {
      const count = await resolvePendingLineManagers(false);

      return NextResponse.json({
        success: true,
        count: count,
        message: `Rejected ${count} pending requests`
      });
    }

    // Approve all pending approval requests
    if (action === "approveAll") {
      // line_manager takes the pending_line_manager value
      const count = await resolvePendingLineManagers(true);

      return NextResponse.json({
        success: true,
        count: count,
        message: `Approved ${count} pending requests`
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/sheet error:", message);
    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sheet - Update employee
 */
export async function PUT(req: Request) {
  if (!await isAuthenticated()) {
    return unauthorizedResponse();
  }
  const currentUser = await getCurrentUser();
  console.log(`🔐 PUT /api/sheet accessed by: ${currentUser}`);

  try {
    const body = await req.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json(
        { success: false, error: "Missing id or data" },
        { status: 400 }
      );
    }

    const edit = fromSheetData(data);
    // Approval workflow fields can also be cleared (null)
    if (data["lineManagerStatus"] !== undefined) edit.line_manager_status = data["lineManagerStatus"];
    if (data["pendingLineManager"] !== undefined) edit.pending_line_manager = data["pendingLineManager"];
    if (data["requester"] !== undefined) edit.requester = data["requester"];

    await saveEmployeeEdit(String(id), edit, currentUser);

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/sheet error:", message);
    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sheet - Delete employee
 * Added rows are deleted; HR employees are hidden from the app (HR data is never changed).
 */
export async function DELETE(req: Request) {
  if (!await isAuthenticated()) {
    return unauthorizedResponse();
  }
  const currentUser = await getCurrentUser();
  console.log(`🔐 DELETE /api/sheet accessed by: ${currentUser}`);

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const deleteAll = searchParams.get("deleteAll");

    // Delete ALL added rows (HR employees come back from HR anyway)
    if (deleteAll === "true") {
      const count = await removeAllManualRows();

      return NextResponse.json({
        success: true,
        count: count,
        message: `Deleted all ${count} employees`
      });
    }

    // Delete single employee
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    await removeEmployee(id, currentUser);

    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/sheet error:", message);
    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 }
    );
  }
}
