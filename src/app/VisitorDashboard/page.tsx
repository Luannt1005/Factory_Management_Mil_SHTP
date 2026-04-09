'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // Add missing import if needed

export default function Dashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        try {
            const res = await fetch('/api/requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
            } else if (res.status === 401) {
                router.push('/login');
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
            case 'REJECTED': return '#ef4444'; // Red
            default: return '#f59e0b'; // Amber
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] py-10 px-4 text-white">
            <div className="container mx-auto max-w-6xl relative">
                
                {/* Back to Home Button */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm font-bold text-white/70 hover:text-white transition-colors">
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Back to Home
                    </Link>
                </div>

                <div className="flex flex-wrap gap-4 justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-white drop-shadow-md">My Applications</h1>
                        <p className="text-[#ffe5e5]">Track and manage your factory visitor registrations.</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/VisitorRequest" className="inline-flex items-center justify-center px-8 py-3 rounded-full font-bold text-[#db011c] bg-white hover:bg-white/90 transition-all shadow-lg hover:-translate-y-0.5">
                            + Create New Request
                        </Link>
                    </div>
                </div>

                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20 text-[#0f172a]">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
                                <th className="p-6 text-xs font-bold uppercase tracking-wider">Visitor / Company</th>
                                <th className="p-6 text-xs font-bold uppercase tracking-wider">Visit Period</th>
                                <th className="p-6 text-xs font-bold uppercase tracking-wider">Workflows</th>
                                <th className="p-6 text-xs font-bold uppercase tracking-wider">Overall Status</th>
                                <th className="p-6 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="text-[0.925rem] bg-white">
                            {requests.map((request) => (
                                <tr
                                    key={request.id}
                                    className="border-b border-gray-100 hover:bg-red-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    <td className="p-6">
                                        <div className="font-bold text-[#0f172a]">{request.visitor_name}</div>
                                        <div className="text-sm text-gray-500 mt-1">{request.current_company}</div>
                                    </td>
                                    <td className="p-6 text-gray-700 font-medium">
                                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {request.request_approvals?.map((app: any) => (
                                                <div
                                                    key={app.id}
                                                    title={`${app.room_areas?.name || 'Area'}: ${app.status}`}
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        background: getStatusColor(app.status),
                                                        boxShadow: `0 0 6px ${getStatusColor(app.status)}55`
                                                    }}
                                                />
                                            ))}
                                            {(!request.request_approvals || request.request_approvals.length === 0) && (
                                                <span className="text-xs text-gray-400 font-medium">No areas requested</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="px-4 py-1.5 rounded-full text-xs font-bold" style={{
                                            background: getStatusColor(request.status) + '22',
                                            color: getStatusColor(request.status),
                                        }}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <span className="text-sm text-[#db011c] font-bold group-hover:underline">View Details &rarr;</span>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-gray-400 bg-gray-50">
                                        <div className="text-4xl mb-4 opacity-50">📄</div>
                                        <div className="font-medium text-gray-500">No requests found. Start by creating a new visit application.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>

                {/* MODAL OVERLAY */}
                {selectedRequest && (() => {
                    const details = parseDetails(selectedRequest.details);
                    return (
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
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
                                            <h3 className="text-3xl font-extrabold text-[#0f172a] mb-2">{selectedRequest.visitor_name}</h3>
                                            <p className="text-gray-500 font-medium">{selectedRequest.visitor_title} @ {selectedRequest.current_company}</p>
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
                                            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Cost Center</label>
                                            <p className="font-bold text-[#0f172a]">{details.costCenter || 'N/A'}</p>
                                        </div>
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
        </div>
    );
}
