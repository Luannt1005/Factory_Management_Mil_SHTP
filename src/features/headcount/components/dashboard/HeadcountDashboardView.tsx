'use client';

import React, { useState, useMemo } from 'react';
import EmployeeTable from '@/features/headcount/components/dashboard/Emp_table';
import PaginatedEmployeeTable from '@/features/headcount/components/dashboard/PaginatedEmpTable';
import StatsCards from '@/features/headcount/components/dashboard/Multi_card';
import SeniorityChart from '@/features/headcount/components/dashboard/Column_chart_seniority';
import DonutChart from '@/features/headcount/components/dashboard/Donutchart_byType';
import BUOrg3Chart from '@/features/headcount/components/dashboard/bar_chart_BU_Org_3';
import UpcomingResignTable from '@/features/headcount/components/dashboard/upcoming_resign_table';
import ManagerFilter from '@/features/headcount/components/dashboard/ManagerFilter';
import TitleFilter from '@/features/headcount/components/dashboard/TitleFilter';
import BUFilter from '@/features/headcount/components/dashboard/BUFilter';
import { useSheetData, getSubordinatesRecursive } from '@/hooks/useSheetData';
import { DashboardContainer, FilterBar, TableCard } from '@/components/dashboard';
import type { HeadcountDashboardFilter as EmployeeFilter, HeadcountFilterState as FilterState } from '@/types/headcount.types';

