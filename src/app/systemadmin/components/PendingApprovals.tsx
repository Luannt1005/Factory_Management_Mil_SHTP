"use client";

import { useState, useEffect } from "react";
import type { UserAccount } from "@/types/user.types";
import { systemAdminApi } from "@/features/systemadmin/services/systemAdminApi";
import { PendingApprovalsList } from "@/features/systemadmin/components/PendingApprovalsList";
import { PendingApprovalConfirmModal } from "@/features/systemadmin/components/PendingApprovalConfirmModal";

export default function PendingApprovals() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state for confirmation
    const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
    const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [modalError, setModalError] = useState("");

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            const pending = await systemAdminApi.getPendingUsers();
            setUsers(pending);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Connection error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenApprove = (user: UserAccount) => {
        setSelectedUser(user);
        setConfirmAction("approve");
        setModalError("");
    };

    const handleOpenReject = (user: UserAccount) => {
        setSelectedUser(user);
        setConfirmAction("reject");
        setModalError("");
    };

    const handleCloseModal = () => {
        if (isProcessing) return;
        setSelectedUser(null);
        setConfirmAction(null);
        setModalError("");
    };

    const handleConfirm = async (user: UserAccount, action: "approve" | "reject") => {
        setIsProcessing(true);
        setModalError("");
        try {
            if (action === "approve") {
                await systemAdminApi.approveUser(user);
            } else {
                await systemAdminApi.rejectUser(user);
            }
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
            handleCloseModal();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : `${action} failed`;
            setModalError(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <PendingApprovalsList
                users={users}
                loading={loading}
                error={error}
                onApprove={handleOpenApprove}
                onReject={handleOpenReject}
            />

            <PendingApprovalConfirmModal
                isOpen={!!selectedUser && !!confirmAction}
                action={confirmAction}
                user={selectedUser}
                isProcessing={isProcessing}
                error={modalError}
                onClose={handleCloseModal}
                onConfirm={handleConfirm}
            />
        </>
    );
}
