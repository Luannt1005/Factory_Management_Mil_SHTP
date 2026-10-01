"use client";

import React from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SystemAdminRole } from "@/types/system-admin.types";

export interface RoleManagementTableProps {
    roles: SystemAdminRole[];
    loading: boolean;
    onAddClick: () => void;
    onEditClick: (role: SystemAdminRole) => void;
    onDeleteClick: (role: SystemAdminRole) => void;
}

export function RoleManagementTable({
    roles,
    loading,
    onAddClick,
    onEditClick,
    onDeleteClick
}: RoleManagementTableProps) {
    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-800">Role Management</div>
                <Button
                    size="sm"
                    variant="primary"
                    icon={<PlusIcon className="w-4 h-4" />}
                    onClick={onAddClick}
                >
                    New Role
                </Button>
            </div>

            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#fcf5f5] sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">
                                Role Name
                            </th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">
                                Module
                            </th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">
                                Description
                            </th>
                            <th className="py-3 px-4 text-[10px] font-bold text-[#b52427] uppercase tracking-wider">
                                Allowed Pages
                            </th>
                            <th className="py-3 px-4 w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <TableSkeleton rows={4} columns={5} />
                        ) : roles.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="py-8 bg-gray-50/50"
                                >
                                    <EmptyState
                                        title="No roles defined"
                                        description="Create an application role to get started."
                                    />
                                </td>
                            </tr>
                        ) : (
                            roles.map((role) => (
                                <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-bold text-gray-900 text-sm">
                                        {role.name}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Badge
                                            size="sm"
                                            variant="danger"
                                            className="bg-[#fcf5f5] text-[#b52427] border-red-100 font-semibold"
                                        >
                                            {role.app_module}
                                        </Badge>
                                    </td>
                                    <td
                                        className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate"
                                        title={role.description}
                                    >
                                        {role.description || "-"}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-wrap gap-1 max-w-sm">
                                            {(role.permissions || []).length > 0 ? (
                                                <>
                                                    {role.permissions.slice(0, 3).map((p, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200"
                                                        >
                                                            {p}
                                                        </span>
                                                    ))}
                                                    {role.permissions.length > 3 && (
                                                        <span
                                                            className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200"
                                                            title={role.permissions.slice(3).join(", ")}
                                                        >
                                                            +{role.permissions.length - 3} more
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic">
                                                    No access
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-1 justify-end">
                                            <button
                                                type="button"
                                                onClick={() => onEditClick(role)}
                                                className="p-1.5 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                                title="Edit Role"
                                                aria-label="Edit Role"
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteClick(role)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                                title="Delete Role"
                                                aria-label="Delete Role"
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
        </div>
    );
}

export default RoleManagementTable;
