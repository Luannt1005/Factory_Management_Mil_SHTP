'use client';

import { useState, useEffect, useCallback } from 'react';

export default function HistoryTab() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ date: new Date().toISOString().split('T')[0], category: '', search: '' });
    const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [cardNumbers, setCardNumbers] = useState<Record<string, string>>({});

    const handleCardNumberChange = (requestId: string, visitorIndex: number, value: string) => {
        setCardNumbers(prev => ({ ...prev, [`${requestId}-${visitorIndex}`]: value }));
    };

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
                            visitors: req.visitors.map((visitor: any) => {
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
            }
        } catch (err) {
            console.error('Failed to perform check in/out:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.date) query.append('date', filters.date);
            if (filters.category) query.append('category', filters.category);
            if (filters.search) query.append('search', filters.search);
            query.append('limit', '50');

            const res = await fetch(`/api/visitor_admin/checkinout/history?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.requests || []);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

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

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Filters */}
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
                    <input 
                        type="date" 
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                        value={filters.date}
                        onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    />
                </div>
                <div className="w-[200px]">
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
            </div>

            {/* List */}
            <div className="p-0">
                {/* Header Row */}
                <div className="hidden md:grid grid-cols-12 gap-4 bg-[#1a1a1a] text-white px-6 py-3 font-bold text-xs uppercase tracking-wider items-center">
                    <div className="col-span-2">REQUEST CODE</div>
                    <div className="col-span-4">VISITOR</div>
                    <div className="col-span-2">CATEGORY</div>
                    <div className="col-span-2">DATE</div>
                    <div className="col-span-1">DEPT</div>
                    <div className="col-span-1 text-right">STATUS</div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-gray-500">Loading...</div>
                ) : history.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No approved requests found matching the filters.</div>
                ) : (
                    <div className="flex flex-col">
                        {history.map((req, idx) => (
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
                                        {req.submitterName} {req.visitors && req.visitors.length > 0 && <span className="text-[11px] text-gray-400 font-bold ml-2">({req.visitors.length} Visitors)</span>}
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
                                            {req.visitors && req.visitors.length > 0 ? (
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

                                                    {req.visitors.map((v: any, vIdx: number) => (
                                                        <div key={vIdx} className={`py-3 flex justify-between items-center ${vIdx !== req.visitors.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}>
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
    );
}
