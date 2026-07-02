'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckInOutManagement() {
    const router = useRouter();
    
    const [checkInCode, setCheckInCode] = useState('');
    const [checkOutCode, setCheckOutCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [onSiteVisitors, setOnSiteVisitors] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Fetch currently on-site visitors (status = CHECKED_IN)
    const fetchOnSiteVisitors = useCallback(async () => {
        setLoading(true);
        try {
            const date = new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/visitor_admin/checkinout?status=CHECKED_IN&date=${date}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                setOnSiteVisitors(data.visitors || []);
            } else if (res.status === 401 || res.status === 403) {
                router.push('/login?redirect=' + window.location.pathname);
            }
        } catch (err) {
            console.error('Error fetching on-site visitors:', err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchOnSiteVisitors();
    }, [fetchOnSiteVisitors]);

    // Handle Check-in or Check-out submission
    const handleAction = async (action: 'CHECK_IN' | 'CHECK_OUT', code: string) => {
        if (!code.trim()) {
            alert('Please enter a Ref # or Name.');
            return;
        }

        setActionLoading(true);
        try {
            // First search for the visitor
            const searchRes = await fetch(`/api/visitor_admin/checkinout?search=${encodeURIComponent(code.trim())}&limit=5`);
            if (!searchRes.ok) throw new Error('Search failed');
            
            const searchData = await searchRes.json();
            const visitors = searchData.visitors || [];
            
            if (visitors.length === 0) {
                alert(`No visitor found matching: ${code}`);
                setActionLoading(false);
                return;
            }
            
            // If multiple, just pick the first one for quick check-in (or could prompt user)
            const targetVisitor = visitors[0];
            
            // Perform action
            const res = await fetch('/api/visitor_admin/checkinout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    requestId: targetVisitor.requestId,
                    visitorIndex: targetVisitor.visitorIndex,
                    visitorName: targetVisitor.visitorName,
                    visitorCode: targetVisitor.visitorCode
                })
            });

            if (res.ok) {
                if (action === 'CHECK_IN') setCheckInCode('');
                else setCheckOutCode('');
                
                await fetchOnSiteVisitors();
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.error || `Failed to ${action}`}`);
            }
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred.');
        } finally {
            setActionLoading(false);
        }
    };

    // Formating time from UTC string to local HH:MM
    const formatTime = (timeString: string | null) => {
        if (!timeString) return '';
        const d = new Date(timeString);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div className="w-full pb-10 px-6 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-6 mt-4">
                <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                    VISITOR CHECK-IN AND CHECK-OUT MANAGEMENT
                </h2>
            </div>

            {/* Quick Action Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* CHECK IN Panel */}
                <div className="bg-white border border-gray-200 border-dashed rounded-lg p-8 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-black text-gray-900 mb-1">CHECK IN</h3>
                    <p className="text-[12px] text-gray-500 mb-6">Scan visitor QR badge or enter ref number</p>
                    
                    <form 
                        className="w-full max-w-md flex flex-col gap-4"
                        onSubmit={(e) => { e.preventDefault(); handleAction('CHECK_IN', checkInCode); }}
                    >
                        <input 
                            type="text" 
                            placeholder="Ref # or scan QR..." 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#db011c] focus:border-[#db011c]"
                            value={checkInCode}
                            onChange={(e) => setCheckInCode(e.target.value)}
                            disabled={actionLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={actionLoading || !checkInCode.trim()}
                            className="w-full bg-[#db011c] hover:bg-[#b80017] text-white font-bold text-sm py-3 px-4 rounded shadow-sm transition-colors uppercase disabled:opacity-50"
                        >
                            CONFIRM CHECK-IN
                        </button>
                    </form>
                </div>

                {/* CHECK OUT Panel */}
                <div className="bg-white border border-gray-200 border-dashed rounded-lg p-8 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-black text-gray-900 mb-1">CHECK OUT</h3>
                    <p className="text-[12px] text-gray-500 mb-6">Scan badge or look up visitor by name</p>
                    
                    <form 
                        className="w-full max-w-md flex flex-col gap-4"
                        onSubmit={(e) => { e.preventDefault(); handleAction('CHECK_OUT', checkOutCode); }}
                    >
                        <input 
                            type="text" 
                            placeholder="Visitor name or ref #..." 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                            value={checkOutCode}
                            onChange={(e) => setCheckOutCode(e.target.value)}
                            disabled={actionLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={actionLoading || !checkOutCode.trim()}
                            className="w-full bg-[#3f3f46] hover:bg-[#27272a] text-white font-bold text-sm py-3 px-4 rounded shadow-sm transition-colors uppercase disabled:opacity-50"
                        >
                            CONFIRM CHECK-OUT
                        </button>
                    </form>
                </div>
            </div>

            {/* Currently On Site Section */}
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 relative">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                    <h3 className="text-[13px] font-black uppercase text-gray-900 tracking-wide">
                        CURRENTLY ON SITE TODAY
                    </h3>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#db011c]"></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {onSiteVisitors.length > 0 ? (
                            onSiteVisitors.map((v: any, index: number) => (
                                <div key={index} className="flex justify-between items-center py-4 px-5 border border-gray-100 rounded-sm shadow-sm border-l-4 border-l-[#db011c] bg-white transition-colors hover:bg-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-gray-900 tracking-tight">{v.visitorName}</span>
                                        <span className="text-[11px] text-gray-400 font-medium mt-0.5 tracking-wide">
                                            {v.visitorCategory} &middot; {v.visitorCompany || v.visitingSite}
                                        </span>
                                    </div>
                                    <div className="text-[12px] font-bold text-[#db011c] tracking-widest uppercase">
                                        {formatTime(v.checkInTime)} IN
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-gray-400 py-10 border border-gray-100 border-dashed rounded bg-gray-50">
                                No visitors currently on site today
                            </div>
                        )}
                        
                        {onSiteVisitors.length > 0 && (
                            <div className="mt-4 flex justify-end">
                                <button className="text-[11px] font-bold text-[#db011c] border border-[#db011c] px-5 py-2 rounded uppercase tracking-wider hover:bg-[#fff5f5] transition-colors shadow-sm">
                                    VIEW ALL {onSiteVisitors.length}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
