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
    UserGroupIcon,
    PlusIcon,
    XMarkIcon
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
        return new Date().toISOString().split('T')[0];
    });
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('HISTORY'); // Default to History
    const [requestCode, setRequestCode] = useState('');
    const [search, setSearch] = useState('');
    const [searchInputValue, setSearchInputValue] = useState('');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalReqCode, setModalReqCode] = useState('');
    const [modalVisitors, setModalVisitors] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');

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

    // Modal Fetch Logic
    const fetchModalVisitors = async () => {
        if (!modalReqCode.trim()) return;
        setModalLoading(true);
        setModalError('');
        try {
            const res = await fetch(`/api/visitor_admin/checkinout?requestCode=${encodeURIComponent(modalReqCode.trim())}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                if (data.visitors && data.visitors.length > 0) {
                    setModalVisitors(data.visitors);
                } else {
                    setModalError('No visitors found for this Request ID.');
                    setModalVisitors([]);
                }
            } else {
                setModalError('Error fetching request data.');
            }
        } catch (err) {
            setModalError('An unexpected error occurred.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleModalSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchModalVisitors();
    };

    // Perform check-in or check-out action
    const handleAction = async (action: 'CHECK_IN' | 'CHECK_OUT' | 'RESET', item: any, isFromModal = false) => {
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
                if (isFromModal) {
                    await fetchModalVisitors();
                }
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
        setStatus('HISTORY');
        setRequestCode('');
        setSearch('');
        setSearchInputValue('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalReqCode('');
        setModalVisitors([]);
        setModalError('');
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

    const isFiltersActive = date !== new Date().toISOString().split('T')[0] || category !== '' || status !== 'HISTORY' || requestCode !== '' || search !== '';

    return (
        <div className="flex flex-col gap-6 text-[#0f172a]">
            {/* Header & New Check In Button */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">Check-in / Check-out Logs</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Manage and view the history of visitors entering and exiting the factory.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-[#db011c] hover:bg-[#b00116] text-white px-4 py-2.5 rounded-xl shadow-md shadow-red-500/20 transition-all font-bold text-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Check-in
                </button>
            </div>

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
                            <option value="HISTORY">Check-in History</option>
                            <option value="">All Statuses (Inc. Pending)</option>
                            <option value="PENDING">Pending Only</option>
                            <option value="CHECKED_IN">Checked In Only</option>
                            <option value="CHECKED_OUT">Checked Out Only</option>
                        </select>
                    </div>

                    {/* Request Code */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Request ID</label>
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
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Search Name</label>
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                placeholder="Name, company..."
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
                <div className="flex items-center gap-4 mt-2 lg:mt-0">
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
                        Found <span className="text-gray-900 font-bold">{pagination.total}</span> logs
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
                                <th className="px-3 py-2">Company</th>
                                <th className="px-3 py-2 text-center">Req Status</th>
                                <th className="px-3 py-2 text-center">Check-In Log</th>
                                <th className="px-3 py-2 text-center">Check-Out Log</th>
                                <th className="px-3 py-2 text-center">Status</th>
                                <th className="px-3 py-2 text-right w-[140px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-[12px] font-medium bg-white">
                            {loading ? (
                                // Table loading skeletons
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(8)].map((_, j) => (
                                            <td key={j} className="px-3 py-2"><div className="h-4 bg-gray-200 rounded"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : visitors.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <ClockIcon className="w-10 h-10 text-gray-300" />
                                            <p className="font-extrabold text-sm text-[#0f172a]">No logs found</p>
                                            <p className="text-[11px] max-w-sm">No visitor check-in/out history matches the specified criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                visitors.map((item) => {
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
                                                <div className="text-[10px] text-gray-400 font-semibold">{item.visitorCategory}</div>
                                            </td>

                                            {/* Company */}
                                            <td className="px-3 py-2">
                                                <div className="text-[11px] text-gray-700 font-semibold">{item.visitorCompany || '—'}</div>
                                            </td>

                                            {/* Request Status */}
                                            <td className="px-3 py-2 text-center">
                                                <span className={`inline-flex px-1.5 py-0.5 border text-[9px] font-black uppercase rounded ${getRequestStatusColor(item.requestStatus)}`}>
                                                    {item.requestStatus}
                                                </span>
                                            </td>

                                            {/* Check-In Time */}
                                            <td className="px-3 py-2 text-center font-semibold text-emerald-700">
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
                                                            title="Undo Check-in / Reset log"
                                                        >
                                                            <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
                                                        </button>
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

            {/* Check-In Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[800px] flex flex-col overflow-hidden max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-black text-gray-900">Check-In Visitor</h2>
                                <p className="text-xs text-gray-500 font-medium">Search for an approved Request ID to check-in people.</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Search Bar */}
                        <div className="p-6 pb-2 border-b border-gray-100 flex gap-3">
                            <form onSubmit={handleModalSearch} className="flex flex-1 items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Enter Request ID (e.g. 190524_02)"
                                    value={modalReqCode}
                                    onChange={(e) => setModalReqCode(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#db011c] focus:outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-400"
                                    autoFocus
                                />
                                <button 
                                    type="submit"
                                    disabled={modalLoading || !modalReqCode.trim()}
                                    className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl shadow-md transition-all font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                    {modalLoading ? 'Searching...' : 'Search'}
                                </button>
                            </form>
                        </div>

                        {/* Modal Body / Results */}
                        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 relative">
                            {modalError && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-semibold flex items-center gap-2 mb-4">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    {modalError}
                                </div>
                            )}

                            {modalVisitors.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">Visitors in Request #{modalVisitors[0].requestId}</h3>
                                            <p className="text-xs text-gray-500">Request Status: <span className={`font-bold ml-1 ${getRequestStatusColor(modalVisitors[0].requestStatus).split(' ')[1]}`}>{modalVisitors[0].requestStatus}</span></p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {modalVisitors.map((v) => {
                                            const isApproved = v.requestStatus === 'APPROVED' || v.requestStatus === 'COMPLETE';
                                            const actionKey = (act: string) => `${v.visitorCode}-${act}`;
                                            const isCheckingIn = actionLoading === actionKey('CHECK_IN');
                                            
                                            return (
                                                <div key={v.visitorCode} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-red-50 text-red-600 flex items-center justify-center rounded-full font-black text-xs shrink-0">
                                                            {v.visitorName?.charAt(0) || 'V'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm">{v.visitorName}</div>
                                                            <div className="text-xs text-gray-500 font-medium">{v.visitorCompany || v.visitorCategory}</div>
                                                            <div className="text-[10px] text-gray-400 mt-1 font-bold">Code: #{v.visitorCode}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right mr-2 hidden sm:block">
                                                            {getSecurityStatusBadge(v.checkInOutStatus)}
                                                        </div>
                                                        
                                                        {v.checkInOutStatus === 'PENDING' ? (
                                                            <button
                                                                disabled={!isApproved || actionLoading !== null}
                                                                onClick={() => handleAction('CHECK_IN', v, true)}
                                                                className={`
                                                                    flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all min-w-[110px]
                                                                    ${isApproved 
                                                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' 
                                                                        : 'bg-gray-300 text-gray-400 cursor-not-allowed'}
                                                                `}
                                                                title={!isApproved ? 'Requires APPROVED status' : 'Check In'}
                                                            >
                                                                <ArrowLeftOnRectangleIcon className="w-4 h-4 rotate-180" />
                                                                {isCheckingIn ? '...' : 'Check In'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                disabled={true}
                                                                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-gray-400 bg-gray-100 min-w-[110px] cursor-not-allowed"
                                                            >
                                                                <CheckCircleIcon className="w-4 h-4" />
                                                                Checked In
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {modalVisitors.length === 0 && !modalLoading && !modalError && (
                                <div className="text-center text-gray-400 py-12">
                                    <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-bold text-gray-600">Enter a Request ID</p>
                                    <p className="text-xs mt-1">To view visitors and check them in.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
