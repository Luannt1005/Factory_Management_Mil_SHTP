'use client';

import React from 'react';
import {
    CheckCircleIcon,
    NoSymbolIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface SheetApprovalConfirmModalProps {
    isOpen: boolean;
    type: 'approve' | 'reject' | null;
    count: number;
    saving: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export const SheetApprovalConfirmModal: React.FC<SheetApprovalConfirmModalProps> = ({
    isOpen,
    type,
    count,
    saving,
    onConfirm,
    onClose,
}) => {
    if (!isOpen || !type) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-bg-card)] rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200 border border-[var(--color-border)]">
                <div className="flex items-center gap-3 mb-4">
                    {type === 'approve' ? (
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        </div>
                    ) : (
                        <div className="p-3 bg-orange-100 rounded-full">
                            <NoSymbolIcon className="w-6 h-6 text-orange-600" />
                        </div>
                    )}
                    <h3 className="text-lg font-semibold text-[var(--color-text-title)]">
                        {type === 'approve' ? 'Approve All Changes' : 'Reject All Changes'}
                    </h3>
                </div>

                <p className="text-[var(--color-text-muted)] mb-6">
                    {type === 'approve'
                        ? `Are you sure you want to approve all ${count} pending changes? This will apply the new Line Manager values.`
                        : `Are you sure you want to reject all ${count} pending changes? The original Line Manager values will be kept.`}
                </p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--color-text-body)] hover:text-[var(--color-text-title)] hover:bg-[var(--color-bg-page)] rounded-lg transition-colors border border-[var(--color-border)]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={saving}
                        className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                            type === 'approve'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-orange-600 hover:bg-orange-700'
                        }`}
                    >
                        {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                        {type === 'approve' ? 'Yes, Approve All' : 'Yes, Reject All'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SheetApprovalConfirmModal;
