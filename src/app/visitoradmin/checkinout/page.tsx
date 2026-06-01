'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    CheckCircleIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    CalendarDaysIcon,
    UserIcon,
    BuildingOfficeIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowLeftOnRectangleIcon,
    ArrowRightOnRectangleIcon,
    ArrowPathRoundedSquareIcon,
    ShieldCheckIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

export default function CheckInOutManagement() {
    const router = useRouter();
    
    // Filters & States
    const [visitors, setVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0, checkedOut: 0, pending: 0 });
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 0 });
    
    // Filters values
    const [date, setDate] = useState<string>(() => {
        // Default to today
        return new Date().toISOString().split('T')[0];
    });
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [requestCode, setRequestCode] = useState('');
    const [search, setSearch] = useState('');
    const [searchInputValue, setSearchInputValue] = useState('');

    // Fetch visitors data
    const fetchVisitors = useCallback(async (page: number) => {
        setLoading(true);
        try {
            let url = `/api/visitor_admin/checkinout?page=${page}&limit=${pagination.limit}`;
            
            if (date) url += `&date=${date}`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (status) url += `&status=${status}`;
            if (requestCode) url += `&requestCode=${encodeURIComponent(requestCode)}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setVisitors(data.visitors);
                setPagination(data.pagination);
                if (data.todayStats) {
                    setStats(data.todayStats);
                }
            } else if (res.status === 401 || res.status === 403) {
                router.push('/login?redirect=' + window.location.pathname);
            }
        } catch (err) {
            console.error('Error fetching visitors:', err);
        } finally {
            setLoading(false);
        }
    }, [date, category, status, requestCode, search, pagination.limit, router]);

    // Load data when filters change
    useEffect(() => {
        fetchVisitors(1);
    }, [date, category, status, requestCode, search, fetchVisitors]);

    // Debounce or trigger search on enter/click
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInputValue);
    };

    // Perform check-in or check-out action
    const handleAction = async (action: 'CHECK_IN' | 'CHECK_OUT' | 'RESET', item: any) => {
        const key = `${item.visitorCode}-${action}`;
        setActionLoading(key);
        try {
            const res = await fetch('/api/visitor_admin/checkinout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    requestId: item.requestId,
                    visitorIndex: item.visitorIndex,
                    visitorName: item.visitorName,
                    visitorCode: item.visitorCode
                })
            });

            if (res.ok) {
                await fetchVisitors(pagination.page);
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.error || 'Failed to update visitor check-in status'}`);
            }
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred.');
        } finally {
            setActionLoading(null);
        }
    };

    // Reset all filters
    const handleClearFilters = () => {
        setDate(new Date().toISOString().split('T')[0]);
        setCategory('');
        setStatus('');
        setRequestCode('');
        setSearch('');
        setSearchInputValue('');
    };

    // Helper functions for formatters
    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getRequestStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETE':
            case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200';
            case 'IN PROCESS': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getSecurityStatusBadge = (status: string) => {
        switch (status) {
            case 'CHECKED_IN':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Checked In
                    </span>
                );
            case 'CHECKED_OUT':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Checked Out
                    </span>
                );
            case 'PENDING':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                        Pending
                    </span>
                );
        }
    };

    const isFiltersActive = date !== new Date().toISOString().split('T')[0] || category !== '' || status !== '' || requestCode !== '' || search !== '';

    return (
        <div className="flex flex-col gap-6 text-[#0f172a]">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Date input */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Visit Date</label>
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all w-[150px]"
                        />
                    </div>

                    {/* Category input */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Category</label>
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all h-9 min-w-[140px]"
                        >
                            <option value="">All Categories</option>
                            <option value="Vendor">Vendor</option>
                            <option value="Contractor">Contractor</option>
                            <option value="MIL/TTI Expat / SHTP Business trip">MIL/TTI Expat / SHTP</option>
                            <option value="Interviewee">Interviewee</option>
                        </select>
                    </div>

                    {/* Check In Status */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Log Status</label>
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all h-9 min-w-[140px]"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CHECKED_IN">Checked In</option>
                            <option value="CHECKED_OUT">Checked Out</option>
                        </select>
                    </div>

                    {/* Request Code */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Request Code</label>
                        <input 
                            type="text" 
                            placeholder="e.g. 300526_01"
                            value={requestCode}
                            onChange={(e) => setRequestCode(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all w-[130px]"
                        />
                    </div>

                    {/* Search Field */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 min-w-[240px]">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Search</label>
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                placeholder="Name, company, code..."
                                value={searchInputValue}
                                onChange={(e) => setSearchInputValue(e.target.value)}
                                className="text-sm border border-gray-300 rounded-lg pl-3 pr-10 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all w-full"
                            />
                            <button 
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <MagnifyingGlassIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Additional controls and reset */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => fetchVisitors(pagination.page)}
                        className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-all flex items-center gap-1 border border-gray-200"
                    >
                        <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    {isFiltersActive && (
                        <button 
                            onClick={handleClearFilters}
                            className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
                        >
                            Clear
                        </button>
                    )}
                    <div className="text-sm font-medium text-gray-500">
                        Found <span className="text-gray-900 font-bold">{pagination.total}</span> visitors
                    </div>
                </div>
            </div>

            {/* Visitors Table list */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-200 text-[#0f172a]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-3 py-2 w-[120px]">Visitor Code</th>
                                <th className="px-3 py-2">Visitor Name</th>
                                <th className="px-3 py-2">Title / Company</th>
                                <th className="px-3 py-2">Category</th>
                                <th className="px-3 py-2 text-center">Visit Duration</th>
                                <th className="px-3 py-2 text-center">Req Status</th>
                                <th className="px-3 py-2 text-center">Check-In Log</th>
                                <th className="px-3 py-2 text-center">Check-Out Log</th>
                                <th className="px-3 py-2 text-center">Security Status</th>
                                <th className="px-3 py-2 text-right w-[180px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-[12px] font-medium bg-white">
                            {loading ? (
                                // Table loading skeletons
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(10)].map((_, j) => (
                                            <td key={j} className="px-3 py-2"><div className="h-4 bg-gray-200 rounded"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : visitors.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-3 py-8 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <ExclamationTriangleIcon className="w-10 h-10 text-gray-300" />
                                            <p className="font-extrabold text-sm text-[#0f172a]">No visitors found</p>
                                            <p className="text-[11px] max-w-sm">No visitor requests match the specified search or filter criteria. Try clearing some filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                visitors.map((item) => {
                                    const isApproved = item.requestStatus === 'APPROVED' || item.requestStatus === 'COMPLETE';
                                    const actionKey = (act: string) => `${item.visitorCode}-${act}`;

                                    return (
                                        <tr key={item.visitorCode} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                            {/* Visitor Code */}
                                            <td className="px-3 py-2">
                                                <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    #{item.visitorCode}
                                                </span>
                                            </td>

                                            {/* Visitor Name */}
                                            <td className="px-3 py-2 font-bold text-gray-900">
                                                {item.visitorName}
                                            </td>

                                            {/* Title / Company */}
                                            <td className="px-3 py-2">
                                                <div className="font-extrabold text-gray-800">{item.visitorTitle || '—'}</div>
                                                <div className="text-[10px] text-gray-400 font-semibold">{item.visitorCompany}</div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-3 py-2 text-gray-500">
                                                {item.visitorCategory}
                                            </td>

                                            {/* Visit Duration */}
                                            <td className="px-3 py-2 text-center">
                                                <div className="font-bold text-gray-800">{formatDate(item.startDate)}</div>
                                                <div className="text-[10px] text-gray-400 font-semibold">to {formatDate(item.endDate)}</div>
                                            </td>

                                            {/* Request Status */}
                                            <td className="px-3 py-2 text-center">
                                                <span className={`inline-flex px-1.5 py-0.5 border text-[9px] font-black uppercase rounded ${getRequestStatusColor(item.requestStatus)}`}>
                                                    {item.requestStatus}
                                                </span>
                                            </td>

                                            {/* Check-In Time */}
                                            <td className="px-3 py-2 text-center font-semibold text-gray-600">
                                                {formatDateTime(item.checkInTime)}
                                            </td>

                                            {/* Check-Out Time */}
                                            <td className="px-3 py-2 text-center font-semibold text-gray-600">
                                                {formatDateTime(item.checkOutTime)}
                                            </td>

                                            {/* Security Status badge */}
                                            <td className="px-3 py-2 text-center">
                                                {getSecurityStatusBadge(item.checkInOutStatus)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3 py-2 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Check In Action */}
                                                    {item.checkInOutStatus === 'PENDING' && (
                                                        <button
                                                            disabled={!isApproved || actionLoading !== null}
                                                            onClick={() => handleAction('CHECK_IN', item)}
                                                            className={`
                                                                flex items-center justify-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-white transition-all
                                                                ${isApproved 
                                                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' 
                                                                    : 'bg-gray-300 text-gray-400 cursor-not-allowed'}
                                                            `}
                                                            title={!isApproved ? 'Requires APPROVED/COMPLETE status to check in' : 'Check in visitor'}
                                                        >
                                                            <ArrowLeftOnRectangleIcon className="w-3.5 h-3.5 rotate-180" />
                                                            {actionLoading === actionKey('CHECK_IN') ? '...' : 'Check In'}
                                                        </button>
                                                    )}

                                                    {/* Check Out Action */}
                                                    {item.checkInOutStatus === 'CHECKED_IN' && (
                                                        <button
                                                            disabled={actionLoading !== null}
                                                            onClick={() => handleAction('CHECK_OUT', item)}
                                                            className="flex items-center justify-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all shadow-sm"
                                                            title="Check out visitor"
                                                        >
                                                            <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                                                            {actionLoading === actionKey('CHECK_OUT') ? '...' : 'Check Out'}
                                                        </button>
                                                    )}

                                                    {/* Reset Action */}
                                                    {item.checkInOutStatus !== 'PENDING' && (
                                                        <button
                                                            disabled={actionLoading !== null}
                                                            onClick={() => handleAction('RESET', item)}
                                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                            title="Reset back to Pending"
                                                        >
                                                            <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    {/* If request is not approved and status is pending */}
                                                    {!isApproved && item.checkInOutStatus === 'PENDING' && (
                                                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1" title="Request must be Approved or Complete">
                                                            <ExclamationTriangleIcon className="w-3 h-3" /> Locked
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Row */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                        <button
                            disabled={pagination.page <= 1 || loading}
                            onClick={() => fetchVisitors(pagination.page - 1)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold bg-white disabled:opacity-50 hover:bg-gray-50 transition-all"
                        >
                            Previous
                        </button>
                        <span className="text-xs font-bold text-gray-500">
                            Page <span className="text-gray-900 font-extrabold">{pagination.page}</span> of <span className="text-gray-900 font-extrabold">{pagination.totalPages}</span>
                        </span>
                        <button
                            disabled={pagination.page >= pagination.totalPages || loading}
                            onClick={() => fetchVisitors(pagination.page + 1)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold bg-white disabled:opacity-50 hover:bg-gray-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
