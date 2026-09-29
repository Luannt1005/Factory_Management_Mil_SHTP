/**
 * Visitor Dashboard Domain & API Types
 * Orgchart_TTI_onprem
 */

import type { MeetingRoom } from './rooms.types';
import type { RequestApprovalRecord } from './visitor-admin.types';

export type { MeetingRoom, RequestApprovalRecord };

export type VisitorDashboardTab = 'general' | 'interviewee';

export interface VisitorDashboardCandidateItem {
    name: string;
    title: string;
    company: string;
    interviewDepartment: string;
    interviewerName: string;
}

export interface VisitorDashboardParsedDetails {
    costCenter?: string;
    factoryTour?: string;
    mealRegistration?: string;
    startTime?: string;
    interviewArea?: string;
    [key: string]: unknown;
}

export interface VisitorDashboardRequestRecord {
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
    details: string | VisitorDashboardParsedDetails;
    visitors: string | null;
    edit_count?: number;
    editCount?: number;
    created_at: string;
    request_approvals?: RequestApprovalRecord[];

    // Interviewee & legacy compatibility fields
    interviewee_name?: string;
    job_title?: string;
    interview_department?: string;
    interviewer_name?: string;
    start_time?: string;
    interview_area?: string;
    visitor_code?: string;
}

export interface VisitorDashboardPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface GetVisitorDashboardRequestsParams {
    tab: VisitorDashboardTab;
    page: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface GetVisitorDashboardRequestsResponse {
    requests: VisitorDashboardRequestRecord[];
    pagination: VisitorDashboardPagination;
}

export interface UpdateIntervieweeRequestPayload {
    visitors: VisitorDashboardCandidateItem[];
    startDate: string;
    startTime: string;
    interviewArea: string;
    mealRegistration: string;
    factoryTour: string;
    visitingSite: string;
}

export interface UpdateIntervieweeRequestResponse {
    message: string;
    editCount?: number;
    error?: string;
}

export interface GetMeetingRoomsResponse {
    meetingRooms: MeetingRoom[];
}
