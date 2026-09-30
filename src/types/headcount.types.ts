/**
 * Headcount Domain & API Types
 * Orgchart_TTI_onprem - Phase 12A
 */

// ===============================
// Core Domain Entities
// ===============================

/** Database representation of an employee record */
export interface HeadcountEmployee {
    id: string;
    emp_id: string;
    full_name: string | null;
    job_title: string | null;
    dept: string | null;
    bu: string | null;
    bu_org_3: string | null;
    dl_idl_staff: string | null;
    location: string | null;
    employee_type: string | null;
    line_manager: string | null;
    is_direct: string | null;
    joining_date: string | null;
    last_working_day: string | null;
    line_manager_status: string | null;
    pending_line_manager: string | null;
    requester: string | null;
    status: string | null;
    imported_at?: string;
    updated_at?: string;
}

/** Formatted Sheet Row representation with legacy column keys */
export interface SheetEmployeeRow {
    id: string;
    'Emp ID'?: string;
    'FullName '?: string;
    'FullName'?: string;
    'Job Title'?: string;
    'Dept'?: string;
    'BU'?: string;
    'BU Org 3'?: string;
    'DL/IDL/Staff'?: string;
    'Location'?: string;
    'Employee Type'?: string;
    'Line Manager'?: string;
    'Is Direct'?: string;
    'Joining\r\n Date'?: string;
    'Joining Date'?: string;
    'Last Working\r\nDay'?: string;
    'Last Working Day'?: string;
    'Cost Center'?: string;
    'Status'?: string;
    lineManagerStatus?: string | null;
    pendingLineManager?: string | null;
    requester?: string | null;
    employee_type?: string | null;
    [key: string]: unknown;
}

/** Grouped representation of open headcount positions in HeadcountManager */
export interface GroupedHeadcountRow {
    id: string;
    key?: string;
    ids: string[];
    count: number;
    quantity?: number;
    title?: string;
    dept?: string;
    manager?: string;
    isDirect?: string;
    costCenter?: string;
    joiningDate?: string;
    location?: string;
    dlIdlStaff?: string;
    lastWorkingDay?: string;
    isGroup?: boolean;
    rows?: SheetEmployeeRow[];
    [key: string]: unknown;
}

// ===============================
// Filter & Query Parameters
// ===============================

export interface HeadcountQueryParams {
    id?: string;
    page?: number;
    limit?: number;
    dept?: string;
    bu?: string;
    bu_org_3?: string;
    dl_idl_staff?: string;
    job_title?: string;
    location?: string;
    full_name?: string;
    emp_id?: string;
    employee_type?: string;
    line_manager?: string;
    is_direct?: string;
    lineManagerStatus?: string;
    line_manager_status?: string;
    preventCache?: string;
    [key: string]: string | number | undefined;
}

/** Filter state interface for Headcount Dashboard */
export interface HeadcountFilterState {
    title: string | null;
    bu: string | null;
    category: 'staff' | 'idl' | null;
    employeeType: string | null;
    tenure: string | null;
}

/** Legacy EmployeeFilter union interface for dashboard components */
export interface HeadcountDashboardFilter {
    type: 'all' | 'staff' | 'idl' | 'title' | 'tenure' | 'type' | 'bu_org_3';
    value?: string;
    label?: string;
}

// ===============================
// API Payloads & Requests
// ===============================

export interface BulkAddHeadcountPayload {
    action: 'bulkAddHeadcount';
    quantity: number;
    data: Record<string, unknown>;
}

export interface AddEmployeePayload {
    action: 'add';
    data: Record<string, unknown>;
}

export interface ApproveAllPayload {
    action: 'approveAll';
}

export interface RejectAllPayload {
    action: 'rejectAll';
}

export type SheetActionPayload =
    | BulkAddHeadcountPayload
    | AddEmployeePayload
    | ApproveAllPayload
    | RejectAllPayload;

export interface UpdateEmployeePayload {
    id: string;
    data: Record<string, unknown>;
}

// ===============================
// API Responses
// ===============================

export interface PaginatedEmployeesResponse {
    success: boolean;
    headers?: string[];
    data: SheetEmployeeRow[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    error?: string;
}

export interface SingleEmployeeResponse {
    success: boolean;
    data?: HeadcountEmployee;
    error?: string;
}

export interface HeadcountActionResponse {
    success: boolean;
    count?: number;
    id?: string;
    message?: string;
    error?: string;
}

export interface ImportExcelResult {
    success: boolean;
    total?: number;
    saved?: number;
    deleted?: number;
    error?: string;
}

export interface UploadImageResult {
    success: boolean;
    message?: string;
    url?: string;
    path?: string;
    error?: string;
}
