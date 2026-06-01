"use client";

import React, { useState, useEffect } from "react";

interface Employee {
  emp_id: string;
  full_name: string | null;
  job_title: string | null;
  dept: string | null;
  line_manager?: string | null;
}

interface OrgChartData {
  leaders: Record<string, Employee>;
  reports: Record<string, Employee[]>;
}

// Map database names to shorter chart names
const mapNameToChart = (key: string, emp: Employee): string => {
  if (!emp.full_name) {
    // Fallback labels matching the reference image if record is empty
    switch (key) {
      case 'vp': return 'HK Lee';
      case 'globalOps': return 'Jeff Searl';
      case 'ie_fmu_mif': return 'T.T.Tien';
      case 'factoryMgmt': return 'Anna N.N.Quyen';
      case 'mu3': return 'Brian N.K.Hieu';
      case 'mu5': return 'Nash N.T.Ngo';
      case 'mu5bp': return 'Danny L.T. Danh';
      case 'sc': return 'Jena H.T.Thuy';
      case 'opm': return 'Susan Jiang';
      case 'ddk': return 'Skovran Robert';
      case 'ee_mtr': return 'Bryan Wei';
      case 'ame_auto_opex': return 'N.L Hiep';
      case 'ehs_esg': return 'N.T Trung';
      case 'quality': return 'Nancy C.T. Nhan';
      case 'engineering': return 'Ng Peng Heng';
      case 'hrbp': return 'H.T.P.Nha';
      case 'of': return 'Sunny L.T.K.Duong';
      default: return '';
    }
  }

  const cleanId = emp.emp_id.trim().replace(/^0+/, '');
  switch (cleanId) {
    case '500011': return 'HK Lee';
    case '610977': return 'Jeff Searl';
    case '1347': return 'T.T.Tien';
    case '818': return 'Anna N.N.Quyen';
    case '512282': return 'Brian N.K.Hieu';
    case '612495': return 'Nash N.T.Ngo';
    case '509807': return 'Danny L.T. Danh';
    case '5': return 'Jena H.T.Thuy';
    case '590118': return 'Susan Jiang';
    case '612259': return 'Skovran Robert';
    case '614043': return 'Bryan Wei';
    case '500904': return 'N.L Hiep';
    case '568007': return 'N.T Trung';
    case '1238': return 'Nancy C.T. Nhan';
    case '616797': return 'Ng Peng Heng';
    case '578935': return 'H.T.P.Nha';
    case '10': return 'Sunny L.T.K.Duong';
    default: return emp.full_name;
  }
};

// Map database job titles to chart job titles
const mapTitleToChart = (key: string, emp: Employee): string => {
  if (!emp.job_title) {
    switch (key) {
      case 'vp': return 'Operations VP';
      case 'globalOps': return 'VP Global Operations';
      case 'ie_fmu_mif': return 'Sr. Manager';
      case 'factoryMgmt': return 'Manager';
      case 'mu3': return 'Sr. Manager';
      case 'mu5': return 'Sr. Manager';
      case 'mu5bp': return 'Sr. Manager';
      case 'sc': return 'Director';
      case 'opm': return 'Director';
      case 'ddk': return 'Sr. Manager';
      case 'ee_mtr': return 'Sr. Manager';
      case 'ame_auto_opex': return 'Director';
      case 'ehs_esg': return 'Sr. Manager';
      case 'quality': return 'Director';
      case 'engineering': return 'Director';
      case 'hrbp': return 'HRBP Manager';
      case 'of': return 'Sr. Manager';
      default: return '';
    }
  }

  // Abbreviate long titles slightly if necessary to fit nicely
  const title = emp.job_title;
  if (title === 'Senior Factory Management Manager') return 'Sr. Manager';
  if (title === 'Factory Management Manager') return 'Manager';
  if (title === 'Director, Operation Quality') return 'Director';
  if (title === 'Senior EHS & ESG Manager') return 'Sr. Manager';
  if (title === 'Senior Manager of EE & Motor Engineering') return 'Sr. Manager';
  if (title === 'Director (AME & Automation)') return 'Director';
  return title;
};

