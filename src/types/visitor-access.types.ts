/**
 * Visitor Access Door Domain Types
 * Orgchart_TTI_onprem
 *
 * A visitor gets door access by becoming a HikCentral person (personCode = visitor code) holding one
 * card in a department (org) whose access levels open the doors. Adding the person to an access level
 * directly is optional (only when the app key may use the access control APIs).
 * Every assignment is recorded in "visitor_access_assignments" (Visitor_database) for audit and
 * to know which physical card is in use.
 */

/** active = card works; replaced = superseded by a newer assignment of the same visitor; failed = HikCentral rejected it */
export type AccessAssignmentStatus = 'active' | 'revoked' | 'failed' | 'replaced';

export interface AccessAssignment {
    id: string;
    visitorCode: string;
    requestCode: string;
    visitorName: string;
    company: string;
    category: string;
    site: string;
    cardNo: string;
    /** HikCentral person ID (null when the person could not be created) */
    personId: string | null;
    orgIndexCode: string;
    orgName: string;
    /** '' when the access comes from the department only */
    privilegeGroupId: string;
    privilegeGroupName: string;
    beginTime: string;
    endTime: string;
    status: AccessAssignmentStatus;
    lastError: string | null;
    assignedBy: string | null;
    assignedAt: string;
    revokedBy: string | null;
    revokedAt: string | null;
}

/** Row shape of "visitor_access_assignments" */
export interface AccessAssignmentRow {
    id: string;
    visitor_code: string;
    request_code: string | null;
    visitor_name: string;
    company: string | null;
    category: string | null;
    site: string | null;
    card_no: string;
    person_id: string | null;
    org_index_code: string | null;
    org_name: string | null;
    privilege_group_id: string | null;
    privilege_group_name: string | null;
    begin_time: string;
    end_time: string;
    status: AccessAssignmentStatus;
    last_error: string | null;
    assigned_by: string | null;
    assigned_at: string;
    revoked_by: string | null;
    revoked_at: string | null;
}

export interface HikOrg {
    orgIndexCode: string;
    orgName: string;
    parentOrgIndexCode: string;
}

export interface HikAccessLevel {
    privilegeGroupId: string;
    privilegeGroupName: string;
    description: string;
}

/** A HikCentral person (employee or visitor) holding a given card */
export interface HikCardHolder {
    personId: string;
    /** Employee ID, or the visitor code for visitors created by Access Door */
    personCode: string;
    personName: string;
    orgIndexCode: string;
    beginTime: string;
    endTime: string;
    remark: string;
    cardNos: string[];
}

/** GET /api/visitor_admin/access/card-lookup */
export interface CardLookupResponse {
    cardNo: string;
    /** Who holds the card in HikCentral right now */
    holders: HikCardHolder[];
    /** Set when HikCentral could not be asked (the history below is still returned) */
    hikError: string | null;
    /** Access Door records of this card, newest first (active one included) */
    history: AccessAssignment[];
}

/**
 * POST /api/visitor_admin/access/card-lookup  { cardNo, personId }
 * visitor-revoked: an Access Door visitor - the person was deleted (card freed, record revoked)
 * card-removed: an employee / other person - only this card was taken off the person
 */
export interface CardReleaseResponse {
    mode: 'visitor-revoked' | 'card-removed';
}

/** Live lists from HikCentral; each part reports its own error (e.g. API not granted to the app key) */
export interface AccessOptionsResponse {
    configured: boolean;
    orgs: HikOrg[];
    accessLevels: HikAccessLevel[];
    errors: { orgs?: string; accessLevels?: string };
}

/**
 * Defaults per "<requestType>|<site>" key, e.g. "vendor|SHTP"; "*" matches any category / site
 * ("*|*" is the global default). defaultOrgs values are orgIndexCode, defaultLevels privilegeGroupId.
 */
export interface AccessSettings {
    defaultOrgs: Record<string, string>;
    defaultLevels: Record<string, string>;
}

export interface AccessSettingsResponse {
    settings: AccessSettings;
}

export interface AssignCardPayload {
    visitorCode: string;
    requestCode: string;
    visitorName: string;
    company: string;
    category: string;
    site: string;
    cardNo: string;
    orgIndexCode: string;
    orgName: string;
    /** Optional: '' = no direct access level (doors come from the department) */
    privilegeGroupId: string;
    privilegeGroupName: string;
    /** Local date-time "YYYY-MM-DDTHH:mm" (factory time zone) */
    beginTime: string;
    endTime: string;
}

export interface AccessAssignmentsResponse {
    assignments: AccessAssignment[];
}

export interface AccessAssignmentResponse {
    assignment: AccessAssignment;
}

export type AccessAssignmentAction = 'revoke' | 'check';

/** One device-side failure reported by HikCentral for the visitor */
export interface AccessApplicationFailure {
    deviceName: string;
    resourceName: string;
    errorItems: string[];
}

export interface AccessCheckResponse {
    failures: AccessApplicationFailure[];
    /** Platform-wide counters of data not yet applied to devices */
    pendingCount: number | null;
}
