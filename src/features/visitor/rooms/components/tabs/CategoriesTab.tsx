'use client';

import React, { useState, useMemo } from 'react';
import { ExcelColumnFilter } from '../ExcelColumnFilter';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { RoomCategory, RoomCategoryUpdateData } from '@/types/rooms.types';

export interface CategoriesTabProps {
    categories: RoomCategory[];
    loading: boolean;
    editingCategory: RoomCategory | null;
    onEdit: (category: RoomCategory | null) => void;
    onUpdate: (id: string, updates: RoomCategoryUpdateData) => void;
    onDelete: (id: string) => void;
    onAdd?: () => void;
}

export function CategoriesTab({
    categories,
    loading,
    editingCategory,
    onEdit,
    onUpdate,
    onDelete,
    onAdd
}: CategoriesTabProps) {
    const [filters, setFilters] = useState<{ [key: string]: string[] }>({
        name: [],
        site_location: [],
        bu: []
    });

    const filteredCategories = useMemo(() => {
        return categories.filter(cat => {
            if (filters.name.length > 0) {
                const val = cat.name || '(Blanks)';
                if (!filters.name.includes(val)) return false;
            }
            if (filters.site_location.length > 0) {
                const val = cat.site_location || '(Blanks)';
                if (!filters.site_location.includes(val)) return false;
            }
            if (filters.bu.length > 0) {
                const val = cat.bu || '(Blanks)';
                if (!filters.bu.includes(val)) return false;
            }
            return true;
        });
    }, [categories, filters]);

    return (
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
                                        selectedValues={filters.name}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, name: selected }))}
                                    />
                                </th>
                                <th className="p-4 text-center w-[25%]">
                                    <ExcelColumnFilter
                                        title="Site Location"
                                        allValues={categories.map(c => c.site_location)}
                                        selectedValues={filters.site_location}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, site_location: selected }))}
                                    />
                                </th>
                                <th className="p-4 text-center w-[20%]">
                                    <ExcelColumnFilter
                                        title="BU"
                                        allValues={categories.map(c => c.bu)}
                                        selectedValues={filters.bu}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, bu: selected }))}
                                    />
                                </th>
                                <th className="p-4 text-right w-[10%]">
                                    <div className="flex items-center justify-end gap-2">
                                        <span>Action</span>
                                        {(filters.name.length > 0 || filters.site_location.length > 0 || filters.bu.length > 0) && (
                                            <button
                                                onClick={() => setFilters({ name: [], site_location: [], bu: [] })}
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
                                <TableSkeleton rows={4} columns={4} />
                            ) : filteredCategories.map((cat) => (
                                <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    {editingCategory && editingCategory.id === cat.id ? (
                                        <>
                                            <td className="p-4">
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                    value={editingCategory.name}
                                                    onChange={e => onEdit({ ...editingCategory, name: e.target.value })}
                                                />
                                            </td>
                                            <td className="p-4 text-center">
                                                <select
                                                    className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                    value={editingCategory.site_location}
                                                    onChange={e => onEdit({ ...editingCategory, site_location: e.target.value })}
                                                >
                                                    <option value="SHTP">SHTP</option>
                                                    <option value="DDK">DDK</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-center">
                                                <select
                                                    className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                                                    value={editingCategory.bu}
                                                    onChange={e => onEdit({ ...editingCategory, bu: e.target.value })}
                                                >
                                                    <option value="Milwaukee">Milwaukee</option>
                                                    <option value="Share Function">Share Function</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => onUpdate(cat.id, editingCategory)} className="text-white bg-green-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600">Save</button>
                                                    <button onClick={() => onEdit(null)} className="text-gray-500 bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300">Cancel</button>
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
                                                    <button onClick={() => onEdit(cat)} className="text-[#db011c] font-bold hover:underline text-xs">Edit</button>
                                                    <button onClick={() => onDelete(cat.id)} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {filteredCategories.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="py-12">
                                        <EmptyState
                                            title="No categories found"
                                            description="No room categories match the current filter."
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
