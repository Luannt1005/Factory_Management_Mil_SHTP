'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
    CalendarDaysIcon,
    DocumentTextIcon,
    UserGroupIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    BuildingOfficeIcon,
    IdentificationIcon,
    TagIcon,
    ClockIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import type {
    VisitorDashboardRequestRecord,
    VisitorDashboardTab,
    VisitorDashboardParsedDetails,
} from '@/types/visitor-dashboard.types';

export interface VisitorDetailModalProps {
    request: VisitorDashboardRequestRecord | null;
    activeTab: VisitorDashboardTab;
    mounted: boolean;
    submitterEmail?: string;
    onClose: () => void;
    onEdit?: (request: VisitorDashboardRequestRecord) => void;
}

interface VisitorItemInfo {
    name?: string;
    company?: string;
    title?: string;
    email?: string;
    interviewDepartment?: string;
    interviewerName?: string;
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

interface RowProps {
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    value?: React.ReactNode;
    children?: React.ReactNode;
}

function DetailRow({ icon: Icon, label, value, children }: RowProps) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3 text-gray-500 w-1/3 min-w-[140px]">
                {Icon && <Icon className="w-5 h-5 text-gray-400" />}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="text-right flex-1 text-sm font-bold text-[#0f172a] flex justify-end">
                {children || value}
            </div>
        </div>
    );
}

