/**
 * Orgchart API Communication Service
 * Orgchart_TTI_onprem
 */

import type {
    OrgChartNode,
    OrgChartApiResponse,
    GetOrgchartParams,
    OrgChartMutationPayload,
    CustomOrgChartProfile,
    CustomOrgChartRecord,
    CreateCustomOrgchartPayload,
    UpdateCustomOrgchartPayload,
    CoreTeamResponse,
    OpsSupportResponse,
    AddDepartmentPayload,
} from '@/types/orgchart.types';

export class OrgChartApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public details?: unknown
    ) {
        super(message);
        this.name = 'OrgChartApiError';
    }
}

export const orgchartApi = {
    /**
     * GET /api/orgchart
     * Fetch all active employee and department hierarchy nodes
     */
    async getOrgchart(
        params?: GetOrgchartParams,
        signal?: AbortSignal
    ): Promise<OrgChartApiResponse<OrgChartNode>> {
        const query = new URLSearchParams();
        if (params?.dept && params.dept !== 'all') {
            query.set('dept', params.dept);
        }

        const queryString = query.toString();
        const url = `/api/orgchart${queryString ? `?${queryString}` : ''}`;

        const res = await fetch(url, { signal });
        if (!res.ok) {
            throw new OrgChartApiError(`Failed to load orgchart: ${res.statusText}`, res.status);
        }
        return res.json();
    },

    /**
     * POST /api/orgchart
     * (Contract placeholder for node addition)
     */
    async addNode(
        data: OrgChartMutationPayload,
        signal?: AbortSignal
    ): Promise<{ success: boolean; error?: string }> {
        const res = await fetch('/api/orgchart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal,
        });
        return res.json();
    },

    /**
     * PUT /api/orgchart
     * (Contract placeholder for node modification)
     */
    async updateNode(
        data: OrgChartMutationPayload,
        signal?: AbortSignal
    ): Promise<{ success: boolean; error?: string }> {
        const res = await fetch('/api/orgchart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal,
        });
        return res.json();
    },

    /**
     * DELETE /api/orgchart
     * (Contract placeholder for node deletion)
     */
    async deleteNode(
        id: string | number,
        signal?: AbortSignal
    ): Promise<{ success: boolean; error?: string }> {
        const res = await fetch('/api/orgchart', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
            signal,
        });
        return res.json();
    },

    /**
     * GET /api/orgchart/core-team
     * Fetch Core Team executive hierarchy and span-of-control
     */
    async getCoreTeam(signal?: AbortSignal): Promise<CoreTeamResponse> {
        const res = await fetch('/api/orgchart/core-team', { signal });
        if (!res.ok) {
            throw new OrgChartApiError(`Failed to fetch core team data: ${res.statusText}`, res.status);
        }
        const json = await res.json();
        if (!json.success) {
            throw new OrgChartApiError(json.error || 'Failed to load core team data', res.status);
        }
        return json;
    },

    /**
     * GET /api/orgchart/ops-support
     * Fetch Operations Support executive hierarchy
     */
    async getOpsSupport(signal?: AbortSignal): Promise<OpsSupportResponse> {
        const res = await fetch('/api/orgchart/ops-support', { signal });
        if (!res.ok) {
            throw new OrgChartApiError(`Failed to fetch ops support data: ${res.statusText}`, res.status);
        }
        const json = await res.json();
        if (!json.success) {
            throw new OrgChartApiError(json.error || 'Failed to load ops support data', res.status);
        }
        return json;
    },

    /**
     * GET /api/orgcharts?username=${username}
     * Fetch custom org charts list for a user
     */
    async getUserCustomOrgcharts(
        username: string,
        signal?: AbortSignal
    ): Promise<{ orgcharts: CustomOrgChartProfile[] }> {
        const res = await fetch(`/api/orgcharts?username=${encodeURIComponent(username)}`, { signal });
        if (!res.ok) {
            throw new OrgChartApiError(`Failed to fetch orgcharts: ${res.statusText}`, res.status);
        }
        const json = (await res.json()) as { orgcharts?: Array<Omit<CustomOrgChartProfile, 'orgchart_id'> & { orgchart_id: string | number }> };
        const orgcharts: CustomOrgChartProfile[] = (json.orgcharts || []).map((doc) => ({
            ...doc,
            orgchart_id: String(doc.orgchart_id),
        }));
        return { orgcharts };
    },

    /**
     * POST /api/orgcharts
     * Create a new custom org chart
     */
    async createCustomOrgchart(
        data: CreateCustomOrgchartPayload,
        signal?: AbortSignal
    ): Promise<{ success: boolean; orgchart_id: string; message?: string }> {
        const res = await fetch('/api/orgcharts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal,
        });

        if (!res.ok) {
            const errText = await res.text();
            let errMessage = 'Create failed';
            try {
                const errJson = JSON.parse(errText) as { error?: string };
                errMessage = errJson.error || errMessage;
            } catch {
                errMessage += `: ${errText.substring(0, 50)}`;
            }
            throw new OrgChartApiError(errMessage, res.status);
        }

        const json = (await res.json()) as { success: boolean; orgchart_id: string | number; message?: string };
        return {
            ...json,
            orgchart_id: String(json.orgchart_id),
        };
    },

    /**
     * GET /api/orgcharts/[id]
     * Fetch custom org chart by ID
     */
    async getCustomOrgchartById(
        id: string,
        signal?: AbortSignal
    ): Promise<CustomOrgChartRecord> {
        const res = await fetch(`/api/orgcharts/${id}`, { signal });
        const responseText = await res.text();

        let json: (CustomOrgChartRecord & { error?: string }) | null = null;
        try {
            json = JSON.parse(responseText);
        } catch {
            json = null;
        }

        if (res.status === 404) {
            throw new OrgChartApiError('Orgchart not found', 404);
        }

        if (!res.ok) {
            const errMessage = json?.error || `Failed to fetch chart: ${res.status} ${res.statusText}`;
            throw new OrgChartApiError(errMessage, res.status);
        }

        return json as CustomOrgChartRecord;
    },

    /**
     * PUT /api/orgcharts/[id]
     * Update custom org chart data or metadata
     */
    async updateCustomOrgchart(
        id: string,
        data: UpdateCustomOrgchartPayload,
        signal?: AbortSignal
    ): Promise<{ success: boolean; message?: string }> {
        const res = await fetch(`/api/orgcharts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal,
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new OrgChartApiError(errText || 'Failed to save', res.status);
        }

        return res.json();
    },

    /**
     * DELETE /api/orgcharts/[id]
     * Delete custom org chart
     */
    async deleteCustomOrgchart(
        id: string,
        signal?: AbortSignal
    ): Promise<{ success: boolean; message?: string }> {
        const res = await fetch(`/api/orgcharts/${id}`, {
            method: 'DELETE',
            signal,
        });

        if (!res.ok) {
            throw new OrgChartApiError(`Delete failed: ${res.status} ${res.statusText}`, res.status);
        }

        return res.json();
    },

    /**
     * POST /api/add-Department
     * Add department node to orgchart
     */
    async addDepartment(
        data: AddDepartmentPayload,
        signal?: AbortSignal
    ): Promise<{ success: boolean; data: unknown }> {
        const res = await fetch('/api/add-Department', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal,
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new OrgChartApiError(errJson.error || 'Failed to add department', res.status);
        }

        return res.json();
    },
};
