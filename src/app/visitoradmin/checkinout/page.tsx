'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type ViewMode = 'group' | 'visitor' | 'collapsible';
type StatusFilter = 'ALL' | 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT';

export default function CheckInOutManagement() {
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters and View State
    const [filters, setFilters] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        category: '', 
        search: '' 
    });
    const [viewMode, setViewMode] = useState<ViewMode>('collapsible');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    
    const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [cardNumbers, setCardNumbers] = useState<Record<string, string>>({});

    const handleCardNumberChange = (requestId: string, visitorIndex: number, value: string) => {
        setCardNumbers(prev => ({ ...prev, [`${requestId}-${visitorIndex}`]: value }));
    };

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.date) query.append('date', filters.date);
            if (filters.category) query.append('category', filters.category);
            if (filters.search) query.append('search', filters.search);
            query.append('limit', '200'); // Fetch more for flattened view

            const res = await fetch(`/api/visitor_admin/checkinout/history?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.requests || []);
            } else if (res.status === 401 || res.status === 403) {
                router.push('/login?redirect=' + window.location.pathname);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, router]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleAction = async (requestId: string, v: any, action: 'CHECK_IN' | 'CHECK_OUT' | 'RESET') => {
        setActionLoading(`${requestId}-${v.visitorIndex}`);
        try {
            const cardNumber = cardNumbers[`${requestId}-${v.visitorIndex}`] || v.cardNumber || '';
            const res = await fetch('/api/visitor_admin/checkinout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action, 
                    requestId, 
                    visitorIndex: v.visitorIndex,
                    visitorName: v.visitorName,
                    visitorCode: v.visitorCode,
                    cardNumber
                })
            });
            if (res.ok) {
                // Refresh list locally
                const updatedStatus = action === 'CHECK_IN' ? 'CHECKED_IN' : action === 'CHECK_OUT' ? 'CHECKED_OUT' : 'PENDING';
                setHistory(prev => prev.map(req => {
                    if (req.requestId === requestId) {
                        return {
                            ...req,
                            visitors: req.visitors?.map((visitor: any) => {
                                if (visitor.visitorIndex === v.visitorIndex) {
                                    if (action === 'RESET') {
                                        return { ...visitor, checkInOutStatus: 'PENDING', checkInTime: null, checkOutTime: null };
                                    }
                                    return { 
                                        ...visitor, 
                                        checkInOutStatus: updatedStatus, 
                                        [action === 'CHECK_IN' ? 'checkInTime' : 'checkOutTime']: new Date().toISOString() 
                                    };
                                }
                                return visitor;
                            })
                        };
                    }
                    return req;
                }));
            } else {
                console.error('Action failed:', await res.text());
                alert('Action failed');
            }
        } catch (err) {
            console.error('Failed to perform check in/out:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDateTime = (timeString: string | null) => {
        if (!timeString) return '-';
        const d = new Date(timeString);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDateShort = (dateString: string | null) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    const getCategoryBadgeClass = (category: string) => {
        const cat = category?.toUpperCase() || '';
        if (cat.includes('VENDOR') && cat.includes('CONTRACTOR')) return 'text-indigo-600 bg-indigo-50';
        if (cat.includes('VENDOR')) return 'text-blue-600 bg-blue-50';
        if (cat.includes('CONTRACTOR')) return 'text-cyan-600 bg-cyan-50';
        if (cat.includes('INTERVIEWEE')) return 'text-emerald-600 bg-emerald-50';
        if (cat.includes('EXPAT')) return 'text-purple-600 bg-purple-50';
        return 'text-gray-600 bg-gray-50';
    };

    const getStatusBadgeClass = (status: string) => {
        const s = status?.toUpperCase() || '';
        if (s === 'APPROVED' || s === 'COMPLETE') return 'text-green-600 bg-green-50';
        if (s === 'REJECTED') return 'text-red-600 bg-red-50';
        if (s === 'PENDING') return 'text-orange-600 bg-orange-50';
        return 'text-gray-600 bg-gray-50';
    };

    // Filter visitors based on statusFilter
    const processedHistory = history.map(req => {
        const filteredVisitors = req.visitors?.filter((v: any) => {
            if (statusFilter === 'ALL') return true;
            return v.checkInOutStatus === statusFilter;
        }) || [];
        
        return {
            ...req,
            filteredVisitors
        };
    }).filter(req => req.filteredVisitors.length > 0 || (viewMode === 'group' && statusFilter === 'ALL'));

    // Flatten visitors for Visitor View
    const allVisitors = processedHistory.flatMap(req => 
        req.filteredVisitors.map((v: any) => ({
            ...v,
            _requestInfo: req
        }))
    );

    // Summary stats
    const totalRequests = history.length;
    let totalVisitors = 0;
    let currentlyOnSite = 0;
    let completedCheckout = 0;

    history.forEach(req => {
        req.visitors?.forEach((v: any) => {
            totalVisitors++;
            if (v.checkInOutStatus === 'CHECKED_IN') currentlyOnSite++;
            if (v.checkInOutStatus === 'CHECKED_OUT') completedCheckout++;
        });
    });

    const renderActionButtons = (req: any, v: any) => (
        <div className="flex gap-2 ml-4 w-[200px] justify-end items-center">
            <button
                disabled={actionLoading === `${req.requestId}-${v.visitorIndex}` || v.checkInOutStatus !== 'PENDING'}
                onClick={(e) => {
                    e.stopPropagation();
                    handleAction(req.requestId, v, 'CHECK_IN');
                }}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded shadow-sm transition-colors ${
                    v.checkInOutStatus !== 'PENDING'
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#db011c] hover:bg-[#b00116] text-white'
                }`}
            >
                Check In
            </button>
            <button
                disabled={actionLoading === `${req.requestId}-${v.visitorIndex}` || v.checkInOutStatus !== 'CHECKED_IN'}
                onClick={(e) => {
                    e.stopPropagation();
                    handleAction(req.requestId, v, 'CHECK_OUT');
                }}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded shadow-sm transition-colors ${
                    v.checkInOutStatus !== 'CHECKED_IN'
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
            >
                Check Out
            </button>
            
            {/* Reset/Refresh button */}
            {(v.checkInOutStatus === 'CHECKED_IN' || v.checkInOutStatus === 'CHECKED_OUT') && (
                <button
                    disabled={actionLoading === `${req.requestId}-${v.visitorIndex}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Reset check-in/out status for ${v.visitorName}?`)) {
                            handleAction(req.requestId, v, 'RESET');
                        }
                    }}
                    title="Reset Status"
                    className="ml-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            )}
        </div>
    );

    return (
        <div className="w-full pb-10 px-6 mx-auto pt-6">
            <h1 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-wider">In/Out Logs</h1>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Requests</div>
                        <div className="text-xl font-black text-gray-900">{totalRequests}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Expected</div>
                        <div className="text-xl font-black text-gray-900">{totalVisitors}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">On-site</div>
                        <div className="text-xl font-black text-orange-600">{currentlyOnSite}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Checked Out</div>
                        <div className="text-xl font-black text-green-600">{completedCheckout}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Advanced Filters */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-end rounded-t-lg">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Search (ID, Submitter)</label>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <div className="w-[180px]">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                        <div className="flex">
                            <input 
                                type="date" 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-l text-sm focus:outline-none focus:border-[#db011c]"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            />
                            <button 
                                onClick={() => setFilters({ ...filters, date: new Date().toISOString().split('T')[0] })}
                                className="px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase rounded-r transition-colors border border-l-0 border-gray-300"
                            >
                                Today
                            </button>
                        </div>
                    </div>
                    <div className="w-[180px]">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                        <select 
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending (Expected)</option>
                            <option value="CHECKED_IN">Checked In (On-site)</option>
                            <option value="CHECKED_OUT">Checked Out</option>
                        </select>
                    </div>
                    <div className="w-[180px]">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                        <select 
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                            <option value="">All Categories</option>
                            <option value="Vendor">Vendor</option>
                            <option value="Contractor">Contractor</option>
                            <option value="MIL/TTI Expat / SHTP Business trip">MIL / TTI EXPAT</option>
                            <option value="Interviewee">Interviewee</option>
                        </select>
                    </div>
                    
                    {/* View Modes Toggle */}
                    <div className="ml-auto w-auto flex bg-gray-200 p-1 rounded">
                        <button
                            onClick={() => setViewMode('collapsible')}
                            className={`px-3 py-1.5 text-xs font-bold uppercase rounded transition-colors ${viewMode === 'collapsible' ? 'bg-white shadow-sm text-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Collapsible
                        </button>
                        <button
                            onClick={() => setViewMode('group')}
                            className={`px-3 py-1.5 text-xs font-bold uppercase rounded transition-colors ${viewMode === 'group' ? 'bg-white shadow-sm text-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Group
                        </button>
                        <button
                            onClick={() => setViewMode('visitor')}
                            className={`px-3 py-1.5 text-xs font-bold uppercase rounded transition-colors ${viewMode === 'visitor' ? 'bg-white shadow-sm text-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Visitor
                        </button>
                    </div>
                </div>

                {/* List Container */}
                <div className="p-0">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Loading...</div>
                    ) : (viewMode === 'collapsible' || viewMode === 'group') && processedHistory.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No requests found matching the filters.</div>
                    ) : viewMode === 'visitor' && allVisitors.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No visitors found matching the filters.</div>
                    ) : (
                        <div className="flex flex-col">
                            
                            {/* Visitor View Headers */}
                            {viewMode === 'visitor' && (
                                <div className="hidden md:grid grid-cols-12 gap-4 bg-[#1a1a1a] text-white px-6 py-3 font-bold text-xs uppercase tracking-wider items-center">
                                    <div className="col-span-1">CODE</div>
                                    <div className="col-span-2">NAME</div>
                                    <div className="col-span-2">REQUEST / DATE</div>
                                    <div className="col-span-2">COMPANY</div>
                                    <div className="col-span-3 text-center">CARD / TIME IN / OUT</div>
                                    <div className="col-span-2 text-right">ACTION</div>
                                </div>
                            )}

                            {/* Group / Collapsible View Headers */}
                            {(viewMode === 'group' || viewMode === 'collapsible') && (
                                <div className="hidden md:grid grid-cols-12 gap-4 bg-[#1a1a1a] text-white px-6 py-3 font-bold text-xs uppercase tracking-wider items-center">
                                    <div className="col-span-2">REQUEST CODE</div>
                                    <div className="col-span-4">VISITOR(S)</div>
                                    <div className="col-span-2">CATEGORY</div>
                                    <div className="col-span-2">DATE</div>
                                    <div className="col-span-1">DEPT</div>
                                    <div className="col-span-1 text-right">STATUS</div>
                                </div>
                            )}

                            {/* Visitor View Rows */}
                            {viewMode === 'visitor' && allVisitors.map((v: any, idx: number) => {
                                const req = v._requestInfo;
                                return (
                                    <div key={`${req.requestId}-${v.visitorIndex}`} className={`px-6 py-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <div className="col-span-1">
                                            <div className="text-[13px] font-black text-[#db011c]">{v.visitorCode}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-[13px] font-bold text-gray-900">{v.visitorName}</div>
                                            <div className="text-[11px] text-gray-500 truncate" title={v.visitorTitle || '-'}>{v.visitorTitle || '-'}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-xs font-medium text-gray-900 truncate" title={req.requestCode || req.requestId}>{req.requestCode || req.requestId}</div>
                                            <div className="text-[10px] text-gray-500 truncate" title={req.submitterName}>{req.submitterName}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-xs font-medium text-gray-600 truncate" title={v.visitorCompany || req.visitingSite}>{v.visitorCompany || req.visitingSite}</div>
                                        </div>
                                        <div className="col-span-3 flex items-center justify-center gap-4">
                                            <div className="w-[100px]">
                                                <input 
                                                    type="text" 
                                                    placeholder="Card No." 
                                                    className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-[#db011c] focus:ring-1 focus:ring-[#db011c]" 
                                                    value={cardNumbers[`${req.requestId}-${v.visitorIndex}`] ?? v.cardNumber ?? ''}
                                                    onChange={(e) => handleCardNumberChange(req.requestId, v.visitorIndex, e.target.value)}
                                                />
                                            </div>
                                            <div className="w-[80px] text-center">
                                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">IN</div>
                                                <div className={`text-[11px] font-bold ${v.checkInTime ? 'text-green-600' : 'text-gray-400'}`}>{formatTime(v.checkInTime)}</div>
                                            </div>
                                            <div className="w-[80px] text-center">
                                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">OUT</div>
                                                <div className={`text-[11px] font-bold ${v.checkOutTime ? 'text-gray-600' : 'text-gray-400'}`}>{formatTime(v.checkOutTime)}</div>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            {renderActionButtons(req, v)}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Group or Collapsible View Rows */}
                            {(viewMode === 'group' || viewMode === 'collapsible') && processedHistory.map((req, idx) => (
                                <div key={req.requestId} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fff5f5]/30'}`}>
                                    {/* Request Row */}
                                    <div 
                                        className={`px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center ${viewMode === 'collapsible' ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                                        onClick={() => viewMode === 'collapsible' && setExpandedRequest(expandedRequest === req.requestId ? null : req.requestId)}
                                    >
                                        <div className="col-span-2 font-bold text-sm text-gray-900">
                                            {req.requestCode || req.requestId}
                                        </div>
                                        <div className="col-span-4 text-sm text-gray-700 font-medium">
                                            {req.submitterName} {req.filteredVisitors && req.filteredVisitors.length > 0 && <span className="text-[11px] text-gray-400 font-bold ml-2">({req.filteredVisitors.length} Visitors)</span>}
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${getCategoryBadgeClass(req.visitorCategory)}`}>
                                                {req.visitorCategory?.replace(/MIL\/TTI Expat \/ SHTP Business trip/i, 'MIL EXPAT')}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-sm text-gray-700 font-medium">
                                            {formatDateShort(req.startDate)} - {formatDateShort(req.endDate)}
                                        </div>
                                        <div className="col-span-1 text-sm text-gray-700">
                                            {req.visitingSite}
                                        </div>
                                        <div className="col-span-1 flex justify-end items-center gap-2">
                                            <span className={`text-[11px] font-black px-2 py-1 rounded uppercase ${getStatusBadgeClass(req.status)}`}>
                                                APPROVED
                                            </span>
                                            {viewMode === 'collapsible' && (
                                                <div className="text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedRequest === req.requestId ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Visitors (Only in Collapsible mode) */}
                                    {viewMode === 'collapsible' && (
                                        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expandedRequest === req.requestId ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                            <div className="overflow-hidden">
                                                <div className="px-6 py-4 bg-[#f8fafc] border-t border-gray-100 shadow-inner overflow-x-auto">
                                                    <div className="flex flex-col gap-0">
                                                        {req.filteredVisitors && req.filteredVisitors.length > 0 ? (
                                                            <>
                                                                {/* Header for expanded visitors */}
                                                                <div className="flex justify-between items-center pb-2 border-b border-gray-300 mb-2">
                                                                    <div className="flex items-center gap-6">
                                                                        <div className="w-[120px] text-[10px] text-gray-500 font-bold uppercase tracking-wider">VISITOR CODE</div>
                                                                        <div className="w-[180px] text-[10px] text-gray-500 font-bold uppercase tracking-wider">FULL NAME</div>
                                                                        <div className="w-[120px] text-[10px] text-gray-500 font-bold uppercase tracking-wider">TITLE</div>
                                                                        <div className="w-[150px] text-[10px] text-gray-500 font-bold uppercase tracking-wider">COMPANY</div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider pr-[215px]">
                                                                        <div className="w-[100px] text-center">CARD NUMBER</div>
                                                                        <div className="w-[120px] text-center">TIME IN</div>
                                                                        <div className="w-[120px] text-center">TIME OUT</div>
                                                                    </div>
                                                                </div>

                                                                {req.filteredVisitors.map((v: any, vIdx: number) => (
                                                                    <div key={vIdx} className={`py-3 flex justify-between items-center ${vIdx !== req.filteredVisitors.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}>
                                                                        <div className="flex items-center gap-6">
                                                                            <div className="w-[120px]">
                                                                                <div className="text-[13px] font-black text-[#db011c]">{v.visitorCode}</div>
                                                                            </div>
                                                                            <div className="w-[180px]">
                                                                                <div className="text-[13px] font-bold text-gray-900">{v.visitorName}</div>
                                                                            </div>
                                                                            <div className="w-[120px]">
                                                                                <div className="text-[12px] text-gray-600 truncate" title={v.visitorTitle || '-'}>{v.visitorTitle || '-'}</div>
                                                                            </div>
                                                                            <div className="w-[150px]">
                                                                                <div className="text-[13px] font-medium text-gray-600 truncate" title={v.visitorCompany || req.visitingSite}>{v.visitorCompany || req.visitingSite}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-[100px] mr-2">
                                                                                <input 
                                                                                    type="text" 
                                                                                    placeholder="Card No." 
                                                                                    className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-[#db011c] focus:ring-1 focus:ring-[#db011c]" 
                                                                                    value={cardNumbers[`${req.requestId}-${v.visitorIndex}`] ?? v.cardNumber ?? ''}
                                                                                    onChange={(e) => handleCardNumberChange(req.requestId, v.visitorIndex, e.target.value)}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                />
                                                                            </div>
                                                                            <div className="flex gap-4 text-center mr-4">
                                                                                <div className="w-[120px]">
                                                                                    <div className={`text-[11px] font-bold ${v.checkInTime ? 'text-green-600' : 'text-gray-400'}`}>{formatDateTime(v.checkInTime)}</div>
                                                                                </div>
                                                                                <div className="w-[120px]">
                                                                                    <div className={`text-[11px] font-bold ${v.checkOutTime ? 'text-gray-600' : 'text-gray-400'}`}>{formatDateTime(v.checkOutTime)}</div>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Action Buttons */}
                                                                            {renderActionButtons(req, v)}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </>
                                                        ) : (
                                                            <div className="text-sm text-gray-500 py-2">No visitors data available.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper function
function formatTime(timeString: string | null) {
    if (!timeString) return '-';
    const d = new Date(timeString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
