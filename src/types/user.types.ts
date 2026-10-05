/**
 * User & Account Domain Types
 * Orgchart_TTI_onprem
 */

/**
 * User account record used in User Management and Pending Approvals
 */
export interface UserAccount {
    id: string;
    username: string;
    full_name: string;
    role?: string;
    orgchart_role?: string;
    visitor_role?: string;
    app_role_ids?: string[];
    created_at?: string;
    employee_id?: string;
    email?: string;
    last_login?: string;
    sso_provider?: string;
    status?: string;
    department?: string;
    job_title?: string;
    location?: string;
}

/**
 * System App Role definition (Security, Receptionist, HR-TA, etc.)
 */
export interface AppRole {
    id: string;
    name: string;
    role_name?: string;
    description?: string;
    app_module: string;
}

/**
 * Logged-in Session User state in UserContext
 */
export interface SessionUser {
    id: string | number;
    username: string;
    full_name: string;
    role: string;
    orgchart_role: string;
    visitor_role: string;
    image?: string;
    app_role_names?: string[];
    allowedPages?: string[];
}

/**
 * Self-service profile shown on /profile
 */
export interface UserProfile {
    username: string;
    full_name: string;
    role: string;
    employee_id: string;
    title: string;
}

/**
 * Response envelope of /api/profile and /api/profile/password
 */
export interface ProfileApiResponse<T = undefined> {
    success: boolean;
    message?: string;
    data?: T;
}

/**
 * Payload accepted by PUT /api/profile/password
 */
export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

/**
 * Payload accepted by POST /api/signup
 */
export interface SignupPayload {
    username: string;
    password: string;
    full_name: string;
}

/**
 * Response envelope of POST /api/signup
 */
export interface SignupApiResponse {
    success: boolean;
    message?: string;
    error?: string;
}
