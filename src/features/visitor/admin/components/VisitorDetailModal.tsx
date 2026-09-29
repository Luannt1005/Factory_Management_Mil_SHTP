import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type {
    VisitorAdminRequestRecord,
    VisitorAdminApprovalRecord,
    VisitorAdminVisitorItem,
} from '@/types/visitor-admin.types';

export interface VisitorDetailModalProps {
    request: VisitorAdminRequestRecord | null;
    activeTab: 'general' | 'interviewee';
    onClose: () => void;
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

export default function VisitorDetailModal({
    request,
    activeTab,
    onClose,
}: VisitorDetailModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!request || !mounted) return null;

    const details = parseDetails(request.details);
    const visitorsList: VisitorAdminVisitorItem[] = (() => {
        try {
            const parsed = request.visitors ? JSON.parse(request.visitors) : [];
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
        return [{
            name: request.visitor_name,
            title: request.visitor_title,
            company: request.current_company
        }];
    })();

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-8"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-2xl max-h-full overflow-y-auto rounded-2xl shadow-2xl relative text-[#0f172a] animate-in zoom-in-95 duration-200 border-t-[8px] border-t-[#db011c] custom-scrollbar flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 pb-2 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{activeTab === 'general' ? `VISITORS (${visitorsList.length})` : 'INTERVIEWEE INFO'}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-2 flex-1">
                    {activeTab === 'general' ? (
                        <>
                            {/* Visitors List */}
                            <div className="flex flex-col gap-1.5 mb-8">
                                {visitorsList.map((v: VisitorAdminVisitorItem, i: number) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-gray-50/50 px-4 py-2.5 rounded-lg border border-gray-100 transition-colors hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[#db011c] shrink-0"></div>
                                            <h3 className="text-sm font-extrabold text-[#0f172a] truncate">{v.name || 'Unnamed'}</h3>
                                        </div>
                                        <div className="flex flex-col text-[11px] text-gray-500 font-medium sm:text-right ml-5 sm:ml-0 gap-0.5">
                                            <span className="truncate max-w-[200px]"><span className="text-gray-400 font-normal">Title:</span> <span className="text-gray-700">{v.title || 'N/A'}</span></span>
                                            <span className="truncate max-w-[200px]"><span className="text-gray-400 font-normal">Company:</span> <span className="text-gray-700">{v.company || 'N/A'}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Candidates List */}
                            <div className="flex flex-col gap-2 mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Candidates ({visitorsList.length})</h3>
                                <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {visitorsList.map((v: VisitorAdminVisitorItem, i: number) => (
                                        <div key={i} className="flex items-center justify-between gap-2 bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-2 h-2 rounded-full bg-[#db011c] shrink-0"></div>
                                                <div className="overflow-hidden">
                                                    <h3 className="text-sm font-extrabold text-[#0f172a] truncate">{v.name || request.visitor_name || request.interviewee_name || 'Candidate'}</h3>
                                                    <p className="text-xs text-gray-500 font-medium truncate">
                                                        {v.title || request.visitor_title || request.job_title || 'Candidate'}
                                                        {v.interviewDepartment ? ` • ${v.interviewDepartment}` : ''}
                                                        {v.interviewerName ? ` (Interviewer: ${v.interviewerName})` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Details List */}
                    <div className="flex flex-col gap-1 border-t border-gray-100 pt-6">
                        {/* Request Ref */}
                        <div className="flex items-center justify-between py-4 border-b border-gray-50">
                            <div className="flex items-center gap-3 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>
                                <span className="text-sm font-medium">Request Ref</span>
                            </div>
                            <div className="font-extrabold text-[#0f172a] text-sm tracking-tight">#{request.id.split('-')[0].toUpperCase()}</div>
                        </div>

                        {/* Submitter */}
                        <div className="flex items-center justify-between py-4 border-b border-gray-50">
                            <div className="flex items-center gap-3 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                                <span className="text-sm font-medium">Submitter</span>
                            </div>
                            <div className="font-extrabold text-[#0f172a] text-sm tracking-tight">{request.profile_name || request.profiles?.name || request.os_name || '-'}</div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between py-4 border-b border-gray-50">
                            <div className="flex items-center gap-3 text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
                                <span className="text-sm font-medium">Status</span>
                            </div>
                            <div>
                                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5" style={{
                                    background: getStatusColor(request.status) + '15',
                                    color: getStatusColor(request.status),
                                    border: `1px solid ${getStatusColor(request.status)}30`
                                }}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(request.status) }}></span>
                                    {request.status}
                                </span>
                            </div>
                        </div>

                        {activeTab === 'general' ? (
                            <>
                                {/* Visitor Category */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                                        <span className="text-sm font-medium">Visitor Category</span>
                                    </div>
                                    <div className="font-extrabold text-[#0f172a] text-sm">{request.visitor_category}</div>
                                </div>

                                {/* Visit Dates */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                        <span className="text-sm font-medium">Visit Dates</span>
                                    </div>
                                    <div className="font-extrabold text-[#0f172a] text-sm">{new Date(request.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} — {new Date(request.end_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
                                </div>

                                {/* Purpose */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                        <span className="text-sm font-medium">Purpose</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-extrabold text-[#0f172a] text-sm">{request.purpose_of_visit}</div>
                                        {request.purpose_detail && <div className="text-[10px] text-gray-400 font-medium mt-1">{request.purpose_detail}</div>}
                                    </div>
                                </div>

                                {/* Visiting Site */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg>
                                        <span className="text-sm font-medium">Visiting Site</span>
                                    </div>
                                    <div className="font-extrabold text-[#0f172a] text-sm">{request.visiting_site || 'N/A'}</div>
                                </div>

                                {/* Cost Center */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                        <span className="text-sm font-medium">Cost Center</span>
                                    </div>
                                    <div className="font-extrabold text-[#0f172a] text-sm">{details.costCenter || 'N/A'}</div>
                                </div>

                                {/* Factory Tour */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                                        <span className="text-sm font-medium">Factory Tour</span>
                                    </div>
                                    <div className="font-extrabold text-[#0f172a] text-sm">{details.factoryTour || 'No'}</div>
                                </div>

                                {/* Area Approvals */}
                                <div className="flex items-start justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                        <span className="text-sm font-medium">Area Approvals</span>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        {request.request_approvals?.map((app: VisitorAdminApprovalRecord) => (
                                            <div key={app.id} className="flex flex-col items-end gap-0.5">
                                                <span className="px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2" style={{
                                                    background: getStatusColor(app.status) + '15',
                                                    color: getStatusColor(app.status),
                                                    border: `1px solid ${getStatusColor(app.status)}35`
                                                }}>
                                                    {app.room_areas?.name || (request.visitor_category === 'MIL/TTI Expat / SHTP Business trip' ? 'VP Approval (All Rooms)' : 'Manager Approval')}
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(app.status) }}></span>
                                                </span>
                                                {app.approver_email && (
                                                    <span className="text-[10px] text-gray-500 font-medium break-all">
                                                        {app.status === 'PENDING' ? 'Pending at:' : (app.status === 'APPROVED' ? 'Approved by:' : 'Rejected by:')} {app.approver_email}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {(!request.request_approvals || request.request_approvals.length === 0) && (
                                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">None</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Category */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                                        <span className="text-sm font-medium">Category</span>
                                    </div>
                                    <div className="font-extrabold text-[#0f172a] text-sm">Interviewee</div>
                                </div>

                                {/* Schedule Date & Time */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                        <span className="text-sm font-medium">Schedule</span>
                                    </div>
                                    <div className="font-extrabold text-[#0f172a] text-sm">
                                        {new Date(request.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} @ {details.startTime || request.start_time || '—'}
                                    </div>
                                </div>

                                {/* Interview Area */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                                        <span className="text-sm font-medium">Interview Area</span>
                                    </div>
                                    <div className="font-extrabold text-[#0f172a] text-sm">{request.purpose_detail || details.interviewArea || request.interview_area || '—'}</div>
                                </div>

                                {/* Visiting Site */}
                                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg>
                                        <span className="text-sm font-medium">Visiting Site</span>
                                    </div>
                                    <div className="font-extrabold text-[#0f172a] text-sm">{request.visiting_site || 'SHTP'}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-sm font-bold rounded-xl text-white bg-[#db011c] hover:bg-[#b00116] shadow-md shadow-red-500/20 transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
