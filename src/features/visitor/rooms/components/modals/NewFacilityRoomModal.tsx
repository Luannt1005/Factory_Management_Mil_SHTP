'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import type { FacilityRoomFormData, RoomCategory } from '@/types/rooms.types';

export interface NewFacilityRoomModalProps {
    open: boolean;
    formData: FacilityRoomFormData;
    categories: RoomCategory[];
    loading?: boolean;
    onChange: (field: keyof FacilityRoomFormData, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export function NewFacilityRoomModal({
    open,
    formData,
    categories,
    loading = false,
    onChange,
    onSubmit,
    onClose
}: NewFacilityRoomModalProps) {
    if (!open) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <h2 className="text-xl font-extrabold mb-6">Add New Room</h2>
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                value={formData.category}
                                onChange={e => onChange('category', e.target.value)}
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
                                value={formData.name}
                                onChange={e => onChange('name', e.target.value)}
                                placeholder="e.g. Share Function Office L6M"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                value={formData.description || ''}
                                onChange={e => onChange('description', e.target.value)}
                                placeholder="e.g. Floor 6, Building A"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Approver Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm font-medium"
                                value={formData.approver_email}
                                onChange={e => onChange('approver_email', e.target.value)}
                                placeholder="approver@ttigroup.com.vn"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 rounded-xl font-bold text-white bg-[#db011c] hover:bg-[#b90118] transition-colors shadow-md disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Room'}
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
