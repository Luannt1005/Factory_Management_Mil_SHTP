/**
 * Headcount API Service
 * Orgchart_TTI_onprem - Phase 12A
 * 
 * Centralized API client for all Headcount & Employee Sheet operations.
 */

import {
    HeadcountQueryParams,
    PaginatedEmployeesResponse,
    SingleEmployeeResponse,
    HeadcountActionResponse,
    ImportExcelResult,
    UploadImageResult,
} from '@/types/headcount.types';

const ENDPOINTS = {
    SHEET: '/api/sheet',
    IMPORT_EXCEL: '/api/import_excel',
    UPLOAD_EMPLOYEE_IMAGE: '/api/admin/upload-employee-image',
    UPLOAD_IMAGE: '/api/upload-image',
} as const;

export const headcountApi = {
    ENDPOINTS,

    /**
     * Build standard query URL for /api/sheet
     */
    buildSheetQueryUrl(params: URLSearchParams | Record<string, string | number | undefined>): string {
        if (params instanceof URLSearchParams) {
            const queryStr = params.toString();
            return queryStr ? `${ENDPOINTS.SHEET}?${queryStr}` : ENDPOINTS.SHEET;
        }

        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                searchParams.append(key, String(value).trim());
            }
        });

        const queryStr = searchParams.toString();
        return queryStr ? `${ENDPOINTS.SHEET}?${queryStr}` : ENDPOINTS.SHEET;
    },

    /**
     * Get paginated sheet URL for SWR prefetching
     */
    getPaginatedSheetUrl(page: number, limit: number): string {
        return `${ENDPOINTS.SHEET}?page=${page}&limit=${limit}`;
    },

    /**
     * Get avatar image URL for employee
     */
    getAvatarUrl(empId: unknown, version?: number): string {
        const trimmed = String(empId || '').replace(/^0+/, '') || '0';
        return version !== undefined
            ? `/api/uploads/${trimmed}.webp?v=${version}`
            : `/api/uploads/${trimmed}.webp`;
    },

    /**
     * Get fallback avatar placeholder URL
     */
    getFallbackAvatarUrl(name: string): string {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff&size=64`;
    },

    /**
     * Fetch employees (full list or paginated with filters)
     */
    async getEmployees(
        params?: HeadcountQueryParams,
        signal?: AbortSignal
    ): Promise<PaginatedEmployeesResponse> {
        const url = params ? this.buildSheetQueryUrl(params) : ENDPOINTS.SHEET;
        const res = await fetch(url, { signal });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error ${res.status}`);
        }
        return res.json();
    },

    /**
     * Fetch a single employee by id
     */
    async getEmployeeById(
        id: string,
        signal?: AbortSignal
    ): Promise<SingleEmployeeResponse> {
        const url = `${ENDPOINTS.SHEET}?id=${encodeURIComponent(id)}`;
        const res = await fetch(url, { signal });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error ${res.status}`);
        }
        return res.json();
    },

    /**
     * Add single employee
     */
    async addEmployee(
        data: Record<string, unknown>,
        signal?: AbortSignal
    ): Promise<HeadcountActionResponse> {
        const res = await fetch(ENDPOINTS.SHEET, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', data }),
            signal,
        });
        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.error || `HTTP error ${res.status}`);
        }
        return result;
    },

    /**
     * Bulk add open headcount positions
     */
    async bulkAddHeadcount(
        quantity: number,
        data: Record<string, unknown>,
        signal?: AbortSignal
    ): Promise<HeadcountActionResponse> {
        const res = await fetch(ENDPOINTS.SHEET, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'bulkAddHeadcount',
                quantity,
                data,
            }),
            signal,
        });
        const result = await res.json();
        if (!res.ok && !result.success) {
            throw new Error(result.error || `HTTP error ${res.status}`);
        }
        return result;
    },

    /**
     * Update employee fields or approval status
     */
    async updateEmployee(
        id: string,
        data: Record<string, unknown>,
        signal?: AbortSignal
    ): Promise<HeadcountActionResponse> {
        const res = await fetch(ENDPOINTS.SHEET, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, data }),
            signal,
        });
        const result = await res.json();
        if (!res.ok && !result.success) {
            throw new Error(result.error || `HTTP error ${res.status}`);
        }
        return result;
    },

    /**
     * Delete single employee by id
     */
    async deleteEmployee(
        id: string,
        signal?: AbortSignal
    ): Promise<HeadcountActionResponse> {
        const res = await fetch(`${ENDPOINTS.SHEET}?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            signal,
        });
        const result = await res.json();
        if (!res.ok && !result.success) {
            throw new Error(result.error || `HTTP error ${res.status}`);
        }
        return result;
    },

    /**
     * Delete all employees
     */
    async deleteAllEmployees(
        signal?: AbortSignal
    ): Promise<HeadcountActionResponse> {
        const res = await fetch(`${ENDPOINTS.SHEET}?deleteAll=true`, {
            method: 'DELETE',
            signal,
        });
        const result = await res.json();
        if (!res.ok && !result.success) {
            throw new Error(result.error || `HTTP error ${res.status}`);
        }
        return result;
    },

    /**
     * Approve all pending line manager change requests
     */
    async approveAllPending(
        signal?: AbortSignal
    ): Promise<HeadcountActionResponse> {
        const res = await fetch(ENDPOINTS.SHEET, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approveAll' }),
            signal,
        });
        const result = await res.json();
        if (!res.ok && !result.success) {
            throw new Error(result.error || `HTTP error ${res.status}`);
        }
        return result;
    },

    /**
     * Reject all pending line manager change requests
     */
    async rejectAllPending(
        signal?: AbortSignal
    ): Promise<HeadcountActionResponse> {
        const res = await fetch(ENDPOINTS.SHEET, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rejectAll' }),
            signal,
        });
        const result = await res.json();
        if (!res.ok && !result.success) {
            throw new Error(result.error || `HTTP error ${res.status}`);
        }
        return result;
    },

    /**
     * Import employees from Excel file
     */
    async importExcel(
        file: File,
        signal?: AbortSignal
    ): Promise<ImportExcelResult> {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(ENDPOINTS.IMPORT_EXCEL, {
            method: 'POST',
            body: formData,
            signal,
        });
        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.error || 'Upload failed');
        }
        return result;
    },

    /**
     * Upload employee image via admin endpoint
     */
    async uploadEmployeeImage(
        file: Blob,
        filename: string,
        signal?: AbortSignal
    ): Promise<UploadImageResult> {
        const formData = new FormData();
        formData.append('file', file, filename);
        formData.append('filename', filename);

        const res = await fetch(ENDPOINTS.UPLOAD_EMPLOYEE_IMAGE, {
            method: 'POST',
            body: formData,
            signal,
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.error || 'Upload failed');
        }
        return result;
    },

    /**
     * Upload image via standard upload endpoint
     */
    async uploadImage(
        file: Blob,
        filename: string,
        signal?: AbortSignal
    ): Promise<UploadImageResult> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', filename);

        const res = await fetch(ENDPOINTS.UPLOAD_IMAGE, {
            method: 'POST',
            body: formData,
            signal,
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.error || 'Upload failed');
        }
        return result;
    },

    /**
     * Fetch pending approvals count for Review Changes badge
     */
    async getPendingCount(signal?: AbortSignal): Promise<number> {
        try {
            const url = `${ENDPOINTS.SHEET}?page=1&limit=1&lineManagerStatus=pending`;
            const res = await fetch(url, { signal });
            if (!res.ok) return 0;
            const data = await res.json();
            return data.success ? (data.total || 0) : 0;
        } catch {
            return 0;
        }
    }
};
