"use client";

import React, { useState, useEffect } from "react";

interface Employee {
  emp_id: string;
  full_name: string | null;
  job_title: string | null;
  dept: string | null;
  location?: string | null;
  line_manager?: string | null;
}

interface OrgChartData {
  vp: Employee | null;
  globalOps: Employee | null;
  ie_fmu_mif: Employee | null;
  factoryMgmt: Employee | null;
  jeffReports: Employee[];
  supportFunctions: Employee[];
  reports: Record<string, Employee[]>;
}

// Format database names dynamically (e.g. swap comma formats like "Jiang, Baiping" -> "Baiping Jiang")
const mapNameToChart = (emp: Employee): string => {
  const name = emp.full_name;
  if (!name) return "";

  if (name.includes(",")) {
    const parts = name.split(",");
    return `${parts[1].trim()} ${parts[0].trim()}`;
  }
  return name;
};

// Use database job titles directly, with fallback defaults if missing
const mapTitleToChart = (emp: Employee): string => {
  const title = emp.job_title;
  if (!title) return "";

  // Abbreviate extremely long titles slightly to fit nicely on cards
  if (title === 'Senior Factory Management Manager') return 'Sr. Manager';
  if (title === 'Factory Management Manager') return 'Manager';
  if (title === 'Director, Operation Quality') return 'Director';
  if (title === 'Senior EHS & ESG Manager') return 'Sr. Manager';
  if (title === 'Senior Manager of EE & Motor Engineering') return 'Sr. Manager';
  if (title === 'Director (AME & Automation)') return 'Director';
  return title;
};

// Dynamically shorten names to initials format (e.g. "Nguyễn Đức Việt" -> "N.D.Việt")
const shortenReportName = (name: string): string => {
  if (!name) return "";
  
  let cleanName = name.trim();
  if (cleanName.includes(",")) {
    const parts = cleanName.split(",");
    cleanName = `${parts[1].trim()} ${parts[0].trim()}`;
  }

  const parts = cleanName.split(/\s+/);
  if (parts.length <= 1) return cleanName;

  const last = parts[parts.length - 1];
  const initials = parts.slice(0, parts.length - 1).map(p => p[0].toUpperCase()).join(".");
  return `${initials}.${last}`;
};

// Use direct report titles from database directly
const shortenReportTitle = (title: string | null): string => {
  if (!title) return "";
  
  // Clean up extremely long strings for visual neatness
  if (title.includes("Mitigation")) return "MIF Manager";
  if (title.includes("Maintenance")) return "FMU Manager";
  if (title.includes("Assistant IE Manager")) return "IE Asst. Manager";
  if (title.includes("Senior Factory Management Supervisor")) return "IDM Sr. Supervisor";
  if (title.includes("Production Manager")) return "PROD Manager";
  if (title.includes("Assistant PM Manager")) return "PM Asst. Manager";
  if (title.includes("Senior Production Supervisor")) return "PROD Sr. Supervisor";
  if (title.includes("Assistant Production Manager")) return "PROD Asst. Manager";
  if (title.includes("PM Manager")) return "PM Manager";
  if (title.includes("Production Training Supervisor")) return "Training Supervisor";
  
  return title;
};

// Dynamically derive the category header for a card based on employee attributes and sub-reports
const getCategoryHeader = (emp: Employee, reports: Employee[]): string => {
  const cleanId = emp.emp_id.trim().replace(/^0+/, '');
  
  // Specific top division leads
  if (cleanId === '1347') return 'IE & FMU & MIF';
  if (cleanId === '818') return 'Factory Management';
  if (cleanId === '610977') return 'Operations';

  // For other managers, inspect their direct reports' department names
  if (reports && reports.length > 0) {
    const depts = Array.from(new Set(reports.map(r => r.dept).filter(Boolean))) as string[];
    const cleanDepts = depts.map(d => {
      if (d === 'Mitigation & Investigation Force') return 'MIF';
      if (d === 'Factory Maintenance Unit') return 'FMU';
      if (d === 'Warehouse - PT') return 'Warehouse';
      if (d === 'Manufacturing Excellence, Training & Development') return 'ME & Training';
      if (d === 'PM - PT') return 'PM';
      if (d === 'Production - PT') return 'Production';
      if (d === 'PM - Motor') return 'PM (Motor)';
      if (d === 'Production - Motor') return 'Production (Motor)';
      if (d.includes(" - ")) return d.split(" - ")[1];
      return d;
    });

    if (cleanDepts.length > 0) {
      // Abbreviate and combine up to 2 unique departments
      return cleanDepts.slice(0, 2).join(" & ");
    }
  }

  // Fallback to location or department/title
  if (emp.location && emp.location === 'DDK') {
    return 'DDK Operations';
  }
  
  if (emp.dept && emp.dept !== 'Management' && emp.dept !== 'MFG Management') {
    return emp.dept.includes(" - ") ? emp.dept.split(" - ")[1] : emp.dept;
  }
  
  return emp.job_title || 'Operations';
};

