'use client';

import React from 'react';
import type {
    VisitorDashboardRequestRecord,
    VisitorDashboardPagination,
    VisitorDashboardTab,
    VisitorDashboardParsedDetails,
} from '@/types/visitor-dashboard.types';

export interface VisitorDashboardTableProps {
    requests: VisitorDashboardRequestRecord[];
    activeTab: VisitorDashboardTab;
    loading: boolean;
    pagination: VisitorDashboardPagination;
    submitterEmail?: string;
    onPageChange: (page: number) => void;
    onView: (request: VisitorDashboardRequestRecord) => void;
    onEdit: (request: VisitorDashboardRequestRecord) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'APPROVED':
        case 'COMPLETE':
            return '#10b981'; // Green
        case 'REJECTED':
            return '#ef4444'; // Red
        default:
            return '#f59e0b'; // Amber
    }
};

const parseDetails = (details: unknown): VisitorDashboardParsedDetails => {
    if (!details) return {};
    if (typeof details === 'object') return details as VisitorDashboardParsedDetails;
    try {
        return JSON.parse(details as string) as VisitorDashboardParsedDetails;
    } catch {
        return {};
    }
};

export function VisitorDashboardTable({
    requests,
    activeTab,
    loading,
    pagination,
    submitterEmail,
    onPageChange,
    onView,
    onEdit,
}: VisitorDashboardTableProps) {
    const renderGeneralRow = (request: VisitorDashboardRequestRecord) => {
        let visitorCountSuffix = '';
        if (request.visitors) {
            try {
                const parsed = JSON.parse(request.visitors);
                if (Array.isArray(parsed) && parsed.length > 1) {
                    visitorCountSuffix = ` (+ ${parsed.length - 1})`;
                }
            } catch {
                // Ignore parse error
            }
        }

        return (
            <tr
                key={request.id}
                className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors"
                onClick={() => onView(request)}
            >
                <td className="px-6 py-5">
                    <span className="text-[11px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        #{request.id.split('-')[0].toUpperCase()}
                    </span>
                </td>
                <td className="px-6 py-5">
                    <div className="font-extrabold text-[#0f172a] text-[14px]">
                        {request.visitor_name}
                        {visitorCountSuffix}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 tracking-tight">
                        {request.current_company} / {request.visitor_title}
                    </div>
                </td>
                <td className="px-6 py-5 text-center">
                    <span className="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        {request.visitor_category}
                    </span>
                </td>
                <td className="px-6 py-5 text-center text-gray-700 tabular-nums font-bold">
                    {new Date(request.start_date).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(request.end_date).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                    })}
                </td>
                <td className="px-6 py-5">
                    <div className="flex gap-2 justify-center flex-wrap">
                        {request.request_approvals?.map((app) => {
                            const isPendingManager =
                                (app.approver_email === 'Pending Manager Assignment' ||
                                    app.approver_email === 'Manager Approval' ||
                                    app.approver_email === null ||
                                    (app.approver_email === submitterEmail && !app.room_areas?.name)) &&
                                app.status === 'PENDING';
                            const areaName =
                                app.room_areas?.name ||
                                (request.visitor_category !== 'MIL/TTI Expat / SHTP Business trip'
                                    ? 'Manager Approval'
                                    : 'VP Approval');
                            const tooltip = isPendingManager
                                ? `${areaName}: Routing to Line Manager...`
                                : `${areaName} (${app.approver_email || 'Approver'}): ${app.status}`;

                            return (
                                <div
                                    key={app.id}
                                    title={tooltip}
                                    className="w-2.5 h-2.5 rounded-full border border-white shadow-sm cursor-pointer"
                                    style={{
                                        background: getStatusColor(app.status),
                                        boxShadow: `0 0 4px ${getStatusColor(app.status)}55`,
                                    }}
                                />
                            );
                        })}
                        {(!request.request_approvals || request.request_approvals.length === 0) && (
                            <span className="text-[10px] text-gray-400 italic">No areas</span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-5 text-center">
                    <span
                        className="inline-block px-3 py-1 rounded-md text-[10px] font-black tracking-tighter uppercase"
                        style={{
                            background: getStatusColor(request.status) + '15',
                            color: getStatusColor(request.status),
                            border: `1px solid ${getStatusColor(request.status)}30`,
                        }}
                    >
                        {request.status}
                    </span>
                </td>
                <td className="px-6 py-5 text-right pr-8">
                    <button className="text-[11px] font-black text-[#db011c] uppercase tracking-tighter hover:underline">
                        View Details &rarr;
                    </button>
                </td>
            </tr>
        );
    };

    const renderIntervieweeRow = (request: VisitorDashboardRequestRecord) => {
        let visitorCountSuffix = '';
        let dept = '';
        let interviewer = '';

        if (request.visitors) {
            try {
                const parsed = JSON.parse(request.visitors);
                if (Array.isArray(parsed) && parsed.length > 1) {
                    visitorCountSuffix = ` (+ ${parsed.length - 1})`;
                }
                if (Array.isArray(parsed) && parsed.length > 0) {
                    dept = parsed[0].interviewDepartment || parsed[0].company || '';
                    interviewer = parsed[0].interviewerName || '';
                }
            } catch {
                // Ignore parse error
            }
        }

        const dt = parseDetails(request.details);
        const editCount = request.edit_count || request.editCount || 0;

        return (
            <tr
                key={request.id}
                className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors"
                onClick={() => onView(request)}
            >
                <td className="px-6 py-5">
                    <span className="text-[11px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        #{request.id.split('-')[0].toUpperCase()}
                    </span>
                </td>
                <td className="px-6 py-5">
                    <div className="font-extrabold text-[#0f172a] text-[14px]">
                        {request.visitor_name}
                        {visitorCountSuffix}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 tracking-tight">
                        {request.visitor_title || 'Candidate'}
                    </div>
                </td>
                <td className="px-6 py-5">
                    <div className="font-bold text-[#0f172a] text-[12px]">
                        Dept: {dept || request.current_company || '—'}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 tracking-tight">
                        By: {interviewer || '—'}
                    </div>
                </td>
                <td className="px-6 py-5 text-center text-gray-700 tabular-nums font-bold">
                    {new Date(request.start_date).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                    })}
                </td>
                <td className="px-6 py-5 text-center text-gray-700 tabular-nums font-bold">
                    {dt?.startTime || '—'}
                </td>
                <td className="px-6 py-5 text-center text-[11px] text-gray-600">
                    {request.purpose_detail || dt?.interviewArea || '—'}
                </td>
                <td className="px-6 py-5 text-right pr-8">
                    <div className="flex items-center justify-end gap-2">
                        {editCount < 3 ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(request);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                                title={`Edit Request (${3 - editCount} edits remaining)`}
                            >
                                Edit ({editCount}/3)
                            </button>
                        ) : (
                            <span
                                className="px-2.5 py-1 text-[10px] font-bold text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                                title="Maximum 3 edits reached"
                            >
                                Max Edits (3/3)
                            </span>
                        )}
                        <button
                            onClick={() => onView(request)}
                            className="text-[11px] font-black text-[#db011c] uppercase tracking-tighter hover:underline ml-1"
                        >
                            View Details &rarr;
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-200 text-[#0f172a]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        {activeTab === 'general' ? (
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Visitor request code</th>
                                <th className="px-6 py-4">Visitor / Company</th>
                                <th className="px-6 py-4 text-center">Category</th>
                                <th className="px-6 py-4 text-center">Visit Period</th>
                                <th className="px-6 py-4 text-center">Workflows</th>
                                <th className="px-6 py-4 text-center">Overall Status</th>
                                <th className="px-6 py-4 text-right pr-10">Details</th>
                            </tr>
                        ) : (
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Visitor request code</th>
                                <th className="px-6 py-4">Interviewee</th>
                                <th className="px-6 py-4">Department / Interviewer</th>
                                <th className="px-6 py-4 text-center">Schedule Date</th>
                                <th className="px-6 py-4 text-center">Schedule Time</th>
                                <th className="px-6 py-4 text-center">Area</th>
                                <th className="px-6 py-4 text-right pr-10">Details</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="text-[13px] font-medium bg-white">
                        {requests.map((request) =>
                            activeTab === 'general' ? renderGeneralRow(request) : renderIntervieweeRow(request)
                        )}
                        {requests.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="p-20 text-center text-gray-400 bg-gray-50/30">
                                    <div className="text-3xl mb-3 opacity-30">📄</div>
                                    <div className="font-bold text-gray-400 text-sm">
                                        No requests found matching your filters.
                                    </div>
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
                        onClick={(e) => {
                            e.stopPropagation();
                            onPageChange(pagination.page - 1);
                        }}
                        className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPageChange(pageNum);
                                }}
                                className={`w-8 h-8 text-[11px] font-black rounded-lg transition-all ${
                                    pagination.page === pageNum
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
                        onClick={(e) => {
                            e.stopPropagation();
                            onPageChange(pagination.page + 1);
                        }}
                        className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
