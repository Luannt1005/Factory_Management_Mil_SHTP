'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminRoomsPage() {
    const [activeTab, setActiveTab] = useState<'rooms' | 'categories'>('rooms');
    
    // Room State
    const [rooms, setRooms] = useState<any[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [editingRoom, setEditingRoom] = useState<any>(null);
    const [newRoom, setNewRoom] = useState({ category: '', name: '', approver_email: '' });

    // Category State
    const [categories, setCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [newCategory, setNewCategory] = useState({ name: '', site_location: 'SHTP', bu: 'Milwaukee' });

    useEffect(() => {
        fetchRooms();
        fetchCategories();
    }, []);

    const fetchRooms = async () => {
        setLoadingRooms(true);
        const res = await fetch('/api/admin/rooms');
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
            setNewRoom({ category: categories.length > 0 ? categories[0].name : '', name: '', approver_email: '' });
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
        } else {
            const data = await res.json();
            alert(`Error: ${data.error}`);
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

    return (
        <div className="flex flex-col gap-6">
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 gap-6">
                <button 
                    onClick={() => setActiveTab('rooms')} 
                    className={`pb-3 font-bold text-sm tracking-wide transition-colors ${activeTab === 'rooms' ? 'text-[#db011c] border-b-2 border-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    MANAGE ROOMS
                </button>
                <button 
                    onClick={() => setActiveTab('categories')} 
                    className={`pb-3 font-bold text-sm tracking-wide transition-colors ${activeTab === 'categories' ? 'text-[#db011c] border-b-2 border-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    ROOM CATEGORIES
                </button>
            </div>

            {activeTab === 'rooms' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                    {/* ADD NEW ROOM */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-100 text-[#0f172a] h-fit sticky top-20">
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

                    {/* ROOM LIST */}
                    <div className="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-[#0f172a]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-5">Category</th>
                                        <th className="p-5">Room Name</th>
                                        <th className="p-5">Approver Email</th>
                                        <th className="p-5 text-center">Status</th>
                                        <th className="p-5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {loadingRooms ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading rooms...</td></tr>
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
                                        <tr><td colSpan={5} className="p-16 text-center text-gray-400 font-medium">No rooms found. Add your first room area.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                    {/* ADD NEW CATEGORY */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-100 text-[#0f172a] h-fit sticky top-20">
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

                    {/* CATEGORY LIST */}
                    <div className="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-[#0f172a]">
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
        </div>
    );
}
