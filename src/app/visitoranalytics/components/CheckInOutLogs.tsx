'use client';

import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';

interface LogEntry {
    id: string;
    requestId: string;
    requestCode: string;
    visitorIndex: number;
    visitorCode: string;
    visitorName: string;
    action: 'CHECK_IN' | 'CHECK_OUT' | 'INPUT_CARD' | 'REVERSE' | string;
    cardNumber: string | null;
    performedBy: string;
    performedByName: string | null;
    details: any;
    createdAt: string;
}

interface OperatorItem {
    username: string;
    name: string;
    count: number;
}

export default function CheckInOutLogs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [operators, setOperators] = useState<OperatorItem[]>([]);

    // Filters
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [operatorFilter, setOperatorFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [quickDatePreset, setQuickDatePreset] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [quickTimePreset, setQuickTimePreset] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Auto-refresh state
    const [autoRefresh, setAutoRefresh] = useState(true);

    const handleDatePreset = (preset: 'all' | 'today' | 'week' | 'month') => {
        setQuickDatePreset(preset);
        setPage(1);
        const now = new Date();
        if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (preset === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === 'week') {
            const first = now.getDate() - now.getDay() + 1;
            const start = new Date(now.setDate(first));
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(new Date().toISOString().split('T')[0]);
        } else if (preset === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(new Date().toISOString().split('T')[0]);
        }
    };

    const handleTimePreset = (preset: 'all' | 'morning' | 'afternoon' | 'night') => {
        setQuickTimePreset(preset);
        setPage(1);
        if (preset === 'all') {
            setStartTime('');
            setEndTime('');
        } else if (preset === 'morning') {
            setStartTime('06:00');
            setEndTime('12:00');
        } else if (preset === 'afternoon') {
            setStartTime('12:00');
            setEndTime('18:00');
        } else if (preset === 'night') {
            setStartTime('18:00');
            setEndTime('23:59');
        }
    };

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.append('search', search.trim());
            if (actionFilter !== 'ALL') params.append('action', actionFilter);
            if (operatorFilter !== 'ALL') params.append('performedBy', operatorFilter);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (startTime) params.append('startTime', startTime);
            if (endTime) params.append('endTime', endTime);
            params.append('page', page.toString());
            params.append('limit', limit.toString());

            const res = await fetch(`/api/visitor_admin/checkinout_logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setOperators(data.operators || []);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages || 1);
                    setTotalCount(data.pagination.total || 0);
                }
            }
        } catch (err) {
            console.error('Failed to fetch checkinout logs:', err);
        } finally {
            setLoading(false);
        }
    }, [search, actionFilter, operatorFilter, startDate, endDate, startTime, endTime, page, limit]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CHECK_IN':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        CHECK IN
                    </span>
                );
            case 'CHECK_OUT':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-gray-100 text-gray-800 border border-gray-300 shadow-xs">
                        <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        CHECK OUT
                    </span>
                );
            case 'INPUT_CARD':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        INPUT CARD
                    </span>
                );
            case 'REVERSE':
            case 'RESET':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
                        <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        REVERSE
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">
                        {action}
                    </span>
                );
        }
    };

    const handleExportExcel = () => {
        if (!logs || logs.length === 0) {
            alert('No data available to export.');
            return;
        }

        const dataToExport = logs.map((log, idx) => ({
            'No.': idx + 1,
            'Timestamp': formatDateTime(log.createdAt),
            'Operator SSO': log.performedBy || '-',
            'Operator Name': log.performedByName || '-',
            'Action': log.action,
            'Card Number': (log.cardNumber || '-').toString().replace(/^#/, ''),
            'Visitor Name': log.visitorName || '-',
            'Visitor Code': (log.visitorCode || '-').toString().replace(/^#/, ''),
            'Request Code': (log.requestCode || log.requestId || '-').toString().replace(/^#/, '')
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'CheckInOut_Action_Logs');
        XLSX.writeFile(wb, `CheckInOut_Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const resetAllFilters = () => {
        setSearch('');
        setActionFilter('ALL');
        setOperatorFilter('ALL');
        setStartDate('');
        setEndDate('');
        setStartTime('');
        setEndTime('');
        setQuickDatePreset('all');
        setQuickTimePreset('all');
        setPage(1);
    };

    const hasActiveFilters = Boolean(
        search || actionFilter !== 'ALL' || operatorFilter !== 'ALL' || 
        startDate || endDate || startTime || endTime
    );

    return (
        <div className="w-full flex flex-col gap-4">
            {/* FILTER TOOLBAR CONTAINER */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
                <div className="flex flex-col gap-3.5">
                    {/* ROW 1: Search, Action, Operator */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-3 items-end">
                        {/* Search */}
                        <div className="lg:col-span-4">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Search Logs
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Visitor name, code, card, SSO account..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full pl-8 pr-3 py-2 bg-gray-50/50 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:border-[#db011c] focus:bg-white transition-colors"
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Action Filter */}
                        <div className="lg:col-span-3">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Action Type
                            </label>
                            <select
                                value={actionFilter}
                                onChange={(e) => {
                                    setActionFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#db011c] focus:bg-white transition-colors"
                            >
                                <option value="ALL">All Actions</option>
                                <option value="CHECK_IN">Check In (CHECK_IN)</option>
                                <option value="CHECK_OUT">Check Out (CHECK_OUT)</option>
                                <option value="INPUT_CARD">Input Card (INPUT_CARD)</option>
                                <option value="REVERSE">Reverse (REVERSE)</option>
                            </select>
                        </div>

                        {/* SSO Operator Filter */}
                        <div className="lg:col-span-5">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Operator (SSO Account)
                            </label>
                            <select
                                value={operatorFilter}
                                onChange={(e) => {
                                    setOperatorFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#db011c] focus:bg-white transition-colors truncate"
                            >
                                <option value="ALL">All SSO Operators ({operators.length})</option>
                                {operators.map((op) => (
                                    <option key={op.username} value={op.username}>
                                        {op.name ? `${op.name} (${op.username})` : op.username} — {op.count} actions
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ROW 2: Date Filters & Hourly Time Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end pt-2 border-t border-gray-100">
                        {/* Quick Date Presets */}
                        <div className="lg:col-span-4 flex flex-col">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Date Filter Preset
                            </label>
                            <div className="flex bg-gray-100 p-1 rounded-lg gap-1 h-[38px] items-center">
                                <button
                                    onClick={() => handleDatePreset('all')}
                                    className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${quickDatePreset === 'all' && !startDate && !endDate ? 'bg-white shadow-xs text-[#db011c]' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    All Time
                                </button>
                                <button
                                    onClick={() => handleDatePreset('today')}
                                    className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${quickDatePreset === 'today' ? 'bg-white shadow-xs text-[#db011c]' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => handleDatePreset('week')}
                                    className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${quickDatePreset === 'week' ? 'bg-white shadow-xs text-[#db011c]' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Week
                                </button>
                                <button
                                    onClick={() => handleDatePreset('month')}
                                    className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${quickDatePreset === 'month' ? 'bg-white shadow-xs text-[#db011c]' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Month
                                </button>
                            </div>
                        </div>

                        {/* Custom Date Pickers */}
                        <div className="lg:col-span-4 flex flex-col">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Custom Date Range
                            </label>
                            <div className="flex items-center gap-1.5 h-[38px]">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setQuickDatePreset('all');
                                        setPage(1);
                                    }}
                                    className="flex-1 px-2.5 py-1.5 bg-gray-50/50 border border-gray-300 rounded-lg text-xs text-gray-700 font-medium focus:outline-none focus:border-[#db011c]"
                                />
                                <span className="text-gray-400 text-xs font-bold">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setQuickDatePreset('all');
                                        setPage(1);
                                    }}
                                    className="flex-1 px-2.5 py-1.5 bg-gray-50/50 border border-gray-300 rounded-lg text-xs text-gray-700 font-medium focus:outline-none focus:border-[#db011c]"
                                />
                            </div>
                        </div>

                        {/* Hourly Time Filter (Time Range HH:mm) */}
                        <div className="lg:col-span-4 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    Time Filter (Lọc theo giờ)
                                </label>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleTimePreset('morning')}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${quickTimePreset === 'morning' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}
                                        title="06:00 - 12:00"
                                    >
                                        Morning
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTimePreset('afternoon')}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${quickTimePreset === 'afternoon' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}
                                        title="12:00 - 18:00"
                                    >
                                        Afternoon
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTimePreset('night')}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${quickTimePreset === 'night' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}
                                        title="18:00 - 23:59"
                                    >
                                        Night
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 h-[38px]">
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => {
                                        setStartTime(e.target.value);
                                        setQuickTimePreset('all');
                                        setPage(1);
                                    }}
                                    className="flex-1 px-2 py-1.5 bg-gray-50/50 border border-gray-300 rounded-lg text-xs text-gray-700 font-medium focus:outline-none focus:border-[#db011c]"
                                    title="Start Hour (Giờ bắt đầu)"
                                />
                                <span className="text-gray-400 text-xs font-bold">to</span>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => {
                                        setEndTime(e.target.value);
                                        setQuickTimePreset('all');
                                        setPage(1);
                                    }}
                                    className="flex-1 px-2 py-1.5 bg-gray-50/50 border border-gray-300 rounded-lg text-xs text-gray-700 font-medium focus:outline-none focus:border-[#db011c]"
                                    title="End Hour (Giờ kết thúc)"
                                />
                                {(startTime || endTime) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStartTime('');
                                            setEndTime('');
                                            setQuickTimePreset('all');
                                            setPage(1);
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                                        title="Clear time filter"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ROW 3: Action Buttons & Filter Summary */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={resetAllFilters}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#db011c] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Reset All Filters
                                </button>
                            )}
                            <span className="text-xs text-gray-500 font-medium">
                                Total <span className="font-bold text-gray-900">{totalCount}</span> log entries found
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Auto-refresh toggle */}
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                title={autoRefresh ? 'Auto-refresh is ON (30s)' : 'Auto-refresh is PAUSED'}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${autoRefresh ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                Live Sync
                            </button>

                            {/* Refresh Button */}
                            <button
                                onClick={fetchLogs}
                                disabled={loading}
                                className="p-1.5 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Refresh Logs"
                            >
                                <svg className={`w-4 h-4 ${loading ? 'animate-spin text-[#db011c]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>

                            {/* Export Excel Button */}
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export Excel
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AUDIT LOGS TABLE */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-[#1a1a1a] text-white font-bold text-[10px] uppercase tracking-wider border-b border-gray-200">
                                <th className="py-3.5 px-4 w-[165px]">TIMESTAMP</th>
                                <th className="py-3.5 px-4 w-[240px]">OPERATOR (SSO ACCOUNT)</th>
                                <th className="py-3.5 px-4 w-[140px] text-center">ACTION</th>
                                <th className="py-3.5 px-4 w-[120px] text-center">CARD NO.</th>
                                <th className="py-3.5 px-4 min-w-[200px]">VISITOR INFO</th>
                                <th className="py-3.5 px-4 w-[140px]">REQUEST CODE</th>
                                <th className="py-3.5 px-4 min-w-[160px]">DETAILS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db011c]"></div>
                                            <span className="text-xs font-semibold">Loading action logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-sm font-bold text-gray-700">No action logs found</span>
                                            <span className="text-xs text-gray-400">Try adjusting your filters or search criteria.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <tr 
                                        key={log.id || idx} 
                                        className={`hover:bg-red-50/20 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}
                                    >
                                        {/* Timestamp */}
                                        <td className="py-3.5 px-4 font-semibold text-gray-800 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{formatDateTime(log.createdAt)}</span>
                                            </div>
                                        </td>

                                        {/* SSO Operator */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-start gap-2">
                                                <div className="w-7 h-7 rounded-full bg-red-100 text-[#db011c] font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
                                                    {(log.performedByName || log.performedBy || 'U').charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-gray-900 text-xs truncate" title={log.performedByName || log.performedBy}>
                                                        {log.performedByName || log.performedBy}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-mono truncate" title={log.performedBy}>
                                                        {log.performedBy}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Action Badge */}
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>

                                        {/* Card Number */}
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            {log.cardNumber ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-gray-100 text-gray-800 border border-gray-300">
                                                    {log.cardNumber.replace(/^#/, '')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-medium">-</span>
                                            )}
                                        </td>

                                        {/* Visitor Info */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-gray-900 truncate" title={log.visitorName || '-'}>
                                                    {log.visitorName || '-'}
                                                </span>
                                                {log.visitorCode && (
                                                    <span className="text-[10px] font-mono text-[#db011c] font-bold truncate">
                                                        {log.visitorCode.replace(/^#/, '')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Request Code */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className="font-mono text-xs font-semibold text-gray-700">
                                                {(log.requestCode || log.requestId || '-').replace(/^#/, '')}
                                            </span>
                                        </td>

                                        {/* Details */}
                                        <td className="py-3.5 px-4">
                                            <div className="text-[11px] text-gray-600 max-w-[280px] truncate" title={typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '-')}>
                                                {log.action === 'INPUT_CARD' && log.cardNumber ? (
                                                    <span className="text-blue-600 font-medium">Assigned card: #{log.cardNumber}</span>
                                                ) : log.action === 'CHECK_IN' ? (
                                                    <span className="text-emerald-600 font-medium">Visitor entered facility</span>
                                                ) : log.action === 'CHECK_OUT' ? (
                                                    <span className="text-gray-600 font-medium">Visitor exited facility</span>
                                                ) : log.action === 'REVERSE' ? (
                                                    <span className="text-rose-600 font-medium">Reverted check-in status</span>
                                                ) : (
                                                    <span>{typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '-')}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION BAR */}
                {totalCount > 0 && (
                    <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-gray-50 border-t border-gray-200 gap-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <span>Showing</span>
                            <span className="font-bold text-gray-900">{(page - 1) * limit + 1}</span>
                            <span>-</span>
                            <span className="font-bold text-gray-900">{Math.min(page * limit, totalCount)}</span>
                            <span>of</span>
                            <span className="font-bold text-gray-900">{totalCount}</span>
                            <span>action logs</span>

                            <div className="ml-4 flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Rows:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(parseInt(e.target.value, 10));
                                        setPage(1);
                                    }}
                                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold focus:outline-none focus:border-[#db011c]"
                                >
                                    <option value={15}>15</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                disabled={page === 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-xs"
                            >
                                Prev
                            </button>

                            <div className="flex items-center gap-1 mx-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2))
                                    .map((p, idx, arr) => {
                                        const prev = arr[idx - 1];
                                        return (
                                            <div key={p} className="flex items-center gap-1">
                                                {prev && p - prev > 1 && <span className="px-1 text-gray-400 font-bold">...</span>}
                                                <button
                                                    onClick={() => setPage(p)}
                                                    className={`w-7 h-7 text-xs font-black rounded-md transition-all flex items-center justify-center ${
                                                        page === p
                                                            ? 'bg-[#db011c] text-white shadow-sm'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>

                            <button
                                disabled={page === totalPages || loading}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-xs"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
