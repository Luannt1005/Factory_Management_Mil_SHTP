import React from 'react';
import type { VisitorAnalyticsPeriodFilter } from '@/types/visitor-analytics.types';

interface VisitorAnalyticsFiltersProps {
    periodFilter: VisitorAnalyticsPeriodFilter;
    onPeriodChange: (val: VisitorAnalyticsPeriodFilter) => void;
    buFilter: string;
    onBuChange: (val: string) => void;
    statusFilter: string;
    onStatusChange: (val: string) => void;
    categoryFilter: string;
    onCategoryChange: (val: string) => void;
}

export default function VisitorAnalyticsFilters({
    periodFilter,
    onPeriodChange,
    buFilter,
    onBuChange,
    statusFilter,
    onStatusChange,
    categoryFilter,
    onCategoryChange,
}: VisitorAnalyticsFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Filters:</span>
            
            <select 
                value={periodFilter}
                onChange={(e) => onPeriodChange(e.target.value as VisitorAnalyticsPeriodFilter)}
                className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#db011c] text-gray-700 bg-white shadow-sm"
            >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
            </select>

            <select 
                value={buFilter}
                onChange={(e) => onBuChange(e.target.value)}
                className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#db011c] text-gray-700 bg-white shadow-sm"
            >
                <option value="all">All BUs</option>
                <option value="MIL">Milwaukee (MIL)</option>
                <option value="SF">Share Function</option>
            </select>

            <select 
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#db011c] text-gray-700 bg-white shadow-sm"
            >
                <option value="all">All Status</option>
                <option value="IN PROCESS">In Process</option>
                <option value="COMPLETE">Complete</option>
                <option value="REJECTED">Rejected</option>
            </select>

            <select 
                value={categoryFilter}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#db011c] text-gray-700 bg-white shadow-sm"
            >
                <option value="all">All Categories</option>
                <option value="MIL/TTI Expat / SHTP Business trip">MIL / TTI EXPAT</option>
                <option value="Vendor">Vendor</option>
                <option value="Contractor">Contractor</option>
                <option value="Interviewee">Interviewee</option>
            </select>
        </div>
    );
}
