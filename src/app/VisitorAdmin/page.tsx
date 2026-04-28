'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchRequests(1);
    }, [startDate, endDate]);

    const fetchRequests = async (page: number) => {
        setLoading(true);
        try {
            let url = `/api/visitor_admin/requests?page=${page}&limit=${pagination.limit}`;
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
                setPagination(data.pagination);
            } else if (res.status === 401 || res.status === 403) {
                router.push('/login?redirect=' + window.location.pathname);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/visitor_admin/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            if (res.ok) {
                fetchRequests(pagination.page);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETE':
            case 'APPROVED': return '#10b981';
            case 'REJECTED': return '#ef4444';
            case 'IN PROCESS': return '#f59e0b';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">From</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">To</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button 
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="text-sm font-medium text-gray-500">
                    Showing <span className="text-gray-900 font-bold">{requests.length}</span> of <span className="text-gray-900 font-bold">{pagination.total}</span> requests
                </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-200 text-[#0f172a]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Visitor Information</th>
                                <th className="px-6 py-4">Submitter</th>
                                <th className="px-6 py-4 text-center">Visit Dates</th>
                                <th className="px-6 py-4">Approval Progress</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] font-medium bg-white">
                            {requests.map((request) => (
                                <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <span className="text-[11px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                            #{request.id.split('-')[0].toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-extrabold text-[#0f172a] text-[14px]">{request.visitor_name}</div>
                                        <div className="text-[11px] text-gray-500 mt-0.5 tracking-tight">{request.current_company} / {request.visitor_title}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-[#0f172a]">{request.profiles?.name}</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5">{request.profiles?.department}</div>
                                    </td>
                                    <td className="px-6 py-5 text-center text-gray-700 tabular-nums">
                                        <div className="flex flex-col">
                                            <span>{new Date(request.start_date).toLocaleDateString('vi-VN')}</span>
                                            <span className="text-[10px] text-gray-400 font-bold">to</span>
                                            <span>{new Date(request.end_date).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {request.request_approvals?.length > 0 ? (
                                            <div className="flex flex-col gap-1.5">
                                                {request.request_approvals.map((app: any) => (
                                                    <div key={app.id} className="text-[10px] flex items-center justify-between gap-3 text-gray-600 border border-gray-100 p-1.5 rounded-lg bg-gray-50/50">
                                                        <span className="font-bold flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(app.status) }}></span>
                                                            {app.room_areas?.name || 'Area'}
                                                        </span>
                                                        <span className="text-[9px] px-2 py-0.5 rounded-md font-black tracking-tighter" style={{ background: getStatusColor(app.status) + '15', color: getStatusColor(app.status) }}>{app.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-[11px]">No zones mapped</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="inline-block px-3 py-1 rounded-md text-[10px] font-black tracking-tighter uppercase" style={{
                                            background: getStatusColor(request.status) + '15',
                                            color: getStatusColor(request.status),
                                            border: `1px solid ${getStatusColor(request.status)}30`
                                        }}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right pr-6">
                                        <div className="flex justify-end gap-1.5">
                                            <button 
                                                onClick={() => handleUpdateStatus(request.id, 'COMPLETE')} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-white bg-green-500 hover:bg-green-600 transition-all shadow-sm group relative"
                                                title="Approve Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(request.id, 'REJECTED')} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 bg-gray-100 hover:bg-red-50 hover:text-red-600 border border-gray-200 transition-all group"
                                                title="Reject Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && !loading && (
                                <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-medium">No results matching your filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-200">
                        <button 
                            disabled={pagination.page === 1 || loading}
                            onClick={() => fetchRequests(pagination.page - 1)}
                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                                <button
                                    key={pageNum}
                                    onClick={() => fetchRequests(pageNum)}
                                    className={`w-8 h-8 text-[11px] font-black rounded-lg transition-all ${pagination.page === pageNum 
                                        ? 'bg-[#db011c] text-white shadow-md' 
                                        : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                        </div>
                        <button 
                            disabled={pagination.page === pagination.totalPages || loading}
                            onClick={() => fetchRequests(pagination.page + 1)}
                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
