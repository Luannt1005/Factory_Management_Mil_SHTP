"use client";

import { useState, useEffect } from "react";
import { hashPassword } from "@/lib/password";
import { MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

interface UserAccount {
    id: string;
    username: string;
    full_name: string;
    role: string;
    orgchart_role: string;
    visitor_role: string;
    created_at?: string;
    employee_id?: string;
    email?: string;
    last_login?: string;
    sso_provider?: string;
    status?: string;
    department?: string;
    job_title?: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
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
        employee_id: "",
        email: "",
        department: "",
        job_title: "",
        status: "Active"
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = users.filter(user => {
            const matchesSearch = user.full_name.toLowerCase().includes(lowerSearch) || user.username.toLowerCase().includes(lowerSearch) || (user.employee_id && user.employee_id.toLowerCase().includes(lowerSearch));
            const matchesRole = roleFilter === "All" || [user.role, user.orgchart_role, user.visitor_role].includes(roleFilter.toLowerCase());
            const matchesStatus = statusFilter === "All" || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
        filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        setFilteredUsers(filtered);
        setCurrentPage(1);
    }, [searchTerm, roleFilter, statusFilter, users]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            const result = await res.json();
            if (result.success) {
                setUsers(result.data);
                setFilteredUsers(result.data);
            } else {
                setError(result.message || "Cannot load accounts");
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
            employee_id: user.employee_id || "",
            email: user.email || user.username,
            department: user.department || "",
            job_title: user.job_title || "",
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
        const roles = [];
        if (user.role === 'admin') roles.push({ code: 'AD', bg: 'bg-red-100 text-red-700' });
        else if (user.role === 'user') roles.push({ code: 'US', bg: 'bg-gray-100 text-gray-700' });
        
        if (user.orgchart_role === 'admin') roles.push({ code: 'OA', bg: 'bg-red-100 text-red-700' });
        else if (user.orgchart_role === 'viewer') roles.push({ code: 'OV', bg: 'bg-blue-100 text-blue-700' });
        
        if (user.visitor_role === 'admin') roles.push({ code: 'VA', bg: 'bg-red-100 text-red-700' });
        
        if (roles.length === 0) return <span className="text-gray-400">-</span>;
        return (
            <div className="flex gap-1">
                {roles.map((r, i) => (
                    <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.bg}`}>
                        {r.code}
                    </span>
                ))}
            </div>
        );
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
                        employee_id: formData.employee_id,
                        email: formData.email,
                        department: formData.department,
                        job_title: formData.job_title,
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
                    employee_id: formData.employee_id,
                    email: formData.email,
                    department: formData.department,
                    job_title: formData.job_title,
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
                        <span className="text-xs font-semibold text-gray-500">Role</span>
                        <select className="text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white focus:outline-none" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="All">All</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                            <option value="viewer">Viewer</option>
                        </select>
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
                                employee_id: "",
                                email: "",
                                department: "",
                                job_title: "",
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
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Roles</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Function</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">Department</th>
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
                            <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalMode === 'add' ? 'New Account' : 'Edit Account'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-4">
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
                                    <input type="email" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
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

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Global Role</label>
                                    <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="user">User</option>
                                        <option value="admin">Global Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Orgchart Role</label>
                                    <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.orgchart_role} onChange={e => setFormData({ ...formData, orgchart_role: e.target.value })}>
                                        <option value="user">User</option>
                                        <option value="viewer">Viewer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Visitor Role</label>
                                    <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500" value={formData.visitor_role} onChange={e => setFormData({ ...formData, visitor_role: e.target.value })}>
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-[#b52427] hover:bg-[#9a1e21] rounded-lg transition-colors disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Account'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
