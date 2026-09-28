'use client';

import React, { useState, useMemo } from 'react';
import { ExcelColumnFilter } from '../ExcelColumnFilter';
import type { MeetingRoom, MeetingRoomUpdateData } from '@/types/rooms.types';

export interface MeetingRoomsTabProps {
    meetingRooms: MeetingRoom[];
    loading: boolean;
    editingMeetingRoom: MeetingRoom | null;
    onEdit: (room: MeetingRoom | null) => void;
    onUpdate: (id: string, updates: MeetingRoomUpdateData) => void;
    onDelete: (id: string) => void;
    onAdd?: () => void;
}

export function MeetingRoomsTab({
    meetingRooms,
    loading,
    editingMeetingRoom,
    onEdit,
    onUpdate,
    onDelete,
    onAdd
}: MeetingRoomsTabProps) {
    const [filters, setFilters] = useState<{ [key: string]: string[] }>({
        floorName: [],
        roomName: []
    });

    const filteredMeetingRooms = useMemo(() => {
        return meetingRooms.filter(room => {
            if (filters.floorName.length > 0) {
                const val = room.floorName || '(Blanks)';
                if (!filters.floorName.includes(val)) return false;
            }
            if (filters.roomName.length > 0) {
                const val = room.roomName || '(Blanks)';
                if (!filters.roomName.includes(val)) return false;
            }
            return true;
        });
    }, [meetingRooms, filters]);

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                    <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <th className="py-3.5 px-6 w-[45%]">
                                <ExcelColumnFilter
                                    title="Floor Name"
                                    allValues={meetingRooms.map(r => r.floorName)}
                                    selectedValues={filters.floorName}
                                    onFilterChange={(selected) => setFilters(prev => ({ ...prev, floorName: selected }))}
                                />
                            </th>
                            <th className="py-3.5 px-6 w-[40%]">
                                <ExcelColumnFilter
                                    title="Room Name"
                                    allValues={meetingRooms.map(r => r.roomName)}
                                    selectedValues={filters.roomName}
                                    onFilterChange={(selected) => setFilters(prev => ({ ...prev, roomName: selected }))}
                                />
                            </th>
                            <th className="py-3.5 px-6 text-right w-[15%]">
                                <div className="flex items-center justify-end gap-2">
                                    <span className="font-bold text-gray-700 text-xs uppercase tracking-wider">Actions</span>
                                    {(filters.floorName.length > 0 || filters.roomName.length > 0) && (
                                        <button
                                            onClick={() => setFilters({ floorName: [], roomName: [] })}
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
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-gray-500">Loading meeting rooms...</td>
                            </tr>
                        ) : filteredMeetingRooms.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-gray-500">No meeting rooms found matching filter.</td>
                            </tr>
                        ) : (
                            filteredMeetingRooms.map((room) => (
                                <tr key={room.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="py-4 px-6 truncate">
                                        {editingMeetingRoom && editingMeetingRoom.id === room.id ? (
                                            <input
                                                type="text"
                                                className="w-full border rounded px-2 py-1"
                                                value={editingMeetingRoom.floorName}
                                                onChange={e => onEdit({ ...editingMeetingRoom, floorName: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-semibold text-gray-900">{room.floorName}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 truncate">
                                        {editingMeetingRoom && editingMeetingRoom.id === room.id ? (
                                            <input
                                                type="text"
                                                className="w-full border rounded px-2 py-1"
                                                value={editingMeetingRoom.roomName}
                                                onChange={e => onEdit({ ...editingMeetingRoom, roomName: e.target.value })}
                                            />
                                        ) : (
                                            <span className="text-gray-600">{room.roomName}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {editingMeetingRoom && editingMeetingRoom.id === room.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => onUpdate(room.id, { floorName: editingMeetingRoom.floorName, roomName: editingMeetingRoom.roomName })}
                                                    className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 p-1.5 rounded"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => onEdit(null)}
                                                    className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1.5 rounded"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onEdit(room)}
                                                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => onDelete(room.id)}
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
    );
}
