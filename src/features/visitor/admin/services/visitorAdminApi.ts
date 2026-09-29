/**
 * Visitor Admin API Service
 * Centralized API client for all Visitor Admin operations
 * Orgchart_TTI_onprem
 */

import type { HostDepartmentsApiResponse } from '@/types/rooms.types';
import type {
    GetVisitorAdminRequestsParams,
    GetVisitorAdminRequestsResponse,
    UpdateVisitorAdminStatusResponse,
    DeleteVisitorAdminRequestsResponse,
    UpdateVisitorRequestEditPayload,
    UpdateVisitorRequestEditResponse,
} from '@/types/visitor-admin.types';

export class VisitorAdminApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'VisitorAdminApiError';
    }
}

async function handleResponse<T>(res: Response, defaultMessage: string): Promise<T> {
    if (!res.ok) {
        let errorMsg = defaultMessage;
        try {
            const data = await res.json();
            errorMsg = data.error || data.message || defaultMessage;
        } catch {
            // fallback
        }
        throw new VisitorAdminApiError(errorMsg, res.status);
    }
    return res.json() as Promise<T>;
}

export function buildRequestsQueryString(params: GetVisitorAdminRequestsParams): string {
    const searchParams = new URLSearchParams();
    searchParams.set('tab', params.tab);
    searchParams.set('page', String(params.page));
    searchParams.set('limit', String(params.limit));

    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.completeStartDate) searchParams.set('completeStartDate', params.completeStartDate);
    if (params.completeEndDate) searchParams.set('completeEndDate', params.completeEndDate);
    if (params.site) searchParams.set('site', params.site);
    if (params.category) searchParams.set('category', params.category);
    if (params.code) searchParams.set('code', params.code);
    if (params.submitter) searchParams.set('submitter', params.submitter);
    if (params.status) searchParams.set('status', params.status);

    return searchParams.toString();
}

export async function getRequests(
    params: GetVisitorAdminRequestsParams
): Promise<GetVisitorAdminRequestsResponse> {
    const query = buildRequestsQueryString(params);
    const res = await fetch(`/api/visitor_admin/requests?${query}`);
    return handleResponse<GetVisitorAdminRequestsResponse>(res, 'Failed to fetch visitor requests');
}

export async function updateRequestStatus(
    id: string,
    status: string
): Promise<UpdateVisitorAdminStatusResponse> {
    const res = await fetch('/api/visitor_admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
    });
    return handleResponse<UpdateVisitorAdminStatusResponse>(res, 'Failed to update request status');
}

export async function deleteRequests(
    ids: string[]
): Promise<DeleteVisitorAdminRequestsResponse> {
    const res = await fetch('/api/visitor_admin/requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    return handleResponse<DeleteVisitorAdminRequestsResponse>(res, 'Failed to delete requests');
}

export async function getHostDepartments(): Promise<HostDepartmentsApiResponse> {
    const res = await fetch('/api/admin/host-departments');
    return handleResponse<HostDepartmentsApiResponse>(res, 'Failed to fetch host departments');
}

export async function updateRequestDetails(
    id: string,
    payload: UpdateVisitorRequestEditPayload
): Promise<UpdateVisitorRequestEditResponse> {
    const res = await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse<UpdateVisitorRequestEditResponse>(res, 'Failed to update request details');
}

export const visitorAdminApi = {
    getRequests,
    updateRequestStatus,
    deleteRequests,
    getHostDepartments,
    updateRequestDetails,
};
