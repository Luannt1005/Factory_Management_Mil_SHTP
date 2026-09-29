/**
 * Visitor Dashboard API Service
 * Orgchart_TTI_onprem
 */

import type {
    GetMeetingRoomsResponse,
    GetVisitorDashboardRequestsParams,
    GetVisitorDashboardRequestsResponse,
    UpdateIntervieweeRequestPayload,
    UpdateIntervieweeRequestResponse,
} from '@/types/visitor-dashboard.types';

export class VisitorDashboardApiError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'VisitorDashboardApiError';
        this.status = status;
        this.data = data;
    }
}

export const visitorDashboardApi = {
    /**
     * Fetch active meeting rooms for interview area selection
     */
    async getMeetingRooms(): Promise<GetMeetingRoomsResponse> {
        const response = await fetch('/api/admin/meeting-rooms');

        if (!response.ok) {
            let errorData: unknown;
            try {
                errorData = await response.json();
            } catch {
                // Ignore parse error
            }
            throw new VisitorDashboardApiError(
                `Failed to fetch meeting rooms (${response.status})`,
                response.status,
                errorData
            );
        }

        return response.json();
    },

    /**
     * Fetch requests submitted by the logged-in user with filtering & pagination
     */
    async getMyRequests(
        params: GetVisitorDashboardRequestsParams,
        signal?: AbortSignal
    ): Promise<GetVisitorDashboardRequestsResponse> {
        const queryParams = new URLSearchParams({
            tab: params.tab,
            page: String(params.page),
            limit: String(params.limit),
        });

        if (params.startDate) {
            queryParams.append('startDate', params.startDate);
        }
        if (params.endDate) {
            queryParams.append('endDate', params.endDate);
        }
        if (params.search) {
            queryParams.append('search', params.search);
        }

        const response = await fetch(`/api/requests?${queryParams.toString()}`, {
            signal,
        });

        if (!response.ok) {
            let errorData: unknown;
            try {
                errorData = await response.json();
            } catch {
                // Ignore parse error
            }
            throw new VisitorDashboardApiError(
                `Failed to fetch requests (${response.status})`,
                response.status,
                errorData
            );
        }

        return response.json();
    },

    /**
     * Update an Interviewee request (candidates, schedule, area, facilities)
     */
    async updateIntervieweeRequest(
        id: string,
        payload: UpdateIntervieweeRequestPayload
    ): Promise<UpdateIntervieweeRequestResponse> {
        const response = await fetch(`/api/interviewee_requests/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data?.error || `Failed to update request (${response.status})`;
            throw new VisitorDashboardApiError(errorMsg, response.status, data);
        }

        return data;
    },
};
