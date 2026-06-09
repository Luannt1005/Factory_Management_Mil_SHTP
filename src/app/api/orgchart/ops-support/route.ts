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

    // Find Factory Management (Nguyễn Nhã Quyên: 000818)
    const rootId = '818';
    const root = empMap[rootId] || null;

    // We want to group reports for all leaders and managers under root
    const leaderIds = new Set<string>();
    if (root) leaderIds.add(trimLeadingZeros(root.emp_id) || '');

    // Get direct reports of 818
    const directReports = employees.filter(emp => getManagerId(emp) === rootId && (emp.status === 'Active' || emp.status === null));
    directReports.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    directReports.forEach(emp => {
      const id = trimLeadingZeros(emp.emp_id);
      if (id) leaderIds.add(id);
    });

    // Group direct reports for all employees
    const reportsData: Record<string, any[]> = {};
    
    // Initialize report arrays
    leaderIds.forEach(id => {
      reportsData[id] = [];
    });

    // Populate report arrays (only include active employees as reports)
    employees.forEach(emp => {
      const mgrId = getManagerId(emp);
      if (mgrId && reportsData[mgrId] !== undefined) {
        if (trimLeadingZeros(emp.emp_id) !== mgrId && (emp.status === 'Active' || emp.status === null)) {
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

    // COMPUTE FULL SPAN OF CONTROL (Deep tree)
    const childrenMap: Record<string, any[]> = {};
    employees.forEach(emp => {
      const mgrId = getManagerId(emp);
      if (mgrId) {
        if (!childrenMap[mgrId]) childrenMap[mgrId] = [];
        if (emp.status === 'Active' || emp.status === null) {
           if (trimLeadingZeros(emp.emp_id) !== mgrId) {
             childrenMap[mgrId].push(emp);
           }
        }
      }
    });

    const categorizeJobTitle = (title: string | null): string => {
      if (!title) return 'IDL';
      const t = title.toLowerCase();
      if (t.includes('director')) return 'Director';
      if (t.includes('manager')) return 'Manager';
      if (t.includes('supervisor')) return 'Supervisor';
      if (t.includes('specialist')) return 'Specialist';
      if (t.includes('coordinator')) return 'Coordinator';
      if (t.includes('clerk')) return 'Clerk';
      if (t.includes('trainee')) return 'Trainee';
      if (t.includes('engineer')) return 'Engineer';
      return 'IDL';
    };

    const spanOfControlStats: Record<string, { total: number; breakdown: Record<string, number> }> = {};

    const computeSpanOfControl = (empId: string): { total: number; breakdown: Record<string, number> } => {
      if (spanOfControlStats[empId]) return spanOfControlStats[empId];
      let total = 0;
      const breakdown: Record<string, number> = {
        Director: 0,
        Manager: 0,
        Supervisor: 0,
        Specialist: 0,
        Engineer: 0,
        Coordinator: 0,
        Clerk: 0,
        Trainee: 0,
        IDL: 0
      };

      // Set initially to prevent infinite loops in cyclic data (though unlikely in org chart)
      spanOfControlStats[empId] = { total: 0, breakdown: { ...breakdown } };

      const children = childrenMap[empId] || [];
      children.forEach(child => {
        const childId = trimLeadingZeros(child.emp_id);
        if (!childId) return;

        total += 1;
        const cat = categorizeJobTitle(child.job_title);
        breakdown[cat] += 1;

        const childSoc = computeSpanOfControl(childId);
        total += childSoc.total;
        for (const [k, v] of Object.entries(childSoc.breakdown)) {
          if (breakdown[k] !== undefined) breakdown[k] += v;
        }
      });

      spanOfControlStats[empId] = { total, breakdown };
      return spanOfControlStats[empId];
    };

    leaderIds.forEach(id => computeSpanOfControl(id));

    const response = NextResponse.json(
      {
        success: true,
        root,
        directReports,
        reports: reportsData,
        spanOfControl: spanOfControlStats,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch (err: any) {
    console.error("Error loading ops support team:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to load ops support team data",
      },
      { status: 500 }
    );
  }
}
