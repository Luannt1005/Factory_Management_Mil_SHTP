/**
 * Visitor Admin Rooms & Facilities Domain Types
 * Orgchart_TTI_onprem
 */

// --- Meeting Rooms ---
export interface MeetingRoom {
    id: string;
    floorName: string;
    roomName: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MeetingRoomFormData {
    floorName: string;
    roomName: string;
}

export interface MeetingRoomUpdateData {
    id?: string;
    floorName?: string;
    roomName?: string;
}

// --- Room Categories ---
export interface RoomCategory {
    id: string;
    name: string;
    site_location: string;
    bu: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoomCategoryFormData {
    name: string;
    site_location: string;
    bu: string;
}

export interface RoomCategoryUpdateData {
    id?: string;
    name?: string;
    site_location?: string;
    bu?: string;
}

// --- Facility Rooms (RoomArea) ---
export interface FacilityRoom {
    id: string;
    category: string;
    name: string;
    description: string | null;
    approver_email: string | null;
    is_active: boolean;
    site_location?: string | null;
}

export interface FacilityRoomFormData {
    category: string;
    name: string;
    description: string;
    approver_email: string;
}

export interface FacilityRoomUpdateData {
    id?: string;
    category?: string;
    name?: string;
    description?: string | null;
    approver_email?: string | null;
    is_active?: boolean;
}

// --- Host Departments ---
export interface HostDepartment {
    id: string;
    bu: string | null;
    functional_dept: string;
    functional_host_name: string;
    functional_host_email: string | null;
    department: string;
    department_host_name: string;
    department_host_email: string | null;
    is_active: boolean;
    dept_name?: string;
}

export interface HostDepartmentFormData {
    bu: string;
    functional_dept: string;
    functional_host_name: string;
    functional_host_email: string;
    department: string;
    department_host_name: string;
    department_host_email: string;
}

export interface HostDepartmentUpdateData {
    id?: string;
    bu?: string | null;
    functional_dept?: string;
    functional_host_name?: string;
    functional_host_email?: string | null;
    department?: string;
    department_host_name?: string;
    department_host_email?: string | null;
    is_active?: boolean;
}

// --- API Response Envelopes ---
export interface RoomsApiResponse {
    rooms: FacilityRoom[];
}

export interface CategoriesApiResponse {
    categories: RoomCategory[];
}

export interface HostDepartmentsApiResponse {
    hostDepartments: HostDepartment[];
}

export interface MeetingRoomsApiResponse {
    meetingRooms: MeetingRoom[];
}
