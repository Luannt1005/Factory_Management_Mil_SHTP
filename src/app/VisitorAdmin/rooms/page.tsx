'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminRoomsPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRoom, setEditingRoom] = useState<any>(null);
    const [newRoom, setNewRoom] = useState({ category: 'Common Office', name: '', approver_email: '', image_url: '' });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/rooms');
        if (res.ok) {
            const data = await res.json();
            setRooms(data.rooms);
        }
        setLoading(false);
    };

    const handleUpdate = async (id: string, updates: any) => {
        const res = await fetch('/api/admin/rooms', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });
        if (res.ok) {
            fetchRooms();
            setEditingRoom(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRoom),
        });
        if (res.ok) {
            fetchRooms();
            setNewRoom({ category: 'Common Office', name: '', approver_email: '', image_url: '' });
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] py-10 px-4 text-white">
            <div className="container mx-auto max-w-7xl relative">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-white drop-shadow-md">Manage Rooms & Approvers</h1>
                        <p className="text-[#ffe5e5]">Assign specific approver emails to each factory area.</p>
                    </div>
                    <Link href="/VisitorAdmin" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all border border-white/30 shadow-lg">
                        Back to Dashboard
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ADD NEW ROOM */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 text-[#0f172a] h-fit sticky top-20">
                        <h2 className="text-xl font-extrabold mb-6">Add New Room</h2>
                        <form onSubmit={handleCreate} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                <select 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                    value={newRoom.category} 
                                    onChange={e => setNewRoom({ ...newRoom, category: e.target.value })}
                                >
                                    <option>Common Office</option>
                                    <option>AME</option>
                                    <option>ENG</option>
                                    <option>EE/MT</option>
                                    <option>MFG</option>
                                    <option>Shipping</option>
                                    <option>Quality QM</option>
                                    <option>MIL/TTI Expat / SHTP Business trip</option>
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
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Image URL</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                    value={newRoom.image_url} 
                                    onChange={e => setNewRoom({ ...newRoom, image_url: e.target.value })} 
                                    placeholder="/room_office.png" 
                                />
                            </div>
                            <button type="submit" className="w-full py-3.5 mt-2 rounded-xl font-bold text-white bg-[#db011c] hover:bg-[#b90118] transition-colors shadow-lg">
                                Create Room
                            </button>
                        </form>
                    </div>

                    {/* ROOM LIST */}
                    <div className="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20 text-[#0f172a]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-5">Category</th>
                                        <th className="p-5">Room Name</th>
                                        <th className="p-5">Approver Email</th>
                                        <th className="p-5">Status</th>
                                        <th className="p-5">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[0.875rem] font-medium bg-white">
                                    {rooms.map((room) => (
                                        <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-5">
                                                <span className="text-[10px] px-2.5 py-1 rounded-full uppercase font-bold" style={{ background: '#f8fafc', color: '#db011c', border: '1px solid #e2e8f0' }}>
                                                    {room.category}
                                                </span>
                                            </td>
                                            <td className="p-5 font-bold text-gray-800">{room.name}</td>
                                            <td className="p-5 text-gray-600">
                                                {editingRoom?.id === room.id ? (
                                                    <div className="flex flex-col gap-2">
                                                        <input 
                                                            type="email" 
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs" 
                                                            placeholder="Approver Email" 
                                                            defaultValue={room.approver_email} 
                                                            onBlur={(e) => handleUpdate(room.id, { approver_email: e.target.value })} 
                                                        />
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs" 
                                                            placeholder="Image URL" 
                                                            defaultValue={room.image_url} 
                                                            onBlur={(e) => handleUpdate(room.id, { image_url: e.target.value })} 
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        {room.image_url ? (
                                                            <img src={room.image_url} className="w-10 h-10 rounded shadow-sm object-cover border border-gray-200" alt="Room" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded shadow-sm bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">IMG</div>
                                                        )}
                                                        <span className={room.approver_email ? 'font-medium' : 'text-gray-400 italic'}>{room.approver_email || 'No email'}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-5 text-xs font-bold">
                                                <span className={room.is_active ? 'text-green-500' : 'text-red-400'}>{room.is_active ? '● Active' : '○ Inactive'}</span>
                                            </td>
                                            <td className="p-5">
                                                <button onClick={() => setEditingRoom(room)} className="text-[#db011c] font-bold hover:underline">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {rooms.length === 0 && !loading && (
                                        <tr><td colSpan={5} className="p-16 text-center text-gray-400 font-medium">No rooms found. Add your first room area.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
