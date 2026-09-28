'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { roomsAdminApi } from '@/features/visitor/rooms/services/roomsAdminApi';
import { ExcelColumnFilter } from '@/features/visitor/rooms/components/ExcelColumnFilter';
import { MeetingRoomsTab } from '@/features/visitor/rooms/components/tabs/MeetingRoomsTab';
import { HostDepartmentsTab } from '@/features/visitor/rooms/components/tabs/HostDepartmentsTab';
import type {
    FacilityRoom,
    FacilityRoomFormData,
    FacilityRoomUpdateData,
    RoomCategory,
    RoomCategoryFormData,
    RoomCategoryUpdateData,
    HostDepartment,
    HostDepartmentFormData,
    HostDepartmentUpdateData,
    MeetingRoom,
    MeetingRoomFormData,
    MeetingRoomUpdateData,
    RoomsApiResponse,
    CategoriesApiResponse,
    HostDepartmentsApiResponse,
    MeetingRoomsApiResponse,
} from '@/types/rooms.types';

export default function AdminRoomsPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [activeTab, setActiveTab] = useState<'rooms' | 'categories' | 'host-departments' | 'meeting-rooms'>('rooms');
    
    // Modal States
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isHostDeptModalOpen, setIsHostDeptModalOpen] = useState(false);
    const [isMeetingRoomModalOpen, setIsMeetingRoomModalOpen] = useState(false);

    // Room State
    const [rooms, setRooms] = useState<FacilityRoom[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [editingRoom, setEditingRoom] = useState<FacilityRoom | null>(null);
    const [newRoom, setNewRoom] = useState<FacilityRoomFormData>({ category: '', name: '', description: '', approver_email: '' });

    // Category State
    const [categories, setCategories] = useState<RoomCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);
    const [newCategory, setNewCategory] = useState<RoomCategoryFormData>({ name: '', site_location: 'SHTP', bu: 'Milwaukee' });

    // Host Dept State
    // Meeting Room State
    const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
    const [loadingMeetingRooms, setLoadingMeetingRooms] = useState(true);
    const [editingMeetingRoom, setEditingMeetingRoom] = useState<MeetingRoom | null>(null);
    const [newMeetingRoom, setNewMeetingRoom] = useState<MeetingRoomFormData>({ floorName: '', roomName: '' });

    const [hostDepartments, setHostDepartments] = useState<HostDepartment[]>([]);
    const [loadingHostDepartments, setLoadingHostDepartments] = useState(true);
    const [editingHostDept, setEditingHostDept] = useState<HostDepartment | null>(null);
    const [newHostDept, setNewHostDept] = useState<HostDepartmentFormData>({ bu: '', functional_dept: '', functional_host_name: '', functional_host_email: '', department: '', department_host_name: '', department_host_email: '' });
    const [selectedFuncDeptOption, setSelectedFuncDeptOption] = useState<string>('');

    // --- Column Filter States for All Tabs (Excel-like multiselect arrays) ---
    const [roomFilters, setRoomFilters] = useState<{ [key: string]: string[] }>({
        category: [],
        name: [],
        description: [],
        approver_email: [],
        is_active: []
    });

    const [categoryFilters, setCategoryFilters] = useState<{ [key: string]: string[] }>({
        name: [],
        site_location: [],
        bu: []
    });

    // Filtered lists

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            if (roomFilters.category.length > 0) {
                const val = room.category || '(Blanks)';
                if (!roomFilters.category.includes(val)) return false;
            }
            if (roomFilters.name.length > 0) {
                const val = room.name || '(Blanks)';
                if (!roomFilters.name.includes(val)) return false;
            }
            if (roomFilters.description.length > 0) {
                const val = room.description || '(Blanks)';
                if (!roomFilters.description.includes(val)) return false;
            }
            if (roomFilters.approver_email.length > 0) {
                const val = room.approver_email || '(Blanks)';
                if (!roomFilters.approver_email.includes(val)) return false;
            }
            if (roomFilters.is_active.length > 0) {
                const val = room.is_active ? 'Active' : 'Inactive';
                if (!roomFilters.is_active.includes(val)) return false;
            }
            return true;
        });
    }, [rooms, roomFilters]);

    const filteredCategories = useMemo(() => {
        return categories.filter(cat => {
            if (categoryFilters.name.length > 0) {
                const val = cat.name || '(Blanks)';
                if (!categoryFilters.name.includes(val)) return false;
            }
            if (categoryFilters.site_location.length > 0) {
                const val = cat.site_location || '(Blanks)';
                if (!categoryFilters.site_location.includes(val)) return false;
            }
            if (categoryFilters.bu.length > 0) {
                const val = cat.bu || '(Blanks)';
                if (!categoryFilters.bu.includes(val)) return false;
            }
            return true;
        });
    }, [categories, categoryFilters]);


    const uniqueFunctionalDepts = Array.from(new Set(hostDepartments.map((h: HostDepartment) => h.functional_dept).filter(Boolean)));

    useEffect(() => {
        fetchRooms();
        fetchCategories();
        fetchHostDepartments();
        fetchMeetingRooms();
    }, []);

    const fetchRooms = async () => {
        setLoadingRooms(true);
        try {
            const data = await roomsAdminApi.getFacilityRooms(true);
            setRooms(data.rooms);
        } catch {
            // Keep current behavior
        }
        setLoadingRooms(false);
    };

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const data = await roomsAdminApi.getRoomCategories();
            setCategories(data.categories);
            if (data.categories.length > 0 && !newRoom.category) {
                setNewRoom(prev => ({ ...prev, category: data.categories[0].name }));
            }
        } catch {
            // Keep current behavior
        }
        setLoadingCategories(false);
    };

    const fetchMeetingRooms = async () => {
        setLoadingMeetingRooms(true);
        try {
            const data = await roomsAdminApi.getMeetingRooms();
            setMeetingRooms(data.meetingRooms || []);
        } catch {
            // Keep current behavior
        }
        setLoadingMeetingRooms(false);
    };

    const fetchHostDepartments = async () => {
        setLoadingHostDepartments(true);
        try {
            const data = await roomsAdminApi.getHostDepartments(true);
            setHostDepartments(data.hostDepartments || []);
        } catch {
            // Keep current behavior
        }
        setLoadingHostDepartments(false);
    };

    // --- Meeting Room Handlers ---
    const handleCreateMeetingRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await roomsAdminApi.createMeetingRoom(newMeetingRoom);
            fetchMeetingRooms();
            setNewMeetingRoom({ floorName: '', roomName: '' });
            setIsMeetingRoomModalOpen(false);
        } catch {
            alert('Error creating meeting room');
        }
    };

    const handleUpdateMeetingRoom = async (id: string, updates: MeetingRoomUpdateData) => {
        try {
            await roomsAdminApi.updateMeetingRoom({ id, ...updates });
            fetchMeetingRooms();
            setEditingMeetingRoom(null);
        } catch {
            alert('Error updating meeting room');
        }
    };

    const handleDeleteMeetingRoom = async (id: string) => {
        if (!confirm('Are you sure you want to delete this meeting room?')) return;
        try {
            await roomsAdminApi.deleteMeetingRoom(id);
            fetchMeetingRooms();
        } catch {
            alert('Error deleting meeting room');
        }
    };

    // --- Room Handlers ---
    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await roomsAdminApi.createFacilityRoom(newRoom);
            fetchRooms();
            setNewRoom({ category: categories.length > 0 ? categories[0].name : '', name: '', description: '', approver_email: '' });
            setIsRoomModalOpen(false);
        } catch {
            alert('Error creating room');
        }
    };

    const handleUpdateRoom = async (id: string, updates: FacilityRoomUpdateData) => {
        try {
            await roomsAdminApi.updateFacilityRoom({ id, ...updates });
            fetchRooms();
            setEditingRoom(null);
        } catch {
            alert('Error updating room');
        }
    };

    const handleDeleteRoom = async (id: string) => {
        if (!confirm('Are you sure you want to delete this room?')) return;
        try {
            await roomsAdminApi.deleteFacilityRoom(id);
            fetchRooms();
        } catch {
            alert('Error deleting room');
        }
    };

    // --- Category Handlers ---
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await roomsAdminApi.createRoomCategory(newCategory);
            fetchCategories();
            setNewCategory({ name: '', site_location: 'SHTP', bu: 'Milwaukee' });
            setIsCategoryModalOpen(false);
        } catch {
            alert('Error creating category');
        }
    };

    const handleUpdateCategory = async (id: string, updates: RoomCategoryUpdateData) => {
        try {
            await roomsAdminApi.updateRoomCategory({ id, ...updates });
            fetchCategories();
            setEditingCategory(null);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category? Make sure no rooms are using it.')) return;
        try {
            await roomsAdminApi.deleteRoomCategory(id);
            fetchCategories();
        } catch {
            alert('Error deleting category');
        }
    };

    // --- Host Dept Handlers ---
    const handleCreateHostDept = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await roomsAdminApi.createHostDepartment(newHostDept);
            fetchHostDepartments();
            setSelectedFuncDeptOption('');
            setNewHostDept({ bu: '', functional_dept: '', functional_host_name: '', functional_host_email: '', department: '', department_host_name: '', department_host_email: '' });
            setIsHostDeptModalOpen(false);
        } catch {
            alert('Error creating Host Department');
        }
    };

    const handleUpdateHostDept = async (id: string, updates: HostDepartmentUpdateData) => {
        try {
            await roomsAdminApi.updateHostDepartment({ id, ...updates });
            fetchHostDepartments();
            setEditingHostDept(null);
        } catch {
            alert('Error updating Host Department');
        }
    };

    const handleDeleteHostDept = async (id: string) => {
        if (!confirm('Are you sure you want to delete this?')) return;
        try {
            await roomsAdminApi.deleteHostDepartment(id);
            fetchHostDepartments();
        } catch {
            // Keep current behavior
        }
    };

    return (
        <div className="flex flex-col gap-6">
            
            {/* Tab Navigation & Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 gap-4">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('rooms')} 
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'rooms' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Manage Rooms
                    </button>
                    <button 
                        onClick={() => setActiveTab('categories')} 
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'categories' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Room Categories
                    </button>
                    <button 
                        onClick={() => setActiveTab('host-departments')} 
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'host-departments' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Host Departments
                    </button>
                    <button 
                        onClick={() => setActiveTab('meeting-rooms')} 
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'meeting-rooms' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Meeting Rooms
                    </button>
                </div>
                
                {activeTab === 'rooms' && (
                    <button 
                        onClick={() => setIsRoomModalOpen(true)}
                        className="bg-[#db011c] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#b90118] transition-colors"
                    >
                        + Add New Room
                    </button>
                )}
                {activeTab === 'categories' && (
                    <button 
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="bg-[#db011c] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#b90118] transition-colors"
                    >
                        + Add Category
                    </button>
                )}
                {activeTab === 'host-departments' && (
                    <button 
                        onClick={() => setIsHostDeptModalOpen(true)}
                        className="bg-[#db011c] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#b90118] transition-colors"
                    >
                        + Add Host Dept
                    </button>
                )}
                {activeTab === 'meeting-rooms' && (
                    <button 
                        onClick={() => setIsMeetingRoomModalOpen(true)}
                        className="bg-[#db011c] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#b90118] transition-colors"
                    >
                        + Add Meeting Room
                    </button>
                )}
            </div>
    
            {activeTab === 'meeting-rooms' && (
                <MeetingRoomsTab
                    meetingRooms={meetingRooms}
                    loading={loadingMeetingRooms}
                    editingMeetingRoom={editingMeetingRoom}
                    onEdit={setEditingMeetingRoom}
                    onUpdate={handleUpdateMeetingRoom}
                    onDelete={handleDeleteMeetingRoom}
                    onAdd={() => setIsMeetingRoomModalOpen(true)}
                />
            )}


            {/* ROOMS TAB */}
            {activeTab === 'rooms' && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-[#0f172a]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-4 w-[18%]">
                                            <ExcelColumnFilter
                                                title="Category"
                                                allValues={rooms.map(r => r.category)}
                                                selectedValues={roomFilters.category}
                                                onFilterChange={(selected) => setRoomFilters(prev => ({ ...prev, category: selected }))}
                                            />
                                        </th>
                                        <th className="p-4 w-[22%]">
                                            <ExcelColumnFilter
                                                title="Room Name"
                                                allValues={rooms.map(r => r.name)}
                                                selectedValues={roomFilters.name}
                                                onFilterChange={(selected) => setRoomFilters(prev => ({ ...prev, name: selected }))}
                                            />
                                        </th>
                                        <th className="p-4 w-[22%]">
                                            <ExcelColumnFilter
                                                title="Description"
                                                allValues={rooms.map(r => r.description)}
                                                selectedValues={roomFilters.description}
                                                onFilterChange={(selected) => setRoomFilters(prev => ({ ...prev, description: selected }))}
                                            />
                                        </th>
                                        <th className="p-4 w-[20%]">
                                            <ExcelColumnFilter
                                                title="Approver Email"
                                                allValues={rooms.map(r => r.approver_email)}
                                                selectedValues={roomFilters.approver_email}
                                                onFilterChange={(selected) => setRoomFilters(prev => ({ ...prev, approver_email: selected }))}
                                            />
                                        </th>
                                        <th className="p-4 text-center w-[10%]">
                                            <ExcelColumnFilter
                                                title="Status"
                                                allValues={rooms.map(r => r.is_active ? 'Active' : 'Inactive')}
                                                selectedValues={roomFilters.is_active}
                                                onFilterChange={(selected) => setRoomFilters(prev => ({ ...prev, is_active: selected }))}
                                            />
                                        </th>
                                        <th className="p-4 text-right w-[8%]">
                                            <div className="flex items-center justify-end gap-2">
                                                <span>Action</span>
                                                {(roomFilters.category.length > 0 || roomFilters.name.length > 0 || roomFilters.description.length > 0 || roomFilters.approver_email.length > 0 || roomFilters.is_active.length > 0) && (
                                                    <button
                                                        onClick={() => setRoomFilters({ category: [], name: [], description: [], approver_email: [], is_active: [] })}
                                                        className="text-[11px] font-bold text-red-600 hover:text-red-800 underline ml-2"
                                                        title="Reset all filters"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {loadingRooms ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading rooms...</td></tr>
                                    ) : filteredRooms.map((room) => (
                                        <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            {editingRoom && editingRoom.id === room.id ? (
                                                <>
                                                    <td className="p-4">
                                                        <select 
                                                            className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                            value={editingRoom.category}
                                                            onChange={e => setEditingRoom({...editingRoom, category: e.target.value})}
                                                        >
                                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-4">
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                            value={editingRoom.name}
                                                            onChange={e => setEditingRoom({...editingRoom, name: e.target.value})}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                            value={editingRoom.description || ''}
                                                            onChange={e => setEditingRoom({...editingRoom, description: e.target.value})}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <input 
                                                            type="email" 
                                                            className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                            value={editingRoom.approver_email || ''}
                                                            onChange={e => setEditingRoom({...editingRoom, approver_email: e.target.value})}
                                                        />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <select
                                                            className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                            value={editingRoom.is_active ? 'true' : 'false'}
                                                            onChange={e => setEditingRoom({...editingRoom, is_active: e.target.value === 'true'})}
                                                        >
                                                            <option value="true">Active</option>
                                                            <option value="false">Inactive</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={() => handleUpdateRoom(room.id, editingRoom)} className="text-white bg-green-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600">Save</button>
                                                            <button onClick={() => setEditingRoom(null)} className="text-gray-500 bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300">Cancel</button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-5">
                                                        <span className="text-[10px] px-2.5 py-1 rounded-full uppercase font-bold" style={{ background: '#f8fafc', color: '#db011c', border: '1px solid #e2e8f0' }}>
                                                            {room.category}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 font-bold text-gray-800 truncate" title={room.name}>{room.name}</td>
                                                    <td className="p-5 text-gray-600 text-xs truncate" title={room.description || ''}>{room.description || '-'}</td>
                                                    <td className="p-5 text-gray-600 truncate">
                                                        <span className={room.approver_email ? 'font-medium' : 'text-gray-400 italic'} title={room.approver_email || ''}>{room.approver_email || 'No email'}</span>
                                                    </td>
                                                    <td className="p-5 text-xs font-bold text-center">
                                                        <span className={room.is_active ? 'text-green-500' : 'text-gray-400'}>{room.is_active ? '● Active' : '○ Inactive'}</span>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <div className="flex gap-3 justify-end">
                                                            <button onClick={() => setEditingRoom(room)} className="text-[#db011c] font-bold hover:underline text-xs">Edit</button>
                                                            <button onClick={() => handleDeleteRoom(room.id)} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredRooms.length === 0 && !loadingRooms && (
                                        <tr><td colSpan={6} className="p-16 text-center text-gray-400 font-medium">No rooms found matching filter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-[#0f172a]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-4 w-[45%]">
                                            <ExcelColumnFilter
                                                title="Category Name"
                                                allValues={categories.map(c => c.name)}
                                                selectedValues={categoryFilters.name}
                                                onFilterChange={(selected) => setCategoryFilters(prev => ({ ...prev, name: selected }))}
                                            />
                                        </th>
                                        <th className="p-4 text-center w-[25%]">
                                            <ExcelColumnFilter
                                                title="Site Location"
                                                allValues={categories.map(c => c.site_location)}
                                                selectedValues={categoryFilters.site_location}
                                                onFilterChange={(selected) => setCategoryFilters(prev => ({ ...prev, site_location: selected }))}
                                            />
                                        </th>
                                        <th className="p-4 text-center w-[20%]">
                                            <ExcelColumnFilter
                                                title="BU"
                                                allValues={categories.map(c => c.bu)}
                                                selectedValues={categoryFilters.bu}
                                                onFilterChange={(selected) => setCategoryFilters(prev => ({ ...prev, bu: selected }))}
                                            />
                                        </th>
                                        <th className="p-4 text-right w-[10%]">
                                            <div className="flex items-center justify-end gap-2">
                                                <span>Action</span>
                                                {(categoryFilters.name.length > 0 || categoryFilters.site_location.length > 0 || categoryFilters.bu.length > 0) && (
                                                    <button
                                                        onClick={() => setCategoryFilters({ name: [], site_location: [], bu: [] })}
                                                        className="text-[11px] font-bold text-red-600 hover:text-red-800 underline ml-2"
                                                        title="Reset all filters"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {loadingCategories ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading categories...</td></tr>
                                    ) : filteredCategories.map((cat) => (
                                        <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            {editingCategory && editingCategory.id === cat.id ? (
                                                <>
                                                    <td className="p-4">
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                            value={editingCategory.name}
                                                            onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                                                        />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <select 
                                                            className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                            value={editingCategory.site_location}
                                                            onChange={e => setEditingCategory({...editingCategory, site_location: e.target.value})}
                                                        >
                                                            <option value="SHTP">SHTP</option>
                                                            <option value="DDK">DDK</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <select 
                                                            className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                            value={editingCategory.bu}
                                                            onChange={e => setEditingCategory({...editingCategory, bu: e.target.value})}
                                                        >
                                                            <option value="Milwaukee">Milwaukee</option>
                                                            <option value="Share Function">Share Function</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={() => handleUpdateCategory(cat.id, editingCategory)} className="text-white bg-green-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600">Save</button>
                                                            <button onClick={() => setEditingCategory(null)} className="text-gray-500 bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300">Cancel</button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-5 font-bold text-gray-800 truncate" title={cat.name}>
                                                        {cat.name}
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <span className="text-[10px] px-2.5 py-1 rounded-md uppercase font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                            {cat.site_location}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <span className="text-[10px] px-2.5 py-1 rounded-md uppercase font-bold bg-purple-50 text-purple-600 border border-purple-100">
                                                            {cat.bu}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <div className="flex gap-3 justify-end">
                                                            <button onClick={() => setEditingCategory(cat)} className="text-[#db011c] font-bold hover:underline text-xs">Edit</button>
                                                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredCategories.length === 0 && !loadingCategories && (
                                        <tr><td colSpan={4} className="p-16 text-center text-gray-400 font-medium">No categories found matching filter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* HOST DEPARTMENTS TAB */}
            {activeTab === 'host-departments' && (
                <HostDepartmentsTab
                    hostDepartments={hostDepartments}
                    loading={loadingHostDepartments}
                    editingHostDept={editingHostDept}
                    onEdit={setEditingHostDept}
                    onUpdate={handleUpdateHostDept}
                    onDelete={handleDeleteHostDept}
                    onAdd={() => setIsHostDeptModalOpen(true)}
                />
            )}

            {/* PORTAL MODALS */}
            {mounted && isRoomModalOpen && createPortal(
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 relative">
                            <button 
                                onClick={() => setIsRoomModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <h2 className="text-xl font-extrabold mb-6">Add New Room</h2>
                            <form onSubmit={handleCreateRoom} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                        value={newRoom.category} 
                                        onChange={e => setNewRoom({ ...newRoom, category: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Room Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                        value={newRoom.name} 
                                        onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} 
                                        placeholder="e.g. Share Function Office L6M" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                        value={newRoom.description || ''} 
                                        onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} 
                                        placeholder="e.g. Floor 6, Building A" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Approver Email</label>
                                    <input 
                                        type="email" 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                        value={newRoom.approver_email} 
                                        onChange={e => setNewRoom({ ...newRoom, approver_email: e.target.value })} 
                                        placeholder="approver@ttigroup.com.vn" 
                                    />
                                </div>
                                <button type="submit" className="w-full py-3.5 mt-2 rounded-xl font-bold text-white bg-[#db011c] hover:bg-[#b90118] transition-colors shadow-md">
                                    Create Room
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {mounted && isCategoryModalOpen && createPortal(
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 relative">
                            <button 
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <h2 className="text-xl font-extrabold mb-6">Add Category</h2>
                            <form onSubmit={handleCreateCategory} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                        value={newCategory.name} 
                                        onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} 
                                        placeholder="e.g. Common Office" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Site Location</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                        value={newCategory.site_location} 
                                        onChange={e => setNewCategory({ ...newCategory, site_location: e.target.value })}
                                    >
                                        <option value="SHTP">SHTP</option>
                                        <option value="DDK">DDK</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">BU</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                        value={newCategory.bu} 
                                        onChange={e => setNewCategory({ ...newCategory, bu: e.target.value })}
                                    >
                                        <option value="Milwaukee">Milwaukee</option>
                                        <option value="Share Function">Share Function</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-3.5 mt-2 rounded-xl font-bold text-white bg-[#db011c] hover:bg-[#b90118] transition-colors shadow-md">
                                    Create Category
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {mounted && isHostDeptModalOpen && createPortal(
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full border border-gray-100 relative">
                            <button onClick={() => setIsHostDeptModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <h2 className="text-xl font-extrabold mb-1">Add Host Department</h2>
                            <p className="text-xs text-gray-500 mb-6">Select or create a Functional Dept, then add the specific Department & Host.</p>
                            
                            <form onSubmit={handleCreateHostDept} className="flex flex-col gap-5">
                                {/* SECTION 1: FUNCTIONAL DEPT */}
                                <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">1. Functional Department</label>
                                    </div>
                                    <select 
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                                        value={selectedFuncDeptOption}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setSelectedFuncDeptOption(val);
                                            if (val === '__NEW__') {
                                                setNewHostDept({
                                                    ...newHostDept,
                                                    functional_dept: '',
                                                    functional_host_name: '',
                                                    functional_host_email: ''
                                                });
                                            } else {
                                                const existing = hostDepartments.find((h: HostDepartment) => h.functional_dept === val);
                                                setNewHostDept({
                                                    ...newHostDept,
                                                    functional_dept: val,
                                                    functional_host_name: existing?.functional_host_name || '',
                                                    functional_host_email: existing?.functional_host_email || '',
                                                    bu: existing?.bu || ''
                                                });
                                            }
                                        }}
                                        required
                                    >
                                        <option value="" disabled>-- Select Existing Functional Dept --</option>
                                        {uniqueFunctionalDepts.map((fd: string) => (
                                            <option key={fd} value={fd}>{fd}</option>
                                        ))}
                                        <option value="__NEW__">+ Create New Functional Dept...</option>
                                    </select>

                                    {/* If New Functional Dept is selected */}
                                    {selectedFuncDeptOption === '__NEW__' && (
                                        <div className="flex flex-col gap-3 mt-1 pt-3 border-t border-gray-200">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">BU <span className="text-red-500">*</span></label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                                                        value={newHostDept.bu || ''} 
                                                        onChange={e => setNewHostDept({...newHostDept, bu: e.target.value})} 
                                                        required 
                                                        placeholder="e.g. Milwaukee" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">New Functional Dept Name <span className="text-red-500">*</span></label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                                                        value={newHostDept.functional_dept} 
                                                        onChange={e => setNewHostDept({...newHostDept, functional_dept: e.target.value})} 
                                                        required 
                                                        placeholder="e.g. Operations" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Functional Host Name <span className="text-red-500">*</span></label>
                                                    <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" value={newHostDept.functional_host_name} onChange={e => setNewHostDept({...newHostDept, functional_host_name: e.target.value})} required placeholder="e.g. John Doe" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Functional Host Email</label>
                                                    <input type="email" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" value={newHostDept.functional_host_email} onChange={e => setNewHostDept({...newHostDept, functional_host_email: e.target.value})} placeholder="host@ttigroup.com" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* If Existing Functional Dept is selected, show read-only info */}
                                    {selectedFuncDeptOption && selectedFuncDeptOption !== '__NEW__' && (
                                        <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200 text-xs flex justify-between items-center text-gray-600">
                                            <div>
                                                <span className="font-bold text-gray-700 mr-2 border-r pr-2 border-gray-300">BU: <span className="text-[#db011c]">{newHostDept.bu || 'N/A'}</span></span>
                                                <span className="font-bold text-gray-700">Functional Host: </span>
                                                <span className="text-[#db011c] font-bold">{newHostDept.functional_host_name || 'N/A'}</span>
                                                {newHostDept.functional_host_email && <span className="text-gray-400"> ({newHostDept.functional_host_email})</span>}
                                            </div>
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Auto-filled</span>
                                        </div>
                                    )}
                                </div>

                                {/* SECTION 2: DEPARTMENT & DEPARTMENT HOST */}
                                <div className="p-4 bg-white rounded-xl border border-gray-200 flex flex-col gap-3">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">2. Department & Host Info</label>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Department Name <span className="text-red-500">*</span></label>
                                        <input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" value={newHostDept.department} onChange={e => setNewHostDept({...newHostDept, department: e.target.value})} required placeholder="e.g. Sourcing, Quality, Management..." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Dept Host Name <span className="text-red-500">*</span></label>
                                            <input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" value={newHostDept.department_host_name} onChange={e => setNewHostDept({...newHostDept, department_host_name: e.target.value})} required placeholder="Host full name" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Dept Host Email</label>
                                            <input type="email" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" value={newHostDept.department_host_email} onChange={e => setNewHostDept({...newHostDept, department_host_email: e.target.value})} placeholder="host@ttigroup.com" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-3.5 mt-2 rounded-xl font-bold text-white bg-[#db011c] hover:bg-[#b90118] transition-colors shadow-md">
                                    Create Host Department
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}


            {/* Meeting Room Modal */}
            {mounted && isMeetingRoomModalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMeetingRoomModalOpen(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-900">Create New Meeting Room</h3>
                            <button onClick={() => setIsMeetingRoomModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateMeetingRoom} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Floor Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db011c] focus:border-transparent outline-none transition-all"
                                        value={newMeetingRoom.floorName}
                                        onChange={e => setNewMeetingRoom({...newMeetingRoom, floorName: e.target.value})}
                                        placeholder="e.g. Lầu 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Room Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#db011c] focus:border-transparent outline-none transition-all"
                                        value={newMeetingRoom.roomName}
                                        onChange={e => setNewMeetingRoom({...newMeetingRoom, roomName: e.target.value})}
                                        placeholder="e.g. Phòng họp A"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsMeetingRoomModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#db011c] text-white font-bold rounded-lg hover:bg-[#b00116] transition-colors shadow-md"
                                >
                                    Create Meeting Room
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
