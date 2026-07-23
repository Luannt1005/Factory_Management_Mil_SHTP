"use client";

import React, { useState, useEffect } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

interface AppRole {
    id: string;
    name: string;
    app_module: string;
    description: string;
    permissions: string[];
    created_at?: string;
}

const PERMISSION_MATRIX = [
    {
        module: "System Administration",
        pages: [
            { key: "/systemadmin", label: "System Admin Page" }
        ]
    },
    {
        module: "OrgChart",
        pages: [
            { key: "/dashboard", label: "General Dashboard" },
            { key: "/orgchart", label: "OrgChart Editor" },
            { key: "/headcount_open", label: "Headcount Open" },
            { key: "/import_hr_data", label: "Import HR Data" },
            { key: "/sheetmanager", label: "Sheet Manager" }
        ]
    },
    {
        module: "Visitor Management",
        pages: [
            { key: "/visitordashboard", label: "Visitor Dashboard" },
            { key: "/visitorrequest", label: "Visitor Requests" },
            { key: "/visitoradmin", label: "Visitor Admin" },
            { key: "/visitoranalytics", label: "Visitor Analytics" }
        ]
    }
];

export default function RoleManagement() {
    const [roles, setRoles] = useState<AppRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [currentRoleId, setCurrentRoleId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        app_module: "Global",
        description: "",
        permissions: [] as string[]
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/roles");
            const result = await res.json();
            if (result.success) {
                setRoles(result.data);
            } else {
                setError(result.message || "Failed to load roles");
            }
        } catch (err: any) {
            console.error(err);
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (role: AppRole) => {
        setModalMode("edit");
        setCurrentRoleId(role.id);
        setFormData({
            name: role.name,
            app_module: role.app_module,
            description: role.description || "",
            permissions: role.permissions || []
        });
        setIsModalOpen(true);
    };

    const handleDeleteRole = async (role: AppRole) => {
        if (!confirm(`Are you sure you want to delete the role ${role.name}?`)) return;
        try {
            const res = await fetch(`/api/roles?id=${role.id}`, { method: "DELETE" });
            const result = await res.json();
            if (!result.success) throw new Error(result.message || "Delete failed");
            setRoles(roles.filter(r => r.id !== role.id));
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const togglePermission = (perm: string) => {
        setFormData(prev => {
            if (prev.permissions.includes(perm)) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== perm) };
            }
            return { ...prev, permissions: [...prev.permissions, perm] };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError("");

        try {
            const endpoint = "/api/roles";
            const method = modalMode === "add" ? "POST" : "PUT";
            const body = modalMode === "add" 
                ? { ...formData }
                : { id: currentRoleId, ...formData };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const result = await res.json();
            if (!result.success) throw new Error(result.message || "Failed to save role");

            if (modalMode === "add") {
                setRoles(prev => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)));
            } else {
                setRoles(roles.map(r => r.id === currentRoleId ? { ...r, ...formData } : r));
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-800">Role Management</div>
                <button
                    onClick={() => {
                        setModalMode("add");
                        setFormData({ name: "", app_module: "Global", description: "", permissions: [] });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-[#b52427] hover:bg-[#9a1e21] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    New Role
                </button>
            </div>

            <div className="flex-1 overflow-auto bg-white">
                {loading ? (
                    <div className="text-sm text-gray-500 text-center py-10">Loading roles...</div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-[#fcf5f5] sticky top-0 z-10">
                            <tr>
                                <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Role Name</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Module</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Description</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Allowed Pages</th>
                                <th className="py-3 px-4 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {roles.map(role => (
                                <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-gray-900 text-sm">{role.name}</td>
                                    <td className="py-3 px-4">
                                        <span className="text-xs font-medium text-[#b52427] bg-[#fcf5f5] px-2 py-0.5 rounded-full inline-block">
                                            {role.app_module}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate" title={role.description}>{role.description || '-'}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-wrap gap-1 max-w-sm">
                                            {(role.permissions || []).length > 0 ? (
                                                <>
                                                    {role.permissions.slice(0, 3).map((p, i) => (
                                                        <span key={i} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                                            {p}
                                                        </span>
                                                    ))}
                                                    {role.permissions.length > 3 && (
                                                        <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200" title={role.permissions.slice(3).join(', ')}>
                                                            +{role.permissions.length - 3} more
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic">No access</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => handleEditClick(role)} className="p-1.5 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors" title="Edit Role">
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteRole(role)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-md transition-colors" title="Delete Role">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {roles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-sm text-gray-500 bg-gray-50">
                                        No roles defined. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 animate-in fade-in zoom-in-95 duration-200 border border-gray-200 flex flex-col max-h-full">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalMode === 'add' ? 'New Role' : 'Edit Role'}
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto flex-1">
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4 mb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700">Role Name</label>
                                            <input type="text" required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Visitor Admin" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700">App Module</label>
                                            <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.app_module} onChange={e => setFormData({ ...formData, app_module: e.target.value })}>
                                                <option value="Global">Global</option>
                                                <option value="Orgchart">OrgChart</option>
                                                <option value="Visitor">Visitor</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Description</label>
                                        <textarea className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="What can this role do?"></textarea>
                                    </div>

                                    <div className="space-y-2 mt-6">
                                        <label className="text-xs font-semibold text-gray-700 block mb-2">Page Access Permission</label>
                                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="py-2.5 px-4 font-semibold text-gray-700">Module / Page</th>
                                                        <th className="py-2.5 px-4 font-semibold text-gray-700 w-24 text-center">Access</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {PERMISSION_MATRIX.map(module => (
                                                        <React.Fragment key={module.module}>
                                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                                <td colSpan={2} className="py-2 px-4 font-bold text-[#b52427]">{module.module}</td>
                                                            </tr>
                                                            {module.pages.map(page => (
                                                                <tr key={page.key} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="py-2.5 px-4 pl-8 text-gray-700 font-medium flex items-center gap-2">
                                                                        {page.label}
                                                                        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                                                                            {page.key}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-center">
                                                                        <input type="checkbox" 
                                                                            className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                                                                            checked={formData.permissions.includes(page.key)}
                                                                            onChange={() => togglePermission(page.key)}
                                                                            title={`Allow access to ${page.label}`}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-[#b52427] hover:bg-[#9a1e21] rounded-lg transition-colors disabled:opacity-50 min-w-[100px]">{isSaving ? 'Saving...' : 'Save Role'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
