/**
 * Orgchart Domain & API Types
 * Orgchart_TTI_onprem
 */

export interface OrgChartNode {
    id: string | number;
    name: string;
    pid?: string | number | null;
    stpid?: string | number | null;
    title?: string;
    image?: string | null;
    img?: string | null;
    photo?: string | null;
    tags?: string | string[];
    orig_pid?: string | number | null;
    dept?: string | null;
    bu?: string | null;
    BU?: string | null;
    type?: string | null;
    location?: string | null;
    description?: string | null;
    joining_date?: string | null;
    joiningDate?: string | null;
    line_manager?: string | null;
    lineManager?: string | null;
    is_direct?: string | null;
    last_working_day?: string | null;
}

export interface OrgChartApiResponse<T = OrgChartNode> {
    data: T[];
    success: boolean;
    timestamp?: string;
    cached?: boolean;
    error?: string;
}

export interface GetOrgchartParams {
    dept?: string;
}

export interface OrgChartMutationPayload {
    id: string | number;
    pid?: string | number | null;
    stpid?: string | number | null;
    name?: string;
    title?: string;
    image?: string | null;
    img?: string | null;
    tags?: string[] | string;
    orig_pid?: string | number | null;
    dept?: string | null;
    bu?: string | null;
    BU?: string | null;
    type?: string | null;
    location?: string | null;
    description?: string | null;
    joiningDate?: string | null;
    lineManager?: string | null;
}

export interface CustomOrgChartRecord {
    orgchart_id: string;
    orgchart_name: string;
    describe?: string;
    org_data: { data: OrgChartNode[] };
    is_public: boolean;
    username: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateCustomOrgchartPayload {
    username: string;
    orgchart_name: string;
    describe?: string;
    org_data: { data: OrgChartNode[] };
    is_public?: boolean;
}

export interface UpdateCustomOrgchartPayload {
    orgchart_name?: string;
    describe?: string;
    org_data?: { data: OrgChartNode[] };
    is_public?: boolean;
}

export interface CoreTeamEmployee {
    emp_id: string;
    full_name: string | null;
    job_title: string | null;
    dept: string | null;
    location: string | null;
    line_manager?: string | null;
    status?: string | null;
}

export type SpanOfControlBreakdown = Record<string, number>;

export interface SpanOfControlItem {
    total: number;
    breakdown: SpanOfControlBreakdown;
}

export interface CoreTeamResponse {
    success: boolean;
    vp: CoreTeamEmployee | null;
    globalOps: CoreTeamEmployee | null;
    ie_fmu_mif: CoreTeamEmployee | null;
    factoryMgmt: CoreTeamEmployee | null;
    jeffReports: CoreTeamEmployee[];
    supportFunctions: CoreTeamEmployee[];
    reports: Record<string, CoreTeamEmployee[]>;
    spanOfControl: Record<string, SpanOfControlItem>;
    timestamp?: string;
    error?: string;
}

export interface OpsSupportResponse {
    success: boolean;
    root: CoreTeamEmployee | null;
    directReports: CoreTeamEmployee[];
    reports: Record<string, CoreTeamEmployee[]>;
    spanOfControl: Record<string, SpanOfControlItem>;
    timestamp?: string;
    error?: string;
}

export interface AddDepartmentPayload {
    name: string;
    pid?: string | number;
    description?: string;
    id?: string;
}

// Aliases for compatibility
export type OrgNode = OrgChartNode;
export type CustomOrgChartProfile = CustomOrgChartRecord;
