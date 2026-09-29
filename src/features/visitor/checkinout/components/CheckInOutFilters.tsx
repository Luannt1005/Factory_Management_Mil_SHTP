'use client';

import React from 'react';
import MultiSelectDropdown, { MultiSelectOption } from '@/components/MultiSelectDropdown';
import type { CheckInOutFilterState, CheckInOutViewMode } from '@/types/checkinout.types';

export const STATUS_OPTIONS: MultiSelectOption[] = [
    { label: 'Expected Arrival (Chưa đến)', value: 'PENDING' },
    { label: 'Checked In (Đang có mặt)', value: 'CHECKED_IN' },
    { label: 'Checked Out (Đã rời đi)', value: 'CHECKED_OUT' }
];

export const CATEGORY_OPTIONS: MultiSelectOption[] = [
    { label: 'Vendor', value: 'Vendor' },
    { label: 'Contractor', value: 'Contractor' },
    { label: 'MIL / TTI EXPAT', value: 'MIL/TTI Expat / SHTP Business trip' },
    { label: 'Interviewee', value: 'Interviewee' }
];

export const SITE_OPTIONS: MultiSelectOption[] = [
    { label: 'SHTP', value: 'SHTP' },
    { label: 'DDK', value: 'DDK' },
    { label: 'SHTP / DDK', value: 'SHTP/DDK' }
];

export interface CheckInOutFiltersProps {
    filters: CheckInOutFilterState;
    onFiltersChange: (filters: CheckInOutFilterState) => void;
    onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    statusFilters: string[];
    onStatusFiltersChange: (statuses: string[]) => void;
    categories: string[];
    onCategoriesChange: (categories: string[]) => void;
    sites: string[];
    onSitesChange: (sites: string[]) => void;
    viewMode: CheckInOutViewMode;
    onViewModeChange: (viewMode: CheckInOutViewMode) => void;
    showingCount: number;
    totalCount: number;
    onClearAllFilters: () => void;
}

export default function CheckInOutFilters({
    filters,
    onFiltersChange,
    onSearchKeyDown,
    statusFilters,
    onStatusFiltersChange,
    categories,
    onCategoriesChange,
    sites,
    onSitesChange,
    viewMode,
    onViewModeChange,
    showingCount,
    totalCount,
    onClearAllFilters,
}: CheckInOutFiltersProps) {
    const todayStr = new Date().toISOString().split('T')[0];
    const hasActiveFilters = Boolean(
        filters.search ||
        filters.visitorName ||
        statusFilters.length > 0 ||
        categories.length > 0 ||
        sites.length > 0
    );

    return (
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 items-end">
                <div className="w-full">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Search Req</label>
                    <input
                        type="text"
                        placeholder="ID, Submitter, Name..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                        onKeyDown={onSearchKeyDown}
                    />
                </div>
                <div className="w-full">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Visitor Name</label>
                    <input
                        type="text"
                        placeholder="Name..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                        value={filters.visitorName}
                        onChange={(e) => onFiltersChange({ ...filters, visitorName: e.target.value })}
                    />
                </div>
                <div className="w-full">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                    <div className="flex w-full">
                        <input
                            type="date"
                            className="w-full min-w-0 px-2 py-2 bg-white border border-gray-300 rounded-l text-sm focus:outline-none focus:border-[#db011c]"
                            value={filters.date}
                            onChange={(e) => onFiltersChange({ ...filters, date: e.target.value })}
                        />
                        <button
                            onClick={() => onFiltersChange({ ...filters, date: todayStr })}
                            className={`px-2.5 text-xs font-bold uppercase rounded-r transition-colors border border-l-0 ${filters.date === todayStr ? 'bg-[#db011c] text-white border-[#db011c]' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'}`}
                        >
                            Today
                        </button>
                    </div>
                </div>
                <div className="w-full">
                    <MultiSelectDropdown
                        label="Status"
                        options={STATUS_OPTIONS}
                        selected={statusFilters}
                        onChange={onStatusFiltersChange}
                        placeholder="All Status"
                        vertical={true}
                    />
                </div>
                <div className="w-full">
                    <MultiSelectDropdown
                        label="Category"
                        options={CATEGORY_OPTIONS}
                        selected={categories}
                        onChange={onCategoriesChange}
                        placeholder="All Categories"
                        vertical={true}
                    />
                </div>
                <div className="w-full">
                    <MultiSelectDropdown
                        label="Site"
                        options={SITE_OPTIONS}
                        selected={sites}
                        onChange={onSitesChange}
                        placeholder="All Sites"
                        vertical={true}
                    />
                </div>

                {/* View Modes Toggle */}
                <div className="w-full">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">View</label>
                    <div className="flex w-full bg-gray-200 p-1 rounded justify-between h-[38px]">
                        <button
                            onClick={() => onViewModeChange('group')}
                            className={`flex-1 px-1 py-1 text-[10px] font-bold uppercase rounded transition-colors ${viewMode === 'group' ? 'bg-white shadow-sm text-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Group
                        </button>
                        <button
                            onClick={() => onViewModeChange('visitor')}
                            className={`flex-1 px-1 py-1 text-[10px] font-bold uppercase rounded transition-colors ${viewMode === 'visitor' ? 'bg-white shadow-sm text-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Visitor
                        </button>
                    </div>
                </div>
            </div>

            {/* Sub-bar: Showing Count & Clear All Filters */}
            <div className="flex items-center justify-between pt-2.5 mt-3 border-t border-gray-200/70 text-[11px] font-medium text-gray-500 flex-wrap gap-2">
                <div>
                    {viewMode === 'group' ? (
                        <>Showing <span className="text-gray-900 font-bold">{showingCount}</span> of <span className="text-gray-900 font-bold">{totalCount}</span> requests</>
                    ) : (
                        <>Showing <span className="text-gray-900 font-bold">{showingCount}</span> of <span className="text-gray-900 font-bold">{totalCount}</span> visitors</>
                    )}
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={onClearAllFilters}
                        className="text-xs font-bold text-[#db011c] hover:underline underline-offset-4 flex items-center gap-1"
                        title="Clear all filters"
                    >
                        <span>✕</span> Clear all filters
                    </button>
                )}
            </div>
        </div>
    );
}
