"use client";

import React from "react";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime as formatDate } from "@/utils/date";
import type { UserAccount } from "@/types/user.types";

export interface PendingApprovalsListProps {
    users: UserAccount[];
    loading: boolean;
    error: string;
    onApprove: (user: UserAccount) => void;
    onReject: (user: UserAccount) => void;
}

export function PendingApprovalsList({
    users,
    loading,
    error,
    onApprove,
    onReject
}: PendingApprovalsListProps) {
    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#fff5f5]">
                <div className="flex items-center gap-3 text-[#b52427]">
                    <ClockIcon className="w-5 h-5" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">
                        Pending Login Approvals
                    </h3>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    {users.length} accounts awaiting approval
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white p-4">
                {loading ? (
                    <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
                ) : error ? (
                    <div className="py-12 text-center text-sm text-red-500">{error}</div>
                ) : users.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500 flex flex-col items-center">
                        <span className="text-4xl mb-3">✅</span>
                        <p>No pending approvals</p>
                        <p className="text-xs text-gray-400 mt-1">
                            All non-SHTP logins have been reviewed.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#fceded] text-[#b52427] flex items-center justify-center text-sm font-bold shrink-0">
                                            {user.full_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">
                                                {user.full_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {user.email || user.username}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="warning" size="sm">
                                        PENDING
                                    </Badge>
                                </div>

                                <div className="space-y-1.5 mb-4 flex-1">
                                    <div className="text-xs flex">
                                        <span className="text-gray-500 w-20">Location:</span>
                                        <span className="font-semibold text-[#b52427]">
                                            {user.location || "-"}
                                        </span>
                                    </div>
                                    <div className="text-xs flex">
                                        <span className="text-gray-500 w-20">Department:</span>
                                        <span className="font-medium text-gray-800">
                                            {user.department || "-"}
                                        </span>
                                    </div>
                                    <div className="text-xs flex">
                                        <span className="text-gray-500 w-20">Title:</span>
                                        <span className="font-medium text-gray-800">
                                            {user.job_title || "-"}
                                        </span>
                                    </div>
                                    <div className="text-xs flex">
                                        <span className="text-gray-500 w-20">Requested:</span>
                                        <span className="font-medium text-gray-800">
                                            {formatDate(user.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => onReject(user)}
                                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded text-xs font-semibold transition-colors"
                                    >
                                        <XCircleIcon className="w-4 h-4" /> Reject
                                    </button>
                                    <button
                                        onClick={() => onApprove(user)}
                                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                                    >
                                        <CheckCircleIcon className="w-4 h-4" /> Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PendingApprovalsList;