// Shorten direct report names to initials for text-only cards
const shortenReportName = (name: string): string => {
  if (!name) return "";
  
  const cleanName = name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  const lowerName = cleanName.toLowerCase();
  
  if (lowerName.includes("nguyen duc viet")) return "N.D.Viet";
  if (lowerName.includes("huynh tran bao anh")) return "H.T.B.Anh";
  if (lowerName.includes("le thi huong")) return "Cindy L.T.Huong";
  if (lowerName.includes("vu hong thai")) return "V.H.Thai";
  if (lowerName.includes("ly kim phat")) return "L.K.Phat";
  if (lowerName.includes("vo hoang giang")) return "Patrick V.H.Giang";
  if (lowerName.includes("pham minh quan")) return "P.M.Quan";
  if (lowerName.includes("phan thanh giang")) return "P.T.Giang";
  if (lowerName.includes("nguyen minh toan")) return "N.M.Toan";
  if (lowerName.includes("le duy hiep")) return "L.D.Hiep";
  if (lowerName.includes("huynh thuy dong")) return "H.T.Dong";
  if (lowerName.includes("le xuan lam")) return "L.X.Lam";
  if (lowerName.includes("tran van quoc")) return "T.V.Quoc";
  if (lowerName.includes("vo ngoc bich")) return "V.N.Bich";
  if (lowerName.includes("nguyen van lam")) return "Justin N.V.Lam";
  if (lowerName.includes("dang le cam nhung")) return "D.L.C.Nhung";
  if (lowerName.includes("do tuan cuong")) return "D.T.Cuong";
  if (lowerName.includes("nguyen duy nam")) return "N.D.Nam";
  if (lowerName.includes("le thi dieu hien")) return "Lee N.T.D.Hien";
  if (lowerName.includes("pham hoang son")) return "P.H.Son";
  if (lowerName.includes("nguyen thi luyen")) return "Emily N.T.Luyen";
  if (lowerName.includes("nguyen duy that")) return "N.D.That";
  if (lowerName.includes("nguyen van quang")) return "N.V.Quang";
  if (lowerName.includes("tran ho bac")) return "T.H.Bac";
  if (lowerName.includes("nguyen thien truong")) return "Troy N.T.Truong";
  if (lowerName.includes("laven anthony james")) return "Anthony Laven";
  if (lowerName.includes("liu, jinyuan") || lowerName.includes("liu jinyuan")) return "Kelvin Liu";
  if (lowerName.includes("fan, yu") || lowerName.includes("fan yu")) return "Fan Yu";
  if (lowerName.includes("le thanh nhan")) return "Nelly V. Nhan";
  if (lowerName.includes("tran anh loc")) return "T.A.Loc";

  const parts = cleanName.split(/[\s,]+/);
  if (parts.length <= 1) return cleanName;

  if (name.includes(",")) {
    const parts = name.split(",");
    return `${parts[1].trim()} ${parts[0].trim()}`;
  }

  const last = parts[parts.length - 1];
  const initials = parts.slice(0, parts.length - 1).map(p => p[0].toUpperCase()).join(".");
  return `${initials}.${last}`;
};

