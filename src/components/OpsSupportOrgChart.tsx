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
  root: Employee | null;
  directReports: Employee[];
  reports: Record<string, Employee[]>;
  spanOfControl?: Record<string, { total: number; breakdown: Record<string, number> }>;
}

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

// Format database names dynamically and shorten to initials (e.g. "Jiang, Baiping" -> "B.Jiang")
const mapNameToChart = (emp: Employee): string => {
  return shortenReportName(emp.full_name || "");
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



const getCategoryHeader = (emp: Employee, reports: Employee[]): string => {
  return emp.dept || emp.job_title || 'Operations';
};

export default function OpsSupportOrgChart() {
  const [data, setData] = useState<OrgChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  useEffect(() => {
    fetch("/api/orgchart/ops-support")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch ops support data");
        return res.json();
      })
      .then((json) => {
        if (json.success) {
          setData(json);
        } else {
          throw new Error(json.error || "Failed to load ops support data");
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
  const renderLeaderCard = (emp: Employee, options?: { showTopLine?: boolean; isDotted?: boolean }) => {
    if (!data) return null;

    const showTopLine = options?.showTopLine || false;
    const isDotted = options?.isDotted || false;

    const name = mapNameToChart(emp);
    const title = mapTitleToChart(emp);
    const cleanId = emp.emp_id.trim().replace(/^0+/, '');
    const reports = data.reports[cleanId] || [];
    const label = getCategoryHeader(emp, reports);
    const isJeff = cleanId === '610977';
    const displayReports = reports.filter(rep => isSupervisorOrManager(rep.job_title));

    return (
      <div className="flex flex-col items-center w-full relative">
        {showTopLine && (
          isDotted ? (
            <div className="w-[2px] border-l-[2px] border-dotted border-red-500 relative z-0" style={{ height: "20px" }}></div>
          ) : (
            <div className="w-[2px] bg-red-600 relative z-0" style={{ height: "20px" }}></div>
          )
        )}
        <div 
          className={`flex flex-col items-center w-full max-w-[170px] mx-auto bg-white rounded shadow-sm overflow-hidden border ${isJeff ? 'border-2 border-red-600 shadow-md ring-2 ring-red-100' : 'border-gray-200'} hover:shadow-md transition-shadow duration-300 relative cursor-pointer hover:bg-slate-50`}
          onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); }}
        >
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
                     className={`bg-white p-1 flex flex-col justify-center text-center hover:bg-red-50/20 transition-colors duration-100 min-w-0 cursor-pointer ${isLastOdd ? 'col-span-2' : ''}`}
                     onClick={(e) => { e.stopPropagation(); setSelectedEmp(rep); }}
                   >
                     <span className="text-[8.5px] font-bold text-zinc-800 tracking-tight leading-tight truncate">{repName}</span>
                     <span className="text-[7.5px] text-zinc-400 font-semibold tracking-tight leading-none mt-0.5 truncate">{repTitle}</span>
                   </div>
                 );
               })}
             </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedEmp) return null;
    const cleanId = selectedEmp.emp_id.trim().replace(/^0+/, '');
    const isError = imgErrors[cleanId];
    const photoUrl = `/api/uploads/${cleanId}.webp`;
    
    const name = selectedEmp.full_name || '';
    const initials = name.split('.').pop()?.trim().slice(0, 2).toUpperCase() || name.slice(0, 2).toUpperCase();
    
    const reportsForEmp = data?.reports[cleanId] || [];
    const category = getCategoryHeader(selectedEmp, reportsForEmp);
    const socData = data?.spanOfControl?.[cleanId];

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200 p-4"
        onClick={() => setSelectedEmp(null)}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col border border-slate-200 transform scale-[1.02] animate-[fadeIn_0.15s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div className="h-16 bg-[#db011c] relative flex items-center justify-center overflow-hidden shrink-0">
             <div className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')] bg-center"></div>
             <img src="/logo.png" alt="Milwaukee" className="h-5 opacity-90 drop-shadow-md z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
             <button 
               className="absolute top-3 right-3 text-white hover:text-red-200 opacity-80 transition-colors z-20"
               onClick={() => setSelectedEmp(null)}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>
          
          {/* Profile & Info Content */}
          <div className="p-6 relative flex flex-col items-center">
            {/* Profile Avatar */}
            <div className="w-20 h-20 rounded-full border-[3px] border-white bg-slate-100 shadow-md -mt-14 overflow-hidden flex items-center justify-center relative z-20 shrink-0">
              {!isError ? (
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" onError={() => handleImgError(cleanId)} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#db011c] to-[#900112] text-white flex flex-col items-center justify-center font-black text-xl">
                  <span className="text-[9px] opacity-70 tracking-widest leading-none mb-1">MIL</span>
                  <span>{initials}</span>
                </div>
              )}
            </div>
            
            <h3 className="mt-3 text-lg font-black text-slate-800 uppercase tracking-tight leading-tight text-center">{name}</h3>
            
            <div className="w-full h-px bg-slate-100 my-6"></div>
            
            {/* Details Grid */}
            <div className="w-full grid grid-cols-2 gap-y-6 gap-x-6 text-left pl-2">
               <div>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Employee ID</p>
                 <p className="text-[13px] font-bold text-slate-700">{selectedEmp.emp_id}</p>
               </div>
               <div>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Business Unit</p>
                 <p className="text-[13px] font-bold text-slate-700">-</p>
               </div>
               <div>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Category</p>
                 <p className="text-[13px] font-bold text-slate-700">{selectedEmp.job_title || category}</p>
               </div>
               <div>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Location</p>
                 <p className="text-[13px] font-bold text-slate-700">{selectedEmp.location || 'SHTP'}</p>
               </div>
               <div>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Line Manager</p>
                 <p className="text-[13px] font-bold text-slate-700 truncate">{selectedEmp.line_manager || '-'}</p>
               </div>
               <div>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Joining Date</p>
                 <p className="text-[13px] font-bold text-slate-700">N/A</p>
               </div>
            </div>

            {/* Span of Control */}
            {socData && socData.total > 0 && (
              <div className="w-full mt-7 flex flex-col items-center">
                <div className="w-full h-px bg-slate-100 mb-6"></div>
                <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest mb-4">Span of Control ({socData.total})</p>
                <div className="flex flex-wrap gap-2.5 justify-center max-w-sm">
                   {socData.breakdown.Director > 0 && (
                     <span className="px-3 py-1.5 bg-[#d4c3ea] border border-[#a686d1] text-[#4d2d76] rounded-full text-xs font-bold shadow-sm">Director: {socData.breakdown.Director}</span>
                   )}
                   {socData.breakdown.Manager > 0 && (
                     <span className="px-3 py-1.5 bg-[#bec3ed] border border-[#7d89d6] text-[#2c3674] rounded-full text-xs font-bold shadow-sm">Manager: {socData.breakdown.Manager}</span>
                   )}
                   {socData.breakdown.Supervisor > 0 && (
                     <span className="px-3 py-1.5 bg-[#a4cbb4] border border-[#559b72] text-[#1c452e] rounded-full text-xs font-bold shadow-sm">Supervisor: {socData.breakdown.Supervisor}</span>
                   )}
                   {socData.breakdown.Specialist > 0 && (
                     <span className="px-3 py-1.5 bg-[#deb5a2] border border-[#c47b59] text-[#6b3117] rounded-full text-xs font-bold shadow-sm">Specialist: {socData.breakdown.Specialist}</span>
                   )}
                   {socData.breakdown.Engineer > 0 && (
                     <span className="px-3 py-1.5 bg-[#a2c5c5] border border-[#609999] text-[#234848] rounded-full text-xs font-bold shadow-sm">Engineer: {socData.breakdown.Engineer}</span>
                   )}
                   {socData.breakdown.IDL > 0 && (
                     <span className="px-3 py-1.5 bg-[#e2e8f0] border border-[#cbd5e1] text-[#475569] rounded-full text-xs font-bold shadow-sm">IDL: {socData.breakdown.IDL}</span>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
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

  const { root, directReports } = data;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-1 overflow-hidden select-none relative">
      
      {/* Zoom / Scaling Container with fixed width of 1200px to guarantee mathematical alignment of lines across all screens */}
      <div 
        className="w-[1200px] mx-auto transform scale-[0.32] sm:scale-[0.52] md:scale-[0.62] lg:scale-[0.82] xl:scale-[0.96] origin-top transition-transform duration-300 flex flex-col items-center"
      >
        


        {/* Level 0: Root (Nguyễn Nhã Quyên) */}
        <div className="w-full flex justify-center relative mb-0">
          {root && (
            <div className="flex flex-col items-center bg-[#db011c] text-white p-1.5 sm:p-2 rounded-lg shadow-md border border-red-700 w-full max-w-[170px]">
              <div className="flex gap-2 items-center">
                {renderPhoto(root.emp_id, mapNameToChart(root), "w-9 h-11 border border-white/20")}
                <div className="text-left">
                  <span className="text-[7.5px] font-bold tracking-widest text-red-200 uppercase">Head of Operations</span>
                  <h3 className="text-[11px] font-black tracking-tight mt-0.5">{mapNameToChart(root)}</h3>
                  <p className="text-[8px] text-red-100 font-semibold mt-0.5">{mapTitleToChart(root)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Drop from Root */}
        {directReports && directReports.length > 0 && (
          <div className="w-full relative h-8">
            <div className="absolute w-[2px] bg-red-600" style={{ left: "50%", top: "0", bottom: "0" }}></div>
          </div>
        )}

        {/* Rows of direct reports with side trunk line */}
        {directReports && directReports.length > 0 && (
          <div className="w-full relative mt-0 flex flex-col items-center">
            {Array.from({ length: Math.ceil(directReports.length / 5) }).map((_, rowIndex) => {
              const rowItems = directReports.slice(rowIndex * 5, (rowIndex + 1) * 5);
              const isLastRow = rowIndex === Math.ceil(directReports.length / 5) - 1;
              const lastItemCenter = 18 + 16 * (rowItems.length - 1);

              return (
                <div key={rowIndex} className="w-full relative flex flex-col items-center mb-8 z-0">
                  {/* Trunk line segment for this row */}
                  <div 
                    className="absolute bg-red-600 z-0" 
                    style={{ 
                      left: "5%", 
                      top: rowIndex === 0 ? "24px" : "0", 
                      bottom: isLastRow ? "calc(100% - 24px)" : "-32px",
                      width: "2px" 
                    }}
                  ></div>

                  {/* Horizontal line from trunk to last item */}
                  <div className="w-full relative h-6 z-0">
                    <div className="absolute bottom-0 h-[2px] bg-red-600" style={{ left: "5%", width: `calc(${lastItemCenter}% - 5%)` }}></div>
                  </div>

                  {/* Grid for cards in this row */}
                  <div className="grid grid-cols-5 gap-y-0 gap-x-2 w-full mx-auto relative z-10 px-[10%]">
                    {rowItems.map((emp) => (
                      <div key={emp.emp_id} className="col-span-1 flex flex-col items-center relative w-full">
                        {/* Drop line from horizontal bar */}
                        <div className="w-[2px] bg-red-600 h-6"></div>
                        {renderLeaderCard(emp, { showTopLine: false, isDotted: false })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {renderDetailsModal()}
    </div>
  );
}
