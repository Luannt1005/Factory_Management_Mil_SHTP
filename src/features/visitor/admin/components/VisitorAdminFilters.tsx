import React, { useState, useEffect } from 'react';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import DateRangeFilter, { PAST_DATE_PRESETS, type DateRangeValue } from '@/components/ui/DateRangeFilter';

export interface VisitorAdminFiltersProps {
    activeTab: 'general' | 'interviewee';
    code: string;
    onCodeChange: (val: string) => void;
    submitter: string;
    onSubmitterChange: (val: string) => void;
    /** Visit date range (preset or custom From - To) */
    visitDates: DateRangeValue;
    onVisitDatesChange: (val: DateRangeValue) => void;
    /** Approval / completion date range (preset or custom From - To) */
    completeDates: DateRangeValue;
    onCompleteDatesChange: (val: DateRangeValue) => void;
    /** Submit (request creation) date range */
    submitDates: DateRangeValue;
    onSubmitDatesChange: (val: DateRangeValue) => void;
    sites: string[];
    onSitesChange: (val: string[]) => void;
    categories: string[];
    onCategoriesChange: (val: string[]) => void;
    statusFilters: string[];
    onStatusFiltersChange: (val: string[]) => void;
    onClearFilters: () => void;
    selectedRowIds: string[];
    onDeleteSelected: () => void;
    /** Only Visitor admins may delete requests */
    canDelete: boolean;
    onPrintCards: () => void;
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
    visitDates,
    onVisitDatesChange,
    completeDates,
    onCompleteDatesChange,
    submitDates,
    onSubmitDatesChange,
    sites,
    onSitesChange,
    categories,
    onCategoriesChange,
    statusFilters,
    onStatusFiltersChange,
    onClearFilters,
    selectedRowIds,
    onDeleteSelected,
    canDelete,
    onPrintCards,
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
        visitDates.from ||
        visitDates.to ||
        completeDates.from ||
        completeDates.to ||
        submitDates.from ||
        submitDates.to ||
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
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm h-[38px] focus:outline-none focus:border-mwk transition-all"
                    />
                </div>
                <div className="flex-1 min-w-[130px] max-w-[190px]">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Submitter</label>
                    <input 
                        type="text" 
                        value={localSubmitter}
                        onChange={(e) => setLocalSubmitter(e.target.value)}
                        placeholder="Name, dept..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm h-[38px] focus:outline-none focus:border-mwk transition-all"
                    />
                </div>
                <div className="flex-1 min-w-[150px] max-w-[190px]">
                    <DateRangeFilter label="Submit Date" value={submitDates} onChange={onSubmitDatesChange} presets={PAST_DATE_PRESETS} />
                </div>
                <div className="flex-1 min-w-[150px] max-w-[190px]">
                    <DateRangeFilter label="From" value={visitDates} onChange={onVisitDatesChange} />
                </div>
                <div className="flex-1 min-w-[150px] max-w-[190px]">
                    <DateRangeFilter label="Complete Date" value={completeDates} onChange={onCompleteDatesChange} presets={PAST_DATE_PRESETS} />
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
                            onClick={onPrintCards}
                            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-all whitespace-nowrap h-full shadow-sm flex items-center"
                            title="Open the ticked requests in the Visitor Card Studio"
                        >
                            Print Cards ({selectedRowIds.length})
                        </button>
                    )}
                    {canDelete && selectedRowIds.length > 0 && (
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
