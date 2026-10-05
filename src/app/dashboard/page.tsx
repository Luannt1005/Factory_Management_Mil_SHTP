'use client';

import React, { useState, useMemo } from 'react';
import EmployeeTable from './components/Emp_table';
import PaginatedEmployeeTable from './components/PaginatedEmpTable';
import StatsCards from './components/Multi_card';
import SeniorityChart from './components/Column_chart_seniority';
import DonutChart from './components/Donutchart_byType';
import BUOrg3Chart from './components/bar_chart_BU_Org_3';
import UpcomingResignTable from './components/upcoming_resign_table';
import ManagerFilter from './components/ManagerFilter';
import TitleFilter from './components/TitleFilter';
import BUFilter from './components/BUFilter';
import { useSheetData, getSubordinatesRecursive } from '@/hooks/useSheetData';
import { DashboardContainer, PageHeader, FilterBar, TableCard } from '@/components/dashboard';


export interface EmployeeFilter {
    // Retain compatibility for single-value updates, but state will hold all
    type: 'all' | 'staff' | 'idl' | 'title' | 'tenure' | 'type' | 'bu_org_3';
    value?: string;
    label?: string;
}

// New state interface for multiple active filters
interface FilterState {
    title: string | null;
    bu: string | null;
    category: 'staff' | 'idl' | null;     // mapped from 'staff' | 'idl' types
    employeeType: string | null;          // mapped from 'type' (DL/IDL/Staff custom filter)
    tenure: string | null;
}

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
            current = current.filter((node: any) => {
                const title = (node['Job Title'] || node.title || '').toLowerCase();
                return keywords.every((k: string) => title.includes(k));
            });
        }

        // 2. BU Filter
        if (filters.bu) {
            current = current.filter((node: any) => {
                const nodeBU = (node['BU Org 3'] || node.bu_org_3 || '').toLowerCase();
                return nodeBU === filters.bu?.toLowerCase();
            });
        }

        // 3. Category Filter (Staff/IDL quick buttons)
        if (filters.category) {
            const cat = filters.category.toLowerCase();
            current = current.filter((n: any) => (n['DL/IDL/Staff'] || '').toLowerCase().includes(cat));
        }

        // 4. Employee Type Filter (from Donut charts etc)
        if (filters.employeeType) {
            const typeValue = filters.employeeType.toLowerCase();
            current = current.filter((node: any) => {
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
        <DashboardContainer>
            {/* ===== DASHBOARD HEADER ===== */}
            <PageHeader
                kicker="ORGANIZATION & WORKFORCE"
                title="OrgChart Dashboard"
                description="Real-time headcount, seniority distribution, and departmental analytics"
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Title Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Title:</span>
                            <TitleFilter
                                nodes={dashboardNodes}
                                onSelect={handleTitleSelect}
                                selectedTitle={filters.title}
                            />
                        </div>

                        {/* BU Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">BU:</span>
                            <BUFilter
                                nodes={dashboardNodes}
                                onSelect={handleBUSelect}
                                selectedBU={filters.bu}
                            />
                        </div>

                        {/* Manager Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Hierarchy:</span>
                            <ManagerFilter
                                nodes={nodes}
                                onSelect={handleManagerSelect}
                                selectedManagerId={selectedManagerId}
                            />
                        </div>
                    </div>
                }
            />

            {/* Active Filters */}
            {(hasActiveFilters || selectedManagerId) && (
                <FilterBar
                    onClearAll={clearAllFilters}
                    activeFilters={
                        <>
                            {/* Manager Badge */}
                            {selectedManagerId && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="max-w-[120px] truncate">{selectedManagerName}</span>
                                    <button onClick={clearManagerFilter} className="hover:text-purple-900 p-0.5 cursor-pointer" aria-label="Clear manager filter">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Title Badge Using Filter State */}
                            {filters.title && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                                    <span>Title: {filters.title}</span>
                                    <button onClick={() => clearIndividualFilter('title')} className="hover:text-blue-900 p-0.5 cursor-pointer" aria-label="Clear title filter">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* BU Badge */}
                            {filters.bu && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">
                                    <span>BU: {filters.bu}</span>
                                    <button onClick={() => clearIndividualFilter('bu')} className="hover:text-emerald-900 p-0.5 cursor-pointer" aria-label="Clear BU filter">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Other Category Badges */}
                            {filters.category && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium border border-orange-200">
                                    <span className="uppercase">{filters.category}</span>
                                    <button onClick={() => clearIndividualFilter('category')} className="hover:text-orange-900 p-0.5 cursor-pointer" aria-label="Clear category filter">
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

            {/* ===== ROW 1: KPI STATS CARDS ===== */}
            <section aria-label="Key Performance Indicators">
                <StatsCards
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-3"
                    onFilterChange={handleFilterChange}
                    activeFilter={legacyActiveFilterState}
                    nodes={dashboardNodes}
                    loading={nodesLoading}
                    isFiltered={!!selectedManagerId || hasActiveFilters}
                />
            </section>

            {/* ===== MAIN CONTENT GRID: Left (Charts) & Right (Tables) ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ===== LEFT COLUMN: Charts (7 cols) ===== */}
                <div className="lg:col-span-7 flex flex-col gap-6">

                    {/* Donut + Seniority */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[300px]">
                        <DonutChart
                            onFilterChange={handleFilterChange}
                            nodes={filteredDashboardNodes}
                            loading={nodesLoading}
                        />
                        <SeniorityChart
                            onFilterChange={handleFilterChange}
                            nodes={filteredDashboardNodes}
                            loading={nodesLoading}
                        />
                    </div>

                    {/* BU Org Chart */}
                    <div className="min-h-[320px]">
                        <BUOrg3Chart
                            nodes={filteredDashboardNodes}
                            loading={nodesLoading}
                        />
                    </div>
                </div>

                {/* ===== RIGHT COLUMN: Tables (5 cols) ===== */}
                <div className="lg:col-span-5 flex flex-col gap-6">

                    {/* Employee Table */}
                    <TableCard
                        kicker="ROSTER"
                        title="Employee Roster"
                        badge={
                            (!selectedManagerId && !hasActiveFilters)
                                ? 'Server-side pagination'
                                : `${filteredDashboardNodes?.length || 0} total`
                        }
                        className="min-h-[460px]"
                    >
                        <div className="flex-1 min-h-[380px] overflow-hidden">
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
                    </TableCard>

                    {/* Upcoming Resignations */}
                    <TableCard
                        kicker="DEPARTURES"
                        title="Upcoming Resignations"
                        className="min-h-[280px]"
                    >
                        <div className="flex-1 min-h-[220px] overflow-hidden">
                            <UpcomingResignTable
                                nodes={filteredDashboardNodes}
                                loading={nodesLoading}
                                className="h-full"
                            />
                        </div>
                    </TableCard>
                </div>
            </div>
        </DashboardContainer>
    );
}
