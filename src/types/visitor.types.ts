/**
 * Visitor & Security Domain Types
 * Orgchart_TTI_onprem
 */

export type VisitorCheckInOutStatus = 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT';

export interface Visitor {
    visitorIndex: number;
    visitorName: string;
    visitorTitle?: string;
    visitorCompany?: string;
    visitorCode?: string;
    cardNumber?: string;
    checkInOutStatus: VisitorCheckInOutStatus;
    checkInTime?: string | null;
    checkOutTime?: string | null;
}

export interface VisitorRequestData {
    requestId: string;
    requestCode?: string;
    submitterName?: string;
    submitterDepartment?: string;
    visitorCategory?: string;
    visitingSite?: string;
    purposeOfVisit?: string;
    purposeDetail?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    visitors: Visitor[];
}

export interface VisitorLogEntry {
    id: string;
    requestId: string;
    requestCode: string;
    visitorIndex: number;
    visitorCode: string;
    visitorName: string;
    action: 'CHECK_IN' | 'CHECK_OUT' | 'INPUT_CARD' | 'REVERSE' | string;
    cardNumber: string | null;
    performedBy: string;
    performedByName: string | null;
    details: any;
    createdAt: string;
}
