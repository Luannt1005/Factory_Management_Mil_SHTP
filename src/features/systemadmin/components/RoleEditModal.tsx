"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import type { SystemAdminRole, PermissionModule } from "@/types/system-admin.types";

export const PERMISSION_MATRIX: PermissionModule[] = [
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
            { key: "/visitoradmin/checkinout", label: "Check In / Out" },
            { key: "/visitoradmin/rooms", label: "Manage Room" },
            { key: "/visitoradmin", label: "Admin Settings" },
            { key: "/visitoranalytics", label: "Visitor Analytics" }
        ]
    }
];

export interface RoleFormData {
    name: string;
    app_module: string;
    description: string;
    permissions: string[];
}

export interface RoleEditModalProps {
    isOpen: boolean;
    mode: "add" | "edit";
    role: SystemAdminRole | null;
    isSaving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (formData: RoleFormData) => void;
}

export function RoleEditModal({
    isOpen,
    mode,
    role,
    isSaving,
    error,
    onClose,
    onSubmit
}: RoleEditModalProps) {
    const [formData, setFormData] = useState<RoleFormData>({
        name: "",
        app_module: "Global",
        description: "",
        permissions: []
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && role) {
                setFormData({
                    name: role.name || "",
                    app_module: role.app_module || "Global",
                    description: role.description || "",
                    permissions: role.permissions || []
                });
            } else {
                setFormData({
                    name: "",
                    app_module: "Global",
                    description: "",
                    permissions: []
                });
            }
        }
    }, [isOpen, mode, role]);

    const togglePermission = (perm: string) => {
        setFormData((prev) => {
            if (prev.permissions.includes(perm)) {
                return {
                    ...prev,
                    permissions: prev.permissions.filter((p) => p !== perm)
                };
            }
            return { ...prev, permissions: [...prev.permissions, perm] };
        });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "add" ? "New Role" : "Edit Role"}
            maxWidth="2xl"
            footer={
                <>
                    <Button variant="secondary" size="md" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="role-form"
                        variant="primary"
                        size="md"
                        loading={isSaving}
                        className="min-w-[100px]"
                    >
                        Save Role
                    </Button>
                </>
            }
        >
            <form id="role-form" onSubmit={handleFormSubmit} className="flex flex-col space-y-4">
                {error && (
                    <Alert variant="error">{error}</Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Role Name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Visitor Admin"
                    />
                    <Select
                        label="App Module"
                        value={formData.app_module}
                        onChange={(val) => setFormData({ ...formData, app_module: val as any })}
                        options={[
                            { value: "Global", label: "Global" },
                            { value: "Orgchart", label: "OrgChart" },
                            { value: "Visitor", label: "Visitor" },
                        ]}
                    />
                </div>

                <FormField label="Description" htmlFor="role-description">
                    <textarea
                        id="role-description"
                        className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#db011c]"
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What can this role do?"
                    />
                </FormField>

                <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Page Access Permission
                    </label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-2.5 px-4 font-semibold text-gray-700">Module / Page</th>
                                    <th className="py-2.5 px-4 font-semibold text-gray-700 w-24 text-center">Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {PERMISSION_MATRIX.map((module) => (
                                    <React.Fragment key={module.module}>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <td colSpan={2} className="py-2 px-4 font-bold text-[#b52427]">
                                                {module.module}
                                            </td>
                                        </tr>
                                        {module.pages.map((page) => (
                                            <tr key={page.key} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-2.5 px-4 pl-8 text-gray-700 font-medium flex items-center gap-2">
                                                    {page.label}
                                                    <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                                                        {page.key}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
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
            </form>
        </Modal>
    );
}

export default RoleEditModal;
