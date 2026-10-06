'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { VisitorRequestData as RequestData } from '@/types/visitor.types';
import type { CheckInOutAction, CheckInOutRequestRecord, CheckInOutVisitorRecord } from '@/types/checkinout.types';

export interface RequestCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: CheckInOutRequestRecord | RequestData | null;
    cardNumbers: Record<string, string>;
    onCardNumberChange: (requestId: string, visitorIndex: number, value: string) => void;
    onAction: (requestId: string, v: CheckInOutVisitorRecord, action: CheckInOutAction, requestCode?: string) => Promise<void>;
    actionLoading: string | null;
    isSecurity?: boolean;
    isReceptionist?: boolean;
    formatDateTime: (time?: string | null) => string;
    formatDateShort: (date?: string | null) => string;
    getCategoryBadgeClass: (category: string) => string;
}

export default function RequestCheckInModal({
    isOpen,
    onClose,
    request,
    cardNumbers,
    onCardNumberChange,
    onAction,
    actionLoading,
    isSecurity,
    isReceptionist,
    formatDateTime,
    formatDateShort,
    getCategoryBadgeClass,
}: RequestCheckInModalProps) {
    const [mounted, setMounted] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Lock body scroll and listen for Escape key
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        setNotification(null);
    }, [request?.requestId]);

    if (!isOpen || !request || !mounted) return null;

    const visitors = request.visitors || [];
    const pendingVisitors = visitors.filter(v => v.checkInOutStatus === 'PENDING');
    const checkedInVisitors = visitors.filter(v => v.checkInOutStatus === 'CHECKED_IN');
    const checkedOutVisitors = visitors.filter(v => v.checkInOutStatus === 'CHECKED_OUT');

    const handleCheckInAll = async () => {
        if (pendingVisitors.length === 0) return;
        setBulkLoading(true);
        setNotification(null);
        try {
            for (const v of pendingVisitors) {
                await onAction(request.requestId, v, 'CHECK_IN', request.requestCode);
            }
            setNotification({ type: 'success', message: `Successfully checked in ${pendingVisitors.length} visitor(s)!` });
        } catch (err) {
            setNotification({ type: 'error', message: 'An error occurred while checking in all visitors.' });
        } finally {
            setBulkLoading(false);
        }
    };

    const handleCheckOutAll = async () => {
        if (checkedInVisitors.length === 0) return;
        if (!window.confirm(`Confirm check-out for all ${checkedInVisitors.length} active visitor(s)?`)) return;
        setBulkLoading(true);
        setNotification(null);
        try {
            for (const v of checkedInVisitors) {
                await onAction(request.requestId, v, 'CHECK_OUT', request.requestCode);
            }
            setNotification({ type: 'success', message: `Successfully checked out ${checkedInVisitors.length} visitor(s)!` });
        } catch (err) {
            setNotification({ type: 'error', message: 'An error occurred while checking out all visitors.' });
        } finally {
            setBulkLoading(false);
        }
    };


    const visitDates = `${formatDateShort(request.startDate)}${request.endDate && request.endDate !== request.startDate ? ` — ${formatDateShort(request.endDate)}` : ''}`;

    const detailItems: { label: string; value: string }[] = [
        { label: 'Submitter', value: request.submitterName || '-' },
        { label: 'Department', value: request.submitterDepartment || '-' },
        { label: 'Category', value: request.visitorCategory || '-' },
        { label: 'Visit Dates', value: visitDates },
        { label: 'Site', value: request.visitingSite || '-' },
        { label: 'Purpose', value: request.purposeOfVisit || '-' },
        { label: 'Detailed Purpose', value: request.purposeDetail || '-' },
    ];

    return createPortal(
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm sm:p-8"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="checkinout-modal-title"
                className="relative flex max-h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border-t-[8px] border-t-mwk bg-white text-gray-900 shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-4">
                    <h2 id="checkinout-modal-title" className="flex items-baseline gap-2 whitespace-nowrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Check-In / Check-Out</span>
                        <span className="text-sm font-extrabold tracking-tight text-gray-900">#{request.requestCode || request.requestId}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        title="Close (Esc)"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-6 pb-6">
                    {/* Request details: compact single strip, label above value */}
                    <dl className="grid grid-cols-2 divide-gray-100 rounded-xl border border-gray-200 sm:grid-cols-4 lg:grid-cols-7 lg:divide-x">
                        {detailItems.map((item) => (
                            <div key={item.label} className="min-w-0 px-3 py-2">
                                <dt className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.label}</dt>
                                <dd className="mt-0.5 truncate whitespace-nowrap text-xs font-extrabold text-gray-900" title={item.value}>
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {/* Notification */}
                    {notification && (
                        <div
                            role="status"
                            className="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700"
                        >
                            <span className={`h-2 w-2 shrink-0 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-mwk'}`} />
                            <span className="flex-1">{notification.message}</span>
                            <button
                                onClick={() => setNotification(null)}
                                className="cursor-pointer rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700"
                                aria-label="Dismiss"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Visitors header & bulk actions */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                            <h3 className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-gray-400">
                                Visitors ({visitors.length})
                            </h3>
                            <span className="whitespace-nowrap text-xs font-medium text-gray-500">
                                Pending <span className="font-extrabold text-gray-900">{pendingVisitors.length}</span>
                            </span>
                            <span className="whitespace-nowrap text-xs font-medium text-gray-500">
                                Checked in <span className="font-extrabold text-gray-900">{checkedInVisitors.length}</span>
                            </span>
                            <span className="whitespace-nowrap text-xs font-medium text-gray-500">
                                Checked out <span className="font-extrabold text-gray-900">{checkedOutVisitors.length}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {pendingVisitors.length > 0 && (
                                <button
                                    disabled={bulkLoading}
                                    onClick={handleCheckInAll}
                                    className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-mwk px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-mwk-hover disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {bulkLoading && <Spinner />}
                                    Check In All ({pendingVisitors.length})
                                </button>
                            )}
                            {checkedInVisitors.length > 0 && (
                                <button
                                    disabled={bulkLoading}
                                    onClick={handleCheckOutAll}
                                    className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {bulkLoading && <Spinner />}
                                    Check Out All ({checkedInVisitors.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Visitors table: one field per column, no wrapping */}
                    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                        <div className="custom-scrollbar max-h-[55vh] overflow-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    <tr className="[&>th]:whitespace-nowrap [&>th]:px-3 [&>th]:py-3">
                                        <th className="w-10 text-center">#</th>
                                        <th>Visitor Name</th>
                                        <th>Visitor Code</th>
                                        <th>Company</th>
                                        <th>Title</th>
                                        <th>Card No.</th>
                                        <th>Status</th>
                                        <th>Check-In</th>
                                        <th>Check-Out</th>
                                        <th className="sticky right-0 bg-gray-50 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {visitors.map((v) => {
                                        const loadingKey = `${request.requestId}-${v.visitorIndex}`;
                                        const isLoading = actionLoading === loadingKey || bulkLoading;
                                        const isRowLoading = actionLoading === loadingKey;
                                        const currentCard = cardNumbers[loadingKey] !== undefined ? cardNumbers[loadingKey] : (v.cardNumber ?? '');

                                        return (
                                            <tr key={v.visitorIndex} className="group transition-colors hover:bg-gray-50 [&>td]:whitespace-nowrap [&>td]:px-3 [&>td]:py-3">
                                                <td className="text-center font-medium text-gray-400">{v.visitorIndex + 1}</td>
                                                <td>
                                                    <span className="flex items-center gap-2.5">
                                                        <span className="h-2 w-2 shrink-0 rounded-full bg-mwk" />
                                                        <span className="text-sm font-extrabold text-gray-900">{v.visitorName}</span>
                                                    </span>
                                                </td>
                                                <td className="font-mono font-semibold text-gray-600">{v.visitorCode || '-'}</td>
                                                <td className="font-medium text-gray-700">{v.visitorCompany || '-'}</td>
                                                <td className="font-medium text-gray-700">{v.visitorTitle || '-'}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={currentCard}
                                                        onChange={(e) => onCardNumberChange(request.requestId, v.visitorIndex, e.target.value)}
                                                        onBlur={() => {
                                                             if (currentCard !== (v.cardNumber ?? '')) {
                                                                 onAction(request.requestId, v, 'UPDATE_CARD', request.requestCode);
                                                             }
                                                        }}
                                                        placeholder="Card no."
                                                        className="w-28 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 outline-none transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-mwk"
                                                    />
                                                </td>
                                                <td>
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-gray-700">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[v.checkInOutStatus] ?? 'bg-gray-300'}`} />
                                                        {STATUS_LABEL[v.checkInOutStatus] ?? v.checkInOutStatus}
                                                    </span>
                                                </td>
                                                <td className="text-gray-600">{v.checkInTime ? formatDateTime(v.checkInTime) : '-'}</td>
                                                <td className="text-gray-600">{v.checkOutTime ? formatDateTime(v.checkOutTime) : '-'}</td>
                                                <td className="sticky right-0 bg-white transition-colors group-hover:bg-gray-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {v.checkInOutStatus === 'PENDING' && (
                                                            <button
                                                                disabled={isLoading}
                                                                onClick={() => onAction(request.requestId, v, 'CHECK_IN', request.requestCode)}
                                                                className="inline-flex min-w-[88px] cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-mwk px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-mwk-hover disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isRowLoading ? <Spinner /> : 'Check In'}
                                                            </button>
                                                        )}
                                                        {v.checkInOutStatus === 'CHECKED_IN' && (
                                                            <button
                                                                disabled={isLoading}
                                                                onClick={() => onAction(request.requestId, v, 'CHECK_OUT', request.requestCode)}
                                                                className="inline-flex min-w-[88px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isRowLoading ? <Spinner /> : 'Check Out'}
                                                            </button>
                                                        )}
                                                        {v.checkInOutStatus === 'CHECKED_OUT' && (
                                                            <span className="inline-flex min-w-[88px] items-center justify-center text-[11px] font-semibold text-gray-400">
                                                                Completed
                                                            </span>
                                                        )}

                                                        {!isSecurity && !isReceptionist && (
                                                            <button
                                                                disabled={isLoading || v.checkInOutStatus === 'PENDING'}
                                                                onClick={() => {
                                                                    if (window.confirm(`Reset status for ${v.visitorName}?`)) {
                                                                        onAction(request.requestId, v, 'RESET', request.requestCode);
                                                                    }
                                                                }}
                                                                title="Reset status"
                                                                aria-label="Reset status"
                                                                className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-end border-t border-gray-100 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pending',
    CHECKED_IN: 'Checked In',
    CHECKED_OUT: 'Checked Out',
};

const STATUS_DOT: Record<string, string> = {
    PENDING: 'bg-gray-300',
    CHECKED_IN: 'bg-emerald-500',
    CHECKED_OUT: 'bg-gray-500',
};

function Spinner() {
    return (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}
