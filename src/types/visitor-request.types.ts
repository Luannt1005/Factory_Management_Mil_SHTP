/**
 * Visitor Request Domain & Form Types
 * Orgchart_TTI_onprem
 */

export type VisitorCategoryType =
    | 'Vendor'
    | 'Contractor'
    | 'Vendor/Contractor'
    | 'MIL/TTI Expat / SHTP Business trip'
    | 'Interviewee'
    | string;

export type VisitingSiteType = 'SHTP' | 'DDK' | 'SHTP/DDK' | string;

export interface VisitorItem {
    name: string;
    title: string;
    company: string;
}

export type VisitorInfo = VisitorItem;

export interface IntervieweeItem {
    name: string;
    jobTitle: string;
    interviewDepartment: string;
    interviewerName: string;
}

export type IntervieweeInfo = IntervieweeItem;

export interface VisitorRequestDetails {
    factoryTour?: 'Yes' | 'No' | string;
    mealRegistration?: 'Yes' | 'No' | string;
    costCenter?: string;
    startTime?: string;
    interviewArea?: string;
    bu?: string | null;
    functionalDept?: string | null;
    department?: string | null;
}

export interface VisitorRequestFormData {
    visitors: VisitorItem[];
    interviewees: IntervieweeItem[];
    startDate: string;
    endDate: string;
    purposeOfVisit: string;
    visitorCategory: VisitorCategoryType;
    visitingSite: VisitingSiteType;
    purposeDetail: string;
    details: {
        factoryTour: 'Yes' | 'No' | string;
        mealRegistration: 'Yes' | 'No' | string;
        costCenter: string;
    };
    roomIds: string[];
    intervieweeName: string;
    jobTitle: string;
    interviewDepartment: string;
    interviewerName: string;
    startTime: string;
    interviewArea: string;
    bu: string;
    functionalDept: string;
    department: string;
}

export interface VisitorRequestPayloadVisitor {
    name: string;
    title?: string;
    company?: string;
    interviewDepartment?: string;
    interviewerName?: string;
}

export interface CreateVisitorRequestPayload {
    visitors: VisitorRequestPayloadVisitor[];
    visitorName: string;
    visitorTitle: string;
    currentCompany: string;
    purposeOfVisit: string;
    purposeDetail?: string;
    startDate: string;
    endDate: string;
    visitorCategory: string;
    visitingSite: string;
    details: VisitorRequestDetails;
    roomIds?: string[];
    bu?: string;
    functionalDept?: string;
    department?: string;
    intervieweeName?: string;
    jobTitle?: string;
    interviewDepartment?: string;
    interviewerName?: string;
    startTime?: string;
    interviewArea?: string;
}

export interface CreateVisitorRequestSuccessResponse {
    id: string;
    message?: string;
}

export interface VisitorRequestApiError {
    error: string;
}
