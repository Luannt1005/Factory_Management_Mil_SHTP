/**
 * Access Door API Service (Visitor Cards studio)
 * Orgchart_TTI_onprem
 *
 * Assigns HikCentral door access to visitors through /api/visitor_admin/access/*.
 */

import type {
    AccessAssignment,
    AccessAssignmentResponse,
    AccessAssignmentsResponse,
    AccessCheckResponse,
    AccessOptionsResponse,
    AccessSettings,
    AccessSettingsResponse,
    AssignCardPayload,
    CardLookupResponse,
    CardReleaseResponse,
} from '@/types/visitor-access.types';

const BASE = '/api/visitor_admin/access';

export class AccessDoorApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'AccessDoorApiError';
    }
}

async function handleResponse<T>(res: Response, defaultMessage: string): Promise<T> {
    if (!res.ok) {
        let message = defaultMessage;
        try {
            const data = await res.json();
            message = data.error || data.message || defaultMessage;
        } catch {
            // keep default message
        }
        throw new AccessDoorApiError(message, res.status);
    }
    return res.json() as Promise<T>;
}

export const accessDoorApi = {
    async getOptions(): Promise<AccessOptionsResponse> {
        const res = await fetch(`${BASE}/options`, { cache: 'no-store' });
        return handleResponse<AccessOptionsResponse>(res, 'Failed to reach HikCentral');
    },

    async getSettings(): Promise<AccessSettings> {
        const res = await fetch(`${BASE}/settings`, { cache: 'no-store' });
        return (await handleResponse<AccessSettingsResponse>(res, 'Failed to load access settings')).settings;
    },

    async saveSettings(settings: AccessSettings): Promise<AccessSettings> {
        const res = await fetch(`${BASE}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        return (await handleResponse<AccessSettingsResponse>(res, 'Failed to save access settings')).settings;
    },

    async listAssignments(scope: 'active' | 'all', search = ''): Promise<AccessAssignment[]> {
        const query = new URLSearchParams({ scope });
        if (search.trim()) query.set('search', search.trim());
        const res = await fetch(`${BASE}/assignments?${query.toString()}`, { cache: 'no-store' });
        return (await handleResponse<AccessAssignmentsResponse>(res, 'Failed to load card assignments')).assignments;
    },

    async assign(payload: AssignCardPayload): Promise<AccessAssignment> {
        const res = await fetch(`${BASE}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return (await handleResponse<AccessAssignmentResponse>(res, 'Failed to assign the card')).assignment;
    },

    async revoke(id: string): Promise<AccessAssignment> {
        const res = await fetch(`${BASE}/assignments/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'revoke' }),
        });
        return (await handleResponse<AccessAssignmentResponse>(res, 'Failed to revoke the card')).assignment;
    },

    /** Who holds a card (HikCentral person, employee or visitor) and its Access Door history */
    async lookupCard(cardNo: string): Promise<CardLookupResponse> {
        const res = await fetch(`${BASE}/card-lookup?cardNo=${encodeURIComponent(cardNo.trim())}`, { cache: 'no-store' });
        return handleResponse<CardLookupResponse>(res, 'Failed to look up the card');
    },

    /** Releases a card from its holder (visitor: revoked; employee: only the card is removed) */
    async releaseCard(cardNo: string, personId: string): Promise<CardReleaseResponse> {
        const res = await fetch(`${BASE}/card-lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardNo, personId }),
        });
        return handleResponse<CardReleaseResponse>(res, 'Failed to remove the card');
    },

    async check(id: string): Promise<AccessCheckResponse> {
        const res = await fetch(`${BASE}/assignments/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check' }),
        });
        return handleResponse<AccessCheckResponse>(res, 'Failed to check the applying status');
    },
};
