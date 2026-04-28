"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import OrgChartView from "./OrgChartView";
import { useOrgData } from "@/hooks/useOrgData";
import DepartmentFilter from "./DepartmentFilter";
import "@/styles/admin-layout.css";

/**
 * High-Intensity Industrial Loading Station
 */
function OrgChartSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#DB011C] rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-3">
          <p className="text-gray-900 font-bold uppercase tracking-widest text-sm">Milwaukee®</p>
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-400 font-medium text-xs tracking-wide">Syncing organization data...</p>
            <div className="w-40 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#DB011C] w-1/3 animate-[loading-bar_1.5s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
         @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
         }
      `}</style>
    </div>
  );
}

/**
 * Tactical Command Center Interface
 * Optimized with SWR caching - data persists across navigation
 */
function OrgChartPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSector = searchParams.get("group") || "all";
  const currentType = searchParams.get("type") || "all";

  // Use SWR cached data instead of direct fetch
  const { nodes, groups, loading: isOrgDataLoading } = useOrgData();

  const dispatchSectorChange = (sector: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sector === "all") {
      params.delete("group");
    } else {
      params.set("group", sector);
    }
    router.push(`/orgchart?${params.toString()}`);
  };

  const dispatchTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    router.push(`/orgchart?${params.toString()}`);
  }

  return (
    <div className="mil-container flex flex-col h-screen overflow-hidden p-0! bg-[#f2f2f2]">
      <DepartmentFilter
        currentSector={currentSector}
        currentType={currentType}
        groups={groups}
        loading={isOrgDataLoading}
        hasNodes={nodes.length > 0}
        onSelect={dispatchSectorChange}
        onSelectType={dispatchTypeChange}
      />

      <main className="flex-1 relative bg-white z-0 overflow-hidden">
        <OrgChartView selectedGroup={currentSector} selectedType={currentType} />
      </main>
    </div>
  );
}

export default function OrgChartPage() {
  return (
    <Suspense fallback={<OrgChartSkeleton />}>
      <OrgChartPageContent />
    </Suspense>
  );
}
