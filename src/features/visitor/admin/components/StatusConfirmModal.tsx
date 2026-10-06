'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface StatusConfirmModalProps {
    /** Target status; the modal is hidden when null */
    status: 'COMPLETE' | 'REJECTED' | null;
    requestRef: string;
    visitorName?: string | null;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}

export default function StatusConfirmModal({ status, requestRef, visitorName, onConfirm, onClose }: StatusConfirmModalProps) {
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!status) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !submitting) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, submitting, onClose]);

    if (!status || typeof document === 'undefined') return null;

    const isApprove = status === 'COMPLETE';

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            await onConfirm();
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => !submitting && onClose()}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="status-confirm-title"
                className="w-full max-w-md overflow-hidden rounded-2xl border-t-[8px] border-t-mwk bg-white shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 pb-2 pt-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {isApprove ? 'Approve request' : 'Reject request'}
                    </p>
                    <h2 id="status-confirm-title" className="mt-2 text-base font-extrabold tracking-tight text-gray-900">
                        {isApprove ? 'Approve this visitor request?' : 'Reject this visitor request?'}
                    </h2>
                </div>

                <div className="px-6 py-3">
                    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2.5">
                        <span className="text-sm font-medium text-gray-500">Request Ref</span>
                        <span className="whitespace-nowrap text-sm font-extrabold text-gray-900">#{requestRef}</span>
                    </div>
                    {visitorName && (
                        <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2.5">
                            <span className="text-sm font-medium text-gray-500">Visitor</span>
                            <span className="truncate whitespace-nowrap text-sm font-extrabold text-gray-900" title={visitorName}>{visitorName}</span>
                        </div>
                    )}
                    <p className="mt-3 text-xs text-gray-500">
                        {isApprove
                            ? 'The request will be marked COMPLETE and the submitter will be notified.'
                            : 'The request will be marked REJECTED and the submitter will be notified.'}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onClose}
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        autoFocus
                        disabled={submitting}
                        onClick={handleConfirm}
                        className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-mwk hover:bg-mwk-hover'
                        }`}
                    >
                        {submitting ? 'Processing...' : isApprove ? 'Approve' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
