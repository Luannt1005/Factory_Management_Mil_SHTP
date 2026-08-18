'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import EditRequestModal from './EditRequestModal';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'general' | 'interviewee'>('general');
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [category, setCategory] = useState('');
    const [code, setCode] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [exporting, setExporting] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [editingRequest, setEditingRequest] = useState<any>(null);
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        fetchRequests(1);
    }, [startDate, endDate, category, code, statusFilter, activeTab]);

    const fetchRequests = async (page: number) => {
        setLoading(true);
        setSelectedRowIds([]);
        try {
            let url = activeTab === 'general' ? `/api/visitor_admin/requests?page=${page}&limit=${pagination.limit}` : `/api/visitor_admin/interviewee_requests?page=${page}&limit=${pagination.limit}`;
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            if (category) {
                url += `&category=${encodeURIComponent(category)}`;
            }
            if (code) {
                url += `&code=${encodeURIComponent(code)}`;
            }
            if (statusFilter) {
                url += `&status=${encodeURIComponent(statusFilter)}`;
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
            let url = activeTab === 'general' ? `/api/visitor_admin/requests?page=1&limit=999999` : `/api/visitor_admin/interviewee_requests?page=1&limit=999999`;
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            if (category) {
                url += `&category=${encodeURIComponent(category)}`;
            }
            if (code) {
                url += `&code=${encodeURIComponent(code)}`;
            }
            if (statusFilter) {
                url += `&status=${encodeURIComponent(statusFilter)}`;
            }
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                
                // Fetch host departments to map names
                let hostDepts: any[] = [];
                try {
                    const hdRes = await fetch('/api/admin/host-departments');
                    if (hdRes.ok) {
                        const jsonRes = await hdRes.json();
                        hostDepts = jsonRes.hostDepartments || [];
                    }
                } catch (e) {}

                const ExcelJS = await import('exceljs');
                
                const exportData = data.requests.flatMap((r: any) => {
                    if (activeTab === 'general') {
                        const details = parseDetails(r.details);
                        
                        let visitorsArr = [];
                        if (r.visitors) {
                            try {
                                visitorsArr = JSON.parse(r.visitors);
                                if (!Array.isArray(visitorsArr) || visitorsArr.length === 0) {
                                    visitorsArr = [{ name: r.visitor_name, title: r.visitor_title, company: r.current_company }];
                                }
                            } catch (e) {
                                visitorsArr = [{ name: r.visitor_name, title: r.visitor_title, company: r.current_company }];
                            }
                        } else {
                            visitorsArr = [{ name: r.visitor_name, title: r.visitor_title, company: r.current_company }];
                        }

                        return visitorsArr.map((v: any, index: number) => {
                            const pendingApprovals = (r.request_approvals || []).filter((a: any) => a.status === 'PENDING');
                            const approvalProgress = (r.request_approvals || []).map((a: any) => 
                                `[${a.status}] ${a.room_areas?.name || 'Host'} (${a.approver_email})`
                            ).join(' ; ');
                            const isCompleted = r.status === 'COMPLETE' || r.status === 'APPROVED' || r.status === 'REJECTED';

                            const hdObj = hostDepts.find((h: any) => h.functional_dept === details.functionalDept && h.department === details.department) || {};

                            return {
                                'Request Code': '#' + r.id.split('-')[0].toUpperCase(),
                                'Visitor Code': '#' + r.id.split('-')[0].toUpperCase() + '-V' + (index + 1),
                                'Visitor Name': v.name || r.visitor_name || '',
                                'Visitor Title': v.title || r.visitor_title || '',
                                'Visitor Company': v.company || r.current_company || '',
                                'Submitter Name': r.profiles?.name || '',
                                'Submitter Department': r.profiles?.department || '',
                                'Start Date': r.start_date ? new Date(r.start_date).toLocaleDateString('vi-VN') : '',
                                'End Date': r.end_date ? new Date(r.end_date).toLocaleDateString('vi-VN') : '',
                                'Visitor Category': r.visitor_category || '',
                                'Purpose Of Visit': r.purpose_of_visit || '',
                                'Purpose Detail': r.purpose_detail || '',
                                'Visiting Site': r.visiting_site || '',
                                'Host Functional Dept': details.functionalDept || '',
                                'Func Host Name': hdObj.functional_host_name || '',
                                'Host Department': details.department || '',
                                'Dept Host Name': hdObj.department_host_name || '',
                                'Cost Center': details.costCenter || '',
                                'Factory Tour': details.factoryTour || '',
                                'Meal Registration': details.mealRegistration || '',
                                'Status': r.status || '',
                                'Approval Progress': approvalProgress,
                                'Submit Date': r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '',
                                'Completion Date': (isCompleted && r.updated_at) ? new Date(r.updated_at).toLocaleString('vi-VN') : ''
                            };
                        });
                    } else {
                        return [{
                            'Code': r.visitor_code || ('#' + r.id.split('-')[0].toUpperCase()),
                            'Interviewee Name': r.interviewee_name || '',
                            'Submitter Name': r.os_name || '',
                            'Job Title': r.job_title || '',
                            'Interview Department': r.interview_department || '',
                            'Interviewer Name': r.interviewer_name || '',
                            'Start Date': r.start_date ? new Date(r.start_date).toLocaleDateString('vi-VN') : '',
                            'Start Time': r.start_time || '',
                            'Interview Area': r.interview_area || '',
                            'Submitter Name': r.profiles?.name || '',
                            'Status': r.status || '',
                            'Created At': r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : ''
                        }];
                    }
                });

                if (exportData.length > 0) {
                    const workbook = new ExcelJS.Workbook();
                    const worksheet = workbook.addWorksheet('Visitors');

                    const columns = Object.keys(exportData[0]).map(key => ({
                        header: key,
                        key: key,
                        width: Math.max(20, key.length + 5)
                    }));
                    worksheet.columns = columns;

                    exportData.forEach((dataRow: any) => {
                        worksheet.addRow(dataRow);
                    });

                    // Style the header row
                    const headerRow = worksheet.getRow(1);
                    headerRow.eachCell((cell) => {
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFDB011C' } // Red background
                        };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    });
                    
                    // Freeze the header
                    worksheet.views = [
                        { state: 'frozen', xSplit: 0, ySplit: 1 }
                    ];

                    const buffer = await workbook.xlsx.writeBuffer();
                    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `Visitor_Requests_${new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(blobUrl);
                }
            }
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const endpoint = activeTab === 'general' ? '/api/visitor_admin/requests' : '/api/visitor_admin/interviewee_requests';
            const res = await fetch(endpoint, {
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

    const handleDeleteSelected = async () => {
        if (selectedRowIds.length === 0) return;
        if (!confirm('Are you sure you want to delete the selected requests?')) return;
        
        try {
            const endpoint = activeTab === 'general' ? '/api/visitor_admin/requests' : '/api/visitor_admin/interviewee_requests';
            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedRowIds }),
            });
            if (res.ok) {
                setSelectedRowIds([]);
                fetchRequests(pagination.page);
            } else {
                alert('Failed to delete requests');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
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
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    General Visitors
                </button>
                <button
                    onClick={() => setActiveTab('interviewee')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'interviewee' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Interviewee
                </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Code</label>
                        <input 
                            type="text" 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. 2206"
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-24 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all h-8"
                        />
                    </div>
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
                            <option value="Vendor">Vendor</option>
                            <option value="Contractor">Contractor</option>
                            <option value="MIL/TTI Expat / SHTP Business trip">MIL/TTI Expat / SHTP Business trip</option>
                            <option value="Interviewee">Interviewee</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">Status</label>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all h-8"
                        >
                            <option value="">All</option>
                            <option value="IN PROCESS">IN PROCESS</option>
                            <option value="COMPLETE">COMPLETE</option>
                            <option value="REJECTED">REJECTED</option>
                        </select>
                    </div>
                    {(startDate || endDate || category || code || statusFilter) && (
                        <button 
                            onClick={() => { setStartDate(''); setEndDate(''); setCategory(''); setCode(''); setStatusFilter(''); }}
                            className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
                        >
                            Clear
                        </button>
                    )}
                    {selectedRowIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition-all ml-2"
                        >
                            Delete Selected ({selectedRowIds.length})
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

            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-200 text-[#0f172a] max-w-[calc(100vw-2rem)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            {activeTab === 'general' ? (
                                <tr className="bg-[#1a1a1a] text-white border-b border-gray-800 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-3 py-2 w-8">
                                        <input 
                                            type="checkbox" 
                                            checked={requests.length > 0 && selectedRowIds.length === requests.length}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedRowIds(requests.map(r => r.id));
                                                else setSelectedRowIds([]);
                                            }}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-3 py-2">Code</th>
                                    <th className="px-3 py-2">Visitor Name</th>
                                    <th className="px-3 py-2">Company</th>
                                    <th className="px-3 py-2">Title</th>
                                    <th className="px-3 py-2">Category</th>
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
                                            checked={requests.length > 0 && selectedRowIds.length === requests.length}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedRowIds(requests.map(r => r.id));
                                                else setSelectedRowIds([]);
                                            }}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-3 py-2">Code</th>
                                    <th className="px-3 py-2">Interviewee Name</th>
                                    <th className="px-3 py-2">Submitter</th>
                                    <th className="px-3 py-2">Job Title</th>
                                    <th className="px-3 py-2">Interviewer</th>
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
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedRowIds([...selectedRowIds, request.id]);
                                                    else setSelectedRowIds(selectedRowIds.filter(id => id !== request.id));
                                                }}
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
                                        <td className="px-3 py-2">
                                            <div className="font-bold text-[#0f172a] truncate max-w-[250px]" title={request.profiles?.name}>{request.profiles?.name}</div>
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                            {new Date(request.start_date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                            {new Date(request.end_date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold text-[10px]">
                                            {(() => {
                                                try {
                                                    const d = JSON.parse(request.details);
                                                    return d.factoryTour === 'Yes' 
                                                        ? <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Yes</span> 
                                                        : <span className="text-gray-400">No</span>;
                                                } catch(e) { return <span className="text-gray-400">No</span>; }
                                            })()}
                                        </td>
                                        <td className="px-3 py-2">
                                            {request.request_approvals?.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {request.request_approvals.map((app: any) => (
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
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setEditingRequest(request)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-200"
                                                title="Edit Request"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                                </svg>
                                            </button>
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
                                ) : (
                                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-3 py-2">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedRowIds.includes(request.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedRowIds([...selectedRowIds, request.id]);
                                                    else setSelectedRowIds(selectedRowIds.filter(id => id !== request.id));
                                                }}
                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {request.visitor_code || ('#' + request.id.split('-')[0].toUpperCase())}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="font-extrabold text-[#0f172a] truncate max-w-[150px]">
                                                {request.interviewee_name}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="font-bold text-[#0f172a] text-[11px] truncate max-w-[150px]">
                                                {request.os_name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-[11px] text-gray-600 truncate max-w-[100px]">
                                            {request.job_title || '-'}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="font-bold text-[#0f172a] text-[11px] truncate max-w-[120px]">
                                                {request.interviewer_name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                            {new Date(request.start_date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-3 py-2 text-center text-gray-700 tabular-nums">
                                            {request.start_time}
                                        </td>
                                        <td className="px-3 py-2 text-center text-[10px] text-gray-600 truncate max-w-[100px]">
                                            {request.interview_area}
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
                                                    onClick={() => setEditingRequest(request)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100 transition-all border border-blue-200"
                                                    title="Edit Request"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                                    </svg>
                                                </button>
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
                                )
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
                const visitorsList = (() => {
                    try {
                        const parsed = selectedRequest.visitors ? JSON.parse(selectedRequest.visitors) : [];
                        if (parsed && parsed.length > 0) return parsed;
                    } catch (e) {}
                    return [{ name: selectedRequest.visitor_name, title: selectedRequest.visitor_title, company: selectedRequest.current_company }];
                })();

                if (!mounted) return null;

                return createPortal(
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-8"
                        onClick={() => setSelectedRequest(null)}
                    >
                        <div
                            className="bg-white w-full max-w-2xl max-h-full overflow-y-auto rounded-2xl shadow-2xl relative text-[#0f172a] animate-in zoom-in-95 duration-200 border-t-[8px] border-t-[#db011c] custom-scrollbar flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 pb-2 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{activeTab === 'general' ? `VISITORS (${visitorsList.length})` : 'INTERVIEWEE INFO'}</h2>
                                <button
                                    onClick={() => setSelectedRequest(null)}
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
                                            {visitorsList.map((v: any, i: number) => (
                                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-gray-50/50 px-4 py-2 rounded-lg border border-gray-100 transition-colors hover:bg-gray-50">
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
                                        {/* Interviewee Info */}
                                        <div className="flex flex-col gap-3 mb-8">
                                            <div className="flex flex-col gap-2 bg-gray-50/50 px-5 py-4 rounded-xl border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-[#db011c] shrink-0"></div>
                                                    <h3 className="text-sm font-extrabold text-[#0f172a]">{selectedRequest.interviewee_name || 'Unnamed'}</h3>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium ml-5">
                                                    {selectedRequest.job_title || 'N/A'}
                                                </p>
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
                                        <div className="font-extrabold text-[#0f172a] text-sm tracking-tight">{selectedRequest.visitor_code || selectedRequest.id.split('-')[0].toUpperCase()}</div>
                                    </div>
                                    
                                    {/* Submitter */}
                                    {activeTab === 'interviewee' && (
                                        <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                            <div className="flex items-center gap-3 text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                                                <span className="text-sm font-medium">Submitter</span>
                                            </div>
                                            <div className="font-extrabold text-[#0f172a] text-sm tracking-tight">{selectedRequest.os_name || '-'}</div>
                                        </div>
                                    )}
                                    
                                    {/* Status */}
                                    <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                        <div className="flex items-center gap-3 text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
                                            <span className="text-sm font-medium">Status</span>
                                        </div>
                                        <div>
                                            <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5" style={{
                                                background: getStatusColor(selectedRequest.status) + '15',
                                                color: getStatusColor(selectedRequest.status),
                                                border: `1px solid ${getStatusColor(selectedRequest.status)}30`
                                            }}>
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(selectedRequest.status) }}></span>
                                                {selectedRequest.status}
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
                                                <div className="font-extrabold text-[#0f172a] text-sm">{selectedRequest.visitor_category}</div>
                                            </div>

                                            {/* Visit Dates */}
                                            <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                                    <span className="text-sm font-medium">Visit Dates</span>
                                                </div>
                                                <div className="font-extrabold text-[#0f172a] text-sm">{new Date(selectedRequest.start_date).toLocaleDateString()} — {new Date(selectedRequest.end_date).toLocaleDateString()}</div>
                                            </div>

                                            {/* Purpose */}
                                            <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                                    <span className="text-sm font-medium">Purpose</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-extrabold text-[#0f172a] text-sm">{selectedRequest.purpose_of_visit}</div>
                                                    {selectedRequest.purpose_detail && <div className="text-[10px] text-gray-400 font-medium mt-1">{selectedRequest.purpose_detail}</div>}
                                                </div>
                                            </div>

                                            {/* Visiting Site */}
                                            <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg>
                                                    <span className="text-sm font-medium">Visiting Site</span>
                                                </div>
                                                <div className="font-extrabold text-[#0f172a] text-sm">{selectedRequest.visiting_site || 'N/A'}</div>
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
                                                    {selectedRequest.request_approvals?.map((app: any) => (
                                                        <div key={app.id} className="flex flex-col items-end gap-0.5">
                                                            <span className="px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2" style={{
                                                                background: getStatusColor(app.status) + '08',
                                                                color: getStatusColor(app.status),
                                                                border: `1px solid ${getStatusColor(app.status)}20`
                                                            }}>
                                                                {app.room_areas?.name || (selectedRequest.visitor_category === 'MIL/TTI Expat / SHTP Business trip' ? 'VP Approval (All Rooms)' : 'Manager Approval')}
                                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(app.status) }}></span>
                                                            </span>
                                                            {app.approver_email && (
                                                                <span className="text-[10px] text-gray-500 font-medium break-all">
                                                                    {app.status === 'PENDING' ? 'Pending at:' : (app.status === 'APPROVED' ? 'Approved by:' : 'Rejected by:')} {app.approver_email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(!selectedRequest.request_approvals || selectedRequest.request_approvals.length === 0) && (
                                                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">None</span>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Department */}
                                            <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                                                    <span className="text-sm font-medium">Department</span>
                                                </div>
                                                <div className="font-extrabold text-[#0f172a] text-sm">{selectedRequest.interview_department}</div>
                                            </div>
                                            
                                            {/* Interviewer */}
                                            <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                                                    <span className="text-sm font-medium">Interviewer</span>
                                                </div>
                                                <div className="font-extrabold text-[#0f172a] text-sm">{selectedRequest.interviewer_name}</div>
                                            </div>

                                            {/* Schedule */}
                                            <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                                    <span className="text-sm font-medium">Schedule</span>
                                                </div>
                                                <div className="font-extrabold text-[#0f172a] text-sm">{new Date(selectedRequest.start_date).toLocaleDateString()} @ {selectedRequest.start_time}</div>
                                            </div>

                                            {/* Interview Area */}
                                            <div className="flex items-center justify-between py-4 border-b border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                                                    <span className="text-sm font-medium">Interview Area</span>
                                                </div>
                                                <div className="font-extrabold text-[#0f172a] text-sm">{selectedRequest.interview_area}</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
                                <button 
                                    onClick={() => setSelectedRequest(null)} 
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
            })()}
            {/* EDIT MODAL */}
            {editingRequest && (
                <EditRequestModal 
                    request={editingRequest} 
                    onClose={() => setEditingRequest(null)} 
                    onSave={() => {
                        setEditingRequest(null);
                        fetchRequests(pagination.page);
                    }} 
                />
            )}
        </div>
    );
}
