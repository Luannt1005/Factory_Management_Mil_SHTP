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

// Filter to keep only reports with job level of Supervisor, Manager or above
const isSupervisorOrManager = (title: string | null): boolean => {
  if (!title) return false;
  const t = title.toLowerCase();
  return t.includes("manager") || 
         t.includes("supervisor") || 
         t.includes("director") || 
         t.includes("leader") || 
         t.includes("vp") || 
         t.includes("head") || 
         t.includes("chief") ||
         t.includes("lead") ||
         t.includes("principal");
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

  const renderPhoto = (id: string, name: string, className: string = "w-9 h-11 sm:w-11 sm:h-13") => {
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
      <div className={`${className} bg-gradient-to-br from-[#db011c] to-[#900112] text-white flex flex-col items-center justify-center font-black text-xs rounded border border-red-700 select-none shadow-md shrink-0`}>
        <span className="text-[7px] opacity-70 tracking-widest leading-none mb-0.5">MIL</span>
        <span>{initials}</span>
      </div>
    );
  };

  // Render an employee card dynamically (ultra compact)
  const renderLeaderCard = (emp: Employee) => {
    if (!data) return null;

    const name = mapNameToChart(emp);
    const title = mapTitleToChart(emp);
    const cleanId = emp.emp_id.trim().replace(/^0+/, '');
    const reports = data.reports[cleanId] || [];
    const label = getCategoryHeader(emp, reports);
    const isJeff = cleanId === '610977';

    // Filter to show only supervisors, managers or above
    const displayReports = reports.filter(rep => isSupervisorOrManager(rep.job_title));

    return (
      <div className={`flex flex-col items-center w-full max-w-[170px] mx-auto bg-white rounded shadow-sm overflow-hidden border ${isJeff ? 'border-2 border-red-600 shadow-md ring-2 ring-red-100' : 'border-gray-200'} hover:shadow-md transition-shadow duration-300`}>
        {/* Category Header */}
        <div className="w-full bg-[#db011c] text-white text-center py-0.5 px-1 font-black tracking-wider text-[9px] sm:text-[10px] uppercase truncate">
          {label}
        </div>
        
        {/* Profile Card Body */}
        <div className="w-full p-1.5 flex gap-1.5 items-center border-b border-gray-100 bg-zinc-50/50">
          {renderPhoto(emp.emp_id, name)}
          <div className="flex flex-col justify-center min-w-0 text-left">
            <h4 className="text-[11px] font-black text-zinc-900 tracking-tight truncate">{name}</h4>
            <p className="text-[8px] text-zinc-500 font-semibold tracking-tight mt-0.5 truncate">{title}</p>
          </div>
        </div>

        {/* Sub-Reports Box */}
        {displayReports.length > 0 && !isJeff && (
           <div className={`w-full grid ${displayReports.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-[1px] bg-gray-200 border-t border-gray-200`}>
             {displayReports.map((rep, idx) => {
               const repName = shortenReportName(rep.full_name || '');
               const repTitle = shortenReportTitle(rep.job_title);
               const isLastOdd = displayReports.length % 2 !== 0 && idx === displayReports.length - 1;
               return (
                 <div 
                   key={rep.emp_id} 
                   className={`bg-white p-1 flex flex-col justify-center text-center hover:bg-red-50/20 transition-colors duration-100 min-w-0 ${isLastOdd ? 'col-span-2' : ''}`}
                 >
                   <span className="text-[8.5px] font-bold text-zinc-800 tracking-tight leading-tight truncate">{repName}</span>
                   <span className="text-[7.5px] text-zinc-400 font-semibold tracking-tight leading-none mt-0.5 truncate">{repTitle}</span>
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 min-h-[500px]">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold mt-4 tracking-wider text-sm">Loading dynamic organizational data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-red-50/50 rounded-3xl border border-red-100 text-center px-4 min-h-[400px]">
        <span className="text-red-500 text-3xl font-bold">⚠️</span>
        <p className="text-red-700 font-black mt-2">Could not retrieve live database hierarchy</p>
        <p className="text-red-500/70 text-xs mt-1 max-w-md">{error || "Connection refused"}</p>
      </div>
    );
  }

  const { vp, globalOps, ie_fmu_mif, factoryMgmt } = data;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-1 overflow-hidden select-none">
      
      {/* Zoom / Scaling Container to fit perfectly in viewport without scrolling */}
      <div className="w-full max-w-5xl mx-auto transform scale-[0.66] sm:scale-[0.74] md:scale-[0.8] lg:scale-[0.86] xl:scale-[0.92] origin-top transition-transform duration-300 flex flex-col items-center">
        
        {/* Title Block */}
        <div className="flex items-center justify-center gap-2 mb-4 w-full max-w-2xl border-b border-red-600 pb-1.5">
          <img src="/logo.png" alt="Milwaukee Logo" className="h-6 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <h2 className="text-base sm:text-lg font-black tracking-tight text-zinc-900">
            Milwaukee PT VN Core Team - <span className="italic text-red-600">Dynamic Org Chart</span>
          </h2>
        </div>

        {/* Level 0: Operations VP (HK Lee) */}
        {/* Placed centered at 34% from left to align exactly with the split connector */}
        <div className="w-full flex justify-start relative mb-2" style={{ paddingLeft: 'calc(34% - 85px)' }}>
          {vp && (
            <div className="flex flex-col items-center bg-[#db011c] text-white p-1.5 sm:p-2 rounded-lg shadow-md border border-red-700 max-w-[170px]">
              <div className="flex gap-2 items-center">
                {renderPhoto(vp.emp_id, mapNameToChart(vp), "w-9 h-11 border border-white/20")}
                <div className="text-left">
                  <span className="text-[7.5px] font-bold tracking-widest text-red-200 uppercase">Operations VP</span>
                  <h3 className="text-[11px] font-black tracking-tight mt-0.5">{mapNameToChart(vp)}</h3>
                  <p className="text-[8px] text-red-100 font-semibold mt-0.5">{mapTitleToChart(vp)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Level 1 Horizontal Connecting Line */}
        <div className="w-full relative h-6">
          {/* Horizontal Line connector from Left Stack center (9%) to Jeff center (59%) */}
          <div className="absolute left-[9%] w-[50%] bottom-0 h-0.5 bg-red-600"></div>
          {/* Vertical Line going down from VP to the horizontal line */}
          <div className="absolute left-[34%] top-0 bottom-0 w-0.5 bg-red-600"></div>
          {/* Vertical Line going down to Jeff Searl */}
          <div className="absolute left-[59%] bottom-0 h-6 w-0.5 bg-red-600"></div>
          {/* Vertical Line going down to Left Stack */}
          <div className="absolute left-[9%] bottom-0 h-6 w-0.5 bg-red-600"></div>
        </div>

        {/* main horizontal splits: Left Column (Tien & Quyen) and Right Column (Jeff & 6 reports) */}
        <div className="flex w-full gap-4 items-start relative mt-0">
          
          {/* Left Column Stack (Tien and Quyen) */}
          <div className="w-[18%] flex flex-col items-center relative">
            {/* Natural layout vertical connector line between Tien and Quyen */}
            
            {/* Tien Card */}
            <div className="w-full mt-0">
              {ie_fmu_mif && renderLeaderCard(ie_fmu_mif)}
            </div>
            
            {/* Vertical connector line between cards */}
            <div className="w-0.5 h-6 bg-red-600"></div>
            
            {/* Quyen Card */}
            <div className="w-full">
              {factoryMgmt && renderLeaderCard(factoryMgmt)}
            </div>
          </div>

          {/* Right Column Section (Jeff Searl and his 6 direct reports) */}
          <div className="w-[82%] flex flex-col items-center">
            
            {/* Jeff Searl Card */}
            <div className="flex flex-col items-center relative">
              {globalOps && renderLeaderCard(globalOps)}
              
              {/* Vertical connector going down from Jeff to Level 2 reports horizontal line */}
              <div className="w-0.5 h-6 bg-red-600"></div>
            </div>

            {/* Level 2 Connector Row */}
            <div className="w-full relative h-6">
              {/* Horizontal line from Col 1 center (8.3%) to Col 6 center (91.6%) */}
              <div className="absolute left-[8.3%] right-[8.3%] bottom-0 h-0.5 bg-red-600"></div>
              {/* Vertical connector coming down from Jeff (which is centered, so at 50%) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-red-600"></div>
            </div>

            {/* Level 2: Jeff's 6 Direct Reports Grid */}
            <div className="grid grid-cols-6 gap-2 w-full pt-4">
              {data.jeffReports.map((emp) => (
                <div key={emp.emp_id} className="col-span-1 flex flex-col items-center relative w-full mb-4">
                  {/* Vertical connector above card */}
                  <div className="w-0.5 h-4 bg-red-600"></div>
                  {renderLeaderCard(emp)}
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Level 3: Support Functions (Dotted Divider) */}
        <div className="w-full relative py-2 mt-2">
          {/* Main top horizontal dotted line */}
          <div className="absolute inset-x-[4%] top-1/2 border-t border-dotted border-red-500"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-4 text-red-600 font-black tracking-[0.2em] text-[9px] uppercase select-none">
            Support Functions
          </div>
        </div>

        {/* Support Grid (Dynamic Flex wrap for the active support functions in exact order) */}
        <div className="flex flex-wrap justify-center gap-3 w-full max-w-5xl mx-auto items-start">
          {data.supportFunctions.map((emp) => {
            return (
              <div key={emp.emp_id} className="flex flex-col items-center relative min-w-[130px] max-w-[160px] flex-1">
                {/* Dotted vertical line going up to divider */}
                <div className="w-0.5 h-6 border-l border-dotted border-red-500 -mt-2 relative z-0"></div>
                
                {/* Support Card */}
                {renderLeaderCard(emp)}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
