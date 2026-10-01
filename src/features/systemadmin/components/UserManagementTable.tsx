"use client";

import React, { useState, useEffect } from "react";
import {
    MagnifyingGlassIcon,
    PencilSquareIcon,
    TrashIcon,
    PlusIcon
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateShort } from "@/utils/date";
import type { UserAccount, AppRole } from "@/types/user.types";

export interface UserManagementTableProps {
    users: UserAccount[];
    appRoles: AppRole[];
    loading: boolean;
    onAddClick: () => void;
    onEditClick: (user: UserAccount) => void;
    onDeleteClick: (user: UserAccount) => void;
}

export function UserManagementTable({
    users,
    appRoles,
    loading,
    onAddClick,
    onEditClick,
    onDeleteClick
}: UserManagementTableProps) {
    const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Active");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = users.filter(user => {
            const matchesSearch =
                user.full_name.toLowerCase().includes(lowerSearch) ||
                user.username.toLowerCase().includes(lowerSearch) ||
                (user.employee_id && user.employee_id.toLowerCase().includes(lowerSearch));
            const matchesStatus = statusFilter === "All" || user.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
        filtered.sort(
            (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
        setFilteredUsers(filtered);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, users]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const formatDate = (dateStr?: string) => formatDateShort(dateStr, "-");

    const getBU = (fullname: string) => {
        if (!fullname) return "Mil";
        const hasParentheses = fullname.includes("(") && fullname.includes(")");
        if (fullname.includes("VN.MIL") || !hasParentheses) {
            return "Mil";
        }
        return "SF";
    };

    const renderRoleChips = (user: UserAccount) => {
        const ids = user.app_role_ids || [];
        if (ids.length === 0) return <span className="text-gray-400">-</span>;

        return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
                {ids.map((id, i) => {
                    const role = appRoles.find(r => r.id.toString() === id.toString());
                    return (
                        <Badge
                            key={i}
                            size="sm"
                            variant="danger"
                            className="bg-red-50 text-[#b52427] border-red-100 font-bold"
                        >
                            {role ? role.name : `Role ${id}`}
                        </Badge>
                    );
                })}
            </div>
        );
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
                            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#db011c] focus:border-[#db011c]"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Status</span>
                        <select
                            className="text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#db011c]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<PlusIcon className="w-4 h-4" />}
                        onClick={onAddClick}
                    >
                        New Account
                    </Button>
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
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">BU</th>
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
                            <TableSkeleton rows={6} columns={13} />
                        ) : paginatedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={13} className="py-8">
                                    <EmptyState
                                        title="No accounts found"
                                        description="No user accounts match the current search or filters."
                                    />
                                </td>
                            </tr>
                        ) : (
                            paginatedUsers.map((user) => (
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
                                    <td className="py-2.5 px-4 text-xs font-bold text-gray-700">
                                        <span className="px-2 py-1 rounded bg-gray-100">
                                            {getBU(user.full_name)}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-xs text-gray-600">{user.email || user.username}</td>
                                    <td className="py-2.5 px-4">{renderRoleChips(user)}</td>
                                    <td className="py-2.5 px-4 text-xs text-gray-600">{user.job_title || "-"}</td>
                                    <td className="py-2.5 px-4 text-xs text-gray-600">{user.department || "-"}</td>
                                    <td className="py-2.5 px-4 text-xs text-gray-600">{user.location || "-"}</td>
                                    <td className="py-2.5 px-4">
                                        <Badge variant="success" size="sm">
                                            Active
                                        </Badge>
                                    </td>
                                    <td className="py-2.5 px-4">
                                        <Badge variant="success" size="sm">
                                            Changed
                                        </Badge>
                                    </td>
                                    <td className="py-2.5 px-4">
                                        <Badge
                                            variant={user.status === "Inactive" ? "default" : "success"}
                                            size="sm"
                                        >
                                            {user.status || "Active"}
                                        </Badge>
                                    </td>
                                    <td className="py-2.5 px-4 text-[11px] text-gray-500 font-medium">{formatDate(user.created_at)}</td>
                                    <td className="py-2.5 px-4 text-[11px] text-gray-500 font-medium">{formatDate(user.last_login)}</td>
                                    <td className="py-2.5 px-4 text-right">
                                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => onEditClick(user)}
                                                className="p-1 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                                                title="Edit User"
                                                aria-label="Edit User"
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteClick(user)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                                title="Delete User"
                                                aria-label="Delete User"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rows per page</span>
                    <select
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                        value={itemsPerPage}
                        onChange={(e) => {
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
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                        >
                            &lt;
                        </button>
                        <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserManagementTable;
