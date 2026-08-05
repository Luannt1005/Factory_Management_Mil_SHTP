'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

export default function AdminRoomsPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [activeTab, setActiveTab] = useState<'rooms' | 'categories' | 'host-departments'>('rooms');
    
    // Modal States
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isHostDeptModalOpen, setIsHostDeptModalOpen] = useState(false);

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
    const [hostDepartments, setHostDepartments] = useState<any[]>([]);
    const [loadingHostDepartments, setLoadingHostDepartments] = useState(true);
    const [editingHostDept, setEditingHostDept] = useState<any>(null);
    const [newHostDept, setNewHostDept] = useState({ functional_dept: '', functional_host_name: '', functional_host_email: '', department: '', department_host_name: '', department_host_email: '' });
    const [selectedFuncDeptOption, setSelectedFuncDeptOption] = useState<string>('');

    const uniqueFunctionalDepts = Array.from(new Set(hostDepartments.map((h: any) => h.functional_dept).filter(Boolean)));

    useEffect(() => {
        fetchRooms();
        fetchCategories();
        fetchHostDepartments();
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

    const fetchHostDepartments = async () => {
        setLoadingHostDepartments(true);
        const res = await fetch('/api/admin/host-departments?all=true');
        if (res.ok) {
            const data = await res.json();
            setHostDepartments(data.hostDepartments || []);
        }
        setLoadingHostDepartments(false);
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
            setNewHostDept({ functional_dept: '', functional_host_name: '', functional_host_email: '', department: '', department_host_name: '', department_host_email: '' });
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
            </div>

            {/* ROOMS TAB */}
            {activeTab === 'rooms' && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-[#0f172a]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-5">Category</th>
                                        <th className="p-5">Room Name</th>
                                        <th className="p-5">Description</th>
                                        <th className="p-5">Approver Email</th>
                                        <th className="p-5 text-center">Status</th>
                                        <th className="p-5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {loadingRooms ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading rooms...</td></tr>
                                    ) : rooms.map((room) => (
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
                                                    <td className="p-4 text-right flex gap-2 justify-end">
                                                        <button onClick={() => handleUpdateRoom(room.id, editingRoom)} className="text-white bg-green-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600">Save</button>
                                                        <button onClick={() => setEditingRoom(null)} className="text-gray-500 bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300">Cancel</button>
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
                                                    <td className="p-5 text-right flex gap-3 justify-end">
                                                        <button onClick={() => setEditingRoom(room)} className="text-[#db011c] font-bold hover:underline text-xs">Edit</button>
                                                        <button onClick={() => handleDeleteRoom(room.id)} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {rooms.length === 0 && !loadingRooms && (
                                        <tr><td colSpan={6} className="p-16 text-center text-gray-400 font-medium">No rooms found. Add your first room area.</td></tr>
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
                                        <th className="p-5">Category Name</th>
                                        <th className="p-5 text-center">Site Location</th>
                                        <th className="p-5 text-center">BU</th>
                                        <th className="p-5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {loadingCategories ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading categories...</td></tr>
                                    ) : categories.map((cat) => (
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
                                                    <td className="p-4 text-right flex gap-2 justify-end">
                                                        <button onClick={() => handleUpdateCategory(cat.id, editingCategory)} className="text-white bg-green-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600">Save</button>
                                                        <button onClick={() => setEditingCategory(null)} className="text-gray-500 bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300">Cancel</button>
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
                                                    <td className="p-5 text-right flex gap-3 justify-end">
                                                        <button onClick={() => setEditingCategory(cat)} className="text-[#db011c] font-bold hover:underline text-xs">Edit</button>
                                                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {categories.length === 0 && !loadingCategories && (
                                        <tr><td colSpan={4} className="p-16 text-center text-gray-400 font-medium">No categories found. Add your first category.</td></tr>
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
                                        <th className="p-4">Functional Dept</th>
                                        <th className="p-4">Func Host (Name / Email)</th>
                                        <th className="p-4">Department</th>
                                        <th className="p-4">Dept Host (Name / Email)</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {loadingHostDepartments ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td></tr>
                                    ) : hostDepartments.map((h) => (
                                        <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            {editingHostDept?.id === h.id ? (
                                                <>
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
                                    {hostDepartments.length === 0 && !loadingHostDepartments && (
                                        <tr><td colSpan={6} className="p-16 text-center text-gray-400 font-medium">No host departments found.</td></tr>
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
                                                    functional_host_email: existing?.functional_host_email || ''
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
        </div>
    );
}
