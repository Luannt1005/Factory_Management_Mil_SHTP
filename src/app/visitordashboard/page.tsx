'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // Add missing import if needed

export default function Dashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchMyRequests(1);
    }, [startDate, endDate]);

    const fetchMyRequests = async (page: number) => {
        setLoading(true);
        try {
            let url = `/api/requests?page=${page}&limit=${pagination.limit}`;
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
                setPagination(data.pagination);
            } else if (res.status === 401) {
                router.push('/login?redirect=' + window.location.pathname);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const parseDetails = (details: any) => {
        if (!details) return {};
        if (typeof details === 'object') return details;
        try {
            return JSON.parse(details);
        } catch (e) {
            console.error("Error parsing details JSON", e);
            return {};
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return '#10b981'; // Green
            case 'COMPLETE': return '#10b981'; // Green
            case 'REJECTED': return '#ef4444'; // Red
            default: return '#f59e0b'; // Amber
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
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Visitor / Company</th>
                                <th className="px-6 py-4 text-center">Visit Period</th>
                                <th className="px-6 py-4 text-center">Workflows</th>
                                <th className="px-6 py-4 text-center">Overall Status</th>
                                <th className="px-6 py-4 text-right pr-10">Details</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] font-medium bg-white">
                            {requests.map((request) => (
                                <tr
                                    key={request.id}
                                    className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    <td className="px-6 py-5">
                                        <span className="text-[11px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                            #{request.id.split('-')[0].toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-extrabold text-[#0f172a] text-[14px]">
                                            {request.visitor_name}
                                            {request.visitors && (() => {
                                                try {
                                                    const parsed = JSON.parse(request.visitors);
                                                    if (parsed && parsed.length > 1) {
                                                        return ` (+ ${parsed.length - 1})`;
                                                    }
                                                } catch (e) {}
                                                return '';
                                            })()}
                                        </div>
                                        <div className="text-[11px] text-gray-500 mt-0.5 tracking-tight">{request.current_company} / {request.visitor_title}</div>
                                    </td>
                                    <td className="px-6 py-5 text-center text-gray-700 tabular-nums font-bold">
                                        {new Date(request.start_date).toLocaleDateString('vi-VN')} - {new Date(request.end_date).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-2 justify-center flex-wrap">
                                            {request.request_approvals?.map((app: any) => (
                                                <div
                                                    key={app.id}
                                                    title={`${app.room_areas?.name || 'Area'}: ${app.status}`}
                                                    className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                                                    style={{
                                                        background: getStatusColor(app.status),
                                                        boxShadow: `0 0 4px ${getStatusColor(app.status)}55`
                                                    }}
                                                />
                                            ))}
                                            {(!request.request_approvals || request.request_approvals.length === 0) && (
                                                <span className="text-[10px] text-gray-400 italic">No areas</span>
                                            )}
                                        </div>
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
                                    <td className="px-6 py-5 text-right pr-8">
                                        <button className="text-[11px] font-black text-[#db011c] uppercase tracking-tighter hover:underline">
                                            View Details &rarr;
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-gray-400 bg-gray-50/30">
                                        <div className="text-3xl mb-3 opacity-30">📄</div>
                                        <div className="font-bold text-gray-400 text-sm">No requests found matching your filters.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-200">
                        <button 
                            disabled={pagination.page === 1 || loading}
                            onClick={(e) => { e.stopPropagation(); fetchMyRequests(pagination.page - 1); }}
                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map(pageNum => (
                                <button
                                    key={pageNum}
                                    onClick={(e) => { e.stopPropagation(); fetchMyRequests(pageNum); }}
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
                            onClick={(e) => { e.stopPropagation(); fetchMyRequests(pagination.page + 1); }}
                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

                {/* MODAL OVERLAY */}
                {selectedRequest && (() => {
                    const details = parseDetails(selectedRequest.details);
                    return (
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100] p-4 pt-20"
                            onClick={() => setSelectedRequest(null)}
                        >
                            <div
                                className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative text-[#0f172a] animate-in zoom-in-95 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 px-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
                                    <h2 className="text-xl font-extrabold text-[#0f172a]">Application Details</h2>
                                    <button
                                        onClick={() => setSelectedRequest(null)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                    >
                                        &times;
                                    </button>
                                </div>

                                <div className="p-8">
                                    <div className="flex flex-wrap gap-4 justify-between items-start mb-10">
                                        <div>
                                            {(() => {
                                                try {
                                                    const visitorsList = selectedRequest.visitors ? JSON.parse(selectedRequest.visitors) : [];
                                                    if (visitorsList && visitorsList.length > 0) {
                                                        return visitorsList.map((v: any, i: number) => (
                                                            <div key={i} className="mb-4">
                                                                <h3 className="text-3xl font-extrabold text-[#0f172a] mb-1">{v.name}</h3>
                                                                <p className="text-gray-500 font-medium">{v.title} @ {v.company}</p>
                                                            </div>
                                                        ));
                                                    }
                                                } catch (e) {}
                                                return (
                                                    <div className="mb-4">
                                                        <h3 className="text-3xl font-extrabold text-[#0f172a] mb-2">{selectedRequest.visitor_name}</h3>
                                                        <p className="text-gray-500 font-medium">{selectedRequest.visitor_title} @ {selectedRequest.current_company}</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="text-left">
                                            <span className="px-5 py-2 rounded-full text-sm font-extrabold inline-block" style={{
                                                background: getStatusColor(selectedRequest.status) + '15',
                                                color: getStatusColor(selectedRequest.status),
                                            }}>
                                                {selectedRequest.status}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-3 font-medium">Ref: {selectedRequest.id.split('-')[0].toUpperCase()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Visit Dates</label>
                                            <p className="font-bold text-[#0f172a]">{new Date(selectedRequest.start_date).toLocaleDateString()} &mdash; {new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Visit Purpose</label>
                                            <p className="font-bold text-[#0f172a]">{selectedRequest.purpose_of_visit}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Visitor Category</label>
                                            <p className="font-bold text-[#0f172a]">{selectedRequest.visitor_category}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Visiting Site</label>
                                            <p className="font-bold text-[#0f172a]">{selectedRequest.visiting_site || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Cost Center</label>
                                            <p className="font-bold text-[#0f172a]">{details.costCenter || 'N/A'}</p>
                                        </div>
                                        {selectedRequest.purpose_detail && (
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Detail of Purpose</label>
                                                <p className="font-bold text-[#0f172a] whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100">{selectedRequest.purpose_detail}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-10">
                                        <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Area Approvals</label>
                                        <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                            {selectedRequest.request_approvals?.map((app: any, idx: number) => (
                                                <div key={app.id} className={`p-5 px-6 flex justify-between items-center ${idx !== selectedRequest.request_approvals.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                                    <div>
                                                        <div className="font-bold text-sm text-[#0f172a] mb-1">{app.room_areas?.name || 'Unknown Area'}</div>
                                                        <div className="text-xs text-gray-500 font-medium">Approver: <span className="text-[#db011c] font-bold">{app.approver_email}</span></div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[0.7rem] font-extrabold uppercase flex items-center justify-end gap-2" style={{ color: getStatusColor(app.status) }}>
                                                            <span className="w-2 h-2 rounded-full" style={{ background: getStatusColor(app.status) }} />
                                                            {app.status}
                                                        </span>
                                                        {app.acted_at && <div className="text-[0.65rem] text-gray-400 mt-1 font-medium">Processed on {new Date(app.acted_at).toLocaleDateString()}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedRequest.request_approvals || selectedRequest.request_approvals.length === 0) && (
                                                <div className="p-8 text-center text-gray-400 text-sm font-medium">No specific areas were selected for this request.</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-8">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Factory Tour</label>
                                            <p className="font-bold text-[#0f172a]">{details.factoryTour || 'No'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Meal Registration</label>
                                            <p className="font-bold text-[#0f172a]">{details.mealRegistration || 'No'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 px-8 bg-gray-50 flex justify-end gap-4 rounded-b-3xl border-t border-gray-100">
                                    <button onClick={() => setSelectedRequest(null)} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors bg-white">Close</button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

        </div>
    );
}
