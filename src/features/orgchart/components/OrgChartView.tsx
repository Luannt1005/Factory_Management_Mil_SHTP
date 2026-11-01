"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useMemo } from "react";
import OrgChartCanvas from "@/features/orgchart/components/OrgChartCanvas";
import { useOrgData } from "@/hooks/useOrgData";
import OrgChartToolbar, { type EmployeeOption } from "@/features/orgchart/components/OrgChartToolbar";
import { collectSubtreeIds, ORG_SCOPE_ROOT_ID, ORG_SCOPE_ROOT_NAME } from "@/features/orgchart/utils/orgScope";
import "@/styles/admin-layout.css";

/**
 * High-Intensity Industrial Loading Station
 */
function OrgChartSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-mwk rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-3">
          <p className="text-gray-900 font-bold uppercase tracking-widest text-sm">Milwaukee®</p>
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-400 font-medium text-xs tracking-wide">Syncing organization data...</p>
            <div className="w-40 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-mwk w-1/3 animate-[loading-bar_1.5s_infinite]"></div>
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
  // Default view: only Lee Hon Kay's organization; ?scope=all also shows the people outside it
  const showEveryone = searchParams.get("scope") === "all";

  // Use SWR cached data instead of direct fetch
  const { nodes, groups, loading: isOrgDataLoading } = useOrgData();

  // Employee to jump to; nonce lets the same person be searched again
  const [focusRequest, setFocusRequest] = useState<{ id: string; nonce: number } | null>(null);

  // People the ID / Name search can find (no department or open headcount nodes)
  const employees = useMemo<EmployeeOption[]>(() => nodes
    .filter((n) => {
      const tags = Array.isArray(n.tags) ? n.tags.join(',') : String(n.tags ?? '');
      return n.type !== 'group' && !String(n.id).startsWith('dept:') && !tags.includes('group') && !tags.includes('headcount_open') && !!n.name;
    })
    .map((n) => ({ id: String(n.id), name: n.name, title: n.title || '', dept: n.dept || '' }))
    .sort((a, b) => a.name.localeCompare(b.name)), [nodes]);

  const scopeIds = useMemo(() => collectSubtreeIds(nodes, ORG_SCOPE_ROOT_ID), [nodes]);
  const scoped = !showEveryone && scopeIds.size > 0;
  const outsideCount = useMemo(
    () => (scopeIds.size > 0 ? employees.filter((e) => !scopeIds.has(e.id)).length : 0),
    [employees, scopeIds]
  );

  const pushParams = (params: URLSearchParams) => {
    const query = params.toString();
    router.push(query ? `/orgchart?${query}` : "/orgchart");
  };

  const toggleEveryone = (everyone: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (everyone) {
      params.set("scope", "all");
    } else {
      params.delete("scope");
    }
    pushParams(params);
  };

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

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("group");
    params.delete("type");
    pushParams(params);
  };

  const focusEmployee = (id: string) => {
    setFocusRequest({ id, nonce: Date.now() });
  };

  // The person is hidden by the department / type filter or sits outside Lee Hon Kay's organization:
  // lift what hides them, the chart then jumps to them
  const handleFocusHidden = (id: string) => {
    const outside = scoped && !scopeIds.has(id);
    if (currentSector === "all" && currentType === "all" && !outside) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("group");
    params.delete("type");
    if (outside) params.set("scope", "all");
    pushParams(params);
  };

  return (
    <div className="mil-container flex flex-col h-screen overflow-hidden p-0! bg-[#f2f2f2]">
      <OrgChartToolbar
        currentSector={currentSector}
        currentType={currentType}
        groups={groups}
        employees={employees}
        loading={isOrgDataLoading}
        hasNodes={nodes.length > 0}
        onSelect={dispatchSectorChange}
        onSelectType={dispatchTypeChange}
        onFocusEmployee={focusEmployee}
        onReset={resetFilters}
        scopeLabel={ORG_SCOPE_ROOT_NAME}
        scoped={scoped}
        outsideCount={outsideCount}
        onToggleScope={scopeIds.size > 0 ? (on) => toggleEveryone(!on) : undefined}
      />

      <main className="flex-1 relative bg-white z-0 overflow-hidden">
        <OrgChartCanvas
          selectedGroup={currentSector}
          selectedType={currentType}
          focusRequest={focusRequest}
          onFocusHidden={handleFocusHidden}
          rootId={ORG_SCOPE_ROOT_ID}
          scopeIds={scoped ? scopeIds : null}
        />
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
