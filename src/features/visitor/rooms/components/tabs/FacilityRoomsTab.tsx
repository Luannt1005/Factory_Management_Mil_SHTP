'use client';

import React, { useState, useMemo } from 'react';
import { ExcelColumnFilter } from '../ExcelColumnFilter';
import type { FacilityRoom, FacilityRoomUpdateData, RoomCategory } from '@/types/rooms.types';

export interface FacilityRoomsTabProps {
    rooms: FacilityRoom[];
    categories: RoomCategory[];
    loading: boolean;
    editingRoom: FacilityRoom | null;
    onEdit: (room: FacilityRoom | null) => void;
    onUpdate: (id: string, updates: FacilityRoomUpdateData) => void;
    onDelete: (id: string) => void;
    onAdd?: () => void;
}

export function FacilityRoomsTab({
    rooms,
    categories,
    loading,
    editingRoom,
    onEdit,
    onUpdate,
    onDelete,
    onAdd
}: FacilityRoomsTabProps) {
    const [filters, setFilters] = useState<{ [key: string]: string[] }>({
        category: [],
        name: [],
        description: [],
        approver_email: [],
        is_active: []
    });

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            if (filters.category.length > 0) {
                const val = room.category || '(Blanks)';
                if (!filters.category.includes(val)) return false;
            }
            if (filters.name.length > 0) {
                const val = room.name || '(Blanks)';
                if (!filters.name.includes(val)) return false;
            }
            if (filters.description.length > 0) {
                const val = room.description || '(Blanks)';
                if (!filters.description.includes(val)) return false;
            }
            if (filters.approver_email.length > 0) {
                const val = room.approver_email || '(Blanks)';
                if (!filters.approver_email.includes(val)) return false;
            }
            if (filters.is_active.length > 0) {
                const val = room.is_active ? 'Active' : 'Inactive';
                if (!filters.is_active.includes(val)) return false;
            }
            return true;
        });
    }, [rooms, filters]);

    return (
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
                                        selectedValues={filters.category}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, category: selected }))}
                                    />
                                </th>
                                <th className="p-4 w-[22%]">
                                    <ExcelColumnFilter
                                        title="Room Name"
                                        allValues={rooms.map(r => r.name)}
                                        selectedValues={filters.name}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, name: selected }))}
                                    />
                                </th>
                                <th className="p-4 w-[22%]">
                                    <ExcelColumnFilter
                                        title="Description"
                                        allValues={rooms.map(r => r.description)}
                                        selectedValues={filters.description}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, description: selected }))}
                                    />
                                </th>
                                <th className="p-4 w-[20%]">
                                    <ExcelColumnFilter
                                        title="Approver Email"
                                        allValues={rooms.map(r => r.approver_email)}
                                        selectedValues={filters.approver_email}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, approver_email: selected }))}
                                    />
                                </th>
                                <th className="p-4 text-center w-[10%]">
                                    <ExcelColumnFilter
                                        title="Status"
                                        allValues={rooms.map(r => r.is_active ? 'Active' : 'Inactive')}
                                        selectedValues={filters.is_active}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, is_active: selected }))}
                                    />
                                </th>
                                <th className="p-4 text-right w-[8%]">
                                    <div className="flex items-center justify-end gap-2">
                                        <span>Action</span>
                                        {(filters.category.length > 0 || filters.name.length > 0 || filters.description.length > 0 || filters.approver_email.length > 0 || filters.is_active.length > 0) && (
                                            <button
                                                onClick={() => setFilters({ category: [], name: [], description: [], approver_email: [], is_active: [] })}
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
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading rooms...</td></tr>
                            ) : filteredRooms.map((room) => (
                                <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    {editingRoom && editingRoom.id === room.id ? (
                                        <>
                                            <td className="p-4">
                                                <select
                                                    className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                    value={editingRoom.category}
                                                    onChange={e => onEdit({ ...editingRoom, category: e.target.value })}
                                                >
                                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                    value={editingRoom.name}
                                                    onChange={e => onEdit({ ...editingRoom, name: e.target.value })}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                    value={editingRoom.description || ''}
                                                    onChange={e => onEdit({ ...editingRoom, description: e.target.value })}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="email"
                                                    className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                    value={editingRoom.approver_email || ''}
                                                    onChange={e => onEdit({ ...editingRoom, approver_email: e.target.value })}
                                                />
                                            </td>
                                            <td className="p-4 text-center">
                                                <select
                                                    className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                    value={editingRoom.is_active ? 'true' : 'false'}
                                                    onChange={e => onEdit({ ...editingRoom, is_active: e.target.value === 'true' })}
                                                >
                                                    <option value="true">Active</option>
                                                    <option value="false">Inactive</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => onUpdate(room.id, editingRoom)} className="text-white bg-green-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600">Save</button>
                                                    <button onClick={() => onEdit(null)} className="text-gray-500 bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300">Cancel</button>
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
                                                    <button onClick={() => onEdit(room)} className="text-[#db011c] font-bold hover:underline text-xs">Edit</button>
                                                    <button onClick={() => onDelete(room.id)} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {filteredRooms.length === 0 && !loading && (
                                <tr><td colSpan={6} className="p-16 text-center text-gray-400 font-medium">No rooms found matching filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
