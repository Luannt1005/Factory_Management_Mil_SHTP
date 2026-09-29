import React, { useState, useEffect } from 'react';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';

export interface VisitorAdminFiltersProps {
    activeTab: 'general' | 'interviewee';
    code: string;
    onCodeChange: (val: string) => void;
    submitter: string;
    onSubmitterChange: (val: string) => void;
    startDate: string;
    onStartDateChange: (val: string) => void;
    completeStartDate: string;
    onCompleteStartDateChange: (val: string) => void;
    completeEndDate: string;
    onCompleteEndDateChange: (val: string) => void;
    sites: string[];
    onSitesChange: (val: string[]) => void;
    categories: string[];
    onCategoriesChange: (val: string[]) => void;
    statusFilters: string[];
    onStatusFiltersChange: (val: string[]) => void;
    onClearFilters: () => void;
    selectedRowIds: string[];
    onDeleteSelected: () => void;
    onExportExcel: () => void;
    exporting: boolean;
    currentCount: number;
    totalCount: number;
}

const CATEGORY_OPTIONS = [
    { label: 'Vendor', value: 'Vendor' },
    { label: 'Contractor', value: 'Contractor' },
    { label: 'MIL/TTI Expat / SHTP Business trip', value: 'MIL/TTI Expat / SHTP Business trip' }
];

const STATUS_OPTIONS = [
    { label: 'IN PROCESS', value: 'IN PROCESS' },
    { label: 'COMPLETE', value: 'COMPLETE' },
    { label: 'REJECTED', value: 'REJECTED' }
];

const SITE_OPTIONS = [
    { label: 'SHTP', value: 'SHTP' },
    { label: 'DDK', value: 'DDK' },
    { label: 'SHTP / DDK', value: 'SHTP/DDK' }
];

export default function VisitorAdminFilters({
    activeTab,
    code,
    onCodeChange,
    submitter,
    onSubmitterChange,
    startDate,
    onStartDateChange,
    completeStartDate,
    onCompleteStartDateChange,
    completeEndDate,
    onCompleteEndDateChange,
    sites,
    onSitesChange,
    categories,
    onCategoriesChange,
    statusFilters,
    onStatusFiltersChange,
    onClearFilters,
    selectedRowIds,
    onDeleteSelected,
    onExportExcel,
    exporting,
    currentCount,
    totalCount,
}: VisitorAdminFiltersProps) {
    const [localCode, setLocalCode] = useState(code);
    const [localSubmitter, setLocalSubmitter] = useState(submitter);

    useEffect(() => {
        setLocalCode(code);
    }, [code]);

    useEffect(() => {
        setLocalSubmitter(submitter);
    }, [submitter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localCode !== code) {
                onCodeChange(localCode);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localCode, code, onCodeChange]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSubmitter !== submitter) {
                onSubmitterChange(localSubmitter);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localSubmitter, submitter, onSubmitterChange]);

    const hasActiveFilters = Boolean(
        startDate ||
        completeStartDate ||
        completeEndDate ||
        sites.length > 0 ||
        categories.length > 0 ||
        localCode ||
        localSubmitter ||
        statusFilters.length > 0
    );

    return (
        <div className="relative z-30 bg-white/70 backdrop-blur-md p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex-1 min-w-[90px] max-w-[130px]">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Code</label>
                    <input 
                        type="text" 
                        value={localCode}
                        onChange={(e) => setLocalCode(e.target.value)}
                        placeholder="e.g. 2206"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm h-[38px] focus:outline-none focus:border-[#db011c] transition-all"
                    />
                </div>
                <div className="flex-1 min-w-[130px] max-w-[190px]">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Submitter</label>
                    <input 
                        type="text" 
                        value={localSubmitter}
                        onChange={(e) => setLocalSubmitter(e.target.value)}
                        placeholder="Name, dept..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm h-[38px] focus:outline-none focus:border-[#db011c] transition-all"
                    />
                </div>
                <div className="flex-1 min-w-[130px] max-w-[160px]">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">From</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-gray-300 rounded text-sm h-[38px] focus:outline-none focus:border-[#db011c] transition-all"
                    />
                </div>
                <div className="flex-[1.4] min-w-[240px] max-w-[280px]">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Complete Date</label>
                    <div className="flex items-center gap-1.5 h-[38px]">
                        <input 
                            type="date" 
                            value={completeStartDate}
                            onChange={(e) => onCompleteStartDateChange(e.target.value)}
                            title="Complete Date From"
                            className="w-full min-w-0 px-2 py-2 bg-white border border-gray-300 rounded text-sm h-full focus:outline-none focus:border-[#db011c] transition-all"
                        />
                        <span className="text-gray-400 text-xs">-</span>
                        <input 
                            type="date" 
                            value={completeEndDate}
                            onChange={(e) => onCompleteEndDateChange(e.target.value)}
                            title="Complete Date To"
                            className="w-full min-w-0 px-2 py-2 bg-white border border-gray-300 rounded text-sm h-full focus:outline-none focus:border-[#db011c] transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 min-w-[110px] max-w-[150px]">
                    <MultiSelectDropdown 
                        label="Site"
                        options={SITE_OPTIONS}
                        selected={sites}
                        onChange={onSitesChange}
                        placeholder="All Sites"
                        vertical={true}
                    />
                </div>
                {activeTab === 'general' && (
                    <div className="flex-1 min-w-[120px] max-w-[170px]">
                        <MultiSelectDropdown 
                            label="Category"
                            options={CATEGORY_OPTIONS}
                            selected={categories}
                            onChange={onCategoriesChange}
                            placeholder="All Categories"
                            vertical={true}
                        />
                    </div>
                )}
                <div className="flex-1 min-w-[110px] max-w-[150px]">
                    <MultiSelectDropdown 
                        label="Status"
                        options={STATUS_OPTIONS}
                        selected={statusFilters}
                        onChange={onStatusFiltersChange}
                        placeholder="All Status"
                        vertical={true}
                    />
                </div>
                <div className="flex items-center gap-2.5 h-[38px] shrink-0">
                    {hasActiveFilters && (
                        <button 
                            onClick={onClearFilters}
                            className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4 px-1"
                        >
                            Clear
                        </button>
                    )}
                    {selectedRowIds.length > 0 && (
                        <button
                            onClick={onDeleteSelected}
                            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-all whitespace-nowrap h-full shadow-sm flex items-center"
                        >
                            Delete Selected ({selectedRowIds.length})
                        </button>
                    )}
                    <button
                        onClick={onExportExcel}
                        disabled={exporting}
                        className="text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] px-3.5 py-2 rounded transition-all whitespace-nowrap h-full shadow-sm flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {exporting ? 'Exporting...' : 'Export Excel'}
                    </button>
                    <div className="text-xs font-medium text-gray-500 whitespace-nowrap pl-2 border-l border-gray-300 h-6 flex items-center">
                        Showing <span className="text-gray-900 font-bold mx-1">{currentCount}</span> of <span className="text-gray-900 font-bold mx-1">{totalCount}</span> requests
                    </div>
                </div>
            </div>
        </div>
    );
}