export default function DashboardPage() {
    const { nodes, loading: nodesLoading } = useSheetData();

    // Combined filter state
    const [filters, setFilters] = useState<FilterState>({
        title: null,
        bu: null,
        category: null,
        employeeType: null,
        tenure: null
    });

    const [selectedManagerId, setSelectedManagerId] = useState<string | number | null>(null);
    const [selectedManagerName, setSelectedManagerName] = useState<string>('');

    // Legacy handler for compatibility with child components that emit {type, value}
    const handleFilterChange = (filter: EmployeeFilter) => {
        setFilters(prev => {
            const newState = { ...prev };

            if (filter.type === 'all') {
                return { title: null, bu: null, category: null, employeeType: null, tenure: null };
            }

            // Map the discriminatory union "type" to specific state fields
            if (filter.type === 'title') newState.title = filter.value || null;
            if (filter.type === 'bu_org_3') newState.bu = filter.value || null;
            if (filter.type === 'staff') newState.category = 'staff';
            if (filter.type === 'idl') newState.category = 'idl';
            if (filter.type === 'type') newState.employeeType = filter.value || null;
            if (filter.type === 'tenure') newState.tenure = filter.value || null;

            return newState;
        });
    };

    const clearAllFilters = () => {
        setFilters({ title: null, bu: null, category: null, employeeType: null, tenure: null });
    };

    const handleManagerSelect = (id: string | number | null, name?: string) => {
        setSelectedManagerId(id);
        setSelectedManagerName(name || '');
        // Ideally we might want to keep filters when changing managers, 
        // but typically a hierarchy change might reset context. 
        // Keeping filters improves UX for drilling down with same criteria.
        // Let's NOT clear filters here unless requested.
        // clearAllFilters(); 
    };

    const clearManagerFilter = () => {
        setSelectedManagerId(null);
        setSelectedManagerName('');
    };

    const handleTitleSelect = (title: string | null) => {
        setFilters(prev => ({ ...prev, title }));
    };

    const handleBUSelect = (bu: string | null) => {
        setFilters(prev => ({ ...prev, bu }));
    };

    const clearIndividualFilter = (key: keyof FilterState) => {
        setFilters(prev => ({ ...prev, [key]: null }));
    };

    // Calculate hierarchical nodes - always returns an array
    const dashboardNodes = useMemo(() => {
        if (!nodes || nodes.length === 0) {
            return [];
        }
        if (!selectedManagerId) {
            return nodes;
        }
        const subordinates = getSubordinatesRecursive(nodes, selectedManagerId);
        return subordinates;
    }, [nodes, selectedManagerId]);

    // Calculate filtered nodes for charts (Applying ALL active filters)
    const filteredDashboardNodes = useMemo(() => {
        let current = dashboardNodes;

        // 1. Title Filter
        if (filters.title) {
            const keywords = filters.title.toLowerCase().split(" ");
            current = current.filter((node) => {
                const title = (node['Job Title'] || node.title || '').toLowerCase();
                return keywords.every((k: string) => title.includes(k));
            });
        }

        // 2. BU Filter
        if (filters.bu) {
            current = current.filter((node) => {
                const nodeBU = (node['BU Org 3'] || node.bu_org_3 || '').toLowerCase();
                return nodeBU === filters.bu?.toLowerCase();
            });
        }

        // 3. Category Filter (Staff/IDL quick buttons)
        if (filters.category) {
            const cat = filters.category.toLowerCase();
            current = current.filter((n) => (n['DL/IDL/Staff'] || '').toLowerCase().includes(cat));
        }

        // 4. Employee Type Filter (from Donut charts etc)
        if (filters.employeeType) {
            const typeValue = filters.employeeType.toLowerCase();
            current = current.filter((node) => {
                const dlIdlStaff = (node['DL/IDL/Staff'] || '').toLowerCase();
                if (typeValue === 'staff') return dlIdlStaff.includes('staff');
                if (typeValue === 'idl') return dlIdlStaff.includes('idl');
                if (typeValue === 'dl') return !dlIdlStaff.includes('staff') && !dlIdlStaff.includes('idl');
                return true;
            });
        }

        // 5. Tenure (if applied here, though mostly in table)
        if (filters.tenure) {
            // Add tenure logic if needed globally for charts
        }

        return current;
    }, [dashboardNodes, filters]);

    // Helper to calculate active filter count or check if specific filters are active
    const hasActiveFilters = Object.values(filters).some(v => v !== null);

    // Construct simplified activeFilter object for child components that expect the old interface
    // (This is a bit loose, as child components imply single filter, but we are just passing state down)
    const legacyActiveFilterState: EmployeeFilter = {
        type: filters.title ? 'title' : filters.bu ? 'bu_org_3' : filters.category === 'staff' ? 'staff' : filters.category === 'idl' ? 'idl' : 'all',
        value: filters.title || filters.bu || undefined,
        label: filters.title || filters.bu || undefined
    };

    return (
        <DashboardContainer className="px-4 sm:px-6 pt-4 min-h-screen">
            {/* Top Navigation Tab */}
            <div className="flex items-center gap-2 border-b border-gray-200">
                <span className="flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 border-mwk text-mwk -mb-px">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Workforce Overview
                    {!nodesLoading && (
                        <span className="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-mwk">
                            {filteredDashboardNodes.length.toLocaleString()} employees
                        </span>
                    )}
                </span>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Filters:</span>

                    {/* Title Filter */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <span className="text-[11px] font-semibold text-gray-500 w-16 sm:w-auto shrink-0">Title</span>
                        <div className="flex-1 sm:flex-none">
                            <TitleFilter
                                nodes={dashboardNodes}
                                onSelect={handleTitleSelect}
                                selectedTitle={filters.title}
                            />
                        </div>
                    </div>

                    {/* BU Filter */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <span className="text-[11px] font-semibold text-gray-500 w-16 sm:w-auto shrink-0">BU</span>
                        <div className="flex-1 sm:flex-none">
                            <BUFilter
                                nodes={dashboardNodes}
                                onSelect={handleBUSelect}
                                selectedBU={filters.bu}
                            />
                        </div>
                    </div>

                    {/* Manager Filter */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <span className="text-[11px] font-semibold text-gray-500 w-16 sm:w-auto shrink-0">Hierarchy</span>
                        <div className="flex-1 sm:flex-none min-w-0">
                            <ManagerFilter
                                nodes={nodes}
                                onSelect={handleManagerSelect}
                                selectedManagerId={selectedManagerId}
                            />
                        </div>
                    </div>
                </div>

            {/* Active Filters */}
            {(hasActiveFilters || selectedManagerId) && (
                <FilterBar
                    onClearAll={clearAllFilters}
                    activeFilters={
                        <>
                            {/* Manager Badge */}
                            {selectedManagerId && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-mwk rounded-lg text-xs font-semibold border border-red-200">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="max-w-[160px] truncate">{selectedManagerName}</span>
                                    <button onClick={clearManagerFilter} className="hover:text-red-900 p-0.5 cursor-pointer" aria-label="Clear manager filter">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Title Badge Using Filter State */}
                            {filters.title && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-mwk rounded-lg text-xs font-semibold border border-red-200">
                                    <span>Title: {filters.title}</span>
                                    <button onClick={() => clearIndividualFilter('title')} className="hover:text-red-900 p-0.5 cursor-pointer" aria-label="Clear title filter">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* BU Badge */}
                            {filters.bu && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-mwk rounded-lg text-xs font-semibold border border-red-200">
                                    <span>BU: {filters.bu}</span>
                                    <button onClick={() => clearIndividualFilter('bu')} className="hover:text-red-900 p-0.5 cursor-pointer" aria-label="Clear BU filter">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Other Category Badges */}
                            {filters.category && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-mwk rounded-lg text-xs font-semibold border border-red-200">
                                    <span className="uppercase">{filters.category}</span>
                                    <button onClick={() => clearIndividualFilter('category')} className="hover:text-red-900 p-0.5 cursor-pointer" aria-label="Clear category filter">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
                    }
                />
            )}
            </div>

            {/* ROW 1: KPI Stat Cards */}
            <section aria-label="Key Performance Indicators">
                <StatsCards
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-7 gap-4"
                    onFilterChange={handleFilterChange}
                    activeFilter={legacyActiveFilterState}
                    nodes={dashboardNodes}
                    loading={nodesLoading}
                    isFiltered={!!selectedManagerId || hasActiveFilters}
                />
            </section>

            {/* ROW 2: Tenure trend and Employee Type donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SeniorityChart
                    className="lg:col-span-2"
                    onFilterChange={handleFilterChange}
                    nodes={filteredDashboardNodes}
                    loading={nodesLoading}
                />
                <DonutChart
                    onFilterChange={handleFilterChange}
                    nodes={filteredDashboardNodes}
                    loading={nodesLoading}
                />
            </div>

            {/* ROW 3: Departments */}
            <BUOrg3Chart
                nodes={filteredDashboardNodes}
                loading={nodesLoading}
            />

            {/* ROW 4: Roster and Upcoming Resignations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                <TableCard
                    kicker="ROSTER"
                    title="Employee Roster"
                    badge={
                        (!selectedManagerId && !hasActiveFilters)
                            ? 'Server-side pagination'
                            : `${filteredDashboardNodes?.length || 0} total`
                    }
                    className="lg:col-span-2 min-h-[460px]"
                >
                    <div className="h-full min-h-[400px] overflow-x-auto">
                        <div className="h-full min-w-[560px]">
                            {!selectedManagerId && !hasActiveFilters ? (
                                <PaginatedEmployeeTable
                                    pageSize={10}
                                    className="h-full"
                                />
                            ) : (
                                <EmployeeTable
                                    filter={legacyActiveFilterState}
                                    nodes={filteredDashboardNodes}
                                    loading={nodesLoading}
                                    className="h-full"
                                />
                            )}
                        </div>
                    </div>
                </TableCard>

                <TableCard
                    kicker="DEPARTURES"
                    title="Upcoming Resignations"
                    className="min-h-[460px]"
                >
                    <div className="h-full min-h-[400px] overflow-hidden">
                        <UpcomingResignTable
                            nodes={filteredDashboardNodes}
                            loading={nodesLoading}
                            className="h-full"
                        />
                    </div>
                </TableCard>
            </div>
        </DashboardContainer>
    );
}
