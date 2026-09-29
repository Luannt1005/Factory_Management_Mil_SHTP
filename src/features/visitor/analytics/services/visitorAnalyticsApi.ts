/**
 * Visitor Analytics & Audit Logs API Service
 * Orgchart_TTI_onprem
 */

import type {
    GetVisitorAnalyticsParams,
    GetVisitorAnalyticsResponse,
    GetCheckInOutLogsParams,
    GetCheckInOutLogsResponse,
} from '@/types/visitor-analytics.types';

export class VisitorAnalyticsApiError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'VisitorAnalyticsApiError';
        this.status = status;
        this.data = data;
    }
}

export const visitorAnalyticsApi = {
    /**
     * Fetch overview analytics metrics, trends, and category/department breakdowns
     */
    async getAnalytics(params?: GetVisitorAnalyticsParams): Promise<GetVisitorAnalyticsResponse> {
        const queryParams = new URLSearchParams();

        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.bu && params.bu !== 'all') queryParams.append('bu', params.bu);
        if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
        if (params?.category && params.category !== 'all') queryParams.append('category', params.category);

        const queryString = queryParams.toString();
        const url = `/api/visitor_admin/analytics${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);

        if (!response.ok) {
            let errorData: unknown;
            try {
                errorData = await response.json();
            } catch {
                // Ignore parse error
            }
            throw new VisitorAnalyticsApiError(
                `Failed to fetch visitor analytics (${response.status})`,
                response.status,
                errorData
            );
        }

        return response.json();
    },

    /**
     * Fetch paginated gate action audit logs
     */
    async getCheckInOutLogs(params?: GetCheckInOutLogsParams): Promise<GetCheckInOutLogsResponse> {
        const queryParams = new URLSearchParams();

        if (params?.search?.trim()) queryParams.append('search', params.search.trim());
        if (params?.action && params.action !== 'ALL') queryParams.append('action', params.action);
        if (params?.performedBy && params.performedBy !== 'ALL') queryParams.append('performedBy', params.performedBy);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.startTime) queryParams.append('startTime', params.startTime);
        if (params?.endTime) queryParams.append('endTime', params.endTime);
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.export) queryParams.append('export', 'true');

        const queryString = queryParams.toString();
        const url = `/api/visitor_admin/checkinout_logs${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);

        if (!response.ok) {
            let errorData: unknown;
            try {
                errorData = await response.json();
            } catch {
                // Ignore parse error
            }
            throw new VisitorAnalyticsApiError(
                `Failed to fetch check-in/out logs (${response.status})`,
                response.status,
                errorData
            );
        }

        return response.json();
    },

    /**
     * Fetch full dataset for Excel export (capped at 100,000 records)
     */
    async exportCheckInOutLogs(
        params?: Omit<GetCheckInOutLogsParams, 'page' | 'limit' | 'export'>
    ): Promise<GetCheckInOutLogsResponse> {
        return this.getCheckInOutLogs({
            ...params,
            export: true,
            limit: 100000,
        });
    },
};
