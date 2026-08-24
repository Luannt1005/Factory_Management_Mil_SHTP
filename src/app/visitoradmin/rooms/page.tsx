'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

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
    const [rooms, setRooms] = useState<any[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [editingRoom, setEditingRoom] = useState<any>(null);
    const [newRoom, setNewRoom] = useState({ category: '', name: '', description: '', approver_email: '' });

    // Category State
    const [categories, setCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [newCategory, setNewCategory] = useState({ name: '', site_location: 'SHTP', bu: 'Milwaukee' });

    // Host Dept State
    // Meeting Room State
    const [meetingRooms, setMeetingRooms] = useState<any[]>([]);
    const [loadingMeetingRooms, setLoadingMeetingRooms] = useState(true);
    const [editingMeetingRoom, setEditingMeetingRoom] = useState<any>(null);
    const [newMeetingRoom, setNewMeetingRoom] = useState({ floorName: '', roomName: '' });

    const [hostDepartments, setHostDepartments] = useState<any[]>([]);
    const [loadingHostDepartments, setLoadingHostDepartments] = useState(true);
    const [editingHostDept, setEditingHostDept] = useState<any>(null);
    const [newHostDept, setNewHostDept] = useState({ bu: '', functional_dept: '', functional_host_name: '', functional_host_email: '', department: '', department_host_name: '', department_host_email: '' });
    const [selectedFuncDeptOption, setSelectedFuncDeptOption] = useState<string>('');

    // --- Column Filter States for All Tabs ---
    const [roomFilters, setRoomFilters] = useState({
        category: '',
        name: '',
        description: '',
        approver_email: '',
        is_active: ''
    });

    const [categoryFilters, setCategoryFilters] = useState({
        name: '',
        site_location: '',
        bu: ''
    });

    const [hostDeptFilters, setHostDeptFilters] = useState({
        bu: '',
        functional_dept: '',
        functional_host: '',
        department: '',
        department_host: '',
        is_active: ''
    });

    const [meetingRoomFilters, setMeetingRoomFilters] = useState({
        floorName: '',
        roomName: ''
    });

    // Filtered lists
    const filteredMeetingRooms = meetingRooms.filter(room => {
        if (meetingRoomFilters.floorName && !room.floorName?.toLowerCase().includes(meetingRoomFilters.floorName.toLowerCase())) return false;
        if (meetingRoomFilters.roomName && !room.roomName?.toLowerCase().includes(meetingRoomFilters.roomName.toLowerCase())) return false;
        return true;
    });

    const filteredRooms = rooms.filter(room => {
        if (roomFilters.category && !room.category?.toLowerCase().includes(roomFilters.category.toLowerCase())) return false;
        if (roomFilters.name && !room.name?.toLowerCase().includes(roomFilters.name.toLowerCase())) return false;
        if (roomFilters.description && !room.description?.toLowerCase().includes(roomFilters.description.toLowerCase())) return false;
        if (roomFilters.approver_email && !room.approver_email?.toLowerCase().includes(roomFilters.approver_email.toLowerCase())) return false;
        if (roomFilters.is_active !== '') {
            const activeBool = roomFilters.is_active === 'true';
            if (Boolean(room.is_active) !== activeBool) return false;
        }
        return true;
    });

    const filteredCategories = categories.filter(cat => {
        if (categoryFilters.name && !cat.name?.toLowerCase().includes(categoryFilters.name.toLowerCase())) return false;
        if (categoryFilters.site_location && cat.site_location !== categoryFilters.site_location) return false;
        if (categoryFilters.bu && cat.bu !== categoryFilters.bu) return false;
        return true;
    });

    const filteredHostDepartments = hostDepartments.filter(h => {
        if (hostDeptFilters.bu && !h.bu?.toLowerCase().includes(hostDeptFilters.bu.toLowerCase())) return false;
        if (hostDeptFilters.functional_dept && !h.functional_dept?.toLowerCase().includes(hostDeptFilters.functional_dept.toLowerCase())) return false;
        if (hostDeptFilters.functional_host) {
            const q = hostDeptFilters.functional_host.toLowerCase();
            const matchName = h.functional_host_name?.toLowerCase().includes(q);
            const matchEmail = h.functional_host_email?.toLowerCase().includes(q);
            if (!matchName && !matchEmail) return false;
        }
        if (hostDeptFilters.department && !h.department?.toLowerCase().includes(hostDeptFilters.department.toLowerCase())) return false;
        if (hostDeptFilters.department_host) {
            const q = hostDeptFilters.department_host.toLowerCase();
            const matchName = h.department_host_name?.toLowerCase().includes(q);
            const matchEmail = h.department_host_email?.toLowerCase().includes(q);
            if (!matchName && !matchEmail) return false;
        }
        if (hostDeptFilters.is_active !== '') {
            const activeBool = hostDeptFilters.is_active === 'true';
            if (Boolean(h.is_active) !== activeBool) return false;
        }
        return true;
    });

    const uniqueFunctionalDepts = Array.from(new Set(hostDepartments.map((h: any) => h.functional_dept).filter(Boolean)));

    useEffect(() => {
        fetchRooms();
        fetchCategories();
        fetchHostDepartments();
        fetchMeetingRooms();
    }, []);

    const fetchRooms = async () => {
        setLoadingRooms(true);
        const res = await fetch('/api/admin/rooms?all=true');
        if (res.ok) {
            const data = await res.json();
            setRooms(data.rooms);
        }
        setLoadingRooms(false);
    };

    const fetchCategories = async () => {
        setLoadingCategories(true);
        const res = await fetch('/api/admin/room-categories');
        if (res.ok) {
            const data = await res.json();
            setCategories(data.categories);
            if (data.categories.length > 0 && !newRoom.category) {
                setNewRoom(prev => ({ ...prev, category: data.categories[0].name }));
            }
        }
        setLoadingCategories(false);
    };

    const fetchMeetingRooms = async () => {
        setLoadingMeetingRooms(true);
        const res = await fetch('/api/admin/meeting-rooms');
        if (res.ok) {
            const data = await res.json();
            setMeetingRooms(data.meetingRooms || []);
        }
        setLoadingMeetingRooms(false);
    };

    const fetchHostDepartments = async () => {
        setLoadingHostDepartments(true);
        const res = await fetch('/api/admin/host-departments?all=true');
        if (res.ok) {
            const data = await res.json();
            setHostDepartments(data.hostDepartments || []);
        }
        setLoadingHostDepartments(false);
    };

    // --- Meeting Room Handlers ---
    const handleCreateMeetingRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/meeting-rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMeetingRoom),
        });
        if (res.ok) {
            fetchMeetingRooms();
            setNewMeetingRoom({ floorName: '', roomName: '' });
            setIsMeetingRoomModalOpen(false);
        } else {
            alert('Error creating meeting room');
        }
    };

    const handleUpdateMeetingRoom = async (id: string, updates: any) => {
        const res = await fetch('/api/admin/meeting-rooms', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });
        if (res.ok) {
            fetchMeetingRooms();
            setEditingMeetingRoom(null);
        } else {
            alert('Error updating meeting room');
        }
    };

    const handleDeleteMeetingRoom = async (id: string) => {
        if (!confirm('Are you sure you want to delete this meeting room?')) return;
        const res = await fetch(`/api/admin/meeting-rooms?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchMeetingRooms();
        else alert('Error deleting meeting room');
    };

    // --- Room Handlers ---
    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRoom),
        });
        if (res.ok) {
            fetchRooms();
            setNewRoom({ category: categories.length > 0 ? categories[0].name : '', name: '', description: '', approver_email: '' });
            setIsRoomModalOpen(false);
        } else {
            alert('Error creating room');
        }
    };

    const handleUpdateRoom = async (id: string, updates: any) => {
        const res = await fetch('/api/admin/rooms', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });
        if (res.ok) {
            fetchRooms();
            setEditingRoom(null);
        } else {
            alert('Error updating room');
        }
    };

    const handleDeleteRoom = async (id: string) => {
        if (!confirm('Are you sure you want to delete this room?')) return;
        const res = await fetch(`/api/admin/rooms?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchRooms();
        } else {
            alert('Error deleting room');
        }
    };

    // --- Category Handlers ---
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/room-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCategory),
        });
        if (res.ok) {
            fetchCategories();
            setNewCategory({ name: '', site_location: 'SHTP', bu: 'Milwaukee' });
            setIsCategoryModalOpen(false);
        } else {
            alert('Error creating category');
        }
    };

    const handleUpdateCategory = async (id: string, updates: any) => {
        const res = await fetch('/api/admin/room-categories', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });
        if (res.ok) {
            fetchCategories();
            setEditingCategory(null);
        } else {
            const data = await res.json();
            alert(`Error: ${data.error}`);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category? Make sure no rooms are using it.')) return;
        const res = await fetch(`/api/admin/room-categories?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchCategories();
        } else {
            alert('Error deleting category');
        }
    };

    // --- Host Dept Handlers ---
    const handleCreateHostDept = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/host-departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHostDept),
        });
        if (res.ok) {
            fetchHostDepartments();
            setSelectedFuncDeptOption('');
            setNewHostDept({ bu: '', functional_dept: '', functional_host_name: '', functional_host_email: '', department: '', department_host_name: '', department_host_email: '' });
            setIsHostDeptModalOpen(false);
        } else {
            alert('Error creating Host Department');
        }
    };

    const handleUpdateHostDept = async (id: string, updates: any) => {
        const res = await fetch('/api/admin/host-departments', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });
        if (res.ok) {
            fetchHostDepartments();
            setEditingHostDept(null);
        } else {
            alert('Error updating Host Department');
        }
    };

    const handleDeleteHostDept = async (id: string) => {
        if (!confirm('Are you sure you want to delete this?')) return;
        const res = await fetch(`/api/admin/host-departments?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchHostDepartments();
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
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                        <th className="py-3 px-6 font-black text-gray-600 text-xs uppercase tracking-wider w-[40%] align-top">
                                            <div className="mb-1.5">Floor Name</div>
                                            <input
                                                type="text"
                                                placeholder="Filter floor..."
                                                value={meetingRoomFilters.floorName}
                                                onChange={e => setMeetingRoomFilters({ ...meetingRoomFilters, floorName: e.target.value })}
                                                className="w-full px-2.5 py-1 bg-white border border-gray-300 rounded-md text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="py-3 px-6 font-black text-gray-600 text-xs uppercase tracking-wider w-[40%] align-top">
                                            <div className="mb-1.5">Room Name</div>
                                            <input
                                                type="text"
                                                placeholder="Filter room..."
                                                value={meetingRoomFilters.roomName}
                                                onChange={e => setMeetingRoomFilters({ ...meetingRoomFilters, roomName: e.target.value })}
                                                className="w-full px-2.5 py-1 bg-white border border-gray-300 rounded-md text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="py-3 px-6 font-black text-gray-600 text-xs uppercase tracking-wider text-right w-[20%] align-top">
                                            <div className="mb-1.5">Actions</div>
                                            {(meetingRoomFilters.floorName || meetingRoomFilters.roomName) && (
                                                <button
                                                    onClick={() => setMeetingRoomFilters({ floorName: '', roomName: '' })}
                                                    className="text-[11px] font-bold text-red-600 hover:text-red-800 underline"
                                                >
                                                    Clear filter
                                                </button>
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {loadingMeetingRooms ? (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-gray-500">Loading meeting rooms...</td>
                                        </tr>
                                    ) : filteredMeetingRooms.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-gray-500">No meeting rooms found.</td>
                                        </tr>
                                    ) : (
                                        filteredMeetingRooms.map((room) => (
                                            <tr key={room.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="py-4 px-6">
                                                    {editingMeetingRoom?.id === room.id ? (
                                                        <input 
                                                            type="text" 
                                                            className="w-full border rounded px-2 py-1"
                                                            value={editingMeetingRoom.floorName}
                                                            onChange={e => setEditingMeetingRoom({...editingMeetingRoom, floorName: e.target.value})}
                                                        />
                                                    ) : (
                                                        <span className="font-semibold text-gray-900">{room.floorName}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {editingMeetingRoom?.id === room.id ? (
                                                        <input 
                                                            type="text" 
                                                            className="w-full border rounded px-2 py-1"
                                                            value={editingMeetingRoom.roomName}
                                                            onChange={e => setEditingMeetingRoom({...editingMeetingRoom, roomName: e.target.value})}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-600">{room.roomName}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {editingMeetingRoom?.id === room.id ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleUpdateMeetingRoom(room.id, { floorName: editingMeetingRoom.floorName, roomName: editingMeetingRoom.roomName })}
                                                                className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-1.5 rounded"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            </button>
                                                            <button 
                                                                onClick={() => setEditingMeetingRoom(null)}
                                                                className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1.5 rounded"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => setEditingMeetingRoom(room)}
                                                                className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteMeetingRoom(room.id)}
                                                                className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}


            {/* ROOMS TAB */}
            {activeTab === 'rooms' && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-[#0f172a]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-4 align-top w-[18%]">
                                            <div className="mb-1.5 text-gray-600">Category</div>
                                            <input
                                                type="text"
                                                placeholder="Filter category..."
                                                value={roomFilters.category}
                                                onChange={e => setRoomFilters({ ...roomFilters, category: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-4 align-top w-[22%]">
                                            <div className="mb-1.5 text-gray-600">Room Name</div>
                                            <input
                                                type="text"
                                                placeholder="Filter name..."
                                                value={roomFilters.name}
                                                onChange={e => setRoomFilters({ ...roomFilters, name: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-4 align-top w-[22%]">
                                            <div className="mb-1.5 text-gray-600">Description</div>
                                            <input
                                                type="text"
                                                placeholder="Filter description..."
                                                value={roomFilters.description}
                                                onChange={e => setRoomFilters({ ...roomFilters, description: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-4 align-top w-[20%]">
                                            <div className="mb-1.5 text-gray-600">Approver Email</div>
                                            <input
                                                type="text"
                                                placeholder="Filter email..."
                                                value={roomFilters.approver_email}
                                                onChange={e => setRoomFilters({ ...roomFilters, approver_email: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-4 text-center align-top w-[10%]">
                                            <div className="mb-1.5 text-gray-600">Status</div>
                                            <select
                                                value={roomFilters.is_active}
                                                onChange={e => setRoomFilters({ ...roomFilters, is_active: e.target.value })}
                                                className="w-full px-1.5 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            >
                                                <option value="">All</option>
                                                <option value="true">Active</option>
                                                <option value="false">Inactive</option>
                                            </select>
                                        </th>
                                        <th className="p-4 text-right align-top w-[8%]">
                                            <div className="mb-1.5 text-gray-600">Action</div>
                                            {(roomFilters.category || roomFilters.name || roomFilters.description || roomFilters.approver_email || roomFilters.is_active) && (
                                                <button
                                                    onClick={() => setRoomFilters({ category: '', name: '', description: '', approver_email: '', is_active: '' })}
                                                    className="text-[11px] font-bold text-red-600 hover:text-red-800 underline whitespace-nowrap"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {loadingRooms ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading rooms...</td></tr>
                                    ) : filteredRooms.map((room) => (
                                        <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            {editingRoom?.id === room.id ? (
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
                                                            value={editingRoom.approver_email}
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
                                                    <td className="p-5 font-bold text-gray-800">{room.name}</td>
                                                    <td className="p-5 text-gray-600 text-xs">{room.description || '-'}</td>
                                                    <td className="p-5 text-gray-600">
                                                        <span className={room.approver_email ? 'font-medium' : 'text-gray-400 italic'}>{room.approver_email || 'No email'}</span>
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
                                        <tr><td colSpan={6} className="p-16 text-center text-gray-400 font-medium">No rooms found matching the filter.</td></tr>
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
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-4 align-top w-[45%]">
                                            <div className="mb-1.5 text-gray-600">Category Name</div>
                                            <input
                                                type="text"
                                                placeholder="Filter category..."
                                                value={categoryFilters.name}
                                                onChange={e => setCategoryFilters({ ...categoryFilters, name: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-4 text-center align-top w-[25%]">
                                            <div className="mb-1.5 text-gray-600">Site Location</div>
                                            <select
                                                value={categoryFilters.site_location}
                                                onChange={e => setCategoryFilters({ ...categoryFilters, site_location: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            >
                                                <option value="">All Sites</option>
                                                <option value="SHTP">SHTP</option>
                                                <option value="DDK">DDK</option>
                                            </select>
                                        </th>
                                        <th className="p-4 text-center align-top w-[20%]">
                                            <div className="mb-1.5 text-gray-600">BU</div>
                                            <select
                                                value={categoryFilters.bu}
                                                onChange={e => setCategoryFilters({ ...categoryFilters, bu: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            >
                                                <option value="">All BUs</option>
                                                <option value="Milwaukee">Milwaukee</option>
                                                <option value="Share Function">Share Function</option>
                                            </select>
                                        </th>
                                        <th className="p-4 text-right align-top w-[10%]">
                                            <div className="mb-1.5 text-gray-600">Action</div>
                                            {(categoryFilters.name || categoryFilters.site_location || categoryFilters.bu) && (
                                                <button
                                                    onClick={() => setCategoryFilters({ name: '', site_location: '', bu: '' })}
                                                    className="text-[11px] font-bold text-red-600 hover:text-red-800 underline whitespace-nowrap"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {loadingCategories ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading categories...</td></tr>
                                    ) : filteredCategories.map((cat) => (
                                        <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            {editingCategory?.id === cat.id ? (
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
                                                    <td className="p-5 font-bold text-gray-800">
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
                                        <tr><td colSpan={4} className="p-16 text-center text-gray-400 font-medium">No categories found matching the filter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* HOST DEPARTMENTS TAB */}
            {activeTab === 'host-departments' && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-[#0f172a]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-3 align-top w-[12%]">
                                            <div className="mb-1.5 text-gray-600">BU</div>
                                            <input
                                                type="text"
                                                placeholder="Filter BU..."
                                                value={hostDeptFilters.bu}
                                                onChange={e => setHostDeptFilters({ ...hostDeptFilters, bu: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-3 align-top w-[18%]">
                                            <div className="mb-1.5 text-gray-600">Functional Dept</div>
                                            <input
                                                type="text"
                                                placeholder="Filter func dept..."
                                                value={hostDeptFilters.functional_dept}
                                                onChange={e => setHostDeptFilters({ ...hostDeptFilters, functional_dept: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-3 align-top w-[22%]">
                                            <div className="mb-1.5 text-gray-600">Func Host (Name/Email)</div>
                                            <input
                                                type="text"
                                                placeholder="Filter host..."
                                                value={hostDeptFilters.functional_host}
                                                onChange={e => setHostDeptFilters({ ...hostDeptFilters, functional_host: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-3 align-top w-[18%]">
                                            <div className="mb-1.5 text-gray-600">Department</div>
                                            <input
                                                type="text"
                                                placeholder="Filter dept..."
                                                value={hostDeptFilters.department}
                                                onChange={e => setHostDeptFilters({ ...hostDeptFilters, department: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-3 align-top w-[20%]">
                                            <div className="mb-1.5 text-gray-600">Dept Host (Name/Email)</div>
                                            <input
                                                type="text"
                                                placeholder="Filter host..."
                                                value={hostDeptFilters.department_host}
                                                onChange={e => setHostDeptFilters({ ...hostDeptFilters, department_host: e.target.value })}
                                                className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            />
                                        </th>
                                        <th className="p-3 text-center align-top w-[10%]">
                                            <div className="mb-1.5 text-gray-600">Status</div>
                                            <select
                                                value={hostDeptFilters.is_active}
                                                onChange={e => setHostDeptFilters({ ...hostDeptFilters, is_active: e.target.value })}
                                                className="w-full px-1.5 py-1 bg-white border border-gray-300 rounded text-xs font-normal text-gray-700 focus:outline-none focus:border-[#db011c]"
                                            >
                                                <option value="">All</option>
                                                <option value="true">Active</option>
                                                <option value="false">Inactive</option>
                                            </select>
                                        </th>
                                        <th className="p-3 text-right align-top w-[10%]">
                                            <div className="mb-1.5 text-gray-600">Action</div>
                                            {(hostDeptFilters.bu || hostDeptFilters.functional_dept || hostDeptFilters.functional_host || hostDeptFilters.department || hostDeptFilters.department_host || hostDeptFilters.is_active) && (
                                                <button
                                                    onClick={() => setHostDeptFilters({ bu: '', functional_dept: '', functional_host: '', department: '', department_host: '', is_active: '' })}
                                                    className="text-[11px] font-bold text-red-600 hover:text-red-800 underline whitespace-nowrap"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {loadingHostDepartments ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
                                    ) : filteredHostDepartments.map((h) => (
                                        <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            {editingHostDept?.id === h.id ? (
                                                <>
                                                    <td className="p-2"><input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.bu || ''} onChange={e => setEditingHostDept({...editingHostDept, bu: e.target.value})} placeholder="BU" /></td>
                                                    <td className="p-2"><input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.functional_dept} onChange={e => setEditingHostDept({...editingHostDept, functional_dept: e.target.value})} /></td>
                                                    <td className="p-2">
                                                        <input type="text" className="w-full p-1 border rounded text-xs mb-1" value={editingHostDept.functional_host_name} onChange={e => setEditingHostDept({...editingHostDept, functional_host_name: e.target.value})} placeholder="Name" />
                                                        <input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.functional_host_email || ''} onChange={e => setEditingHostDept({...editingHostDept, functional_host_email: e.target.value})} placeholder="Email" />
                                                    </td>
                                                    <td className="p-2"><input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.department} onChange={e => setEditingHostDept({...editingHostDept, department: e.target.value})} /></td>
                                                    <td className="p-2">
                                                        <input type="text" className="w-full p-1 border rounded text-xs mb-1" value={editingHostDept.department_host_name} onChange={e => setEditingHostDept({...editingHostDept, department_host_name: e.target.value})} placeholder="Name" />
                                                        <input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.department_host_email || ''} onChange={e => setEditingHostDept({...editingHostDept, department_host_email: e.target.value})} placeholder="Email" />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <select className="p-1 border rounded text-xs" value={editingHostDept.is_active ? 'true' : 'false'} onChange={e => setEditingHostDept({...editingHostDept, is_active: e.target.value === 'true'})}>
                                                            <option value="true">Active</option><option value="false">Inactive</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        <button onClick={() => handleUpdateHostDept(h.id, editingHostDept)} className="text-green-600 hover:text-green-800 font-bold mr-3 text-xs">Save</button>
                                                        <button onClick={() => setEditingHostDept(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xs">Cancel</button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-4 font-bold">{h.bu || ''}</td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                                                            {h.functional_dept}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-[#db011c]">{h.functional_host_name}</div>
                                                        <div className="text-xs text-gray-500">{h.functional_host_email}</div>
                                                    </td>
                                                    <td className="p-4 font-bold">{h.department}</td>
                                                    <td className="p-4">
                                                        <div className="font-bold">{h.department_host_name}</div>
                                                        <div className="text-xs text-gray-500">{h.department_host_email}</div>
                                                    </td>
                                                    <td className="p-4 text-center">{h.is_active ? <span className="text-green-500 text-xs font-bold">● Active</span> : <span className="text-gray-400 text-xs font-bold">○ Inactive</span>}</td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => setEditingHostDept(h)} className="text-red-500 hover:text-[#b90118] font-bold text-xs mr-4 transition-colors">Edit</button>
                                                        <button onClick={() => handleDeleteHostDept(h.id)} className="text-gray-400 hover:text-red-600 transition-colors"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredHostDepartments.length === 0 && !loadingHostDepartments && (
                                        <tr><td colSpan={7} className="p-16 text-center text-gray-400 font-medium">No host departments found matching the filter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
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
                                                const existing = hostDepartments.find((h: any) => h.functional_dept === val);
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
                                        {uniqueFunctionalDepts.map((fd: any) => (
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
