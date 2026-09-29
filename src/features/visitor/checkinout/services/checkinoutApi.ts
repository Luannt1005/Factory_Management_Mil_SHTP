/**
 * Check-In / Check-Out API Service
 * Centralized API client for all gate check-in/out and badge scanner operations
 * Orgchart_TTI_onprem
 */

import type {
    CheckInOutActionPayload,
    CheckInOutActionResponse,
    CheckInOutHistoryParams,
    CheckInOutHistoryResponse,
} from '@/types/checkinout.types';

export class CheckInOutApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'CheckInOutApiError';
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
        throw new CheckInOutApiError(errorMsg, res.status);
    }
    return res.json() as Promise<T>;
}

export function buildHistoryQueryString(params?: CheckInOutHistoryParams): string {
    const searchParams = new URLSearchParams();
    if (!params) return searchParams.toString();

    if (params.date) searchParams.set('date', params.date);
    if (params.category) searchParams.set('category', params.category);
    if (params.site) searchParams.set('site', params.site);
    if (params.search) searchParams.set('search', params.search);
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));

    return searchParams.toString();
}

/**
 * Fetch check-in/out history requests with filter options
 */
export async function getCheckInOutHistory(
    params?: CheckInOutHistoryParams
): Promise<CheckInOutHistoryResponse> {
    const query = buildHistoryQueryString(params);
    const url = query ? `/api/visitor_admin/checkinout/history?${query}` : '/api/visitor_admin/checkinout/history';
    const res = await fetch(url);
    return handleResponse<CheckInOutHistoryResponse>(res, 'Failed to fetch check-in/out history');
}

/**
 * Quick search request by code / barcode scanner
 */
export async function lookupCheckInOutRequest(
    cleanCode: string,
    limit: number = 10
): Promise<CheckInOutHistoryResponse> {
    const res = await fetch(
        `/api/visitor_admin/checkinout/history?search=${encodeURIComponent(cleanCode)}&limit=${limit}`
    );
    return handleResponse<CheckInOutHistoryResponse>(res, 'Failed to lookup request');
}

/**
 * Perform gate action: CHECK_IN, CHECK_OUT, RESET, UPDATE_CARD
 */
export async function performCheckInOutAction(
    payload: CheckInOutActionPayload
): Promise<CheckInOutActionResponse> {
    const res = await fetch('/api/visitor_admin/checkinout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse<CheckInOutActionResponse>(res, 'Failed to execute check-in/out action');
}
