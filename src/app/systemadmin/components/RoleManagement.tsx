"use client";

import React, { useState, useEffect } from "react";
import { systemAdminApi } from "@/features/systemadmin/services/systemAdminApi";
import type { SystemAdminRole } from "@/types/system-admin.types";
import { RoleManagementTable } from "@/features/systemadmin/components/RoleManagementTable";
import { RoleEditModal, type RoleFormData } from "@/features/systemadmin/components/RoleEditModal";

export default function RoleManagement() {
    const [roles, setRoles] = useState<SystemAdminRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [currentRole, setCurrentRole] = useState<SystemAdminRole | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const data = await systemAdminApi.getRoles();
            setRoles(data);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Connection error");
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setModalMode("add");
        setCurrentRole(null);
        setError("");
        setIsModalOpen(true);
    };

    const handleEditClick = (role: SystemAdminRole) => {
        setModalMode("edit");
        setCurrentRole(role);
        setError("");
        setIsModalOpen(true);
    };

    const handleDeleteRole = async (role: SystemAdminRole) => {
        if (!confirm(`Are you sure you want to delete the role ${role.name}?`)) return;
        try {
            await systemAdminApi.deleteRole(role.id);
            setRoles((prev) => prev.filter((r) => r.id !== role.id));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Delete failed");
        }
    };

    const handleSaveRole = async (formData: RoleFormData) => {
        setIsSaving(true);
        setError("");

        try {
            if (modalMode === "add") {
                const created = await systemAdminApi.createRole(formData);
                setRoles((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
            } else {
                if (!currentRole?.id) {
                    throw new Error("Missing role ID for update");
                }
                const updated = await systemAdminApi.updateRole({
                    id: currentRole.id,
                    ...formData
                });
                setRoles((prev) =>
                    prev.map((r) => (r.id === currentRole.id ? { ...r, ...updated, ...formData } : r))
                );
            }
            setIsModalOpen(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save role");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <RoleManagementTable
                roles={roles}
                loading={loading}
                onAddClick={handleAddClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteRole}
            />

            <RoleEditModal
                isOpen={isModalOpen}
                mode={modalMode}
                role={currentRole}
                isSaving={isSaving}
                error={error}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveRole}
            />
        </>
    );
}
