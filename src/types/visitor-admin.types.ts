/**
 * Visitor Admin Domain & API Types
 * Orgchart_TTI_onprem
 */

import type { HostDepartment } from './rooms.types';
export type { HostDepartment };

export interface RequestApprovalRecord {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    approver_email: string;
    room_areas: {
        name: string;
        category?: string;
    } | null;
}

export type VisitorAdminApprovalRecord = RequestApprovalRecord;

export interface VisitorAdminVisitorItem {
    name?: string;
    company?: string;
    title?: string;
    interviewDepartment?: string;
    interviewerName?: string;
    [key: string]: unknown;
}

export interface VisitorAdminUserProfile {
    name: string | null;
    department: string | null;
}

export interface VisitorAdminRequestRecord {
    id: string;
    status: string;
    visitor_name: string;
    visitor_title: string;
    current_company: string;
    start_date: string;
    end_date: string;
    purpose_of_visit: string;
    visitor_category: string;
    visiting_site: string;
    purpose_detail: string | null;
    details: string | Record<string, unknown>;
    visitors: string | null;
    created_at: string;
    updated_at: string;
    profile_name: string | null;
    profile_department: string | null;
    profiles?: VisitorAdminUserProfile;
    request_approvals?: RequestApprovalRecord[];
    power_automate_run_id?: string | null;
    /** Visitor codes of this request whose card was confirmed as printed */
    printed_codes?: string[];
    /** Active access cards given in Access Door */
    assigned_cards?: { visitor_code: string; card_no: string }[];
    /** false: rejected or started before printing was recorded */
    card_tracked?: boolean;

    // Interviewee & legacy compatibility fields
    interviewee_name?: string;
    job_title?: string;
    interview_department?: string;
    interviewer_name?: string;
    start_time?: string;
    interview_area?: string;
    visitor_code?: string;
    request_code?: string;
    os_name?: string;
    record_type?: string;
    requestId?: string;
}

export interface VisitorAdminPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface GetVisitorAdminRequestsParams {
    tab: 'general' | 'interviewee';
    page: number;
    limit: number;
    /** Visit date range: requests whose visit overlaps startDate..endDate (one day when only startDate) */
    startDate?: string;
    endDate?: string;
    completeStartDate?: string;
    /** Submit (creation) date range, inclusive */
    submitStartDate?: string;
    submitEndDate?: string;
    completeEndDate?: string;
    site?: string;
    category?: string;
    code?: string;
    /** Finds the request of a visitor code, e.g. V04112607V2 (part of the code also matches) */
    visitorCode?: string;
    submitter?: string;
    status?: string;
    /** Comma list of not_printed, printed, assigned */
    cardStatus?: string;
}

export interface GetVisitorAdminRequestsResponse {
    requests: VisitorAdminRequestRecord[];
    pagination: VisitorAdminPagination;
}

export interface UpdateVisitorAdminStatusPayload {
    id?: string;
    approvalId?: string;
    status: string;
}

export interface UpdateVisitorAdminStatusResponse {
    message: string;
    data?: VisitorAdminRequestRecord;
}

export interface DeleteVisitorAdminRequestsPayload {
    ids: string[];
}

export interface DeleteVisitorAdminRequestsResponse {
    message: string;
}

export interface EditModalVisitorItem {
    name: string;
    company: string;
    title: string;
    interviewDepartment?: string;
}

export interface UpdateVisitorRequestEditPayload {
    start_date: string;
    end_date: string;
    visitor_category: string;
    visiting_site: string;
    details: Record<string, unknown>;
    visitors: EditModalVisitorItem[];
    interviewee_name?: string;
    job_title?: string;
    interview_department?: string;
}

export interface UpdateVisitorRequestEditResponse {
    message?: string;
    data: VisitorAdminRequestRecord;
}
