'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CalendarDaysIcon, DocumentTextIcon, UserGroupIcon, MapPinIcon, CurrencyDollarIcon, BuildingOfficeIcon, IdentificationIcon, TagIcon, ClockIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';

import { Suspense } from 'react';

function DashboardContent() {
    const { data: session } = useSession();
    const isHrVisitor = (session?.user as any)?.app_role_names?.includes('Hr Visitor') || (session?.user as any)?.role === 'admin';
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [editingInterviewee, setEditingInterviewee] = useState<any>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);
        const [activeTab, setActiveTab] = useState<'general' | 'interviewee'>('general');
    const [mounted, setMounted] = useState(false);
    const [meetingRooms, setMeetingRooms] = useState<any[]>([]);

    useEffect(() => {
        const fetchMeetingRooms = async () => {
            try {
                const res = await fetch('/api/admin/meeting-rooms');
                if (res.ok) {
                    const data = await res.json();
                    setMeetingRooms(data.meetingRooms || []);
                }
            } catch (error) {
                console.error('Failed to fetch meeting rooms:', error);
            }
        };
        fetchMeetingRooms();
    }, []);
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    
    // Set initial activeTab based on searchParams, but only once on mount
    useEffect(() => {
        setMounted(true);
        if (tabParam === 'interviewee') {
            setActiveTab('interviewee');
        } else if (tabParam === 'general') {
            setActiveTab('general');
        }
    }, [tabParam]);

    useEffect(() => {
        if (session) {
            fetchMyRequests(pagination.page);
        }
    }, [pagination.page, startDate, endDate, activeTab, session]);

    const resetPage = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchMyRequests = async (page: number, tabOverride?: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        setLoading(true);
        try {
            const currentTab = tabOverride || activeTab;
            const apiEndpoint = `/api/requests?tab=${currentTab}`;
            let url = `${apiEndpoint}&page=${page}&limit=${pagination.limit}`;
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            const res = await fetch(url, { signal });
            if (res.ok) {
                const data = await res.json();
                if (!signal.aborted) {
                    setRequests(data.requests);
                    setPagination(data.pagination);
                }
            } else if (res.status === 401 && !signal.aborted) {
                router.push('/login?redirect=' + window.location.pathname);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error(err);
        } finally {
            // Only stop loading if we haven't started a new request
            if (!signal.aborted) {
                setLoading(false);
            }
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

    useEffect(() => {
        if (editingInterviewee) {
            let initialVisitors: any[] = [];
            try {
                initialVisitors = editingInterviewee.visitors ? JSON.parse(editingInterviewee.visitors) : [];
            } catch (e) {}
            if (!initialVisitors || initialVisitors.length === 0) {
                initialVisitors = [{
                    name: editingInterviewee.visitor_name || editingInterviewee.interviewee_name || '',
                    title: editingInterviewee.visitor_title || editingInterviewee.job_title || '',
                    company: editingInterviewee.current_company || '',
                    interviewDepartment: editingInterviewee.interview_department || editingInterviewee.current_company || '',
                    interviewerName: editingInterviewee.interviewer_name || ''
                }];
            }
            const dt = parseDetails(editingInterviewee.details);
            setEditFormData({
                visitors: initialVisitors,
                startDate: editingInterviewee.start_date ? new Date(editingInterviewee.start_date).toISOString().split('T')[0] : '',
                startTime: dt.startTime || editingInterviewee.start_time || '',
                interviewArea: editingInterviewee.purpose_detail || dt.interviewArea || editingInterviewee.interview_area || '',
                mealRegistration: dt.mealRegistration || 'No',
                factoryTour: dt.factoryTour || 'No',
                visitingSite: editingInterviewee.visiting_site || 'SHTP'
            });
        }
    }, [editingInterviewee]);

    const submitEditInterviewee = async () => {
        if (!editFormData.visitors || editFormData.visitors.length === 0) {
            alert('Please add at least one candidate.');
            return;
        }
        for (let i = 0; i < editFormData.visitors.length; i++) {
            const v = editFormData.visitors[i];
            if (!v.name || !v.name.trim()) {
                alert(`Please enter Candidate #${i + 1} Name.`);
                return;
            }
        }
        if (!editFormData.startDate) {
            alert('Please select Schedule Date.');
            return;
        }
        if (!editFormData.startTime) {
            alert('Please select Schedule Time.');
            return;
        }
        if (!editFormData.interviewArea) {
            alert('Please select Interview Area.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/interviewee_requests/${editingInterviewee.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData),
            });
            if (res.ok) {
                alert('Request updated successfully!');
                setEditingInterviewee(null);
                fetchMyRequests(pagination.page);
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to update request'}`);
            }
        } catch (e) {
            alert('Internal server error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* TABS */}
            <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200 shadow-sm w-fit">
                <button
                    onClick={() => { setActiveTab('general'); resetPage(); }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'general'
                        ? 'bg-white text-[#db011c] shadow-sm ring-1 ring-gray-200/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                        }`}
                >
                    General Visitors
                </button>
                <button
                    onClick={() => { 
                        if (!isHrVisitor) {
                            alert("You need Hr Visitor role to view Interviewee requests.");
                            return;
                        }
                        setActiveTab('interviewee'); 
                        resetPage(); 
                    }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'interviewee'
                        ? 'bg-white text-[#db011c] shadow-sm ring-1 ring-gray-200/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                        } ${!isHrVisitor ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-500' : ''}`}
                >
                    Interviewee
                </button>
            </div>

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
                    {(startDate || endDate || searchTerm) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); fetchMyRequests(1); }}
                            className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search code/Visitor/Company"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { resetPage(); fetchMyRequests(1); } }}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                    />
                    <button 
                        onClick={() => { resetPage(); fetchMyRequests(1); }}
                        className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
                    >
                        Search
                    </button>
                </div>

                <div className="text-sm font-medium text-gray-500 w-full text-right mt-2 md:mt-0 md:w-auto">
                    Showing <span className="text-gray-900 font-bold">{requests.length}</span> of <span className="text-gray-900 font-bold">{pagination.total}</span> requests
                </div>
            </div>

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
                            {requests.map((request) => activeTab === 'general' ? (
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
                                                } catch (e) { }
                                                return '';
                                            })()}
                                        </div>
                                        <div className="text-[11px] text-gray-500 mt-0.5 tracking-tight">{request.current_company} / {request.visitor_title}</div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                            {request.visitor_category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center text-gray-700 tabular-nums font-bold">
                                        {new Date(request.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} - {new Date(request.end_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-2 justify-center flex-wrap">
                                            {request.request_approvals?.map((app: any) => (
                                                <div
                                                    key={app.id}
                                                    title={`${app.room_areas?.name || (request.visitor_category !== 'MIL/TTI Expat / SHTP Business trip' ? 'Manager Approval' : 'VP Approval')}: ${app.status}`}
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
                            ) : (
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
                                                } catch (e) { }
                                                return '';
                                            })()}
                                        </div>
                                        <div className="text-[11px] text-gray-500 mt-0.5 tracking-tight">{request.visitor_title || 'Candidate'}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {(() => {
                                            let dept = '';
                                            let interviewer = '';
                                            try {
                                                const parsed = request.visitors ? JSON.parse(request.visitors) : [];
                                                if (parsed.length > 0) {
                                                    dept = parsed[0].interviewDepartment || parsed[0].company || '';
                                                    interviewer = parsed[0].interviewerName || '';
                                                }
                                            } catch (e) { }
                                            return (
                                                <>
                                                    <div className="font-bold text-[#0f172a] text-[12px]">
                                                        Dept: {dept || request.current_company || '—'}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 mt-0.5 tracking-tight">
                                                        By: {interviewer || '—'}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-5 text-center text-gray-700 tabular-nums font-bold">
                                        {new Date(request.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-5 text-center text-gray-700 tabular-nums font-bold">
                                        {(() => {
                                            const dt = parseDetails(request.details);
                                            return dt?.startTime || '—';
                                        })()}
                                    </td>
                                    <td className="px-6 py-5 text-center text-[11px] text-gray-600">
                                        {request.purpose_detail || (() => {
                                            const dt = parseDetails(request.details);
                                            return dt?.interviewArea || '—';
                                        })()}
                                    </td>
                                    <td className="px-6 py-5 text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            {(request.edit_count || request.editCount || 0) < 3 ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingInterviewee(request);
                                                    }}
                                                    className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                                                    title={`Edit Request (${3 - (request.edit_count || request.editCount || 0)} edits remaining)`}
                                                >
                                                    Edit ({request.edit_count || request.editCount || 0}/3)
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
                                                onClick={() => setSelectedRequest(request)}
                                                className="text-[11px] font-black text-[#db011c] uppercase tracking-tighter hover:underline ml-1"
                                            >
                                                View Details &rarr;
                                            </button>
                                        </div>
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
            {selectedRequest && mounted && createPortal((() => {
                const details = parseDetails(selectedRequest.details);
                
                let visitorsList: any[] = [];
                try {
                    visitorsList = selectedRequest.visitors ? JSON.parse(selectedRequest.visitors) : [];
                } catch (e) { }

                if (!visitorsList || visitorsList.length === 0) {
                    visitorsList = [{
                        name: selectedRequest.visitor_name || "Unknown",
                        company: selectedRequest.current_company || "",
                        title: selectedRequest.visitor_title || "",
                        email: ""
                    }];
                }

                const Row = ({ icon: Icon, label, value, children }: any) => (
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

                return (
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                        onClick={() => setSelectedRequest(null)}
                    >
                        <div
                            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative text-[#0f172a] animate-in zoom-in-95 duration-200 border-t-[6px] border-[#db011c]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="p-6 md:p-8">
                                {activeTab === 'general' ? (
                                    <>
                                        <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-gray-100">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Visitors ({visitorsList.length})</h3>
                                            <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                                {visitorsList.map((v: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                                        <div className="w-2 h-2 rounded-full bg-[#db011c] shrink-0"></div>
                                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 overflow-hidden">
                                                            <h2 className="text-sm font-bold text-[#0f172a] truncate">{v.name}</h2>
                                                            <p className="text-xs text-gray-500 truncate font-medium">
                                                                {v.title ? `${v.title} @ ` : ''}{v.company || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Row icon={IdentificationIcon} label="Request Ref" value={selectedRequest.id.split('-')[0].toUpperCase()} />
                                            <Row icon={TagIcon} label="Status">
                                                <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5" style={{
                                                    background: getStatusColor(selectedRequest.status) + '15',
                                                    color: getStatusColor(selectedRequest.status),
                                                }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(selectedRequest.status) }}></span>
                                                    {selectedRequest.status}
                                                </span>
                                            </Row>
                                            <Row icon={UserGroupIcon} label="Visitor Category" value={selectedRequest.visitor_category} />
                                            <Row icon={CalendarDaysIcon} label="Visit Dates" value={`${new Date(selectedRequest.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} — ${new Date(selectedRequest.end_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`} />
                                            <Row icon={DocumentTextIcon} label="Purpose">
                                                <div className="text-right">
                                                    <div>{selectedRequest.purpose_of_visit}</div>
                                                    {selectedRequest.purpose_detail && <div className="text-xs text-gray-400 font-normal mt-1">{selectedRequest.purpose_detail}</div>}
                                                </div>
                                            </Row>
                                            <Row icon={BuildingOfficeIcon} label="Visiting Site" value={selectedRequest.visiting_site || 'N/A'} />
                                            <Row icon={CurrencyDollarIcon} label="Cost Center" value={details.costCenter || 'N/A'} />
                                            <Row icon={MapPinIcon} label="Factory Tour" value={details.factoryTour || 'No'} />
                                            
                                            {selectedRequest.request_approvals && selectedRequest.request_approvals.length > 0 && (
                                                <Row icon={ShieldCheckIcon} label="Area Approvals">
                                                    <div className="flex flex-col gap-2 w-full items-end">
                                                        {selectedRequest.request_approvals.map((app: any) => (
                                                            <div key={app.id} className="flex flex-col items-end gap-0.5">
                                                                <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100" style={{ color: getStatusColor(app.status) }}>
                                                                    {app.room_areas?.name || 'Area'}
                                                                    <span className="w-1.5 h-1.5 rounded-full ml-1" style={{ background: getStatusColor(app.status) }}></span>
                                                                </span>
                                                                {app.approver_email && (
                                                                    <span className="text-[10px] text-gray-500 font-medium break-all">
                                                                        {app.status === 'PENDING' ? 'Pending at:' : (app.status === 'APPROVED' ? 'Approved by:' : 'Rejected by:')} {app.approver_email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Row>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-gray-100">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Candidates ({visitorsList.length})</h3>
                                            <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                                {visitorsList.map((v: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                                        <div className="w-2 h-2 rounded-full bg-[#db011c] shrink-0"></div>
                                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 overflow-hidden">
                                                            <h2 className="text-sm font-bold text-[#0f172a] truncate">{v.name || selectedRequest.interviewee_name || 'Candidate'}</h2>
                                                            <p className="text-xs text-gray-500 truncate font-medium">
                                                                {v.title || selectedRequest.job_title ? `${v.title || selectedRequest.job_title} ` : ''}
                                                                {v.interviewDepartment ? `• ${v.interviewDepartment} ` : v.company ? `@ ${v.company} ` : ''}
                                                                {v.interviewerName ? `(Interviewer: ${v.interviewerName})` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Row icon={IdentificationIcon} label="Request Ref" value={(selectedRequest.id || selectedRequest.visitor_code)?.split('-')[0]?.toUpperCase()} />
                                            <Row icon={TagIcon} label="Status">
                                                <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5" style={{
                                                    background: getStatusColor(selectedRequest.status) + '15',
                                                    color: getStatusColor(selectedRequest.status),
                                                }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(selectedRequest.status) }}></span>
                                                    {selectedRequest.status}
                                                </span>
                                            </Row>
                                            <Row icon={UserGroupIcon} label="Category" value="Interviewee" />
                                            <Row icon={CalendarDaysIcon} label="Schedule Date" value={new Date(selectedRequest.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} />
                                            <Row icon={ClockIcon} label="Schedule Time" value={details.startTime || selectedRequest.start_time || '—'} />
                                            <Row icon={MapPinIcon} label="Interview Area" value={selectedRequest.purpose_detail || details.interviewArea || selectedRequest.interview_area || '—'} />
                                            <Row icon={BuildingOfficeIcon} label="Visiting Site" value={selectedRequest.visiting_site || 'SHTP'} />
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="p-4 px-8 bg-gray-50 rounded-b-xl border-t border-gray-100 flex justify-end items-center">
                                {activeTab === 'interviewee' ? (
                                    <div>
                                        {(selectedRequest.edit_count || selectedRequest.editCount || 0) < 3 ? (
                                            <button 
                                                onClick={() => {
                                                    setEditingInterviewee(selectedRequest);
                                                    setSelectedRequest(null);
                                                }}
                                                className="px-6 py-2.5 bg-[#db011c] hover:bg-[#b00116] text-white text-sm font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                                </svg>
                                                Edit Request ({3 - (selectedRequest.edit_count || selectedRequest.editCount || 0)} edits left)
                                            </button>
                                        ) : (
                                            <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg flex items-center gap-1.5">
                                                <span>⚠️ Max edit limit reached (3/3)</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button onClick={() => setSelectedRequest(null)} className="px-6 py-2 bg-[#db011c] hover:bg-[#b00116] text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })(), document.body)}

            {mounted && editingInterviewee && createPortal((
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingInterviewee(null)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative z-10 max-h-[90vh] flex flex-col overflow-hidden border-t-[6px] border-[#db011c]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Edit Interviewee Request</h2>
                                <p className="text-xs text-gray-500 font-medium">
                                    Request #{editingInterviewee.id?.split('-')[0]?.toUpperCase()} • Edit count: <span className="font-bold text-blue-600">{editingInterviewee.edit_count || editingInterviewee.editCount || 0}/3</span>
                                </p>
                            </div>
                            <button onClick={() => setEditingInterviewee(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                            {/* Candidates List */}
                            <div className="flex flex-col gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Candidates ({(editFormData.visitors || []).length})
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...(editFormData.visitors || [])];
                                            updated.push({
                                                name: '',
                                                title: '',
                                                company: '',
                                                interviewDepartment: '',
                                                interviewerName: ''
                                            });
                                            setEditFormData({ ...editFormData, visitors: updated });
                                        }}
                                        className="px-3 py-1 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                    >
                                        <span className="text-[#db011c] font-black">+</span> Add Candidate
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {(editFormData.visitors || []).map((cand: any, idx: number) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col gap-3">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                <span className="text-xs font-black text-gray-500 uppercase">
                                                    Candidate #{idx + 1}
                                                </span>
                                                {(editFormData.visitors || []).length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = editFormData.visitors.filter((_: any, i: number) => i !== idx);
                                                            setEditFormData({ ...editFormData, visitors: updated });
                                                        }}
                                                        className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div>
                                                    <InputLabel required>Full Name</InputLabel>
                                                    <Input 
                                                        required 
                                                        value={cand.name || ''} 
                                                        onChange={(e: any) => {
                                                            const updated = [...editFormData.visitors];
                                                            updated[idx].name = e.target.value;
                                                            setEditFormData({ ...editFormData, visitors: updated });
                                                        }} 
                                                        placeholder="Candidate Name" 
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel required>Job Title</InputLabel>
                                                    <Input 
                                                        required 
                                                        value={cand.title || ''} 
                                                        onChange={(e: any) => {
                                                            const updated = [...editFormData.visitors];
                                                            updated[idx].title = e.target.value;
                                                            setEditFormData({ ...editFormData, visitors: updated });
                                                        }} 
                                                        placeholder="e.g. Software Engineer" 
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel required>Interview Department</InputLabel>
                                                    <Input 
                                                        required 
                                                        value={cand.interviewDepartment || cand.company || ''} 
                                                        onChange={(e: any) => {
                                                            const updated = [...editFormData.visitors];
                                                            updated[idx].interviewDepartment = e.target.value;
                                                            updated[idx].company = e.target.value;
                                                            setEditFormData({ ...editFormData, visitors: updated });
                                                        }} 
                                                        placeholder="e.g. IT Department" 
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel required>Interviewer Name</InputLabel>
                                                    <Input 
                                                        required 
                                                        value={cand.interviewerName || ''} 
                                                        onChange={(e: any) => {
                                                            const updated = [...editFormData.visitors];
                                                            updated[idx].interviewerName = e.target.value;
                                                            setEditFormData({ ...editFormData, visitors: updated });
                                                        }} 
                                                        placeholder="e.g. Tran Thi B" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule & Area Details */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <InputLabel required>Schedule Date</InputLabel>
                                    <Input required type="date" value={editFormData.startDate || ''} onChange={(e: any) => setEditFormData({...editFormData, startDate: e.target.value})} />
                                </div>
                                <div>
                                    <InputLabel required>Schedule Time</InputLabel>
                                    <Input required type="time" value={editFormData.startTime || ''} onChange={(e: any) => setEditFormData({...editFormData, startTime: e.target.value})} />
                                </div>
                                <div>
                                    <InputLabel>Meal Registration</InputLabel>
                                    <select 
                                        className="w-full h-[40px] px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                                        value={editFormData.mealRegistration || 'No'} 
                                        onChange={(e: any) => setEditFormData({...editFormData, mealRegistration: e.target.value})}
                                    >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel>Factory Tour</InputLabel>
                                    <select 
                                        className="w-full h-[40px] px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                                        value={editFormData.factoryTour || 'No'} 
                                        onChange={(e: any) => setEditFormData({...editFormData, factoryTour: e.target.value})}
                                    >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>
                                <div className="md:col-span-4">
                                    <InputLabel required>Interview Area (Meeting Room)</InputLabel>
                                    <select 
                                        required 
                                        className="w-full h-[40px] px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                                        value={editFormData.interviewArea || ''} 
                                        onChange={(e: any) => setEditFormData({...editFormData, interviewArea: e.target.value})}
                                    >
                                        <option value="" disabled>Select Meeting Room</option>
                                        {(Object.entries(
                                            meetingRooms.reduce((acc, room) => {
                                                if (!acc[room.floorName]) acc[room.floorName] = [];
                                                acc[room.floorName].push(room);
                                                return acc;
                                            }, {} as Record<string, any[]>)
                                        ) as Array<[string, any[]]>).map(([floor, rooms]) => (
                                            <optgroup key={floor} label={floor}>
                                                {rooms.map((room: any) => (
                                                    <option key={room.id} value={`${room.floorName} - ${room.roomName}`}>
                                                        {room.roomName}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
                            <button onClick={() => setEditingInterviewee(null)} className="px-6 py-2 rounded-lg font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">Cancel</button>
                            <button onClick={submitEditInterviewee} disabled={saving} className="px-6 py-2 rounded-lg font-bold text-white bg-[#db011c] hover:bg-[#b00116] shadow-md transition-colors disabled:opacity-50 flex items-center gap-2">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            ), document.body)}

        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}

const Input = (props: any) => (
    <input 
        {...props} 
        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', color: '#1e293b', outline: 'none' }}
        onFocus={(e) => e.target.style.borderColor = '#db011c'}
        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        onClick={(e) => {
            if (props.type === 'date' || props.type === 'time') {
                try {
                    (e.target as any).showPicker();
                } catch (err) {}
            }
            if (props.onClick) props.onClick(e);
        }}
    />
);

const InputLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', marginTop: '8px' }}>
        {children}
        {required && <span style={{ color: '#db011c', marginLeft: '4px' }}>*</span>}
    </label>
);
