'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/visitor_admin/requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
            } else if (res.status === 401 || res.status === 403) {
                router.push('/login');
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
                fetchRequests();
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
        <div className="min-h-screen bg-[var(--background)] py-10 px-4 text-white">
            <div className="container mx-auto max-w-7xl relative">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-white drop-shadow-md">Admin Dashboard</h1>
                        <p className="text-[#ffe5e5]">Overall management of visitor requests and factory access areas.</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/VisitorAdmin/rooms" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all border border-white/30">
                            Manage Rooms & Emails
                        </Link>
                        <button onClick={() => router.push('/VisitorDashboard')} className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-[#db011c] bg-white hover:bg-white/90 transition-all shadow-lg hover:-translate-y-0.5">
                            Switch to User View
                        </button>
                    </div>
                </div>

                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20 text-[#0f172a]">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                <th className="p-6">Visitor</th>
                                <th className="p-6">Submitter</th>
                                <th className="p-6">Dates</th>
                                <th className="p-6">Approval Workflow</th>
                                <th className="p-6">Overall Status</th>
                                <th className="p-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-[0.875rem] font-medium bg-white">
                            {requests.map((request) => (
                                <tr key={request.id} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                                    <td className="p-6">
                                        <div className="font-extrabold text-[#0f172a] text-sm">{request.visitor_name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{request.current_company} / {request.visitor_title}</div>
                                    </td>
                                    <td className="p-6">
                                        <div className="font-bold text-[#0f172a]">{request.profiles?.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{request.profiles?.department}</div>
                                    </td>
                                    <td className="p-6 text-gray-700">
                                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                    </td>
                                    <td className="p-6">
                                        {request.request_approvals?.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                                {request.request_approvals.map((app: any) => (
                                                    <div key={app.id} className="text-xs flex items-center gap-2 text-gray-700 font-medium">
                                                        <span style={{ color: getStatusColor(app.status) }}>●</span> {app.room_areas?.name || 'Unknown'}: <span className="font-bold">{app.approver_email}</span> - <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ background: getStatusColor(app.status) + '22', color: getStatusColor(app.status) }}>{app.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">No workflow</span>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <span className="px-4 py-1.5 rounded-full text-xs font-bold" style={{
                                            background: getStatusColor(request.status) + '22',
                                            color: getStatusColor(request.status)
                                        }}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleUpdateStatus(request.id, 'COMPLETE')} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition-colors shadow-sm">Approve</button>
                                            <button onClick={() => handleUpdateStatus(request.id, 'REJECTED')} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors">Reject</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && !loading && (
                                <tr><td colSpan={6} className="p-16 text-center text-gray-400 font-medium">No visitor requests found.</td></tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
