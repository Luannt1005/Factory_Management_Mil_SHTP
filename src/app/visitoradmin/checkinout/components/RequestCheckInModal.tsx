'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Visitor {
    visitorIndex: number;
    visitorName: string;
    visitorTitle?: string;
    visitorCompany?: string;
    visitorCode?: string;
    cardNumber?: string;
    checkInOutStatus: 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT';
    checkInTime?: string | null;
    checkOutTime?: string | null;
}

interface RequestData {
    requestId: string;
    requestCode?: string;
    submitterName?: string;
    submitterDepartment?: string;
    visitorCategory?: string;
    visitingSite?: string;
    purposeOfVisit?: string;
    purposeDetail?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    visitors: Visitor[];
}

interface RequestCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: RequestData | null;
    cardNumbers: Record<string, string>;
    onCardNumberChange: (requestId: string, visitorIndex: number, value: string) => void;
    onAction: (requestId: string, v: any, action: 'CHECK_IN' | 'CHECK_OUT' | 'RESET' | 'UPDATE_CARD', requestCode?: string) => Promise<void>;
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

    return createPortal(
        <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/60 backdrop-blur-md transition-all duration-200 animate-in fade-in" 
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl border-t-[6px] border-t-[#db011c] border-x border-b border-gray-100 w-full max-w-5xl max-h-[90vh] overflow-hidden relative text-[#0f172a] flex flex-col my-auto transition-all animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-[#db011c] font-black text-sm">
                            #
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                                Check-In / Out: {request.requestCode || request.requestId}
                            </h2>
                            {request.visitorCategory && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-[#db011c] border border-red-100">
                                    {request.visitorCategory}
                                </span>
                            )}
                            {request.visitingSite && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                    Site: {request.visitingSite}
                                </span>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
                        title="Close (Esc)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body scroll area */}
                <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
                    {/* Request Details Grid - All 5 items on the same row on desktop */}
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Submitter</span>
                                <div className="font-bold text-gray-900 truncate" title={request.submitterName}>
                                    {request.submitterName || '-'}
                                </div>
                                {request.submitterDepartment && (
                                    <div className="text-[11px] text-gray-500 font-medium truncate" title={request.submitterDepartment}>
                                        {request.submitterDepartment}
                                    </div>
                                )}
                            </div>

                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Company</span>
                                <div className="font-bold text-gray-900 truncate" title={visitors[0]?.visitorCompany}>
                                    {visitors[0]?.visitorCompany || '-'}
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Visit Date</span>
                                <div className="font-bold text-gray-900 whitespace-nowrap">
                                    {formatDateShort(request.startDate)} {request.endDate && request.endDate !== request.startDate ? `→ ${formatDateShort(request.endDate)}` : ''}
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Purpose</span>
                                <div className="font-semibold text-gray-800 truncate" title={request.purposeOfVisit}>
                                    {request.purposeOfVisit || '-'}
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Detailed Purpose</span>
                                <div className="font-medium text-gray-800 line-clamp-2 break-words" title={request.purposeDetail || '-'}>
                                    {request.purposeDetail || '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notification Banner */}
                    {notification && (
                        <div className={`px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-between shadow-2xs ${
                            notification.type === 'success' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                            <span>{notification.message}</span>
                            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100 ml-3 font-bold cursor-pointer">✕</button>
                        </div>
                    )}

                    {/* Visitors Section Header & Bulk Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                Visitors ({visitors.length})
                            </h3>
                            <div className="flex gap-1.5 text-[11px] font-bold">
                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                                    Pending: {pendingVisitors.length}
                                </span>
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                                    Checked In: {checkedInVisitors.length}
                                </span>
                                <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                    Checked Out: {checkedOutVisitors.length}
                                </span>
                            </div>
                        </div>

                        {/* Bulk Action Buttons */}
                        <div className="flex items-center gap-2">
                            {pendingVisitors.length > 0 && (
                                <button
                                    disabled={bulkLoading}
                                    onClick={handleCheckInAll}
                                    className="bg-[#db011c] hover:bg-[#b00116] disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Check In All ({pendingVisitors.length})
                                </button>
                            )}
                            {checkedInVisitors.length > 0 && (
                                <button
                                    disabled={bulkLoading}
                                    onClick={handleCheckOutAll}
                                    className="bg-gray-800 hover:bg-black disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                    Check Out All ({checkedInVisitors.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Visitors Table */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto max-h-[42vh] overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-gray-50/95 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-200">
                                    <tr>
                                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                                        <th className="py-2.5 px-3 min-w-[180px]">Visitor Name</th>
                                        <th className="py-2.5 px-3 min-w-[140px]">Company / Title</th>
                                        <th className="py-2.5 px-3 w-32">Card No.</th>
                                        <th className="py-2.5 px-3 w-28 text-center">Status</th>
                                        <th className="py-2.5 px-3 w-32 whitespace-nowrap">Check-In</th>
                                        <th className="py-2.5 px-3 w-32 whitespace-nowrap">Check-Out</th>
                                        <th className="py-2.5 px-3 w-44 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {visitors.map((v) => {
                                        const loadingKey = `${request.requestId}-${v.visitorIndex}`;
                                        const isLoading = actionLoading === loadingKey || bulkLoading;
                                        const currentCard = cardNumbers[loadingKey] !== undefined ? cardNumbers[loadingKey] : (v.cardNumber ?? '');

                                        return (
                                            <tr key={v.visitorIndex} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="py-2.5 px-3 text-center text-gray-400 font-semibold">
                                                    {v.visitorIndex + 1}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <div className="font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                                                        <span>{v.visitorName}</span>
                                                        {v.visitorCode && (
                                                            <span className="text-[10px] font-bold text-[#db011c] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                                {v.visitorCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <div className="font-semibold text-gray-800" title={v.visitorCompany}>
                                                        {v.visitorCompany || '-'}
                                                    </div>
                                                    {v.visitorTitle && (
                                                        <div className="text-[11px] text-gray-500 font-normal" title={v.visitorTitle}>
                                                            {v.visitorTitle}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <input
                                                        type="text"
                                                        value={currentCard}
                                                        onChange={(e) => onCardNumberChange(request.requestId, v.visitorIndex, e.target.value)}
                                                        onBlur={() => {
                                                             if (currentCard !== (v.cardNumber ?? '')) {
                                                                 onAction(request.requestId, v, 'UPDATE_CARD', request.requestCode);
                                                             }
                                                        }}
                                                        placeholder="Card No..."
                                                        className="w-28 px-2.5 py-1 text-xs font-semibold border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white shadow-2xs"
                                                    />
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    {v.checkInOutStatus === 'PENDING' && (
                                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70">
                                                            Pending
                                                        </span>
                                                    )}
                                                    {v.checkInOutStatus === 'CHECKED_IN' && (
                                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70">
                                                            Checked In
                                                        </span>
                                                    )}
                                                    {v.checkInOutStatus === 'CHECKED_OUT' && (
                                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200">
                                                            Checked Out
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 text-[11px] text-gray-600 whitespace-nowrap">
                                                    {v.checkInTime ? formatDateTime(v.checkInTime) : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-[11px] text-gray-600 whitespace-nowrap">
                                                    {v.checkOutTime ? formatDateTime(v.checkOutTime) : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            disabled={isLoading || v.checkInOutStatus !== 'PENDING'}
                                                            onClick={() => onAction(request.requestId, v, 'CHECK_IN', request.requestCode)}
                                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                                                v.checkInOutStatus !== 'PENDING'
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                                    : 'bg-[#db011c] hover:bg-[#b00116] text-white shadow-2xs'
                                                            }`}
                                                        >
                                                            {isLoading && actionLoading === loadingKey ? '...' : 'Check In'}
                                                        </button>

                                                        <button
                                                            disabled={isLoading || v.checkInOutStatus !== 'CHECKED_IN'}
                                                            onClick={() => onAction(request.requestId, v, 'CHECK_OUT', request.requestCode)}
                                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                                                v.checkInOutStatus !== 'CHECKED_IN'
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                                    : 'bg-gray-800 hover:bg-black text-white shadow-2xs'
                                                            }`}
                                                        >
                                                            {isLoading && actionLoading === loadingKey ? '...' : 'Check Out'}
                                                        </button>

                                                        {!isSecurity && !isReceptionist && (
                                                            <button
                                                                disabled={isLoading || v.checkInOutStatus === 'PENDING'}
                                                                onClick={() => {
                                                                    if (window.confirm(`Reset status for ${v.visitorName}?`)) {
                                                                        onAction(request.requestId, v, 'RESET', request.requestCode);
                                                                    }
                                                                }}
                                                                title="Reset status"
                                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
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
                <div className="p-3.5 sm:p-4 px-5 flex items-center justify-end border-t border-gray-100 bg-gray-50/50 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
