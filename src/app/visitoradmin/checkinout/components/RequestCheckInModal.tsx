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
            setNotification({ type: 'success', message: `Check-in thành công cho ${pendingVisitors.length} khách!` });
        } catch (err) {
            setNotification({ type: 'error', message: 'Lỗi trong quá trình check in tất cả.' });
        } finally {
            setBulkLoading(false);
        }
    };

    const handleCheckOutAll = async () => {
        if (checkedInVisitors.length === 0) return;
        if (!window.confirm(`Check-out toàn bộ ${checkedInVisitors.length} khách đang có mặt?`)) return;
        setBulkLoading(true);
        setNotification(null);
        try {
            for (const v of checkedInVisitors) {
                await onAction(request.requestId, v, 'CHECK_OUT', request.requestCode);
            }
            setNotification({ type: 'success', message: `Check-out thành công cho ${checkedInVisitors.length} khách!` });
        } catch (err) {
            setNotification({ type: 'error', message: 'Lỗi trong quá trình check out tất cả.' });
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl border-t-[6px] border-t-[#db011c] w-full max-w-4xl max-h-[90vh] overflow-hidden relative text-[#0f172a] animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100">
                    <div>
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
                        <p className="text-xs text-gray-500 mt-0.5">Xác minh thông tin và thao tác Check-In / Check-Out khách thăm</p>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Đóng (Esc)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Request Overview Information */}
                <div className="p-5 pb-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80 text-xs">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Submitter (Người tạo)</span>
                            <div className="font-bold text-gray-900 truncate" title={request.submitterName}>{request.submitterName || '-'}</div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Company (Công ty)</span>
                            <div className="font-bold text-gray-900 truncate" title={visitors[0]?.visitorCompany}>
                                {visitors[0]?.visitorCompany || '-'}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Visit Date (Ngày thăm)</span>
                            <div className="font-bold text-gray-900">
                                {formatDateShort(request.startDate)} {request.endDate && request.endDate !== request.startDate ? `→ ${formatDateShort(request.endDate)}` : ''}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Purpose (Mục đích)</span>
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
                            Danh sách khách ({visitors.length})
                        </h3>
                        <div className="flex gap-1.5 text-[11px] font-bold">
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70">
                                Chờ: {pendingVisitors.length}
                            </span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                                Đang có mặt: {checkedInVisitors.length}
                            </span>
                            <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                Đã về: {checkedOutVisitors.length}
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
                                Check In Tất Cả ({pendingVisitors.length})
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
                                Check Out Tất Cả ({checkedInVisitors.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Visitors List Body */}
                <div className="p-5 max-h-[52vh] overflow-y-auto space-y-2.5 bg-gray-50/30">
                    {visitors.map((v) => {
                        const loadingKey = `${request.requestId}-${v.visitorIndex}`;
                        const isLoading = actionLoading === loadingKey || bulkLoading;
                        const currentCard = cardNumbers[loadingKey] !== undefined ? cardNumbers[loadingKey] : (v.cardNumber ?? '');

                        return (
                            <div 
                                key={v.visitorIndex}
                                className="bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-2xs hover:border-gray-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5"
                            >
                                {/* Visitor Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-black flex items-center justify-center border border-gray-200 shrink-0">
                                            {v.visitorIndex + 1}
                                        </span>
                                        <span className="font-bold text-sm text-gray-900 truncate">
                                            {v.visitorName}
                                        </span>
                                        {v.visitorCode && (
                                            <span className="text-[10px] font-bold text-[#db011c] bg-red-50 px-1.5 py-0.5 rounded border border-red-100 shrink-0">
                                                {v.visitorCode}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                        {v.visitorTitle && <span>{v.visitorTitle}</span>}
                                        {v.visitorCompany && (
                                            <span className="text-gray-600 font-medium">🏢 {v.visitorCompany}</span>
                                        )}
                                    </div>

                                    {/* Timestamps */}
                                    {(v.checkInTime || v.checkOutTime) && (
                                        <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-3">
                                            {v.checkInTime && (
                                                <span className="text-emerald-700 font-medium">
                                                    Vào: <strong>{formatDateTime(v.checkInTime)}</strong>
                                                </span>
                                            )}
                                            {v.checkOutTime && (
                                                <span className="text-gray-600 font-medium">
                                                    Ra: <strong>{formatDateTime(v.checkOutTime)}</strong>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="flex flex-wrap items-center gap-3 shrink-0">
                                    {/* Card Number Input */}
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-[10px] font-bold uppercase text-gray-500 whitespace-nowrap">
                                            Số thẻ:
                                        </label>
                                        <input
                                            type="text"
                                            value={currentCard}
                                            onChange={(e) => onCardNumberChange(request.requestId, v.visitorIndex, e.target.value)}
                                            onBlur={() => {
                                                if (currentCard !== (v.cardNumber ?? '')) {
                                                    onAction(request.requestId, v, 'UPDATE_CARD', request.requestCode);
                                                }
                                            }}
                                            placeholder="Thẻ khách..."
                                            className="w-28 px-2.5 py-1.5 text-xs font-bold border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#db011c] focus:border-[#db011c] focus:outline-none bg-white shadow-2xs"
                                        />
                                    </div>

                                    {/* Status Badge */}
                                    <div className="min-w-[85px] text-center">
                                        {v.checkInOutStatus === 'PENDING' && (
                                            <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70">
                                                Chờ vào
                                            </span>
                                        )}
                                        {v.checkInOutStatus === 'CHECKED_IN' && (
                                            <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70">
                                                Đang có mặt
                                            </span>
                                        )}
                                        {v.checkInOutStatus === 'CHECKED_OUT' && (
                                            <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200">
                                                Đã về
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            disabled={isLoading || v.checkInOutStatus !== 'PENDING'}
                                            onClick={() => onAction(request.requestId, v, 'CHECK_IN', request.requestCode)}
                                            className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg shadow-2xs transition-colors flex items-center gap-1 ${
                                                v.checkInOutStatus !== 'PENDING'
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                    : 'bg-[#db011c] hover:bg-[#b00116] text-white cursor-pointer'
                                            }`}
                                        >
                                            {isLoading && actionLoading === loadingKey ? '...' : 'Check In'}
                                        </button>

                                        <button
                                            disabled={isLoading || v.checkInOutStatus !== 'CHECKED_IN'}
                                            onClick={() => onAction(request.requestId, v, 'CHECK_OUT', request.requestCode)}
                                            className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg shadow-2xs transition-colors flex items-center gap-1 ${
                                                v.checkInOutStatus !== 'CHECKED_IN'
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                    : 'bg-gray-800 hover:bg-black text-white cursor-pointer'
                                            }`}
                                        >
                                            {isLoading && actionLoading === loadingKey ? '...' : 'Check Out'}
                                        </button>

                                        {!isSecurity && !isReceptionist && (
                                            <button
                                                disabled={isLoading || v.checkInOutStatus === 'PENDING'}
                                                onClick={() => {
                                                    if (window.confirm(`Khôi phục trạng thái chờ check-in cho ${v.visitorName}?`)) {
                                                        onAction(request.requestId, v, 'RESET', request.requestCode);
                                                    }
                                                }}
                                                title="Reset lại trạng thái"
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 px-5 flex items-center justify-between border-t border-gray-100 bg-white sticky bottom-0">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="text-amber-500">💡</span> Nhập số thẻ và bấm <strong>Check In</strong> để cập nhật số thẻ vào hệ thống cùng lúc.
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
