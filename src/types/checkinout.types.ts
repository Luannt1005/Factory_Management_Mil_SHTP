/**
 * Check-In / Check-Out Domain & API Types
 * Orgchart_TTI_onprem
 */

import type { Visitor, VisitorCheckInOutStatus, VisitorRequestData } from './visitor.types';

export type { VisitorCheckInOutStatus };

export type CheckInOutAction = 
    | 'CHECK_IN' 
    | 'CHECK_OUT' 
    | 'RESET' 
    | 'UPDATE_CARD' 
    | 'REVERSE' 
    | 'INPUT_CARD';

export interface CheckInOutActionPayload {
    action: CheckInOutAction;
    requestId: string;
    requestCode?: string;
    visitorIndex: number;
    visitorName: string;
    visitorCode: string;
    cardNumber?: string | null;
}

export interface CheckInOutActionResponse {
    message: string;
}

export interface CheckInOutVisitorRecord extends Visitor {
    submitterName?: string;
    interviewDepartment?: string | null;
    interviewerName?: string | null;
    requestCode?: string;
}

export interface CheckInOutRequestRecord extends VisitorRequestData {
    visitors: CheckInOutVisitorRecord[];
    createdAt?: string;
    filteredVisitors?: CheckInOutVisitorRecord[];
}

export interface CheckInOutProcessedVisitor extends CheckInOutVisitorRecord {
    _requestInfo: CheckInOutRequestRecord;
}

export interface CheckInOutPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CheckInOutHistoryParams {
    date?: string;
    category?: string;
    site?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface CheckInOutHistoryResponse {
    requests: CheckInOutRequestRecord[];
    pagination: CheckInOutPagination;
}

export interface CheckInOutStats {
    total: number;
    checkedIn: number;
    checkedOut: number;
    pending: number;
}

export type CheckInOutViewMode = 'group' | 'visitor';

export interface CheckInOutFilterState {
    date: string;
    search: string;
    visitorName: string;
}
