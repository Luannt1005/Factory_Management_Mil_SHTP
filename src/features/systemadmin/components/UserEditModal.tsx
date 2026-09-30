"use client";

import React, { useState, useEffect } from "react";
import type { UserAccount, AppRole } from "@/types/user.types";

export interface UserFormData {
    username: string;
    full_name: string;
    password?: string;
    role: string;
    orgchart_role: string;
    visitor_role: string;
    app_role_ids: string[];
    employee_id: string;
    email: string;
    department: string;
    job_title: string;
    location: string;
    status: string;
}

export interface UserEditModalProps {
    isOpen: boolean;
    mode: "add" | "edit";
    user: UserAccount | null;
    appRoles: AppRole[];
    isSaving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (formData: UserFormData) => void;
}

export function UserEditModal({
    isOpen,
    mode,
    user,
    appRoles,
    isSaving,
    error,
    onClose,
    onSubmit
}: UserEditModalProps) {
    const [formData, setFormData] = useState<UserFormData>({
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
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && user) {
                setFormData({
                    username: user.username || "",
                    full_name: user.full_name || "",
                    password: "",
                    role: user.role || "user",
                    orgchart_role: user.orgchart_role || "user",
                    visitor_role: user.visitor_role || "user",
                    app_role_ids: user.app_role_ids || [],
                    employee_id: user.employee_id || "",
                    email: user.email || user.username || "",
                    department: user.department || "",
                    job_title: user.job_title || "",
                    location: user.location || "",
                    status: user.status || "Active"
                });
            } else {
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
            }
            setLocalError("");
        }
    }, [isOpen, mode, user]);

    if (!isOpen) return null;

    const toggleAppRole = (roleId: string) => {
        setFormData((prev) => {
            const ids = prev.app_role_ids || [];
            if (ids.includes(roleId)) {
                return { ...prev, app_role_ids: ids.filter((id) => id !== roleId) };
            }
            return { ...prev, app_role_ids: [...ids, roleId] };
        });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (mode === "add" && (!formData.password || formData.password.length < 6)) {
            setLocalError("Password must be at least 6 chars");
            return;
        }

        if (mode === "edit" && formData.password && formData.password.trim() !== "" && formData.password.length < 6) {
            setLocalError("New password must be at least 6 chars");
            return;
        }

        onSubmit(formData);
    };

    const displayedError = localError || error;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-200 flex flex-col my-8 max-h-full">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-bold text-gray-900">
                        {mode === "add" ? "New Account" : "Edit Account"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="text-2xl">×</span>
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1">
                        {displayedError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                {displayedError}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    value={formData.full_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, full_name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Username</label>
                                <input
                                    type="text"
                                    required={mode === "add"}
                                    disabled={mode === "edit"}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Employee ID</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    value={formData.employee_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, employee_id: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Department</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    value={formData.department}
                                    onChange={(e) =>
                                        setFormData({ ...formData, department: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Job Title / Function</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    value={formData.job_title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, job_title: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Status</label>
                                <select
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({ ...formData, status: e.target.value })
                                    }
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Password</label>
                                <input
                                    type="password"
                                    required={mode === "add"}
                                    placeholder={mode === "edit" ? "Leave blank to keep current" : ""}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                            <label className="text-xs font-semibold text-gray-700 block mb-2">
                                Assigned Roles
                            </label>
                            {appRoles.length === 0 ? (
                                <div className="text-xs text-gray-400 italic">
                                    No custom roles defined. Please create them in Role Management.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    {appRoles.map((role) => (
                                        <label
                                            key={role.id}
                                            className="flex items-center gap-2.5 cursor-pointer group"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-[#b52427] rounded border-gray-300 focus:ring-[#b52427] cursor-pointer"
                                                checked={formData.app_role_ids.includes(role.id.toString())}
                                                onChange={() => toggleAppRole(role.id.toString())}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700 group-hover:text-[#b52427] transition-colors">
                                                    {role.name}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    {role.app_module}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#b52427] hover:bg-[#9a1e21] rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
                        >
                            {isSaving ? "Saving..." : "Save Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UserEditModal;