export function VisitorDetailModal({
    request,
    activeTab,
    mounted,
    submitterEmail,
    onClose,
    onEdit,
}: VisitorDetailModalProps) {
    if (!request || !mounted) return null;

    const details = parseDetails(request.details);

    let visitorsList: VisitorItemInfo[] = [];
    try {
        visitorsList = request.visitors ? JSON.parse(request.visitors) : [];
    } catch {
        visitorsList = [];
    }

    if (!visitorsList || visitorsList.length === 0) {
        visitorsList = [
            {
                name: request.visitor_name || 'Unknown',
                company: request.current_company || '',
                title: request.visitor_title || '',
                email: '',
            },
        ];
    }

    const editCount = request.edit_count || request.editCount || 0;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative text-[#0f172a] animate-in zoom-in-95 duration-200 border-t-[6px] border-[#db011c]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6 md:p-8">
                    {activeTab === 'general' ? (
                        <>
                            <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Visitors ({visitorsList.length})
                                </h3>
                                <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {visitorsList.map((v, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-[#db011c] shrink-0"></div>
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 overflow-hidden">
                                                <h2 className="text-sm font-bold text-[#0f172a] truncate">
                                                    {v.name}
                                                </h2>
                                                <p className="text-xs text-gray-500 truncate font-medium">
                                                    {v.title ? `${v.title} @ ` : ''}
                                                    {v.company || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <DetailRow
                                    icon={IdentificationIcon}
                                    label="Request Ref"
                                    value={request.id.split('-')[0].toUpperCase()}
                                />
                                <DetailRow icon={TagIcon} label="Status">
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                                        style={{
                                            background: getStatusColor(request.status) + '15',
                                            color: getStatusColor(request.status),
                                        }}
                                    >
                                        <span
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ background: getStatusColor(request.status) }}
                                        ></span>
                                        {request.status}
                                    </span>
                                </DetailRow>
                                <DetailRow
                                    icon={UserGroupIcon}
                                    label="Visitor Category"
                                    value={request.visitor_category}
                                />
                                <DetailRow
                                    icon={CalendarDaysIcon}
                                    label="Visit Dates"
                                    value={`${new Date(request.start_date).toLocaleDateString('en-US', {
                                        month: '2-digit',
                                        day: '2-digit',
                                        year: 'numeric',
                                    })} — ${new Date(request.end_date).toLocaleDateString('en-US', {
                                        month: '2-digit',
                                        day: '2-digit',
                                        year: 'numeric',
                                    })}`}
                                />
                                <DetailRow icon={DocumentTextIcon} label="Purpose">
                                    <div className="text-right">
                                        <div>{request.purpose_of_visit}</div>
                                        {request.purpose_detail && (
                                            <div className="text-xs text-gray-400 font-normal mt-1">
                                                {request.purpose_detail}
                                            </div>
                                        )}
                                    </div>
                                </DetailRow>
                                <DetailRow
                                    icon={BuildingOfficeIcon}
                                    label="Visiting Site"
                                    value={request.visiting_site || 'N/A'}
                                />
                                <DetailRow
                                    icon={CurrencyDollarIcon}
                                    label="Cost Center"
                                    value={details.costCenter || 'N/A'}
                                />
                                <DetailRow
                                    icon={MapPinIcon}
                                    label="Factory Tour"
                                    value={details.factoryTour || 'No'}
                                />

                                {request.request_approvals && request.request_approvals.length > 0 && (
                                    <DetailRow icon={ShieldCheckIcon} label="Area Approvals">
                                        <div className="flex flex-col gap-2 w-full items-end">
                                            {request.request_approvals.map((app) => {
                                                const isPendingManagerRouting =
                                                    (app.approver_email === 'Pending Manager Assignment' ||
                                                        app.approver_email === 'Manager Approval' ||
                                                        app.approver_email === null ||
                                                        (app.approver_email === submitterEmail &&
                                                            !app.room_areas?.name)) &&
                                                    app.status === 'PENDING';

                                                return (
                                                    <div key={app.id} className="flex flex-col items-end gap-0.5">
                                                        <span
                                                            className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                                                            style={{
                                                                color: getStatusColor(app.status),
                                                                background: getStatusColor(app.status) + '15',
                                                                border: `1px solid ${getStatusColor(app.status)}30`,
                                                            }}
                                                        >
                                                            {app.room_areas?.name ||
                                                                (request.visitor_category !==
                                                                'MIL/TTI Expat / SHTP Business trip'
                                                                    ? 'Manager Approval'
                                                                    : 'VP Approval')}
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full ml-1"
                                                                style={{ background: getStatusColor(app.status) }}
                                                            ></span>
                                                        </span>
                                                        {isPendingManagerRouting ? (
                                                            <span className="text-[10px] text-amber-600 font-bold inline-flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse mt-0.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                                                Pending: Routing to Line Manager...
                                                            </span>
                                                        ) : app.approver_email ? (
                                                            <span className="text-[10px] text-gray-500 font-medium break-all mt-0.5">
                                                                {app.status === 'PENDING'
                                                                    ? 'Pending at:'
                                                                    : app.status === 'APPROVED'
                                                                    ? 'Approved by:'
                                                                    : 'Rejected by:'}{' '}
                                                                <span className="font-bold text-gray-700">
                                                                    {app.approver_email}
                                                                </span>
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </DetailRow>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Candidates ({visitorsList.length})
                                </h3>
                                <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {visitorsList.map((v, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-[#db011c] shrink-0"></div>
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 overflow-hidden">
                                                <h2 className="text-sm font-bold text-[#0f172a] truncate">
                                                    {v.name || request.interviewee_name || 'Candidate'}
                                                </h2>
                                                <p className="text-xs text-gray-500 truncate font-medium">
                                                    {v.title || request.job_title
                                                        ? `${v.title || request.job_title} `
                                                        : ''}
                                                    {v.interviewDepartment
                                                        ? `• ${v.interviewDepartment} `
                                                        : v.company
                                                        ? `@ ${v.company} `
                                                        : ''}
                                                    {v.interviewerName
                                                        ? `(Interviewer: ${v.interviewerName})`
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <DetailRow
                                    icon={IdentificationIcon}
                                    label="Request Ref"
                                    value={(request.id || request.visitor_code)?.split('-')[0]?.toUpperCase()}
                                />
                                <DetailRow icon={TagIcon} label="Status">
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                                        style={{
                                            background: getStatusColor(request.status) + '15',
                                            color: getStatusColor(request.status),
                                        }}
                                    >
                                        <span
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ background: getStatusColor(request.status) }}
                                        ></span>
                                        {request.status}
                                    </span>
                                </DetailRow>
                                <DetailRow icon={UserGroupIcon} label="Category" value="Interviewee" />
                                <DetailRow
                                    icon={CalendarDaysIcon}
                                    label="Schedule Date"
                                    value={new Date(request.start_date).toLocaleDateString('en-US', {
                                        month: '2-digit',
                                        day: '2-digit',
                                        year: 'numeric',
                                    })}
                                />
                                <DetailRow
                                    icon={ClockIcon}
                                    label="Schedule Time"
                                    value={details.startTime || request.start_time || '—'}
                                />
                                <DetailRow
                                    icon={MapPinIcon}
                                    label="Interview Area"
                                    value={
                                        request.purpose_detail ||
                                        details.interviewArea ||
                                        request.interview_area ||
                                        '—'
                                    }
                                />
                                <DetailRow
                                    icon={BuildingOfficeIcon}
                                    label="Visiting Site"
                                    value={request.visiting_site || 'SHTP'}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 px-8 bg-gray-50 rounded-b-xl border-t border-gray-100 flex justify-end items-center">
                    {activeTab === 'interviewee' ? (
                        <div>
                            {editCount < 3 ? (
                                <button
                                    onClick={() => {
                                        if (onEdit) {
                                            onEdit(request);
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-[#db011c] hover:bg-[#b00116] text-white text-sm font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                        stroke="currentColor"
                                        className="w-4 h-4"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                                        />
                                    </svg>
                                    Edit Request ({3 - editCount} edits left)
                                </button>
                            ) : (
                                <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg flex items-center gap-1.5">
                                    <span>⚠️ Max edit limit reached (3/3)</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-[#db011c] hover:bg-[#b00116] text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
