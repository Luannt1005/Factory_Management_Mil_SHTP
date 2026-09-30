/**
 * System Administration Domain Types
 * Orgchart_TTI_onprem
 */

import { UserAccount, AppRole, SessionUser } from './user.types';

// Re-export core user types to maintain single source of truth
export type { UserAccount, AppRole, SessionUser };

/**
 * System Admin Role representation with permissions and timestamps
 */
export interface SystemAdminRole extends AppRole {
    permissions: string[];
    created_at?: string;
    updated_at?: string;
}

/**
 * Payload for creating a new user account
 */
export interface CreateUserPayload {
    username: string;
    full_name: string;
    password: string;
    role?: string;
    orgchart_role?: string;
    visitor_role?: string;
    app_role_ids?: string[];
    employee_id?: string;
    email?: string;
    department?: string;
    job_title?: string;
    location?: string;
    status?: string;
}

/**
 * Payload for updating an existing user account
 */
export interface UpdateUserPayload {
    id: string;
    full_name: string;
    role?: string;
    orgchart_role?: string;
    visitor_role?: string;
    password?: string;
    app_role_ids?: string[];
    employee_id?: string;
    email?: string;
    department?: string;
    job_title?: string;
    location?: string;
    status?: string;
}

/**
 * Payload for creating a new app role
 */
export interface CreateRolePayload {
    name: string;
    app_module: string;
    description?: string;
    permissions: string[];
}

/**
 * Payload for updating an existing app role
 */
export interface UpdateRolePayload {
    id: string;
    name: string;
    app_module: string;
    description?: string;
    permissions: string[];
}

/**
 * Standard action response for System Admin mutations
 */
export interface SystemAdminActionResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: unknown;
}

/**
 * Generic API response wrapper for typed responses
 */
export interface SystemAdminApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

/**
 * Permission Matrix Module definition for page access checkboxes
 */
export interface PermissionPage {
    key: string;
    label: string;
}

export interface PermissionModule {
    module: string;
    pages: PermissionPage[];
}

/**
 * System Admin navigation tab identifiers
 */
export type SystemAdminTab = 'users' | 'roles' | 'pending';
