import React from 'react';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type {
    VisitorAdminRequestRecord,
    VisitorAdminPagination,
    VisitorAdminApprovalRecord,
} from '@/types/visitor-admin.types';

export interface VisitorAdminTableProps {
    activeTab: 'general' | 'interviewee';
    requests: VisitorAdminRequestRecord[];
    loading: boolean;
    selectedRowIds: string[];
    onSelectRow: (id: string, selected: boolean) => void;
    onSelectAll: (selected: boolean) => void;
    onView: (request: VisitorAdminRequestRecord) => void;
    onEdit: (request: VisitorAdminRequestRecord) => void;
    onUpdateStatus: (id: string, status: string) => void;
    pagination: VisitorAdminPagination;
    onPageChange: (page: number) => void;
}

const parseDetails = (details: unknown): Record<string, any> => {
    if (!details) return {};
    if (typeof details === 'object') return details as Record<string, any>;
    if (typeof details === 'string') {
        try {
            return JSON.parse(details);
        } catch (e) {
            console.error("Error parsing details JSON", e);
            return {};
        }
    }
    return {};
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETE':
        case 'APPROVED': return '#10b981';
        case 'REJECTED': return '#ef4444';
        case 'PENDING':
        case 'IN PROCESS':
        default: return '#f59e0b';
    }
};

