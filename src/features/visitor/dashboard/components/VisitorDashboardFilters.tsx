'use client';

import React from 'react';

export interface VisitorDashboardFiltersProps {
    startDate: string;
    endDate: string;
    searchTerm: string;
    loadedCount: number;
    totalCount: number;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    onSearchTermChange: (value: string) => void;
    onSearch: () => void;
    onClear: () => void;
}

export function VisitorDashboardFilters({
    startDate,
    endDate,
    searchTerm,
    loadedCount,
    totalCount,
    onStartDateChange,
    onEndDateChange,
    onSearchTermChange,
    onSearch,
    onClear,
}: VisitorDashboardFiltersProps) {
    const hasActiveFilters = Boolean(startDate || endDate || searchTerm);

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">From</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">To</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                    />
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={onClear}
                        className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search code/Visitor/Company"
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onSearch();
                        }
                    }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                />
                <button
                    onClick={onSearch}
                    className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
                >
                    Search
                </button>
            </div>

            <div className="text-sm font-medium text-gray-500 w-full text-right mt-2 md:mt-0 md:w-auto">
                Showing <span className="text-gray-900 font-bold">{loadedCount}</span> of{' '}
                <span className="text-gray-900 font-bold">{totalCount}</span> requests
            </div>
        </div>
    );
}
