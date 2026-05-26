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
    const [category, setCategory] = useState('');
    const [exporting, setExporting] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchRequests(1);
    }, [startDate, endDate, category]);

    const fetchRequests = async (page: number) => {
        setLoading(true);
        try {
            let url = `/api/visitor_admin/requests?page=${page}&limit=${pagination.limit}`;
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            if (category) {
                url += `&category=${encodeURIComponent(category)}`;
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

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            let url = `/api/visitor_admin/requests?page=1&limit=999999`;
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            if (category) {
                url += `&category=${encodeURIComponent(category)}`;
            }
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const XLSX = await import('xlsx');
                
                const exportData = data.requests.map((r: any) => {
                    const details = parseDetails(r.details);
                    return {
                        'Code': '#' + r.id.split('-')[0].toUpperCase(),
                        'Visitor Name': r.visitors ? (function(){try{return JSON.parse(r.visitors).map((v:any) => `${v.name} (${v.title})`).join(', ');}catch(e){return r.visitor_name;}}()) : r.visitor_name,
                        'Current Company': r.current_company,
                        'Submitter Name': r.profiles?.name,
                        'Submitter Department': r.profiles?.department,
                        'Start Date': new Date(r.start_date).toLocaleDateString('vi-VN'),
                        'End Date': new Date(r.end_date).toLocaleDateString('vi-VN'),
                        'Visitor Category': r.visitor_category,
                        'Purpose Of Visit': r.purpose_of_visit,
                        'Visiting Site': r.visiting_site,
                        'Cost Center': details.costCenter || '',
                        'Status': r.status,
                        'Created At': new Date(r.created_at).toLocaleString('vi-VN')
                    };
                });

                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Visitors");
                XLSX.writeFile(workbook, `Visitor_Requests_${new Date().toISOString().split('T')[0]}.xlsx`);
            }
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
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
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Category</label>
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all h-8"
                        >
                            <option value="">All</option>
                            <option value="Customer">Customer</option>
                            <option value="Vendor / Supplier / Contractor">Vendor / Supplier</option>
                            <option value="Inter-company">Inter-company</option>
                            <option value="Government / Investor / Official">Government / Investor</option>
                            <option value="Interviewee">Interviewee</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    {(startDate || endDate || category) && (
                        <button 
                            onClick={() => { setStartDate(''); setEndDate(''); setCategory(''); }}
                            className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
                        >
                            Clear
                        </button>
                    )}
                    <button
                        onClick={handleExportExcel}
                        disabled={exporting}
                        className="text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] px-3 py-1.5 rounded-md transition-all ml-2"
                    >
                        {exporting ? 'Exporting...' : 'Export Excel'}
                    </button>
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
                                <th className="px-3 py-2">Code</th>
                                <th className="px-3 py-2">Visitor Info</th>
                                <th className="px-3 py-2">Category</th>
                                <th className="px-3 py-2">Submitter</th>
                                <th className="px-3 py-2 text-center">Start Date</th>
                                <th className="px-3 py-2 text-center">End Date</th>
                                <th className="px-3 py-2">Approval Progress</th>
                                <th className="px-3 py-2 text-center">Status</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-[12px] font-medium bg-white">
                            {requests.map((request) => (
                                <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-3 py-2">
                                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                            #{request.id.split('-')[0].toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="font-extrabold text-[#0f172a] truncate max-w-[120px]">
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
                                        <div className="text-[10px] text-gray-500 mt-0.5 tracking-tight truncate max-w-[120px]">{request.current_company} / {request.visitor_title}</div>
                                    </td>
                                    <td className="px-3 py-2 text-[11px] text-gray-600 truncate max-w-[100px]">
                                        {request.visitor_category}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="font-bold text-[#0f172a] truncate max-w-[120px]">{request.profiles?.name}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[120px]">{request.profiles?.department}</div>
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                        {new Date(request.start_date).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                        {new Date(request.end_date).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-3 py-2">
                                        {request.request_approvals?.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {request.request_approvals.map((app: any) => (
                                                    <div key={app.id} className="text-[9px] flex items-center justify-between gap-2 text-gray-600 border border-gray-100 p-1 rounded bg-gray-50/50">
                                                        <span className="font-bold flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(app.status) }}></span>
                                                            <span className="truncate max-w-[80px]">{app.room_areas?.name || 'Area'}</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-[10px]">No zones</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-tighter uppercase" style={{
                                            background: getStatusColor(request.status) + '15',
                                            color: getStatusColor(request.status),
                                            border: `1px solid ${getStatusColor(request.status)}30`
                                        }}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setSelectedRequest(request)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200"
                                                title="View Details"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
                                            </button>
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
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
                                <h2 className="text-lg font-extrabold text-[#0f172a]">App Details</h2>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="flex flex-wrap gap-4 justify-between items-start mb-4">
                                    <div>
                                        {(() => {
                                            try {
                                                const visitorsList = selectedRequest.visitors ? JSON.parse(selectedRequest.visitors) : [];
                                                if (visitorsList && visitorsList.length > 0) {
                                                    return visitorsList.map((v: any, i: number) => (
                                                        <div key={i} className="mb-2">
                                                            <h3 className="text-xl font-extrabold text-[#0f172a] leading-tight">{v.name}</h3>
                                                            <p className="text-gray-500 font-medium text-xs">{v.title} @ {v.company}</p>
                                                        </div>
                                                    ));
                                                }
                                            } catch (e) {}
                                            return (
                                                <div className="mb-2">
                                                    <h3 className="text-xl font-extrabold text-[#0f172a] leading-tight">{selectedRequest.visitor_name}</h3>
                                                    <p className="text-gray-500 font-medium text-xs">{selectedRequest.visitor_title} @ {selectedRequest.current_company}</p>
                                                </div>
                                            );
                                        })()}
                                        <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            By: <span className="text-[#db011c]">{selectedRequest.profiles?.name}</span> ({selectedRequest.profiles?.department})
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-3 py-1 rounded-full text-xs font-extrabold inline-block" style={{
                                            background: getStatusColor(selectedRequest.status) + '15',
                                            color: getStatusColor(selectedRequest.status),
                                        }}>
                                            {selectedRequest.status}
                                        </span>
                                        <p className="text-[10px] text-gray-400 mt-1 font-medium">Ref: {selectedRequest.id.split('-')[0].toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Start Date</label>
                                        <p className="font-bold text-[#0f172a] text-xs">{new Date(selectedRequest.start_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">End Date</label>
                                        <p className="font-bold text-[#0f172a] text-xs">{new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Visit Purpose</label>
                                        <p className="font-bold text-[#0f172a] text-xs truncate">{selectedRequest.purpose_of_visit}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Category</label>
                                        <p className="font-bold text-[#0f172a] text-xs truncate">{selectedRequest.visitor_category}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Site</label>
                                        <p className="font-bold text-[#0f172a] text-xs truncate">{selectedRequest.visiting_site || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Cost Center</label>
                                        <p className="font-bold text-[#0f172a] text-xs">{details.costCenter || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 mb-4">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex-1">
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Factory Tour</label>
                                        <p className="font-bold text-[#0f172a] text-xs">{details.factoryTour || 'No'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex-1">
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Meal Reg.</label>
                                        <p className="font-bold text-[#0f172a] text-xs">{details.mealRegistration || 'No'}</p>
                                    </div>
                                </div>

                                {selectedRequest.purpose_detail && (
                                    <div className="mb-4">
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Detail of Purpose</label>
                                        <p className="font-bold text-[#0f172a] text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded-lg border border-gray-100 max-h-20 overflow-y-auto">{selectedRequest.purpose_detail}</p>
                                    </div>
                                )}

                                <div className="mb-2">
                                    <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Area Approvals</label>
                                    <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden max-h-32 overflow-y-auto">
                                        {selectedRequest.request_approvals?.map((app: any, idx: number) => (
                                            <div key={app.id} className={`p-2 px-3 flex justify-between items-center ${idx !== selectedRequest.request_approvals.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                                <div>
                                                    <div className="font-bold text-xs text-[#0f172a] mb-0.5">{app.room_areas?.name || 'Unknown'}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium">By: <span className="text-[#db011c] font-bold">{app.approver_email}</span></div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] font-extrabold uppercase flex items-center justify-end gap-1" style={{ color: getStatusColor(app.status) }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(app.status) }} />
                                                        {app.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!selectedRequest.request_approvals || selectedRequest.request_approvals.length === 0) && (
                                            <div className="p-4 text-center text-gray-400 text-xs font-medium">No areas mapped.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 px-4 bg-gray-50 flex justify-end gap-2 rounded-b-3xl border-t border-gray-100">
                                <button onClick={() => setSelectedRequest(null)} className="px-4 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors bg-white">Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
