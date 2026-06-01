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
    
    // Fetch all active employees
    const queryStr = "SELECT emp_id, full_name, job_title, dept, line_manager FROM employees WHERE emp_id IS NOT NULL AND emp_id <> '' AND (status = 'Active' OR status IS NULL)";
    const result = await pool.query(queryStr);
    const employees = result.rows;

    if (!employees || employees.length === 0) {
      return NextResponse.json({ success: true, leaders: {}, reports: {} });
    }

    // Map of clean_id -> employee for quick lookup
    const empMap: Record<string, any> = {};
    employees.forEach(emp => {
      const cleanId = trimLeadingZeros(emp.emp_id);
      if (cleanId) {
        empMap[cleanId] = emp;
      }
    });

    // Defining the key leader IDs (both clean and original)
    const keyLeaders = {
      vp: '500011',               // Lee Hon Kay (HK Lee)
      globalOps: '610977',        // Jeff Searl
      ie_fmu_mif: '001347',       // T.T.Tien
      factoryMgmt: '000818',      // Anna N.N.Quyen
      mu3: '512282',              // Brian N.K.Hieu
      mu5: '612495',              // Nash N.T.Ngo
      mu5bp: '509807',            // Danny L.T.Danh
      sc: '000005',               // Jena H.T.Thuy
      opm: '590118',              // Susan Jiang
      ddk: '612259',              // Skovran Robert
      ee_mtr: '614043',           // Bryan Wei
      ame_auto_opex: '500904',    // N.L Hiep
      ehs_esg: '568007',          // N.T Trung
      quality: '001238',          // Nancy C.T. Nhan
      engineering: '616797',      // Ng Peng Heng
      hrbp: '578935',             // Active HRBP (Nguyễn Thị Ngọc Phượng)
      of: '000010'                // Sunny L.T.K.Duong (Hồng Nguyễn Nhất Linh)
    };

    // Clean leader ID list for easy mapping
    const leaderCleanIds = Object.values(keyLeaders).map(id => trimLeadingZeros(id) || '');

    // Reconstruct the leaders list from DB
    const leadersData: Record<string, any> = {};
    Object.entries(keyLeaders).forEach(([key, id]) => {
      const cleanId = trimLeadingZeros(id);
      const emp = cleanId ? empMap[cleanId] : null;
      if (emp) {
        leadersData[key] = {
          emp_id: emp.emp_id,
          full_name: emp.full_name,
          job_title: emp.job_title,
          dept: emp.dept,
          line_manager: emp.line_manager
        };
      } else {
        // Fallback placeholder data matching the image if missing in DB
        leadersData[key] = {
          emp_id: id,
          full_name: null,
          job_title: null,
          dept: null,
          line_manager: null
        };
      }
    });

    // Group direct reports under each leader
    const reportsData: Record<string, any[]> = {};
    leaderCleanIds.forEach(cleanId => {
      reportsData[cleanId] = [];
    });

    employees.forEach(emp => {
      const lineManager = emp.line_manager;
      if (!lineManager) return;
      
      const parts = lineManager.split(':');
      const mgrId = trimLeadingZeros(parts[0]);
      
      if (mgrId && reportsData[mgrId] !== undefined) {
        // Do not add the leader themselves as their own report
        if (trimLeadingZeros(emp.emp_id) !== mgrId) {
          reportsData[mgrId].push({
            emp_id: emp.emp_id,
            full_name: emp.full_name,
            job_title: emp.job_title,
            dept: emp.dept
          });
        }
      }
    });

    // Sort reports alphabetically by full name for clean UI
    Object.keys(reportsData).forEach(mgrId => {
      reportsData[mgrId].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    });

    const response = NextResponse.json(
      {
        success: true,
        leaders: leadersData,
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
