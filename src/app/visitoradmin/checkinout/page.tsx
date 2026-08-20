'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';

type ViewMode = 'group' | 'visitor';
type StatusFilter = 'ALL' | 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT';

const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

export default function CheckInOutManagement() {
    const router = useRouter();
    const { user } = useUser();
    const isSecurity = user?.app_role_names?.includes('Security') || false;
    const isReceptionist = user?.app_role_names?.includes('Receptionist') || false;
    
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters and View State
    const [filters, setFilters] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        category: '', 
        search: '',
        visitorName: '',
        site: ''
    });
    const [viewMode, setViewMode] = useState<ViewMode>('group');
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
            if (filters.site) query.append('site', filters.site);
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

    const handleAction = async (requestId: string, v: any, action: 'CHECK_IN' | 'CHECK_OUT' | 'RESET' | 'UPDATE_CARD') => {
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
                                    if (action === 'UPDATE_CARD') {
                                        return { ...visitor, cardNumber };
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
        return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
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

    // Filter visitors based on statusFilter and visitorName
    const processedHistory = history.map(req => {
        const filteredVisitors = req.visitors?.filter((v: any) => {
            if (statusFilter !== 'ALL' && v.checkInOutStatus !== statusFilter) return false;
            if (filters.visitorName) {
                const nameMatch = removeAccents(v.visitorName || '').includes(removeAccents(filters.visitorName));
                if (!nameMatch) return false;
            }
            return true;
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
        <div className="flex gap-1.5 w-full justify-end items-center">
            <button
                disabled={actionLoading === `${req.requestId}-${v.visitorIndex}` || v.checkInOutStatus !== 'PENDING'}
                onClick={(e) => {
                    e.stopPropagation();
                    handleAction(req.requestId, v, 'CHECK_IN');
                }}
                className={`whitespace-nowrap text-[9px] font-bold uppercase px-2 py-1.5 rounded shadow-sm transition-colors ${
                    v.checkInOutStatus !== 'PENDING'
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#db011c] hover:bg-[#b00116] text-white'
                }`}
            >
                Check In
            </button>
            
            {!isSecurity && (
                <button
                    disabled={actionLoading === `${req.requestId}-${v.visitorIndex}` || v.checkInOutStatus !== 'CHECKED_IN'}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAction(req.requestId, v, 'CHECK_OUT');
                    }}
                    className={`whitespace-nowrap text-[9px] font-bold uppercase px-2 py-1.5 rounded shadow-sm transition-colors ${
                        v.checkInOutStatus !== 'CHECKED_IN'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                >
                    Check Out
                </button>
            )}
            
            {/* Reset/Refresh button */}
            {!isSecurity && !isReceptionist && (
                <div className={`ml-1 ${v.checkInOutStatus === 'CHECKED_IN' || v.checkInOutStatus === 'CHECKED_OUT' ? 'visible' : 'invisible'}`}>
                    <button
                        disabled={actionLoading === `${req.requestId}-${v.visitorIndex}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Reset check-in/out status for ${v.visitorName}?`)) {
                                handleAction(req.requestId, v, 'RESET');
                            }
                        }}
                        title="Reset Status"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full pb-10 px-6 mx-auto pt-6">

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Advanced Filters */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 items-end">
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Search Req</label>
                            <input 
                                type="text" 
                                placeholder="ID, Submitter..." 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Visitor Name</label>
                            <input 
                                type="text" 
                                placeholder="Name..." 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                                value={filters.visitorName}
                                onChange={(e) => setFilters({ ...filters, visitorName: e.target.value })}
                            />
                        </div>
                        <div className="w-full">
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
                                    className={`px-3 text-xs font-bold uppercase rounded-r transition-colors border border-l-0 ${filters.date === new Date().toISOString().split('T')[0] ? 'bg-[#db011c] text-white border-[#db011c]' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'}`}
                                >
                                    Today
                                </button>
                            </div>
                        </div>
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                            <select 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            >
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Expected Arrival</option>
                                <option value="CHECKED_IN">Checked In</option>
                                <option value="CHECKED_OUT">Checked Out</option>
                            </select>
                        </div>
                        <div className="w-full">
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
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Site</label>
                            <select 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                                value={filters.site}
                                onChange={(e) => setFilters({ ...filters, site: e.target.value })}
                            >
                                <option value="">All Sites</option>
                                <option value="SHTP">SHTP</option>
                                <option value="DDK">DDK</option>
                                <option value="SHTP/DDK">SHTP / DDK</option>
                            </select>
                        </div>
                        
                        {/* View Modes Toggle */}
                        <div className="flex w-full bg-gray-200 p-1 rounded justify-between h-[38px]">
                            <button
                                onClick={() => setViewMode('group')}
                                className={`flex-1 px-1 py-1 text-[10px] font-bold uppercase rounded transition-colors ${viewMode === 'group' ? 'bg-white shadow-sm text-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Group
                            </button>
                            <button
                                onClick={() => setViewMode('visitor')}
                                className={`flex-1 px-1 py-1 text-[10px] font-bold uppercase rounded transition-colors ${viewMode === 'visitor' ? 'bg-white shadow-sm text-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Visitor
                            </button>
                        </div>
                    </div>
                </div>

                {/* List Container */}
                <div className="p-0">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Loading...</div>
                    ) : viewMode === 'group' && processedHistory.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No requests found matching the filters.</div>
                    ) : viewMode === 'visitor' && allVisitors.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No visitors found matching the filters.</div>
                    ) : (
                        <div className="flex flex-col">
                            
                            {viewMode === 'visitor' && (
                                <div className="hidden md:grid grid-cols-[1fr_1.2fr_1.5fr_1fr_1.2fr_0.8fr_1.3fr_1fr_0.7fr_0.7fr_170px] gap-4 items-center bg-[#1a1a1a] text-white px-6 py-3 font-bold text-[9px] uppercase tracking-wider mb-2">
                                    <div>REQUEST</div>
                                    <div>VISITOR CODE</div>
                                    <div>FULL NAME</div>
                                    <div>TITLE</div>
                                    <div>COMPANY</div>
                                    <div className="text-center">CATEGORY</div>
                                    <div>DATE</div>
                                    <div className="text-center">CARD NUMBER</div>
                                    <div className="text-center">TIME IN</div>
                                    <div className="text-center">TIME OUT</div>
                                    <div className="text-right">ACTION</div>
                                </div>
                            )}

                            {/* Group View Headers */}
                            {viewMode === 'group' && (
                                <div className="hidden md:grid grid-cols-12 gap-4 bg-[#1a1a1a] text-white px-6 py-3 font-bold text-xs uppercase tracking-wider items-center">
                                    <div className="col-span-2">REQUEST CODE</div>
                                    <div className="col-span-4">VISITOR(S)</div>
                                    <div className="col-span-2">CATEGORY</div>
                                    <div className="col-span-2">DATE</div>
                                    <div className="col-span-2">SITE</div>
                                </div>
                            )}

                            {/* Visitor View Rows */}
                            {viewMode === 'visitor' && allVisitors.map((v: any, idx: number) => {
                                const req = v._requestInfo;
                                return (
                                    <div key={`${req.requestId}-${v.visitorIndex}`} className={`px-6 py-3 grid grid-cols-[1fr_1.2fr_1.5fr_1fr_1.2fr_0.8fr_1.3fr_1fr_0.7fr_0.7fr_170px] gap-4 items-center border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <div className="text-[11px] font-medium text-gray-900 truncate" title={req.requestCode || req.requestId}>{req.requestCode || req.requestId}</div>
                                        <div className="text-xs font-black text-[#db011c] truncate" title={v.visitorCode}>{v.visitorCode}</div>
                                        <div className="text-xs font-bold text-gray-900 truncate" title={v.visitorName}>{v.visitorName}</div>
                                        <div className="text-[10px] text-gray-500 truncate" title={v.visitorTitle || '-'}>{v.visitorTitle || '-'}</div>
                                        <div className="text-[11px] font-medium text-gray-600 truncate" title={v.visitorCompany || req.visitingSite}>{v.visitorCompany || req.visitingSite}</div>
                                        <div className="text-[10px] text-center">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${getCategoryBadgeClass(req.visitorCategory)}`}>
                                                {req.visitorCategory?.replace(/MIL\/TTI Expat \/ SHTP Business trip/i, 'MIL EXPAT')}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-medium text-gray-600 truncate">{formatDateShort(req.startDate)} - {formatDateShort(req.endDate)}</div>
                                        
                                        <div className="w-full">
                                            <input 
                                                type="text" 
                                                placeholder="Card No." 
                                                className={`w-full text-[11px] px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-[#db011c] ${isSecurity ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`} 
                                                value={cardNumbers[`${req.requestId}-${v.visitorIndex}`] ?? v.cardNumber ?? ''}
                                                onChange={(e) => handleCardNumberChange(req.requestId, v.visitorIndex, e.target.value)}
                                                disabled={isSecurity}
                                                readOnly={isSecurity}
                                            />
                                        </div>
                                        <div className={`text-[11px] font-bold text-center ${v.checkInTime ? 'text-green-600' : 'text-gray-400'}`}>{formatTime(v.checkInTime)}</div>
                                        <div className={`text-[11px] font-bold text-center ${v.checkOutTime ? 'text-gray-600' : 'text-gray-400'}`}>{formatTime(v.checkOutTime)}</div>
                                        
                                        <div className="flex justify-end min-w-0">
                                            {renderActionButtons(req, v)}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Group View Rows */}
                            {viewMode === 'group' && processedHistory.map((req, idx) => (
                                <div key={req.requestId} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fff5f5]/30'}`}>
                                    {/* Request Row */}
                                    <div 
                                        className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setExpandedRequest(expandedRequest === req.requestId ? null : req.requestId)}
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
                                        <div className="col-span-2 flex justify-between items-center text-sm text-gray-700">
                                            <span>{req.visitingSite}</span>
                                            <div className="text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedRequest === req.requestId ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Visitors */}
                                    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expandedRequest === req.requestId ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                            <div className="overflow-hidden">
                                                <div className="px-6 py-4 bg-[#f8fafc] border-t border-gray-100 shadow-inner overflow-x-auto">
                                                    <div className="flex flex-col gap-0">
                                                        {req.filteredVisitors && req.filteredVisitors.length > 0 ? (
                                                            <>
                                                                {/* Header for expanded visitors */}
                                                                <div className="grid grid-cols-[130px_1.5fr_1.5fr_1.5fr_1fr_90px_60px_60px_170px] gap-4 items-center pb-2 border-b border-gray-300 mb-2">
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">VISITOR CODE</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">FULL NAME</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">TITLE</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">COMPANY</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">DATE</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">CARD NUMBER</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">TIME IN</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">TIME OUT</div>
                                                                    <div></div>
                                                                </div>

                                                                {req.filteredVisitors.map((v: any, vIdx: number) => (
                                                                    <div key={vIdx} className={`py-3 grid grid-cols-[130px_1.5fr_1.5fr_1.5fr_1fr_90px_60px_60px_170px] gap-4 items-center ${vIdx !== req.filteredVisitors.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}>
                                                                        <div className="text-xs font-black text-[#db011c] truncate" title={v.visitorCode}>{v.visitorCode}</div>
                                                                        <div className="text-xs font-bold text-gray-900 truncate" title={v.visitorName}>{v.visitorName}</div>
                                                                        <div className="text-[11px] text-gray-600 truncate" title={v.visitorTitle || '-'}>{v.visitorTitle || '-'}</div>
                                                                        <div className="text-[11px] font-medium text-gray-600 truncate" title={v.visitorCompany || req.visitingSite}>{v.visitorCompany || req.visitingSite}</div>
                                                                        <div className="text-[10px] font-medium text-gray-600 truncate text-center">{formatDateShort(req.startDate)} - {formatDateShort(req.endDate)}</div>
                                                                        <div className="w-full">
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="Card No." 
                                                                                className={`w-full text-[11px] px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-[#db011c] ${isSecurity ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`} 
                                                                                value={cardNumbers[`${req.requestId}-${v.visitorIndex}`] ?? v.cardNumber ?? ''}
                                                                                onChange={(e) => handleCardNumberChange(req.requestId, v.visitorIndex, e.target.value)}
                                                                                onBlur={(e) => {
                                                                                    if (cardNumbers[`${req.requestId}-${v.visitorIndex}`] !== undefined) {
                                                                                        handleAction(req.requestId, v, 'UPDATE_CARD');
                                                                                    }
                                                                                }}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                disabled={isSecurity}
                                                                                readOnly={isSecurity}
                                                                            />
                                                                        </div>
                                                                        <div className={`text-[11px] font-bold text-center ${v.checkInTime ? 'text-green-600' : 'text-gray-400'}`}>{formatTime(v.checkInTime)}</div>
                                                                        <div className={`text-[11px] font-bold text-center ${v.checkOutTime ? 'text-gray-600' : 'text-gray-400'}`}>{formatTime(v.checkOutTime)}</div>
                                                                        
                                                                        <div className="flex justify-end min-w-0">
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