// Shorten direct report job titles
const shortenReportTitle = (title: string | null): string => {
  if (!title) return "";
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
  if (title.includes("Assistant Warehouse Manager")) return "WH Asst. Manager";
  if (title.includes("Senior Warehouse Manager")) return "WH Manager";
  if (title.includes("Senior PMC Manager")) return "PMC Manager";
  if (title.includes("PMC Manager")) return "PMC Manager";
  if (title.includes("Assistant PMC Manager")) return "PMC Asst. Manager";
  if (title.includes("OPM Manager")) return "OPM Manager";
  if (title.includes("Assistant OPM Manager")) return "OPM Asst. Manager";
  if (title.includes("PM Supervisor")) return "PM Supervisor";
  if (title.includes("Senior Operations Quality Manager")) return "Ops Quality Manager";
  if (title.includes("Reliability Manager")) return "Reliability Manager";
  if (title.includes("Quality Manager")) return "Quality Manager";
  if (title.includes("Senior PSE Manager")) return "PSE Manager";
  if (title.includes("Senior NPD Manager")) return "NPD Manager";
  if (title.includes("Senior VE Manager")) return "VE Manager";
  
  return title;
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

  // Render a standard leader card
  const renderLeaderCard = (key: string, label: string) => {
    if (!data) return null;
    const emp = data.leaders[key];
    if (!emp) return null;

    const name = mapNameToChart(key, emp);
    const title = mapTitleToChart(key, emp);
    const cleanId = emp.emp_id.trim().replace(/^0+/, '');
    const reports = data.reports[cleanId] || [];

    // Filter to show only key sub-reports (max 4 for visual spacing, similar to image)
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

  const vp = data.leaders.vp;
  const globalOps = data.leaders.globalOps;

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
                {renderPhoto(vp.emp_id, mapNameToChart('vp', vp), "w-16 h-20 border border-white/20")}
                <div className="text-left">
                  <span className="text-[10px] font-bold tracking-widest text-red-200 uppercase">Operations VP</span>
                  <h3 className="text-base font-black tracking-tight mt-0.5">{mapNameToChart('vp', vp)}</h3>
                  <p className="text-xs text-red-100 font-semibold mt-0.5">Asia Vice President</p>
                </div>
              </div>
            </div>
          )}
          {/* Connector Down */}
          <div className="w-0.5 h-10 bg-red-600 mt-0"></div>
        </div>

        {/* Level 1: Operations Director (Jeff Searl) */}
        <div className="relative flex flex-col items-center mb-12">
          {globalOps && (
            <div className="flex flex-col items-center bg-white border-2 border-red-600 p-3 rounded-lg shadow-md max-w-[280px]">
              <div className="flex gap-4 items-center">
                {renderPhoto(globalOps.emp_id, mapNameToChart('globalOps', globalOps), "w-16 h-20 border border-gray-200")}
                <div className="text-left">
                  <span className="text-[10px] font-bold tracking-widest text-red-600 uppercase">OPERATIONS</span>
                  <h3 className="text-base font-black tracking-tight mt-0.5 text-zinc-900">{mapNameToChart('globalOps', globalOps)}</h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-0.5">VP Global Operations</p>
                </div>
              </div>
            </div>
          )}
          {/* Horizontal line stretching from Left to Right */}
          <div className="absolute left-[8%] right-[8%] bottom-0 h-0.5 bg-red-600"></div>
          {/* Central Connector Down */}
          <div className="w-0.5 h-10 bg-red-600"></div>
        </div>

        {/* Level 2: Divisions Grid */}
        <div className="grid grid-cols-8 gap-4 w-full items-start mb-16 relative">
          
          {/* IE & FMU & MIF (Col 1) */}
          <div className="col-span-1 flex flex-col items-center relative">
            <div className="absolute top-[-20px] bottom-0 left-1/2 w-0.5 bg-red-600 z-0"></div>
            <div className="relative z-10 w-full mt-5">
              {renderLeaderCard('ie_fmu_mif', 'IE & FMU & MIF')}
            </div>
          </div>

          {/* Factory Management (Col 2) */}
          <div className="col-span-1 flex flex-col items-center relative">
            <div className="absolute top-[-20px] bottom-0 left-1/2 w-0.5 bg-red-600 z-0"></div>
            <div className="relative z-10 w-full mt-5">
              {renderLeaderCard('factoryMgmt', 'Factory Management')}
            </div>
          </div>

          {/* MU L3 Console (Col 3) */}
          <div className="col-span-1 flex flex-col items-center relative">
            <div className="absolute top-[-20px] bottom-0 left-1/2 w-0.5 bg-red-600 z-0"></div>
            <div className="relative z-10 w-full mt-5">
              {renderLeaderCard('mu3', 'MU L3 Console')}
            </div>
          </div>

          {/* MU L5 Console (Col 4) */}
          <div className="col-span-1 flex flex-col items-center relative">
            <div className="absolute top-[-20px] bottom-0 left-1/2 w-0.5 bg-red-600 z-0"></div>
            <div className="relative z-10 w-full mt-5">
              {renderLeaderCard('mu5', 'MU L5 Console')}
            </div>
          </div>

          {/* MU L5 MT & BP (Col 5) */}
          <div className="col-span-1 flex flex-col items-center relative">
            <div className="absolute top-[-20px] bottom-0 left-1/2 w-0.5 bg-red-600 z-0"></div>
            <div className="relative z-10 w-full mt-5">
              {renderLeaderCard('mu5bp', 'MU L5 MT & BP')}
            </div>
          </div>

          {/* Supply Chain (Col 6) */}
          <div className="col-span-1 flex flex-col items-center relative">
            <div className="absolute top-[-20px] bottom-0 left-1/2 w-0.5 bg-red-600 z-0"></div>
            <div className="relative z-10 w-full mt-5">
              {renderLeaderCard('sc', 'Supply Chain')}
            </div>
          </div>

          {/* OPM (Col 7) */}
          <div className="col-span-1 flex flex-col items-center relative">
            <div className="absolute top-[-20px] bottom-0 left-1/2 w-0.5 bg-red-600 z-0"></div>
            <div className="relative z-10 w-full mt-5">
              {renderLeaderCard('opm', 'OPM')}
            </div>
          </div>

          {/* DDK Factory (Col 8) */}
          <div className="col-span-1 flex flex-col items-center relative">
            <div className="absolute top-[-20px] bottom-0 left-1/2 w-0.5 bg-red-600 z-0"></div>
            <div className="relative z-10 w-full mt-5">
              {renderLeaderCard('ddk', 'DDK Factory')}
            </div>
          </div>

        </div>

        {/* Level 3: Support Functions (Bottom Row) */}
        {/* Dotted horizontal line separator */}
        <div className="w-full relative py-6 mb-4">
          <div className="absolute inset-x-[4%] top-1/2 border-t-2 border-dotted border-red-500"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-6 text-red-600 font-black tracking-[0.2em] text-xs uppercase select-none">
            Support Functions
          </div>
        </div>

        {/* Support Grid (7 Columns) */}
        <div className="grid grid-cols-7 gap-4 w-full items-start">
          
          {/* EE & MTR */}
          <div className="flex flex-col items-center">
            {renderLeaderCard('ee_mtr', 'EE & MTR')}
          </div>

          {/* AME/AUTO/OPEX */}
          <div className="flex flex-col items-center">
            {renderLeaderCard('ame_auto_opex', 'AME/AUTO/OPEX')}
          </div>

          {/* EHS & ESG */}
          <div className="flex flex-col items-center">
            {renderLeaderCard('ehs_esg', 'EHS & ESG')}
          </div>

          {/* Quality */}
          <div className="flex flex-col items-center">
            {renderLeaderCard('quality', 'Quality')}
          </div>

          {/* Engineering */}
          <div className="flex flex-col items-center">
            {renderLeaderCard('engineering', 'Engineering')}
          </div>

          {/* HRBP */}
          <div className="flex flex-col items-center">
            {renderLeaderCard('hrbp', 'HRBP')}
          </div>

          {/* OF */}
          <div className="flex flex-col items-center">
            {renderLeaderCard('of', 'OF')}
          </div>

        </div>

      </div>
    </div>
  );
}
