import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth-server";

// Trim leading zeros from ID
const trimLeadingZeros = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim().replace(/^0+/, '') || '0';
  return trimmed === '0' ? null : trimmed;
};

export async function GET(req: Request) {
  if (!await isAuthenticated()) {
    return unauthorizedResponse();
  }

  try {
    const pool = await getDbConnection();
    
    // Fetch all employees (including resigned to keep key leaders like HRBP and OF)
    const queryStr = "SELECT emp_id, full_name, job_title, dept, location, line_manager, status FROM employees WHERE emp_id IS NOT NULL AND emp_id <> ''";
    const result = await pool.query(queryStr);
    const employees = result.rows;

    if (!employees || employees.length === 0) {
      return NextResponse.json({ success: true, vp: null, globalOps: null, ie_fmu_mif: null, factoryMgmt: null, jeffReports: [], supportFunctions: [], reports: {} });
    }

    // Map of clean_id -> employee for quick lookup
    const empMap: Record<string, any> = {};
    employees.forEach(emp => {
      const cleanId = trimLeadingZeros(emp.emp_id);
      if (cleanId) {
        empMap[cleanId] = emp;
      }
    });

    // Helper to get line manager ID cleanly
    const getManagerId = (emp: any): string | null => {
      if (!emp.line_manager) return null;
      return trimLeadingZeros(emp.line_manager.split(':')[0]);
    };

    // Find VP (Lee Hon Kay: 500011)
    const vpId = '500011';
    const vp = empMap[vpId] || null;

    // Find Global Ops (Jeff Searl: 610977)
    const globalOpsId = '610977';
    const globalOps = empMap[globalOpsId] || null;

    // Find IE & FMU & MIF (Trương Trọng Tiến: 001347)
    const ie_fmu_mif = empMap['1347'] || null;

    // Find Factory Management (Nguyễn Nhã Quyên: 000818)
    const factoryMgmt = empMap['818'] || null;

    // Find all active direct reports of Jeff Searl (610977)
    const jeffReports = employees.filter(emp => getManagerId(emp) === globalOpsId && (emp.status === 'Active' || emp.status === null));
    // Sort jeffReports alphabetically by name
    jeffReports.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    // Support functions in the exact order shown in the image
    const supportIds = ['614043', '500904', '568007', '001238', '616797', '578935', '000010'];
    const supportFunctions = supportIds.map(id => empMap[trimLeadingZeros(id) || '']).filter(Boolean);

    // Group direct reports for all employees
    const reportsData: Record<string, any[]> = {};
    
    // We want to group reports for all leaders and managers
    const leaderIds = new Set<string>();
    if (vp) leaderIds.add(trimLeadingZeros(vp.emp_id) || '');
    if (globalOps) leaderIds.add(trimLeadingZeros(globalOps.emp_id) || '');
    if (ie_fmu_mif) leaderIds.add(trimLeadingZeros(ie_fmu_mif.emp_id) || '');
    if (factoryMgmt) leaderIds.add(trimLeadingZeros(factoryMgmt.emp_id) || '');
    
    jeffReports.forEach(emp => {
      const id = trimLeadingZeros(emp.emp_id);
      if (id) leaderIds.add(id);
    });
    supportFunctions.forEach(emp => {
      const id = trimLeadingZeros(emp.emp_id);
      if (id) leaderIds.add(id);
    });

    // Initialize report arrays
    leaderIds.forEach(id => {
      reportsData[id] = [];
    });

    // Populate report arrays (only include active employees as reports)
    employees.forEach(emp => {
      const mgrId = getManagerId(emp);
      if (mgrId && reportsData[mgrId] !== undefined) {
        if (trimLeadingZeros(emp.emp_id) !== mgrId && (emp.status === 'Active' || emp.status === null || emp.emp_id === '578935' || emp.emp_id === '000010')) {
          reportsData[mgrId].push({
            emp_id: emp.emp_id,
            full_name: emp.full_name,
            job_title: emp.job_title,
            dept: emp.dept,
            location: emp.location
          });
        }
      }
    });

    // Sort reports alphabetically by full name
    Object.keys(reportsData).forEach(mgrId => {
      reportsData[mgrId].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    });

    const response = NextResponse.json(
      {
        success: true,
        vp,
        globalOps,
        ie_fmu_mif,
        factoryMgmt,
        jeffReports,
        supportFunctions,
        reports: reportsData,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch (err: any) {
    console.error("Error loading core team:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to load core team data",
      },
      { status: 500 }
    );
  }
}
