'use client';

import React, { useState, useEffect } from 'react';

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
    visitorCategory?: string;
    visitingSite?: string;
    purposeOfVisit?: string;
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
    const [bulkLoading, setBulkLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        // Reset notification when request changes
        setNotification(null);
    }, [request?.requestId]);

    if (!isOpen || !request) return null;

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
            setNotification({ type: 'error', message: 'Failed to check in all visitors.' });
        } finally {
            setBulkLoading(false);
        }
    };

    const handleCheckOutAll = async () => {
        if (checkedInVisitors.length === 0) return;
        if (!window.confirm(`Check out all ${checkedInVisitors.length} active visitor(s)?`)) return;
        setBulkLoading(true);
        setNotification(null);
        try {
            for (const v of checkedInVisitors) {
                await onAction(request.requestId, v, 'CHECK_OUT', request.requestCode);
            }
            setNotification({ type: 'success', message: `Successfully checked out ${checkedInVisitors.length} visitor(s)!` });
        } catch (err) {
            setNotification({ type: 'error', message: 'Failed to check out all visitors.' });
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl border-t-[6px] border-t-[#db011c] w-full max-w-5xl max-h-[90vh] overflow-hidden relative text-[#0f172a] animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">
                            Check-In / Check-Out #{request.requestCode || request.requestId}
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

                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Close (Esc)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Request Overview Information */}
                <div className="p-5 pb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80 text-xs">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Submitter</span>
                            <div className="font-bold text-gray-900 truncate" title={request.submitterName}>{request.submitterName || '-'}</div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Company</span>
                            <div className="font-bold text-gray-900 truncate" title={visitors[0]?.visitorCompany}>
                                {visitors[0]?.visitorCompany || '-'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Visit Date</span>
                            <div className="font-bold text-gray-900">
                                {formatDateShort(request.startDate)} {request.endDate && request.endDate !== request.startDate ? `→ ${formatDateShort(request.endDate)}` : ''}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Purpose</span>
                            <div className="font-medium text-gray-700 truncate" title={request.purposeOfVisit}>
                                {request.purposeOfVisit || '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Banner */}
                {notification && (
                    <div className={`mx-5 mb-2 px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-between ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        <span>{notification.message}</span>
                        <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100 ml-3 font-bold">✕</button>
                    </div>
                )}

                {/* Visitors Section Header & Bulk Action Buttons */}
                <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Visitors ({visitors.length})
                        </h3>
                        <div className="flex gap-1.5 text-[11px] font-bold">
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70">
                                Pending: {pendingVisitors.length}
                            </span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                                Checked In: {checkedInVisitors.length}
                            </span>
                            <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                Checked Out: {checkedOutVisitors.length}
                            </span>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex items-center gap-2">
                        {pendingVisitors.length > 0 && (
                            <button
                                disabled={bulkLoading}
                                onClick={handleCheckInAll}
                                className="bg-[#db011c] hover:bg-[#b00116] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Check In All ({pendingVisitors.length})
                            </button>
                        )}
                        {checkedInVisitors.length > 0 && (
                            <button
                                disabled={bulkLoading}
                                onClick={handleCheckOutAll}
                                className="bg-gray-800 hover:bg-black disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Check Out All ({checkedInVisitors.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Visitors Table */}
                <div className="overflow-x-auto max-h-[52vh] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-200">
                            <tr>
                                <th className="py-2.5 px-3 w-10 text-center">#</th>
                                <th className="py-2.5 px-3">Visitor Name</th>
                                <th className="py-2.5 px-3">Company / Title</th>
                                <th className="py-2.5 px-3 w-32">Card No.</th>
                                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                                <th className="py-2.5 px-3 w-32 whitespace-nowrap">Check In</th>
                                <th className="py-2.5 px-3 w-32 whitespace-nowrap">Check Out</th>
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
                                        <td className="py-2.5 px-3 text-center text-gray-500 font-semibold">
                                            {v.visitorIndex + 1}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                                <span>{v.visitorName}</span>
                                                {v.visitorCode && (
                                                    <span className="text-[10px] font-semibold text-[#db011c] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                        {v.visitorCode}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <div className="font-medium text-gray-800 truncate max-w-[200px]" title={v.visitorCompany}>
                                                {v.visitorCompany || '-'}
                                            </div>
                                            {v.visitorTitle && (
                                                <div className="text-[11px] text-gray-400 truncate max-w-[200px]" title={v.visitorTitle}>
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
                                                className="w-28 px-2 py-1 text-xs font-semibold border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white shadow-2xs"
                                            />
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            {v.checkInOutStatus === 'PENDING' && (
                                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70">
                                                    Pending
                                                </span>
                                            )}
                                            {v.checkInOutStatus === 'CHECKED_IN' && (
                                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70">
                                                    Checked In
                                                </span>
                                            )}
                                            {v.checkInOutStatus === 'CHECKED_OUT' && (
                                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200">
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
                                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                                                        v.checkInOutStatus !== 'PENDING'
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                            : 'bg-[#db011c] hover:bg-[#b00116] text-white cursor-pointer shadow-xs'
                                                    }`}
                                                >
                                                    {isLoading && actionLoading === loadingKey ? '...' : 'Check In'}
                                                </button>

                                                <button
                                                    disabled={isLoading || v.checkInOutStatus !== 'CHECKED_IN'}
                                                    onClick={() => onAction(request.requestId, v, 'CHECK_OUT', request.requestCode)}
                                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                                                        v.checkInOutStatus !== 'CHECKED_IN'
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                            : 'bg-gray-800 hover:bg-black text-white cursor-pointer shadow-xs'
                                                    }`}
                                                >
                                                    {isLoading && actionLoading === loadingKey ? '...' : 'Check Out'}
                                                </button>

                                                {!isSecurity && !isReceptionist && (
                                                    <button
                                                        disabled={isLoading || v.checkInOutStatus === 'PENDING'}
                                                        onClick={() => {
                                                            if (window.confirm(`Reset check-in status for ${v.visitorName}?`)) {
                                                                onAction(request.requestId, v, 'RESET', request.requestCode);
                                                            }
                                                        }}
                                                        title="Reset status"
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
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

                {/* Footer */}
                <div className="p-4 px-5 flex items-center justify-end border-t border-gray-100 bg-white sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
