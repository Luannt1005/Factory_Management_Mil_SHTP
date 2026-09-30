"use client";

import React, { useState, useEffect } from "react";
import { hashPassword } from "@/lib/password";
import type { UserAccount, AppRole } from "@/types/user.types";
import type { UpdateUserPayload } from "@/types/system-admin.types";
import { systemAdminApi } from "@/features/systemadmin/services/systemAdminApi";
import { UserManagementTable } from "@/features/systemadmin/components/UserManagementTable";
import { UserEditModal, type UserFormData } from "@/features/systemadmin/components/UserEditModal";

export default function UserManagement() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [appRoles, setAppRoles] = useState<AppRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, rolesData] = await Promise.all([
                systemAdminApi.getUsers(),
                systemAdminApi.getRoles()
            ]);

            setUsers(usersData);
            setAppRoles(rolesData);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Connection error");
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setModalMode("add");
        setCurrentUser(null);
        setError("");
        setIsModalOpen(true);
    };

    const handleEditClick = (user: UserAccount) => {
        setModalMode("edit");
        setCurrentUser(user);
        setError("");
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (user: UserAccount) => {
        if (!confirm(`Are you sure you want to delete ${user.full_name}?`)) return;
        try {
            await systemAdminApi.deleteUser(user.id);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Delete failed");
        }
    };

    const handleSaveUser = async (formData: UserFormData) => {
        setIsSaving(true);
        setError("");

        try {
            if (modalMode === "add") {
                if (!formData.password || formData.password.length < 6) {
                    setError("Password must be at least 6 chars");
                    setIsSaving(false);
                    return;
                }

                const hashedPassword = await hashPassword(formData.password);

                const created = await systemAdminApi.createUser({
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
                });

                setUsers((prev) =>
                    [...prev, created].sort((a, b) => a.full_name.localeCompare(b.full_name))
                );
            } else if (modalMode === "edit" && currentUser?.id) {
                const updateData: UpdateUserPayload = {
                    id: currentUser.id,
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

                if (formData.password && formData.password.trim() !== "") {
                    if (formData.password.length < 6) {
                        setError("New password must be at least 6 chars");
                        setIsSaving(false);
                        return;
                    }
                    updateData.password = await hashPassword(formData.password);
                }

                await systemAdminApi.updateUser(updateData);

                setUsers((prev) =>
                    prev.map((u) => (u.id === currentUser.id ? { ...u, ...updateData } : u))
                );
            }
            setIsModalOpen(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save user");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <UserManagementTable
                users={users}
                appRoles={appRoles}
                loading={loading}
                onAddClick={handleAddClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteUser}
            />

            <UserEditModal
                isOpen={isModalOpen}
                mode={modalMode}
                user={currentUser}
                appRoles={appRoles}
                isSaving={isSaving}
                error={error}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveUser}
            />
        </>
    );
}
