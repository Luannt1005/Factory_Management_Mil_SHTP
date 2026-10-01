"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "add" ? "New Account" : "Edit Account"}
            maxWidth="2xl"
            footer={
                <>
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="user-edit-form"
                        variant="primary"
                        size="md"
                        loading={isSaving}
                        className="min-w-[110px]"
                    >
                        Save Account
                    </Button>
                </>
            }
        >
            <form id="user-edit-form" onSubmit={handleFormSubmit} className="flex flex-col space-y-4">
                {displayedError && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                        {displayedError}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">
                            Full Name <span className="text-[#db011c]">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#db011c] transition-colors"
                            value={formData.full_name}
                            onChange={(e) =>
                                setFormData({ ...formData, full_name: e.target.value })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">
                            Username {mode === "add" && <span className="text-[#db011c]">*</span>}
                        </label>
                        <input
                            type="text"
                            required={mode === "add"}
                            disabled={mode === "edit"}
                            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#db011c] disabled:opacity-50 transition-colors"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">Employee ID</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#db011c] transition-colors"
                            value={formData.employee_id}
                            onChange={(e) =>
                                setFormData({ ...formData, employee_id: e.target.value })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">
                            Email <span className="text-[#db011c]">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#db011c] transition-colors"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">Department</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#db011c] transition-colors"
                            value={formData.department}
                            onChange={(e) =>
                                setFormData({ ...formData, department: e.target.value })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">Job Title / Function</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#db011c] transition-colors"
                            value={formData.job_title}
                            onChange={(e) =>
                                setFormData({ ...formData, job_title: e.target.value })
                            }
                        />
                    </div>
                    <Select
                        label="Status"
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val })}
                        options={[
                            { value: "Active", label: "Active" },
                            { value: "Inactive", label: "Inactive" },
                        ]}
                    />
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 block">
                            Password {mode === "add" && <span className="text-[#db011c]">*</span>}
                        </label>
                        <input
                            type="password"
                            required={mode === "add"}
                            placeholder={mode === "edit" ? "Leave blank to keep current" : ""}
                            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#db011c] transition-colors"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                        />
                    </div>
                </div>

                <div className="space-y-2 mt-2 pt-4 border-t border-gray-100">
                    <label className="text-xs font-semibold text-gray-700 block mb-2">
                        Assigned Roles
                    </label>
                    {appRoles.length === 0 ? (
                        <div className="text-xs text-gray-400 italic">
                            No custom roles defined. Please create them in Role Management.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50/80 p-4 rounded-xl border border-gray-200">
                            {appRoles.map((role) => (
                                <label
                                    key={role.id}
                                    className="flex items-center gap-2.5 cursor-pointer group"
                                >
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-[#db011c] rounded border-gray-300 focus:ring-[#db011c] cursor-pointer"
                                        checked={formData.app_role_ids.includes(role.id.toString())}
                                        onChange={() => toggleAppRole(role.id.toString())}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-700 group-hover:text-[#db011c] transition-colors">
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
            </form>
        </Modal>
    );
}

export default UserEditModal;