export default function VisitorAdminTable({
    activeTab,
    requests,
    loading,
    selectedRowIds,
    onSelectRow,
    onSelectAll,
    onView,
    onEdit,
    onUpdateStatus,
    pagination,
    onPageChange,
}: VisitorAdminTableProps) {
    const isAllSelected = requests.length > 0 && selectedRowIds.length === requests.length;

    return (
        <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-200 text-[#0f172a] max-w-[calc(100vw-2rem)]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        {activeTab === 'general' ? (
                            <tr className="bg-[#1a1a1a] text-white border-b border-gray-800 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-3 py-2 w-8">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllSelected}
                                        onChange={(e) => onSelectAll(e.target.checked)}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-3 py-2">Code</th>
                                <th className="px-3 py-2">Visitor Name</th>
                                <th className="px-3 py-2">Company</th>
                                <th className="px-3 py-2">Title</th>
                                <th className="px-3 py-2">Category</th>
                                <th className="px-3 py-2 text-center">Site</th>
                                <th className="px-3 py-2">Submitter</th>
                                <th className="px-3 py-2 text-center">Start Date</th>
                                <th className="px-3 py-2 text-center">End Date</th>
                                <th className="px-3 py-2 text-center">Factory Tour</th>
                                <th className="px-3 py-2">Approval Progress</th>
                                <th className="px-3 py-2 text-center">Status</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                        ) : (
                            <tr className="bg-[#1a1a1a] text-white border-b border-gray-800 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-3 py-2 w-8">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllSelected}
                                        onChange={(e) => onSelectAll(e.target.checked)}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-3 py-2">Code</th>
                                <th className="px-3 py-2">Interviewee Name</th>
                                <th className="px-3 py-2">Submitter</th>
                                <th className="px-3 py-2">Job Title</th>
                                <th className="px-3 py-2">Interviewer</th>
                                <th className="px-3 py-2 text-center">Site</th>
                                <th className="px-3 py-2 text-center">Start Date</th>
                                <th className="px-3 py-2 text-center">Start Time</th>
                                <th className="px-3 py-2 text-center">Area</th>
                                <th className="px-3 py-2 text-center">Status</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="text-[12px] font-medium bg-white">
                        {requests.map((request) => (
                            activeTab === 'general' ? (
                                <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-3 py-2">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedRowIds.includes(request.id)}
                                            onChange={(e) => onSelectRow(request.id, e.target.checked)}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                        />
                                    </td>
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
                                    </td>
                                    <td className="px-3 py-2 text-[11px] text-gray-600 truncate max-w-[100px]">
                                        {request.current_company || '-'}
                                    </td>
                                    <td className="px-3 py-2 text-[11px] text-gray-600 truncate max-w-[100px]">
                                        {request.visitor_title || '-'}
                                    </td>
                                    <td className="px-3 py-2 text-[11px] text-gray-600 truncate max-w-[100px]">
                                        {request.visitor_category}
                                    </td>
                                    <td className="px-3 py-2 text-center whitespace-nowrap">
                                        {request.visiting_site ? (
                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                {request.visiting_site}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-[11px]">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="font-bold text-[#0f172a] truncate max-w-[250px]" title={request.profiles?.name || undefined}>{request.profiles?.name}</div>
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                        {new Date(request.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                        {new Date(request.end_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-3 py-2 text-center font-bold text-[10px]">
                                        {(() => {
                                            const d = parseDetails(request.details);
                                            return d.factoryTour === 'Yes'
                                                ? <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Yes</span>
                                                : <span className="text-gray-400">No</span>;
                                        })()}
                                    </td>
                                    <td className="px-3 py-2">
                                        {(request.request_approvals?.length ?? 0) > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {request.request_approvals?.map((app: VisitorAdminApprovalRecord) => (
                                                    <div key={app.id} className="text-[9px] flex flex-col gap-0.5 text-gray-600 border border-gray-100 p-1 rounded bg-gray-50/50">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-bold flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(app.status) }}></span>
                                                                <span className="truncate max-w-[80px]">
                                                                    {app.room_areas?.name || (request.visitor_category !== 'MIL/TTI Expat / SHTP Business trip' ? 'Manager Approval' : 'VP Approval')}
                                                                </span>
                                                            </span>
                                                        </div>
                                                        {app.approver_email && (
                                                            <span className="text-[8px] text-gray-400 font-medium truncate max-w-[120px]" title={`${app.status === 'PENDING' ? 'Pending at' : (app.status === 'APPROVED' ? 'Approved by' : 'Rejected by')}: ${app.approver_email}`}>
                                                                {app.status === 'PENDING' ? 'P:' : (app.status === 'APPROVED' ? 'A:' : 'R:')} {app.approver_email.split('@')[0]}
                                                            </span>
                                                        )}
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
                                        {(request.status === 'COMPLETE' || request.status === 'APPROVED') && request.updated_at && (
                                            <div className="text-[9px] text-gray-400 font-medium mt-0.5" title="Completion Date">
                                                {new Date(request.updated_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => onEdit(request)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-200 cursor-pointer"
                                                title="Edit Request"
                                                aria-label="Edit Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                                </svg>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => onView(request)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200 cursor-pointer"
                                                title="View Details"
                                                aria-label="View Details"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => onUpdateStatus(request.id, 'COMPLETE')} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-white bg-green-500 hover:bg-green-600 transition-all shadow-sm group relative cursor-pointer"
                                                title="Approve Request"
                                                aria-label="Approve Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => onUpdateStatus(request.id, 'REJECTED')} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 bg-gray-100 hover:bg-red-50 hover:text-red-600 border border-gray-200 transition-all group cursor-pointer"
                                                title="Reject Request"
                                                aria-label="Reject Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-3 py-2">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedRowIds.includes(request.id)}
                                            onChange={(e) => onSelectRow(request.id, e.target.checked)}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                            #{request.id.split('-')[0].toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="font-extrabold text-[#0f172a] truncate max-w-[150px]">
                                            {request.visitor_name || request.interviewee_name}
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
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="font-bold text-[#0f172a] text-[11px] truncate max-w-[150px]" title={request.profile_name || request.profiles?.name || request.os_name || undefined}>
                                            {request.profile_name || request.profiles?.name || request.os_name || '-'}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-[11px] text-gray-600 truncate max-w-[100px]">
                                        {request.visitor_title || request.job_title || '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="font-bold text-[#0f172a] text-[11px] truncate max-w-[120px]">
                                            {(() => {
                                                if (request.visitors) {
                                                    try {
                                                        const v = JSON.parse(request.visitors);
                                                        return v[0]?.interviewerName;
                                                    } catch(e) {}
                                                }
                                                return request.interviewer_name || '-';
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center whitespace-nowrap">
                                        {request.visiting_site ? (
                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                {request.visiting_site}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-[11px]">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                        {new Date(request.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                        {(() => {
                                            const d = parseDetails(request.details);
                                            return (d.startTime as string) || request.start_time || '-';
                                        })()}
                                    </td>
                                    <td className="px-3 py-2 text-center text-[10px] text-gray-600 truncate max-w-[100px]">
                                        {request.purpose_detail || (() => {
                                            const d = parseDetails(request.details);
                                            return (d.interviewArea as string) || request.interview_area || '-';
                                        })()}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-tighter uppercase" style={{
                                            background: getStatusColor(request.status) + '15',
                                            color: getStatusColor(request.status),
                                            border: `1px solid ${getStatusColor(request.status)}30`
                                        }}>
                                            {request.status}
                                        </span>
                                        {(request.status === 'COMPLETE' || request.status === 'APPROVED') && (request.updated_at || request.created_at) && (
                                            <div className="text-[9px] text-gray-400 font-medium mt-0.5" title="Completion Date">
                                                {new Date(request.updated_at || request.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => onEdit(request)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-200 cursor-pointer"
                                                title="Edit Request"
                                                aria-label="Edit Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                                </svg>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => onView(request)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200 cursor-pointer"
                                                title="View Details"
                                                aria-label="View Details"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => onUpdateStatus(request.id, 'COMPLETE')} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-white bg-green-500 hover:bg-green-600 transition-all shadow-sm group relative cursor-pointer"
                                                title="Approve Request"
                                                aria-label="Approve Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => onUpdateStatus(request.id, 'REJECTED')} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 bg-gray-100 hover:bg-red-50 hover:text-red-600 border border-gray-200 transition-all group cursor-pointer"
                                                title="Reject Request"
                                                aria-label="Reject Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        ))}
                        {loading && (
                            <TableSkeleton rows={8} columns={14} />
                        )}
                        {requests.length === 0 && !loading && (
                            <tr>
                                <td colSpan={14} className="py-12">
                                    <EmptyState
                                        title="No results matching your filters"
                                        description="Try adjusting your search criteria, status filters, or date range."
                                    />
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
                        onClick={() => onPageChange(pagination.page - 1)}
                        className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                            .filter(pageNum => pageNum === 1 || pageNum === pagination.totalPages || (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2))
                            .map((pageNum, idx, arr) => {
                                const prev = arr[idx - 1];
                                return (
                                    <div key={pageNum} className="flex items-center gap-1.5">
                                        {prev && pageNum - prev > 1 && (
                                            <span className="px-1 text-gray-400 font-bold text-xs select-none">...</span>
                                        )}
                                        <button
                                            onClick={() => onPageChange(pageNum)}
                                            className={`w-8 h-8 text-[11px] font-black rounded-lg transition-all ${pagination.page === pageNum 
                                                ? 'bg-[#db011c] text-white shadow-md' 
                                                : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    </div>
                                );
                            })
                        }
                    </div>
                    <button 
                        disabled={pagination.page === pagination.totalPages || loading}
                        onClick={() => onPageChange(pagination.page + 1)}
                        className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
