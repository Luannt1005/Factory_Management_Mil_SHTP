'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { roomsAdminApi } from '@/features/visitor/rooms/services/roomsAdminApi';
import { MeetingRoomsTab } from '@/features/visitor/rooms/components/tabs/MeetingRoomsTab';
import { HostDepartmentsTab } from '@/features/visitor/rooms/components/tabs/HostDepartmentsTab';
import { CategoriesTab } from '@/features/visitor/rooms/components/tabs/CategoriesTab';
import { FacilityRoomsTab } from '@/features/visitor/rooms/components/tabs/FacilityRoomsTab';
import { NewCategoryModal } from '@/features/visitor/rooms/components/modals/NewCategoryModal';
import { NewFacilityRoomModal } from '@/features/visitor/rooms/components/modals/NewFacilityRoomModal';
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
                <FacilityRoomsTab
                    rooms={rooms}
                    categories={categories}
                    loading={loadingRooms}
                    editingRoom={editingRoom}
                    onEdit={setEditingRoom}
                    onUpdate={handleUpdateRoom}
                    onDelete={handleDeleteRoom}
                    onAdd={() => setIsRoomModalOpen(true)}
                />
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
                <CategoriesTab
                    categories={categories}
                    loading={loadingCategories}
                    editingCategory={editingCategory}
                    onEdit={setEditingCategory}
                    onUpdate={handleUpdateCategory}
                    onDelete={handleDeleteCategory}
                    onAdd={() => setIsCategoryModalOpen(true)}
                />
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
            {mounted && (
                <NewFacilityRoomModal
                    open={isRoomModalOpen}
                    formData={newRoom}
                    categories={categories}
                    onChange={(field, value) => setNewRoom(prev => ({ ...prev, [field]: value }))}
                    onSubmit={handleCreateRoom}
                    onClose={() => setIsRoomModalOpen(false)}
                />
            )}

            {mounted && (
                <NewCategoryModal
                    open={isCategoryModalOpen}
                    formData={newCategory}
                    onChange={(field, value) => setNewCategory(prev => ({ ...prev, [field]: value }))}
                    onSubmit={handleCreateCategory}
                    onClose={() => setIsCategoryModalOpen(false)}
                />
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
