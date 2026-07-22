'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HistoryTab from './HistoryTab';

export default function CheckInOutManagement() {
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [onSiteVisitors, setOnSiteVisitors] = useState<any[]>([]);
    const [expectedRequests, setExpectedRequests] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'checkin' | 'history'>('checkin');

    const [expectedSearch, setExpectedSearch] = useState('');
    const [expectedCategory, setExpectedCategory] = useState('');
    const [onSiteSearch, setOnSiteSearch] = useState('');
    const [onSiteCategory, setOnSiteCategory] = useState('');
    const [expandedExpected, setExpandedExpected] = useState<string | null>(null);
    const [cardNumbers, setCardNumbers] = useState<Record<string, string>>({});

    const handleCardNumberChange = (requestId: string, visitorIndex: number, value: string) => {
        setCardNumbers(prev => ({ ...prev, [`${requestId}-${visitorIndex}`]: value }));
    };

    useEffect(() => {
        setMounted(true);
    }, []);
    
    // Fetch currently on-site visitors and expected requests
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const date = new Date().toISOString().split('T')[0];
            const [onSiteRes, historyRes] = await Promise.all([
                fetch(`/api/visitor_admin/checkinout?status=CHECKED_IN&limit=100`),
                fetch(`/api/visitor_admin/checkinout/history?date=${date}&limit=100`)
            ]);

            if (onSiteRes.ok) {
                const data = await onSiteRes.json();
                setOnSiteVisitors(data.visitors || []);
            } else if (onSiteRes.status === 401 || onSiteRes.status === 403) {
                router.push('/login?redirect=' + window.location.pathname);
            }
            
            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setExpectedRequests(historyData.requests || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard visitors:', err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                // Refresh local data
                await fetchData();
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

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '';
        const d = new Date(timeString);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const filteredExpected = expectedRequests.filter(req => {
        const matchesSearch = req.requestId.toLowerCase().includes(expectedSearch.toLowerCase()) ||
            (req.submitterName || '').toLowerCase().includes(expectedSearch.toLowerCase()) ||
            req.visitors?.some((v: any) => v.visitorName.toLowerCase().includes(expectedSearch.toLowerCase()) || v.visitorCode.toLowerCase().includes(expectedSearch.toLowerCase()));
        
        const matchesCategory = expectedCategory === '' || req.visitorCategory === expectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const filteredOnSite = onSiteVisitors.filter(v => {
        const matchesSearch = v.visitorName.toLowerCase().includes(onSiteSearch.toLowerCase()) ||
            v.visitorCode.toLowerCase().includes(onSiteSearch.toLowerCase()) ||
            (v.visitorCompany || v.visitingSite || '').toLowerCase().includes(onSiteSearch.toLowerCase());
            
        const matchesCategory = onSiteCategory === '' || v.visitorCategory === onSiteCategory;
        
        return matchesSearch && matchesCategory;
    });

    if (!mounted) return null;

    return (
        <div className="w-full pb-10 px-6 mx-auto">
            {/* Header and Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('checkin')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'checkin' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Active Check-in/out
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    In/Out Logs
                </button>
            </div>

            {activeTab === 'history' ? (
                <HistoryTab />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Expected Requests Today Section */}
                    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-lg shadow-sm p-6 relative flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <h3 className="text-[13px] font-black uppercase text-gray-900 tracking-wide">
                                    EXPECTED REQUESTS TODAY ({filteredExpected.length})
                                </h3>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                <select
                                    value={expectedCategory}
                                    onChange={(e) => setExpectedCategory(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-auto focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">All Categories</option>
                                    <option value="Vendor">Vendor</option>
                                    <option value="Contractor">Contractor</option>
                                    <option value="MIL/TTI Expat / SHTP Business trip">MIL / TTI EXPAT</option>
                                    <option value="Interviewee">Interviewee</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Search expected requests..."
                                    value={expectedSearch}
                                    onChange={(e) => setExpectedSearch(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-64 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col border border-gray-200 rounded overflow-hidden">
                                <div className="hidden md:grid grid-cols-12 gap-4 bg-[#1a1a1a] text-white px-6 py-3 font-bold text-[10px] uppercase tracking-wider items-center border-b border-gray-200">
                                    <div className="col-span-2">REQUEST CODE</div>
                                    <div className="col-span-4">SUBMITTER</div>
                                    <div className="col-span-3">CATEGORY</div>
                                    <div className="col-span-2">SITE</div>
                                    <div className="col-span-1"></div>
                                </div>
                                
                                {filteredExpected.length > 0 ? (
                                    filteredExpected.map((req: any, index: number) => (
                                        <div key={req.requestId} className={`flex flex-col ${index !== filteredExpected.length - 1 ? 'border-b border-gray-200' : ''}`}>
                                            <div 
                                                className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer hover:bg-blue-50/50 transition-colors bg-white"
                                                onClick={() => setExpandedExpected(expandedExpected === req.requestId ? null : req.requestId)}
                                            >
                                                <div className="col-span-2 font-bold text-sm text-gray-900 tracking-tight">
                                                    {req.requestCode || req.requestId}
                                                </div>
                                                <div className="col-span-4 text-sm text-gray-700 font-medium">
                                                    {req.submitterName} <span className="text-[11px] font-bold text-gray-400 ml-2">({req.visitors?.length || 0} Visitors)</span>
                                                </div>
                                                <div className="col-span-3">
                                                    <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest bg-blue-100 text-blue-700">
                                                        {req.visitorCategory?.replace(/MIL\/TTI Expat \/ SHTP Business trip/i, 'MIL EXPAT')}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 text-sm text-gray-700">
                                                    {req.visitingSite}
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`text-gray-400 h-5 w-5 transition-transform ${expandedExpected === req.requestId ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            {/* Expanded Visitors with Smooth Animation */}
                                            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expandedExpected === req.requestId ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                <div className="overflow-hidden">
                                                    <div className="px-6 py-4 bg-[#f8fafc] border-t border-gray-100 shadow-inner overflow-x-auto">
                                                    <div className="flex flex-col gap-0 min-w-[700px]">
                                                        {req.visitors && req.visitors.length > 0 ? (
                                                            <>
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
                                                                            <div className="w-[120px] text-[13px] font-black text-blue-600">{v.visitorCode}</div>
                                                                            <div className="w-[180px] text-[13px] font-bold text-gray-900">{v.visitorName}</div>
                                                                            <div className="w-[120px] text-[12px] text-gray-600 truncate" title={v.visitorTitle || '-'}>{v.visitorTitle || '-'}</div>
                                                                            <div className="w-[150px] text-[13px] font-medium text-gray-600 truncate" title={v.visitorCompany || req.visitingSite}>{v.visitorCompany || req.visitingSite}</div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-[100px] mr-2">
                                                                                <input 
                                                                                    type="text" 
                                                                                    placeholder="Card No." 
                                                                                    className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                                                                                    value={cardNumbers[`${req.requestId}-${v.visitorIndex}`] ?? v.cardNumber ?? ''}
                                                                                    onChange={(e) => handleCardNumberChange(req.requestId, v.visitorIndex, e.target.value)} onClick={(e) => e.stopPropagation()}
                                                                                    
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
                                                                                    onClick={(e) => { e.stopPropagation(); handleAction(req.requestId, v, 'CHECK_IN'); }}
                                                                                    className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded shadow-sm transition-colors ${v.checkInOutStatus !== 'PENDING' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                                                                >
                                                                                    Check In
                                                                                </button>
                                                                                <button
                                                                                    disabled={actionLoading === `${req.requestId}-${v.visitorIndex}` || v.checkInOutStatus !== 'CHECKED_IN'}
                                                                                    onClick={(e) => { e.stopPropagation(); handleAction(req.requestId, v, 'CHECK_OUT'); }}
                                                                                    className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded shadow-sm transition-colors ${v.checkInOutStatus !== 'CHECKED_IN' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                                                                                >
                                                                                    Check Out
                                                                                </button>
                                                                                
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
                                    ))
                                ) : (
                                    <div className="text-center text-sm text-gray-400 py-10">
                                        No expected requests found matching the search.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Currently On Site Section */}
                    <div className="lg:col-span-1 bg-white border border-gray-100 rounded-lg shadow-sm p-6 relative flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                <h3 className="text-[13px] font-black uppercase text-gray-900 tracking-wide">
                                    CURRENTLY ON SITE ({filteredOnSite.length})
                                </h3>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                <select
                                    value={onSiteCategory}
                                    onChange={(e) => setOnSiteCategory(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-auto focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">All Categories</option>
                                    <option value="Vendor">Vendor</option>
                                    <option value="Contractor">Contractor</option>
                                    <option value="MIL/TTI Expat / SHTP Business trip">MIL / TTI EXPAT</option>
                                    <option value="Interviewee">Interviewee</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Search by name, code or company..."
                                    value={onSiteSearch}
                                    onChange={(e) => setOnSiteSearch(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded text-sm w-full sm:w-64 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10b981]"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filteredOnSite.length > 0 ? (
                                    filteredOnSite.map((v: any, index: number) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-5 border border-gray-100 rounded-sm shadow-sm border-l-4 border-l-[#10b981] bg-white transition-colors hover:bg-gray-50 gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-gray-900 tracking-tight">{v.visitorName}</span>
                                                <span className="text-[11px] text-gray-400 font-medium mt-0.5 tracking-wide">
                                                    {v.visitorCode} &middot; {v.visitorCategory?.replace(/MIL\/TTI Expat \/ SHTP Business trip/i, 'MIL EXPAT')} &middot; {v.visitorCompany || v.visitingSite}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">Time In</div>
                                                    <div className="text-[12px] font-bold text-[#10b981] tracking-widest uppercase">
                                                        {formatTime(v.checkInTime)}
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={actionLoading === `${v.requestId}-${v.visitorIndex}`}
                                                    onClick={() => handleAction(v.requestId, v, 'CHECK_OUT')}
                                                    className="px-4 py-2 text-[10px] font-bold uppercase rounded shadow-sm bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === `${v.requestId}-${v.visitorIndex}` ? 'Processing...' : 'Check Out'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-sm text-gray-400 py-10 border border-gray-100 border-dashed rounded bg-gray-50">
                                        No visitors currently on site
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
