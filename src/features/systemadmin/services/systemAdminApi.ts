/**
 * System Administration API Service
 * Orgchart_TTI_onprem
 *
 * Centralized service for User Management, Role Management, and Pending Approvals.
 */

import {
    UserAccount,
    SystemAdminRole,
    CreateUserPayload,
    UpdateUserPayload,
    CreateRolePayload,
    UpdateRolePayload,
    SystemAdminActionResponse,
    SystemAdminApiResponse
} from '@/types/system-admin.types';

const ENDPOINTS = {
    USERS: '/api/users',
    ROLES: '/api/roles',
} as const;

export const systemAdminApi = {
    ENDPOINTS,

    // ==========================================
    // User Accounts
    // ==========================================

    /**
     * Fetch all user accounts ordered by full_name
     */
    async getUsers(signal?: AbortSignal): Promise<UserAccount[]> {
        const res = await fetch(ENDPOINTS.USERS, { signal });
        const result: SystemAdminApiResponse<UserAccount[]> = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to fetch users (${res.status})`);
        }
        return result.data || [];
    },

    /**
     * Create a new user account
     */
    async createUser(payload: CreateUserPayload, signal?: AbortSignal): Promise<UserAccount> {
        const res = await fetch(ENDPOINTS.USERS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal,
        });
        const result: SystemAdminApiResponse<UserAccount> = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to create user (${res.status})`);
        }
        return result.data;
    },

    /**
     * Update an existing user account
     */
    async updateUser(payload: UpdateUserPayload, signal?: AbortSignal): Promise<SystemAdminActionResponse> {
        const res = await fetch(ENDPOINTS.USERS, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal,
        });
        const result: SystemAdminActionResponse = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to update user (${res.status})`);
        }
        return result;
    },

    /**
     * Delete a user account by ID
     */
    async deleteUser(id: string, signal?: AbortSignal): Promise<SystemAdminActionResponse> {
        const res = await fetch(`${ENDPOINTS.USERS}?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            signal,
        });
        const result: SystemAdminActionResponse = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to delete user (${res.status})`);
        }
        return result;
    },

    // ==========================================
    // App Roles & Permissions
    // ==========================================

    /**
     * Fetch all application roles
     */
    async getRoles(signal?: AbortSignal): Promise<SystemAdminRole[]> {
        const res = await fetch(ENDPOINTS.ROLES, { signal });
        const result: SystemAdminApiResponse<SystemAdminRole[]> = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to fetch roles (${res.status})`);
        }
        return result.data || [];
    },

    /**
     * Create a new application role
     */
    async createRole(payload: CreateRolePayload, signal?: AbortSignal): Promise<SystemAdminRole> {
        const res = await fetch(ENDPOINTS.ROLES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal,
        });
        const result: SystemAdminApiResponse<SystemAdminRole> = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to create role (${res.status})`);
        }
        return result.data;
    },

    /**
     * Update an existing application role
     */
    async updateRole(payload: UpdateRolePayload, signal?: AbortSignal): Promise<SystemAdminRole> {
        const res = await fetch(ENDPOINTS.ROLES, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal,
        });
        const result: SystemAdminApiResponse<SystemAdminRole> = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to update role (${res.status})`);
        }
        return result.data;
    },

    /**
     * Delete an application role by ID
     */
    async deleteRole(id: string, signal?: AbortSignal): Promise<SystemAdminActionResponse> {
        const res = await fetch(`${ENDPOINTS.ROLES}?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            signal,
        });
        const result: SystemAdminActionResponse = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to delete role (${res.status})`);
        }
        return result;
    },

    // ==========================================
    // Pending Approvals Workflow
    // ==========================================

    /**
     * Fetch all users with status "Pending Approval"
     */
    async getPendingUsers(signal?: AbortSignal): Promise<UserAccount[]> {
        const allUsers = await this.getUsers(signal);
        return allUsers.filter(u => u.status === 'Pending Approval');
    },

    /**
     * Approve a pending user account (sets status to "Active")
     */
    async approveUser(user: UserAccount, signal?: AbortSignal): Promise<SystemAdminActionResponse> {
        return this.updateUser({
            id: user.id,
            full_name: user.full_name,
            role: user.role,
            orgchart_role: user.orgchart_role,
            visitor_role: user.visitor_role,
            app_role_ids: user.app_role_ids,
            employee_id: user.employee_id,
            email: user.email,
            department: user.department,
            job_title: user.job_title,
            location: user.location,
            status: 'Active',
        }, signal);
    },

    /**
     * Reject a pending user account (sets status to "Inactive")
     */
    async rejectUser(user: UserAccount, signal?: AbortSignal): Promise<SystemAdminActionResponse> {
        return this.updateUser({
            id: user.id,
            full_name: user.full_name,
            role: user.role,
            orgchart_role: user.orgchart_role,
            visitor_role: user.visitor_role,
            app_role_ids: user.app_role_ids,
            employee_id: user.employee_id,
            email: user.email,
            department: user.department,
            job_title: user.job_title,
            location: user.location,
            status: 'Inactive',
        }, signal);
    },
};
