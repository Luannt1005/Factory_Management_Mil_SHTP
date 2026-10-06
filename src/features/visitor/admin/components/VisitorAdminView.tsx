'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { visitorAdminApi, VisitorAdminApiError } from '@/features/visitor/admin/services/visitorAdminApi';
import VisitorAdminFilters from '@/features/visitor/admin/components/VisitorAdminFilters';
import VisitorAdminTable from '@/features/visitor/admin/components/VisitorAdminTable';
import VisitorDetailModal from '@/features/visitor/admin/components/VisitorDetailModal';
import VisitorEditModal from '@/features/visitor/admin/components/VisitorEditModal';
import StatusConfirmModal from '@/features/visitor/admin/components/StatusConfirmModal';
import type {
    VisitorAdminRequestRecord,
    VisitorAdminPagination,
    VisitorAdminApprovalRecord,
    VisitorAdminVisitorItem,
    HostDepartment,
} from '@/types/visitor-admin.types';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'general' | 'interviewee'>('general');
    const [requests, setRequests] = useState<VisitorAdminRequestRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<VisitorAdminPagination>({ total: 0, page: 1, limit: 15, totalPages: 0 });
    const [startDate, setStartDate] = useState('');
    const [completeStartDate, setCompleteStartDate] = useState('');
    const [completeEndDate, setCompleteEndDate] = useState('');
    const [sites, setSites] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [code, setCode] = useState('');
    const [submitter, setSubmitter] = useState('');
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [exporting, setExporting] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<VisitorAdminRequestRecord | null>(null);
    const [editingRequest, setEditingRequest] = useState<VisitorAdminRequestRecord | null>(null);
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; status: 'COMPLETE' | 'REJECTED' } | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchRequests(1);
    }, [startDate, completeStartDate, completeEndDate, sites, categories, code, submitter, statusFilters, activeTab]);

    const fetchRequests = async (page: number) => {
        setLoading(true);
        setSelectedRowIds([]);
        try {
            const data = await visitorAdminApi.getRequests({
                tab: activeTab,
                page,
                limit: pagination.limit,
                startDate: startDate || undefined,
                completeStartDate: completeStartDate || undefined,
                completeEndDate: completeEndDate || undefined,
                site: sites.length > 0 ? sites.join(',') : undefined,
                category: categories.length > 0 ? categories.join(',') : undefined,
                code: code || undefined,
                submitter: submitter || undefined,
                status: statusFilters.length > 0 ? statusFilters.join(',') : undefined,
            });
            setRequests(data.requests);
            setPagination(data.pagination);
        } catch (err: unknown) {
            if (err instanceof VisitorAdminApiError && (err.status === 401 || err.status === 403)) {
                router.push('/login?redirect=' + window.location.pathname);
            } else {
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

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

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const data = await visitorAdminApi.getRequests({
                tab: activeTab,
                page: 1,
                limit: 999999,
                startDate: startDate || undefined,
                completeStartDate: completeStartDate || undefined,
                completeEndDate: completeEndDate || undefined,
                site: sites.length > 0 ? sites.join(',') : undefined,
                category: categories.length > 0 ? categories.join(',') : undefined,
                code: code || undefined,
                submitter: submitter || undefined,
                status: statusFilters.length > 0 ? statusFilters.join(',') : undefined,
            });

            // Fetch host departments to map names
            let hostDepts: HostDepartment[] = [];
            try {
                const jsonRes = await visitorAdminApi.getHostDepartments();
                hostDepts = jsonRes.hostDepartments || [];
            } catch (e) {}

            const ExcelJS = await import('exceljs');

            const exportData = data.requests.flatMap((r: VisitorAdminRequestRecord): Record<string, unknown>[] => {
                const details = parseDetails(r.details);
                const isCompleted = r.status === 'COMPLETE' || r.status === 'APPROVED' || r.status === 'REJECTED';
                const approvalProgress = (r.request_approvals || []).map((a: VisitorAdminApprovalRecord) =>
                    `[${a.status}] ${a.room_areas?.name || 'Host'} (${a.approver_email})`
                ).join(' ; ');

                const hdObj = hostDepts.find((h: HostDepartment) =>
                    (details.functionalDept && details.department && h.functional_dept?.toLowerCase() === details.functionalDept.toLowerCase() && h.department?.toLowerCase() === details.department.toLowerCase()) ||
                    (details.department && h.department?.toLowerCase() === details.department.toLowerCase())
                ) || {} as Partial<HostDepartment>;

                if (activeTab === 'general') {
                    let visitorsArr: VisitorAdminVisitorItem[] = [];
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

                    const rawCode = (r.request_code || r.id || '').replace(/^#/, '').split('-')[0].toUpperCase();
                    const reqCode = rawCode;

                    return visitorsArr.map((v: VisitorAdminVisitorItem, index: number) => {
                        const visCode = `${reqCode}V${index + 1}`;

                        return {
                            'Request Code': reqCode,
                            'Visitor Code': visCode,
                            'Visitor Name': v.name || r.visitor_name || '',
                            'Visitor Title': v.title || r.visitor_title || '',
                            'Visitor Company': v.company || r.current_company || '',
                            'Submitter Name': r.profile_name || r.profiles?.name || r.os_name || '',
                            'Submitter Department': details.submitterDept || r.profile_department || r.profiles?.department || '',
                            'Start Date': toExcelDate(r.start_date),
                            'End Date': toExcelDate(r.end_date),
                            'Visitor Category': r.visitor_category || '',
                            'Purpose Of Visit': r.purpose_of_visit || '',
                            'Purpose Detail': r.purpose_detail || details.purpose || '',
                            'Visiting Site': r.visiting_site || '',
                            'BU': details.bu || hdObj.bu || '',
                            'Host Functional Dept': details.functionalDept || '',
                            'Func Host Name': hdObj.functional_host_name || details.functionalHostName || '',
                            'Host Department': details.department || '',
                            'Dept Host Name': hdObj.department_host_name || details.departmentHostName || '',
                            'Cost Center': details.costCenter || '',
                            'Factory Tour': details.factoryTour || '',
                            'Meal Registration': details.mealRegistration || '',
                            'Status': r.status || '',
                            'Approval Progress': approvalProgress,
                            'Submit Date': toExcelDate(r.created_at),
                            'Completion Date': isCompleted ? toExcelDate(r.updated_at) : ''
                        };
                    });
                } else {
                    const rawCode = (r.visitor_code || r.request_code || r.id || '').replace(/^#/, '').split('-')[0].toUpperCase();
                    const reqCode = rawCode;
                    const visCode = r.visitor_code
                        ? r.visitor_code.replace(/^#/, '').replace(/-/g, '')
                        : `${reqCode}V1`;

                    return [{
                        'Request Code': reqCode,
                        'Visitor Code': visCode,
                        'Visitor Name': r.interviewee_name || r.visitor_name || '',
                        'Visitor Title': r.job_title || r.visitor_title || '',
                        'Visitor Company': details.company || r.current_company || '',
                        'Submitter Name': r.profile_name || r.profiles?.name || r.os_name || '',
                        'Submitter Department': details.submitterDept || r.profile_department || r.profiles?.department || '',
                        'Start Date': toExcelDate(r.start_date),
                        'End Date': toExcelDate(r.end_date || r.start_date),
                        'Visitor Category': r.visitor_category || 'Interviewee',
                        'Purpose Of Visit': r.purpose_of_visit || 'Interview',
                        'Purpose Detail': r.purpose_detail || details.interviewArea || r.interview_area || '',
                        'Visiting Site': r.visiting_site || '',
                        'BU': details.bu || hdObj.bu || '',
                        'Host Functional Dept': details.functionalDept || '',
                        'Func Host Name': hdObj.functional_host_name || details.functionalHostName || '',
                        'Host Department': details.interviewDepartment || r.interview_department || details.department || '',
                        'Dept Host Name': details.interviewerName || r.interviewer_name || hdObj.department_host_name || '',
                        'Cost Center': details.costCenter || '',
                        'Factory Tour': details.factoryTour || '',
                        'Meal Registration': details.mealRegistration || '',
                        'Status': r.status || '',
                        'Approval Progress': approvalProgress,
                        'Submit Date': toExcelDate(r.created_at),
                        'Completion Date': isCompleted ? toExcelDate(r.updated_at) : ''
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

                exportData.forEach((dataRow: Record<string, unknown>) => {
                    worksheet.addRow(dataRow);
                });

                // Date columns: Excel "Short Date" format, right-aligned
                DATE_EXPORT_COLUMNS.forEach((key) => {
                    if (!columns.some(c => c.key === key)) return;
                    const column = worksheet.getColumn(key);
                    column.numFmt = 'dd/mm/yyyy';
                    column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                        if (rowNumber > 1) cell.alignment = { horizontal: 'right' };
                    });
                });

                // Style the header row
                const headerRow = worksheet.getRow(1);
                headerRow.eachCell((cell) => {
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFDB011C' }
                    };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });
                headerRow.height = 24;

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
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    // Approve / Reject buttons only open the confirmation modal; the update runs on confirm
    const handleUpdateStatus = (id: string, status: string) => {
        if (status === 'COMPLETE' || status === 'REJECTED') {
            setPendingStatusChange({ id, status });
        }
    };

    const confirmStatusChange = async () => {
        if (!pendingStatusChange) return;
        try {
            await visitorAdminApi.updateRequestStatus(pendingStatusChange.id, pendingStatusChange.status);
            setPendingStatusChange(null);
            fetchRequests(pagination.page);
        } catch (err) {
            console.error(err);
        }
    };

    const pendingStatusRequest = pendingStatusChange ? requests.find(r => r.id === pendingStatusChange.id) : undefined;

    const handleDeleteSelected = async () => {
        if (selectedRowIds.length === 0) return;
        if (!confirm('Are you sure you want to delete the selected requests?')) return;

        try {
            await visitorAdminApi.deleteRequests(selectedRowIds);
            setSelectedRowIds([]);
            fetchRequests(pagination.page);
        } catch (err) {
            console.error(err);
            alert('Failed to delete requests');
        }
    };

    const handleClearFilters = () => {
        setStartDate('');
        setCompleteStartDate('');
        setCompleteEndDate('');
        setSites([]);
        setCategories([]);
        setCode('');
        setSubmitter('');
        setStatusFilters([]);
    };

    const handleSelectRow = (id: string, selected: boolean) => {
        if (selected) {
            setSelectedRowIds(prev => [...prev, id]);
        } else {
            setSelectedRowIds(prev => prev.filter(rowId => rowId !== id));
        }
    };

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            setSelectedRowIds(requests.map(r => r.id));
        } else {
            setSelectedRowIds([]);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-mwk text-mwk' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    General Visitors
                </button>
                <button
                    onClick={() => setActiveTab('interviewee')}
                    className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'interviewee' ? 'border-mwk text-mwk' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Interviewee
                </button>
            </div>

            {/* Filters */}
            <VisitorAdminFilters
                activeTab={activeTab}
                code={code}
                onCodeChange={setCode}
                submitter={submitter}
                onSubmitterChange={setSubmitter}
                startDate={startDate}
                onStartDateChange={setStartDate}
                completeStartDate={completeStartDate}
                onCompleteStartDateChange={setCompleteStartDate}
                completeEndDate={completeEndDate}
                onCompleteEndDateChange={setCompleteEndDate}
                sites={sites}
                onSitesChange={setSites}
                categories={categories}
                onCategoriesChange={setCategories}
                statusFilters={statusFilters}
                onStatusFiltersChange={setStatusFilters}
                onClearFilters={handleClearFilters}
                selectedRowIds={selectedRowIds}
                onDeleteSelected={handleDeleteSelected}
                onExportExcel={handleExportExcel}
                exporting={exporting}
                currentCount={requests.length}
                totalCount={pagination.total}
            />

            {/* Table */}
            <VisitorAdminTable
                activeTab={activeTab}
                requests={requests}
                loading={loading}
                selectedRowIds={selectedRowIds}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
                onView={setSelectedRequest}
                onEdit={setEditingRequest}
                onUpdateStatus={handleUpdateStatus}
                pagination={pagination}
                onPageChange={fetchRequests}
            />

            {/* Detail Modal */}
            <VisitorDetailModal
                request={selectedRequest}
                activeTab={activeTab}
                onClose={() => setSelectedRequest(null)}
            />

            {/* Approve / Reject confirmation */}
            <StatusConfirmModal
                status={pendingStatusChange?.status ?? null}
                requestRef={((pendingStatusRequest?.request_code || pendingStatusChange?.id || '').replace(/^#/, '').split('-')[0]).toUpperCase()}
                visitorName={pendingStatusRequest?.visitor_name || pendingStatusRequest?.interviewee_name}
                onConfirm={confirmStatusChange}
                onClose={() => setPendingStatusChange(null)}
            />

            {/* Edit Modal */}
            {editingRequest && (
                <VisitorEditModal
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

const DATE_EXPORT_COLUMNS = ['Start Date', 'End Date', 'Submit Date', 'Completion Date'];

/**
 * Converts an API date/timestamp into a Date that Excel shows as the same calendar day.
 * ExcelJS writes Dates as UTC, so the local (VN) calendar day is rebuilt as a UTC midnight.
 */
function toExcelDate(value?: string | null): Date | '' {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}
