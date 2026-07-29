"use client";

import React, { useState, useEffect } from "react";
import { hashPassword } from "@/lib/password";
import { MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

interface AppRole {
    id: string;
    name: string;
    app_module: string;
}

interface UserAccount {
    id: string;
    username: string;
    full_name: string;
    role?: string;
    orgchart_role?: string;
    visitor_role?: string;
    app_role_ids?: string[];
    created_at?: string;
    employee_id?: string;
    email?: string;
    last_login?: string;
    sso_provider?: string;
    status?: string;
    department?: string;
    job_title?: string;
    location?: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [appRoles, setAppRoles] = useState<AppRole[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Active");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: "",
        full_name: "",
        password: "",
        role: "user",
        orgchart_role: "user",
        visitor_role: "user",
        app_role_ids: [] as string[],
        employee_id: "",
        email: "",
        department: "",
        job_title: "",
        location: "",
        status: "Active"
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = users.filter(user => {
            const matchesSearch = user.full_name.toLowerCase().includes(lowerSearch) || user.username.toLowerCase().includes(lowerSearch) || (user.employee_id && user.employee_id.toLowerCase().includes(lowerSearch));
            const matchesStatus = statusFilter === "All" || user.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
        filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        setFilteredUsers(filtered);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, users]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                fetch("/api/users"),
                fetch("/api/roles")
            ]);
            
            const usersData = await usersRes.json();
            const rolesData = await rolesRes.json();
            
            if (usersData.success) {
                setUsers(usersData.data);
                setFilteredUsers(usersData.data);
            } else {
                setError(usersData.message || "Cannot load accounts");
            }

            if (rolesData.success) {
                setAppRoles(rolesData.data);
            }
        } catch (err: any) {
            console.error(err);
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user: UserAccount) => {
        setModalMode("edit");
        setCurrentUserId(user.id);
        setFormData({
            username: user.username,
            full_name: user.full_name,
            password: "",
            role: user.role || "user",
            orgchart_role: user.orgchart_role || "user",
            visitor_role: user.visitor_role || "user",
            app_role_ids: user.app_role_ids || [],
            employee_id: user.employee_id || "",
            email: user.email || user.username,
            department: user.department || "",
            job_title: user.job_title || "",
            location: user.location || "",
            status: user.status || "Active"
        });
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (user: UserAccount) => {
        if (!confirm(`Are you sure you want to delete ${user.full_name}?`)) return;
        try {
            const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
            const result = await res.json();
            if (!result.success) throw new Error(result.message || "Delete failed");
            setUsers(users.filter(u => u.id !== user.id));
        } catch (err: any) {
            alert(err.message || "Delete failed");
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    const renderRoleChips = (user: UserAccount) => {
        const ids = user.app_role_ids || [];
        if (ids.length === 0) return <span className="text-gray-400">-</span>;
        
        return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
                {ids.map((id, i) => {
                    const role = appRoles.find(r => r.id.toString() === id.toString());
                    return (
                        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-[#b52427] border border-red-100 whitespace-nowrap">
                            {role ? role.name : `Role ${id}`}
                        </span>
                    );
                })}
            </div>
        );
    };

    const toggleAppRole = (roleId: string) => {
        setFormData(prev => {
            const ids = prev.app_role_ids || [];
            if (ids.includes(roleId)) {
                return { ...prev, app_role_ids: ids.filter(id => id !== roleId) };
            }
            return { ...prev, app_role_ids: [...ids, roleId] };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError("");

        try {
            if (modalMode === "add") {
                if (formData.password.length < 6) {
                    setError("Password must be at least 6 chars");
                    setIsSaving(false);
                    return;
                }

                const hashedPassword = await hashPassword(formData.password);

                const res = await fetch("/api/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: formData.username,
                        full_name: formData.full_name,
                        password: hashedPassword,
                        role: formData.role,
                        orgchart_role: formData.orgchart_role,
                        visitor_role: formData.visitor_role,
                        app_role_ids: formData.app_role_ids,
                        employee_id: formData.employee_id,
                        email: formData.email,
                        department: formData.department,
                        job_title: formData.job_title,
                        location: formData.location,
                        status: formData.status
                    })
                });

                const result = await res.json();
                if (!result.success) throw new Error(result.message || "Failed to add user");
                setUsers(prev => [...prev, result.data].sort((a, b) => a.full_name.localeCompare(b.full_name)));

            } else if (modalMode === "edit" && currentUserId) {
                const updateData: any = {
                    id: currentUserId,
                    full_name: formData.full_name,
                    role: formData.role,
                    orgchart_role: formData.orgchart_role,
                    visitor_role: formData.visitor_role,
                    app_role_ids: formData.app_role_ids,
                    employee_id: formData.employee_id,
                    email: formData.email,
                    department: formData.department,
                    job_title: formData.job_title,
                    location: formData.location,
                    status: formData.status
                };

                if (formData.password.trim() !== "") {
                    if (formData.password.length < 6) {
                        setError("New password must be at least 6 chars");
                        setIsSaving(false);
                        return;
                    }
                    updateData.password = await hashPassword(formData.password);
                }

                const res = await fetch("/api/users", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updateData)
                });

                const result = await res.json();
                if (!result.success) throw new Error(result.message || "Failed to update user");

                setUsers(users.map(u => u.id === currentUserId ? { ...u, ...updateData } : u));
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
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-64">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Name, email, or employee ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Status</span>
                        <select className="text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white focus:outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="All">All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setModalMode("add");
                            setFormData({
                                username: "",
                                full_name: "",
                                password: "",
                                role: "user",
                                orgchart_role: "user",
                                visitor_role: "user",
                                app_role_ids: [],
                                employee_id: "",
                                email: "",
                                department: "",
                                job_title: "",
                                location: "",
                                status: "Active"
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 bg-[#b52427] hover:bg-[#9a1e21] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                        New Account
                    </button>
                    <div className="text-xs text-gray-500 font-medium">
                        {filteredUsers.length} total
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-[#fcf5f5] sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">User</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Email</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Assigned Roles</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Title</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Department</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Location</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Credential</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Password</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Status</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Created</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Last Login</th>
                            <th className="py-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={11} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                        ) : paginatedUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="py-2.5 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#b52427] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                            {user.full_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-gray-800">{user.full_name}</span>
                                            {user.employee_id && <span className="text-[10px] text-gray-500">{user.employee_id}</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-2.5 px-4 text-xs text-gray-600">{user.email || user.username}</td>
                                <td className="py-2.5 px-4">{renderRoleChips(user)}</td>
                                <td className="py-2.5 px-4 text-xs text-gray-600">{user.job_title || '-'}</td>
                                <td className="py-2.5 px-4 text-xs text-gray-600">{user.department || '-'}</td>
                                <td className="py-2.5 px-4 text-xs text-gray-600">{user.location || '-'}</td>
                                <td className="py-2.5 px-4">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Active
                                    </span>
                                </td>
                                <td className="py-2.5 px-4">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Changed
                                    </span>
                                </td>
                                <td className="py-2.5 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.status === 'Inactive' ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Inactive' ? 'bg-gray-400' : 'bg-green-500'}`}></span>
                                        {user.status || 'Active'}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 text-[11px] text-gray-500 font-medium">{formatDate(user.created_at)}</td>
                                <td className="py-2.5 px-4 text-[11px] text-gray-500 font-medium">{formatDate(user.last_login)}</td>
                                <td className="py-2.5 px-4 text-right">
                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(user)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteUser(user)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination placeholder matching image */}
            <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rows per page</span>
                    <select 
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                        value={itemsPerPage}
                        onChange={e => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex items-center gap-1">
                        <button 
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >&lt;</button>
                        <button 
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >&gt;</button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-200 flex flex-col my-8 max-h-full">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalMode === 'add' ? 'New Account' : 'Edit Account'}
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

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Full Name</label>
                                        <input type="text" required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Username</label>
                                        <input type="text" required={modalMode === 'add'} disabled={modalMode === 'edit'} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Employee ID</label>
                                        <input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Email</label>
                                        <input type="email" required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Department</label>
                                        <input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Job Title / Function</label>
                                        <input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.job_title} onChange={e => setFormData({ ...formData, job_title: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Status</label>
                                        <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Password</label>
                                        <input type="password" required={modalMode === 'add'} placeholder={modalMode === 'edit' ? "Leave blank to keep current" : ""} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                                    <label className="text-xs font-semibold text-gray-700 block mb-2">Assigned Roles</label>
                                    {appRoles.length === 0 ? (
                                        <div className="text-xs text-gray-400 italic">No custom roles defined. Please create them in Role Management.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            {appRoles.map(role => (
                                                <label key={role.id} className="flex items-center gap-2.5 cursor-pointer group">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 text-[#b52427] rounded border-gray-300 focus:ring-[#b52427] cursor-pointer"
                                                        checked={formData.app_role_ids.includes(role.id.toString())}
                                                        onChange={() => toggleAppRole(role.id.toString())}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-700 group-hover:text-[#b52427] transition-colors">{role.name}</span>
                                                        <span className="text-[10px] text-gray-500">{role.app_module}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-[#b52427] hover:bg-[#9a1e21] rounded-lg transition-colors disabled:opacity-50 min-w-[100px]">{isSaving ? 'Saving...' : 'Save Account'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