export default function CoreTeamOrgChart() {
  const [data, setData] = useState<OrgChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/orgchart/core-team")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch core team data");
        return res.json();
      })
      .then((json) => {
        if (json.success) {
          setData(json);
        } else {
          throw new Error(json.error || "Failed to load core team data");
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleImgError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  const renderPhoto = (id: string, name: string, className: string = "w-14 h-16 sm:w-16 sm:h-20") => {
    const cleanId = id.trim().replace(/^0+/, '');
    const isError = imgErrors[cleanId];
    const photoUrl = `/api/uploads/${cleanId}.webp`;

    if (!isError) {
      return (
        <img
          src={photoUrl}
          alt={name}
          className={`${className} object-cover border border-gray-300 rounded shadow-sm`}
          onError={() => handleImgError(cleanId)}
        />
      );
    }

    // Initials fallback
    const initials = name
      .split('.')
      .pop() // e.g. "Tien" from "T.T.Tien"
      ?.trim()
      .slice(0, 2)
      .toUpperCase() || name.slice(0, 2).toUpperCase();

    return (
      <div className={`${className} bg-gradient-to-br from-[#db011c] to-[#900112] text-white flex flex-col items-center justify-center font-black text-base sm:text-lg rounded border border-red-700 select-none shadow-md shrink-0`}>
        <span className="text-[10px] opacity-70 tracking-widest leading-none mb-1">MIL</span>
        <span>{initials}</span>
      </div>
    );
  };

  // Render an employee card dynamically
  const renderLeaderCard = (emp: Employee) => {
    if (!data) return null;

    const name = mapNameToChart(emp);
    const title = mapTitleToChart(emp);
    const cleanId = emp.emp_id.trim().replace(/^0+/, '');
    const reports = data.reports[cleanId] || [];
    const label = getCategoryHeader(emp, reports);

    // Filter to show only key sub-reports (max 4 for visual spacing)
    const displayReports = reports.slice(0, 4);

    return (
      <div className="flex flex-col items-center w-full max-w-[260px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
        {/* Category Header */}
        <div className="w-full bg-[#db011c] text-white text-center py-1.5 px-2 font-black tracking-wider text-[11px] sm:text-xs uppercase truncate">
          {label}
        </div>
        
        {/* Profile Card Body */}
        <div className="w-full p-3 flex gap-3 items-center border-b border-gray-100 bg-zinc-50/50">
          {renderPhoto(emp.emp_id, name)}
          <div className="flex flex-col justify-center min-w-0 text-left">
            <h4 className="text-sm font-black text-zinc-900 tracking-tight truncate">{name}</h4>
            <p className="text-xs text-zinc-500 font-medium tracking-tight mt-0.5 truncate">{title}</p>
          </div>
        </div>

        {/* Sub-Reports Box */}
        {displayReports.length > 0 && (
           <div className="w-full bg-white p-2 flex flex-col gap-1.5">
             {displayReports.map((rep) => {
               const repName = shortenReportName(rep.full_name || '');
               const repTitle = shortenReportTitle(rep.job_title);
               return (
                 <div key={rep.emp_id} className="w-full border border-gray-100 hover:border-red-200 bg-zinc-50/20 rounded p-1.5 text-left flex flex-col hover:bg-red-50/10 transition-colors duration-200">
                   <span className="text-[11px] font-bold text-zinc-800 tracking-tight leading-snug truncate">{repName}</span>
                   <span className="text-[9px] text-zinc-400 font-semibold tracking-tight leading-none mt-0.5 truncate">{repTitle}</span>
                 </div>
               );
             })}
           </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold mt-4 tracking-wider text-sm">Loading dynamic organizational data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center bg-red-50/50 rounded-3xl border border-red-100 mt-8 text-center px-4">
        <span className="text-red-500 text-3xl font-bold">⚠️</span>
        <p className="text-red-700 font-black mt-2">Could not retrieve live database hierarchy</p>
        <p className="text-red-500/70 text-xs mt-1 max-w-md">{error || "Connection refused"}</p>
      </div>
    );
  }

  const { vp, globalOps, ie_fmu_mif, factoryMgmt } = data;

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10 text-zinc-800 font-sans mt-12 overflow-x-auto select-none">
      
      {/* Chart Layout Box */}
      <div className="min-w-[1080px] flex flex-col items-center mx-auto text-center">
        
        {/* Title Block */}
        <div className="flex items-center justify-center gap-4 mb-10 w-full max-w-3xl border-b-2 border-red-600 pb-3">
          <img src="/logo.png" alt="Milwaukee Logo" className="h-10 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
            Milwaukee PT VN Core Team - <span className="italic text-red-600">Dynamic Org Chart</span>
          </h2>
        </div>

        {/* Level 0: Operations VP (HK Lee) */}
        <div className="relative flex flex-col items-center mb-10">
          {vp && (
            <div className="flex flex-col items-center bg-[#db011c] text-white p-3 rounded-lg shadow-md border border-red-700 max-w-[280px]">
              <div className="flex gap-4 items-center">
                {renderPhoto(vp.emp_id, mapNameToChart(vp), "w-16 h-20 border border-white/20")}
                <div className="text-left">
                  <span className="text-[10px] font-bold tracking-widest text-red-200 uppercase">Operations VP</span>
                  <h3 className="text-base font-black tracking-tight mt-0.5">{mapNameToChart(vp)}</h3>
                  <p className="text-xs text-red-100 font-semibold mt-0.5">{mapTitleToChart(vp)}</p>
                </div>
              </div>
            </div>
          )}
          {/* Connector Down */}
          <div className="w-0.5 h-10 bg-red-600 mt-0"></div>
        </div>

        {/* Level 1: Direct reports to Operations VP (3 Columns) */}
        <div className="relative w-full mb-10 max-w-6xl mx-auto">
          {/* Horizontal connecting line from Col 1 center (16.6%) to Col 3 center (83.3%) */}
          <div className="absolute left-[16.6%] right-[16.6%] top-0 h-0.5 bg-red-600"></div>

          <div className="grid grid-cols-3 gap-6 w-full items-start pt-5 relative">
            
            {/* Column 1: Trương Trọng Tiến (IE & FMU & MIF) */}
            <div className="flex flex-col items-center relative">
              {/* Vertical line from horizontal bar to card */}
              <div className="absolute top-[-20px] h-5 w-0.5 bg-red-600"></div>
              {ie_fmu_mif && renderLeaderCard(ie_fmu_mif)}
            </div>

            {/* Column 2: Nguyễn Nhã Quyên (Factory Management) */}
            <div className="flex flex-col items-center relative">
              {/* Vertical line from horizontal bar to card */}
              <div className="absolute top-[-20px] h-5 w-0.5 bg-red-600"></div>
              {factoryMgmt && renderLeaderCard(factoryMgmt)}
            </div>

            {/* Column 3: Jeff Searl (VP Global Operations) */}
            <div className="flex flex-col items-center relative">
              {/* Vertical line from horizontal bar to card */}
              <div className="absolute top-[-20px] h-5 w-0.5 bg-red-600"></div>
              
              {/* Jeff Searl Card */}
              {globalOps && (
                <div className="flex flex-col items-center w-full max-w-[260px] bg-white border-2 border-red-600 p-3 rounded-lg shadow-md relative z-10">
                  <div className="flex gap-4 items-center">
                    {renderPhoto(globalOps.emp_id, mapNameToChart(globalOps), "w-16 h-20 border border-gray-200")}
                    <div className="text-left">
                      <span className="text-[10px] font-bold tracking-widest text-red-600 uppercase">OPERATIONS</span>
                      <h3 className="text-base font-black tracking-tight mt-0.5 text-zinc-900">{mapNameToChart(globalOps)}</h3>
                      <p className="text-xs text-zinc-500 font-semibold mt-0.5">{mapTitleToChart(globalOps)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Level 2 Connector (Direct reports of Jeff Searl) */}
        <div className="w-full max-w-6xl mx-auto relative h-10">
          {/* Vertical line going down from Jeff Searl (at 83.3% center of right-most column of Level 1) */}
          <div className="absolute left-[83.3%] top-0 h-full w-0.5 bg-red-600"></div>
          {/* Horizontal line connecting all 6 columns of Level 2 (from Col 1 center 8.3% to Col 6 center 91.6%) */}
          <div className="absolute left-[8.3%] right-[8.3%] bottom-0 h-0.5 bg-red-600"></div>
        </div>

        {/* Level 2: Jeff Searl's reports (6 Columns Grid) */}
        <div className="grid grid-cols-6 gap-4 w-full max-w-6xl mx-auto items-start mb-16 pt-5 relative">
          {data.jeffReports.map((emp) => (
            <div key={emp.emp_id} className="flex flex-col items-center relative">
              <div className="absolute top-[-20px] h-5 w-0.5 bg-red-600"></div>
              {renderLeaderCard(emp)}
            </div>
          ))}
        </div>

        {/* Level 3: Support Functions (Bottom Row) */}
        {/* Dotted horizontal line separator */}
        <div className="w-full relative py-6 mb-4">
          <div className="absolute inset-x-[4%] top-1/2 border-t-2 border-dotted border-red-500"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-6 text-red-600 font-black tracking-[0.2em] text-xs uppercase select-none">
            Support Functions
          </div>
        </div>

        {/* Support Grid (Dynamic layout based on size of active items) */}
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl mx-auto items-start">
          {data.supportFunctions.map((emp) => (
            <div key={emp.emp_id} className="flex flex-col items-center min-w-[150px] max-w-[220px]">
              {renderLeaderCard(emp)}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
