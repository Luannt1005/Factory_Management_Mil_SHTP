/**
 * Visitor Request API Service
 * Thin HTTP client wrapper around endpoints used by the Visitor Request module
 * Orgchart_TTI_onprem
 */

import type {
    RoomsApiResponse,
    MeetingRoomsApiResponse,
    HostDepartmentsApiResponse,
} from '@/types/rooms.types';
import type {
    CreateVisitorRequestPayload,
    CreateVisitorRequestSuccessResponse,
} from '@/types/visitor-request.types';

async function handleResponse<T>(res: Response, defaultErrorMessage: string): Promise<T> {
    if (!res.ok) {
        let errorMsg = defaultErrorMessage;
        try {
            const data = await res.json();
            errorMsg = data.error || data.message || defaultErrorMessage;
        } catch {
            // Fall back to default error message if JSON parsing fails
        }
        throw new Error(errorMsg);
    }
    return res.json() as Promise<T>;
}

export async function getRooms(): Promise<RoomsApiResponse> {
    const res = await fetch('/api/admin/rooms');
    return handleResponse<RoomsApiResponse>(res, 'Failed to fetch rooms');
}

export async function getMeetingRooms(): Promise<MeetingRoomsApiResponse> {
    const res = await fetch('/api/admin/meeting-rooms');
    return handleResponse<MeetingRoomsApiResponse>(res, 'Failed to fetch meeting rooms');
}

export async function getHostDepartments(all = false): Promise<HostDepartmentsApiResponse> {
    const res = await fetch(`/api/admin/host-departments?all=${all}`);
    return handleResponse<HostDepartmentsApiResponse>(res, 'Failed to fetch host departments');
}

export async function createVisitorRequest(
    payload: CreateVisitorRequestPayload
): Promise<CreateVisitorRequestSuccessResponse> {
    const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse<CreateVisitorRequestSuccessResponse>(res, 'Failed to submit visitor request');
}

export const visitorRequestApi = {
    getRooms,
    getMeetingRooms,
    getHostDepartments,
    createVisitorRequest,
};
