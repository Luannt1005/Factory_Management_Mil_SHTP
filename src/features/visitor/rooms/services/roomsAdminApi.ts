/**
 * Visitor Rooms Admin API Service
 * Thin HTTP wrapper around /api/admin/* endpoints
 * Orgchart_TTI_onprem
 */

import type {
    MeetingRoom,
    MeetingRoomFormData,
    MeetingRoomUpdateData,
    MeetingRoomsApiResponse,
    FacilityRoom,
    FacilityRoomFormData,
    FacilityRoomUpdateData,
    RoomsApiResponse,
    RoomCategory,
    RoomCategoryFormData,
    RoomCategoryUpdateData,
    CategoriesApiResponse,
    HostDepartment,
    HostDepartmentFormData,
    HostDepartmentUpdateData,
    HostDepartmentsApiResponse,
} from '@/types/rooms.types';

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

// ==========================================
// MEETING ROOMS
// ==========================================

export async function getMeetingRooms(): Promise<MeetingRoomsApiResponse> {
    const res = await fetch('/api/admin/meeting-rooms');
    return handleResponse<MeetingRoomsApiResponse>(res, 'Failed to fetch meeting rooms');
}

export async function createMeetingRoom(data: MeetingRoomFormData): Promise<MeetingRoom> {
    const res = await fetch('/api/admin/meeting-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<MeetingRoom>(res, 'Error creating meeting room');
}

export async function updateMeetingRoom(data: MeetingRoomUpdateData): Promise<MeetingRoom> {
    const res = await fetch('/api/admin/meeting-rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<MeetingRoom>(res, 'Error updating meeting room');
}

export async function deleteMeetingRoom(id: string): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/meeting-rooms?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res, 'Error deleting meeting room');
}

// ==========================================
// FACILITY ROOMS
// ==========================================

export async function getFacilityRooms(all = true): Promise<RoomsApiResponse> {
    const url = all ? '/api/admin/rooms?all=true' : '/api/admin/rooms';
    const res = await fetch(url);
    return handleResponse<RoomsApiResponse>(res, 'Failed to fetch facility rooms');
}

export async function createFacilityRoom(data: FacilityRoomFormData): Promise<{ message: string; data: FacilityRoom }> {
    const res = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; data: FacilityRoom }>(res, 'Error creating room');
}

export async function updateFacilityRoom(data: FacilityRoomUpdateData): Promise<{ message: string; data: FacilityRoom }> {
    const res = await fetch('/api/admin/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; data: FacilityRoom }>(res, 'Error updating room');
}

export async function deleteFacilityRoom(id: string): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/rooms?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res, 'Error deleting room');
}

// ==========================================
// ROOM CATEGORIES
// ==========================================

export async function getRoomCategories(): Promise<CategoriesApiResponse> {
    const res = await fetch('/api/admin/room-categories');
    return handleResponse<CategoriesApiResponse>(res, 'Failed to fetch room categories');
}

export async function createRoomCategory(data: RoomCategoryFormData): Promise<{ message: string; data: RoomCategory }> {
    const res = await fetch('/api/admin/room-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; data: RoomCategory }>(res, 'Error creating category');
}

export async function updateRoomCategory(data: RoomCategoryUpdateData): Promise<{ message: string; data: RoomCategory }> {
    const res = await fetch('/api/admin/room-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; data: RoomCategory }>(res, 'Error updating category');
}

export async function deleteRoomCategory(id: string): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/room-categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res, 'Error deleting category');
}

// ==========================================
// HOST DEPARTMENTS
// ==========================================

export async function getHostDepartments(all = true): Promise<HostDepartmentsApiResponse> {
    const url = all ? '/api/admin/host-departments?all=true' : '/api/admin/host-departments';
    const res = await fetch(url);
    return handleResponse<HostDepartmentsApiResponse>(res, 'Failed to fetch host departments');
}

export async function createHostDepartment(data: HostDepartmentFormData): Promise<{ message: string; data: HostDepartment }> {
    const res = await fetch('/api/admin/host-departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; data: HostDepartment }>(res, 'Error creating Host Department');
}

export async function updateHostDepartment(data: HostDepartmentUpdateData): Promise<{ message: string }> {
    const res = await fetch('/api/admin/host-departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(res, 'Error updating Host Department');
}

export async function deleteHostDepartment(id: string): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/host-departments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res, 'Error deleting host department');
}

export const roomsAdminApi = {
    getMeetingRooms,
    createMeetingRoom,
    updateMeetingRoom,
    deleteMeetingRoom,
    getFacilityRooms,
    createFacilityRoom,
    updateFacilityRoom,
    deleteFacilityRoom,
    getRoomCategories,
    createRoomCategory,
    updateRoomCategory,
    deleteRoomCategory,
    getHostDepartments,
    createHostDepartment,
    updateHostDepartment,
    deleteHostDepartment,
};
