'use client';

import React, { useState, useMemo } from 'react';
import { ExcelColumnFilter } from '../ExcelColumnFilter';
import type { HostDepartment, HostDepartmentUpdateData } from '@/types/rooms.types';

export interface HostDepartmentsTabProps {
    hostDepartments: HostDepartment[];
    loading: boolean;
    editingHostDept: HostDepartment | null;
    onEdit: (dept: HostDepartment | null) => void;
    onUpdate: (id: string, updates: HostDepartmentUpdateData) => void;
    onDelete: (id: string) => void;
    onAdd?: () => void;
}

export function HostDepartmentsTab({
    hostDepartments,
    loading,
    editingHostDept,
    onEdit,
    onUpdate,
    onDelete,
    onAdd
}: HostDepartmentsTabProps) {
    const [filters, setFilters] = useState<{ [key: string]: string[] }>({
        bu: [],
        functional_dept: [],
        functional_host: [],
        department: [],
        department_host: [],
        is_active: []
    });

    const filteredHostDepartments = useMemo(() => {
        return hostDepartments.filter(h => {
            if (filters.bu.length > 0) {
                const val = h.bu || '(Blanks)';
                if (!filters.bu.includes(val)) return false;
            }
            if (filters.functional_dept.length > 0) {
                const val = h.functional_dept || '(Blanks)';
                if (!filters.functional_dept.includes(val)) return false;
            }
            if (filters.functional_host.length > 0) {
                const val = h.functional_host_name ? `${h.functional_host_name}${h.functional_host_email ? ` (${h.functional_host_email})` : ''}` : (h.functional_host_email || '(Blanks)');
                if (!filters.functional_host.includes(val) && !filters.functional_host.includes(h.functional_host_name) && !(h.functional_host_email && filters.functional_host.includes(h.functional_host_email))) return false;
            }
            if (filters.department.length > 0) {
                const val = h.department || '(Blanks)';
                if (!filters.department.includes(val)) return false;
            }
            if (filters.department_host.length > 0) {
                const val = h.department_host_name ? `${h.department_host_name}${h.department_host_email ? ` (${h.department_host_email})` : ''}` : (h.department_host_email || '(Blanks)');
                if (!filters.department_host.includes(val) && !filters.department_host.includes(h.department_host_name) && !(h.department_host_email && filters.department_host.includes(h.department_host_email))) return false;
            }
            if (filters.is_active.length > 0) {
                const val = h.is_active ? 'Active' : 'Inactive';
                if (!filters.is_active.includes(val)) return false;
            }
            return true;
        });
    }, [hostDepartments, filters]);

    return (
        <div className="animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-[#0f172a]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                <th className="p-4 w-[11%]">
                                    <ExcelColumnFilter
                                        title="BU"
                                        allValues={hostDepartments.map(h => h.bu)}
                                        selectedValues={filters.bu}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, bu: selected }))}
                                    />
                                </th>
                                <th className="p-4 w-[17%]">
                                    <ExcelColumnFilter
                                        title="Functional Dept"
                                        allValues={hostDepartments.map(h => h.functional_dept)}
                                        selectedValues={filters.functional_dept}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, functional_dept: selected }))}
                                    />
                                </th>
                                <th className="p-4 w-[20%]">
                                    <ExcelColumnFilter
                                        title="Func Host"
                                        allValues={hostDepartments.map(h => h.functional_host_name ? `${h.functional_host_name}${h.functional_host_email ? ` (${h.functional_host_email})` : ''}` : (h.functional_host_email || ''))}
                                        selectedValues={filters.functional_host}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, functional_host: selected }))}
                                    />
                                </th>
                                <th className="p-4 w-[17%]">
                                    <ExcelColumnFilter
                                        title="Department"
                                        allValues={hostDepartments.map(h => h.department)}
                                        selectedValues={filters.department}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, department: selected }))}
                                    />
                                </th>
                                <th className="p-4 w-[20%]">
                                    <ExcelColumnFilter
                                        title="Dept Host"
                                        allValues={hostDepartments.map(h => h.department_host_name ? `${h.department_host_name}${h.department_host_email ? ` (${h.department_host_email})` : ''}` : (h.department_host_email || ''))}
                                        selectedValues={filters.department_host}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, department_host: selected }))}
                                    />
                                </th>
                                <th className="p-4 text-center w-[8%]">
                                    <ExcelColumnFilter
                                        title="Status"
                                        allValues={hostDepartments.map(h => h.is_active ? 'Active' : 'Inactive')}
                                        selectedValues={filters.is_active}
                                        onFilterChange={(selected) => setFilters(prev => ({ ...prev, is_active: selected }))}
                                    />
                                </th>
                                <th className="p-4 text-right w-[7%]">
                                    <div className="flex items-center justify-end gap-2">
                                        <span>Action</span>
                                        {(filters.bu.length > 0 || filters.functional_dept.length > 0 || filters.functional_host.length > 0 || filters.department.length > 0 || filters.department_host.length > 0 || filters.is_active.length > 0) && (
                                            <button
                                                onClick={() => setFilters({ bu: [], functional_dept: [], functional_host: [], department: [], department_host: [], is_active: [] })}
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
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
                            ) : filteredHostDepartments.map((h) => (
                                <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    {editingHostDept && editingHostDept.id === h.id ? (
                                        <>
                                            <td className="p-2"><input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.bu || ''} onChange={e => onEdit({ ...editingHostDept, bu: e.target.value })} placeholder="BU" /></td>
                                            <td className="p-2"><input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.functional_dept} onChange={e => onEdit({ ...editingHostDept, functional_dept: e.target.value })} /></td>
                                            <td className="p-2">
                                                <input type="text" className="w-full p-1 border rounded text-xs mb-1" value={editingHostDept.functional_host_name} onChange={e => onEdit({ ...editingHostDept, functional_host_name: e.target.value })} placeholder="Name" />
                                                <input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.functional_host_email || ''} onChange={e => onEdit({ ...editingHostDept, functional_host_email: e.target.value })} placeholder="Email" />
                                            </td>
                                            <td className="p-2"><input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.department} onChange={e => onEdit({ ...editingHostDept, department: e.target.value })} /></td>
                                            <td className="p-2">
                                                <input type="text" className="w-full p-1 border rounded text-xs mb-1" value={editingHostDept.department_host_name} onChange={e => onEdit({ ...editingHostDept, department_host_name: e.target.value })} placeholder="Name" />
                                                <input type="text" className="w-full p-1 border rounded text-xs" value={editingHostDept.department_host_email || ''} onChange={e => onEdit({ ...editingHostDept, department_host_email: e.target.value })} placeholder="Email" />
                                            </td>
                                            <td className="p-2 text-center">
                                                <select className="p-1 border rounded text-xs" value={editingHostDept.is_active ? 'true' : 'false'} onChange={e => onEdit({ ...editingHostDept, is_active: e.target.value === 'true' })}>
                                                    <option value="true">Active</option><option value="false">Inactive</option>
                                                </select>
                                            </td>
                                            <td className="p-2 text-right">
                                                <button onClick={() => onUpdate(h.id, editingHostDept)} className="text-green-600 hover:text-green-800 font-bold mr-3 text-xs">Save</button>
                                                <button onClick={() => onEdit(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xs">Cancel</button>
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
                                                <button onClick={() => onEdit(h)} className="text-red-500 hover:text-[#b90118] font-bold text-xs mr-4 transition-colors">Edit</button>
                                                <button onClick={() => onDelete(h.id)} className="text-gray-400 hover:text-red-600 transition-colors"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {filteredHostDepartments.length === 0 && !loading && (
                                <tr><td colSpan={7} className="p-16 text-center text-gray-400 font-medium">No host departments found matching filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
