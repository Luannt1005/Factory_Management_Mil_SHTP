"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import type { UserAccount } from "@/types/user.types";

export interface PendingApprovalConfirmModalProps {
    isOpen: boolean;
    action: "approve" | "reject" | null;
    user: UserAccount | null;
    isProcessing: boolean;
    error?: string;
    onClose: () => void;
    onConfirm: (user: UserAccount, action: "approve" | "reject") => void;
}

export function PendingApprovalConfirmModal({
    isOpen,
    action,
    user,
    isProcessing,
    error,
    onClose,
    onConfirm
}: PendingApprovalConfirmModalProps) {
    if (!isOpen || !user || !action) return null;

    const isApprove = action === "approve";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isApprove ? "Confirm User Approval" : "Confirm User Rejection"}
            maxWidth="md"
            footer={
                <>
                    <Button variant="secondary" size="md" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button
                        variant={isApprove ? "primary" : "secondary"}
                        size="md"
                        loading={isProcessing}
                        className={
                            isApprove
                                ? "!bg-green-600 hover:!bg-green-700 !text-white min-w-[100px]"
                                : "!bg-red-600 hover:!bg-red-700 !text-white min-w-[100px]"
                        }
                        onClick={() => onConfirm(user, action)}
                    >
                        {isApprove ? "Approve User" : "Reject & Deactivate"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4 text-sm text-gray-700">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                            isApprove ? "bg-green-600" : "bg-red-600"
                        }`}
                    >
                        {isApprove ? (
                            <CheckCircleIcon className="w-6 h-6" />
                        ) : (
                            <XCircleIcon className="w-6 h-6" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 truncate">{user.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email || user.username}</div>
                    </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex">
                        <span className="text-gray-400 w-24">Department:</span>
                        <span className="font-medium text-gray-800">{user.department || "-"}</span>
                    </div>
                    <div className="flex">
                        <span className="text-gray-400 w-24">Job Title:</span>
                        <span className="font-medium text-gray-800">{user.job_title || "-"}</span>
                    </div>
                    <div className="flex">
                        <span className="text-gray-400 w-24">Location:</span>
                        <span className="font-semibold text-[#b52427]">{user.location || "-"}</span>
                    </div>
                </div>

                <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    {isApprove
                        ? `Are you sure you want to approve access for ${user.full_name}? Their status will be set to Active.`
                        : `Are you sure you want to reject and deactivate ${user.full_name}? Their status will be set to Inactive.`}
                </p>
            </div>
        </Modal>
    );
}

export default PendingApprovalConfirmModal;
