'use client';

import React from 'react';
import type {
    CheckInOutAction,
    CheckInOutProcessedVisitor,
    CheckInOutRequestRecord,
    CheckInOutVisitorRecord,
} from '@/types/checkinout.types';
import { formatDateShort, formatDateTime } from '@/utils/date';
import { getCategoryBadgeClass } from '@/utils/badge';

export interface VisitorViewTableProps {
    visitors: CheckInOutProcessedVisitor[];
    cardNumbers: Record<string, string>;
    onCardNumberChange: (requestId: string, visitorIndex: number, value: string) => void;
    onAction: (requestId: string, v: CheckInOutVisitorRecord, action: CheckInOutAction, requestCode?: string) => Promise<void>;
    actionLoading: string | null;
    isSecurity?: boolean;
    isReceptionist?: boolean;
    onOpenModal: (request: CheckInOutRequestRecord) => void;
    formatDateTimeCustom?: (time?: string | null) => string;
    formatDateShortCustom?: (date?: string | null) => string;
    getCategoryBadgeClassCustom?: (category?: string) => string;
}

export default function VisitorViewTable({
    visitors,
    cardNumbers,
    onCardNumberChange,
    onAction,
    actionLoading,
    isSecurity,
    isReceptionist,
    onOpenModal,
    formatDateTimeCustom = formatDateTime,
    formatDateShortCustom = formatDateShort,
    getCategoryBadgeClassCustom = getCategoryBadgeClass,
}: VisitorViewTableProps) {
    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1360px]">
                <thead>
                    <tr className="bg-[#1a1a1a] text-white font-bold text-[9px] uppercase tracking-wider">
                        <th className="py-3 px-4 w-[110px]">REQUEST</th>
                        <th className="py-3 px-3 min-w-[130px]">SUBMITTER</th>
                        <th className="py-3 px-3 w-[125px]">VISITOR CODE</th>
                        <th className="py-3 px-3 min-w-[140px]">FULL NAME</th>
                        <th className="py-3 px-3 min-w-[100px]">TITLE</th>
                        <th className="py-3 px-3 min-w-[120px]">COMPANY</th>
                        <th className="py-3 px-2 text-center w-[95px]">CATEGORY</th>
                        <th className="py-3 px-3 text-center w-[155px]">DATE</th>
                        <th className="py-3 px-3 text-center w-[105px]">CARD NUMBER</th>
                        <th className="py-3 px-3 text-center w-[120px]">TIME IN</th>
                        <th className="py-3 px-3 text-center w-[120px]">TIME OUT</th>
                        <th className="py-3 px-4 text-center w-[160px]">ACTION</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {visitors.map((v, idx) => {
                        const req = v._requestInfo;
                        return (
                            <tr key={`${req.requestId}-${v.visitorIndex}`} className={`transition-colors hover:bg-red-50/20 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                <td className="py-3 px-4">
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenModal(req);
                                        }}
                                        className="text-[11px] font-bold text-gray-900 hover:text-[#db011c] cursor-pointer truncate underline-offset-2 hover:underline flex items-center gap-1 max-w-[110px]"
                                        title={`Mở Modal Check-In cho đơn ${req.requestCode || req.requestId}`}
                                    >
                                        <span className="truncate">{req.requestCode || req.requestId}</span>
                                        <span className="text-[9px] text-[#db011c] shrink-0">↗</span>
                                    </div>
                                </td>
                                <td className="py-3 px-3">
                                    <div className="text-[11px] font-bold text-gray-700 truncate max-w-[150px]" title={req.submitterName || '-'}>
                                        {req.submitterName || '-'}
                                    </div>
                                </td>
                                <td className="py-3 px-3">
                                    <div className="text-xs font-black text-[#db011c] truncate" title={v.visitorCode}>
                                        {v.visitorCode}
                                    </div>
                                </td>
                                <td className="py-3 px-3">
                                    <div className="text-xs font-bold text-gray-900 truncate max-w-[180px]" title={v.visitorName}>
                                        {v.visitorName}
                                    </div>
                                </td>
                                <td className="py-3 px-3">
                                    <div className="text-[10px] text-gray-500 truncate max-w-[120px]" title={v.visitorTitle || '-'}>
                                        {v.visitorTitle || '-'}
                                    </div>
                                </td>
                                <td className="py-3 px-3">
                                    <div className="text-[11px] font-medium text-gray-600 truncate max-w-[150px]" title={v.visitorCompany || req.visitingSite}>
                                        {v.visitorCompany || req.visitingSite}
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase whitespace-nowrap ${getCategoryBadgeClassCustom(req.visitorCategory)}`}>
                                        {req.visitorCategory?.replace(/MIL\/TTI Expat \/ SHTP Business trip/i, 'MIL EXPAT')}
                                    </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                    <span className="text-[10px] font-medium text-gray-600 whitespace-nowrap">
                                        {formatDateShortCustom(req.startDate)} - {formatDateShortCustom(req.endDate)}
                                    </span>
                                </td>
                                <td className="py-3 px-3">
                                    <div className="w-[90px] mx-auto">
                                        <input
                                            type="text"
                                            placeholder="Card No."
                                            className="w-full text-[11px] px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-[#db011c] text-center"
                                            value={cardNumbers[`${req.requestId}-${v.visitorIndex}`] ?? v.cardNumber ?? ''}
                                            onChange={(e) => onCardNumberChange(req.requestId, v.visitorIndex, e.target.value)}
                                            onBlur={() => {
                                                if (cardNumbers[`${req.requestId}-${v.visitorIndex}`] !== undefined) {
                                                    onAction(req.requestId, v, 'UPDATE_CARD', req.requestCode);
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </td>
                                <td className="py-3 px-3 text-center">
                                    <span className={`text-[10px] font-bold whitespace-nowrap ${v.checkInTime ? 'text-green-600' : 'text-gray-400'}`}>
                                        {formatDateTimeCustom(v.checkInTime)}
                                    </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                    <span className={`text-[10px] font-bold whitespace-nowrap ${v.checkOutTime ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {formatDateTimeCustom(v.checkOutTime)}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <div className="flex justify-center items-center">
                                        <div className="flex gap-1.5 items-center justify-center">
                                            <button
                                                disabled={actionLoading === `${req.requestId}-${v.visitorIndex}` || v.checkInOutStatus !== 'PENDING'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAction(req.requestId, v, 'CHECK_IN', req.requestCode);
                                                }}
                                                className={`whitespace-nowrap text-[9px] font-bold uppercase px-2 py-1.5 rounded shadow-sm transition-colors ${
                                                    v.checkInOutStatus !== 'PENDING'
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-[#db011c] hover:bg-[#b00116] text-white'
                                                }`}
                                            >
                                                Check In
                                            </button>

                                            <button
                                                disabled={actionLoading === `${req.requestId}-${v.visitorIndex}` || v.checkInOutStatus !== 'CHECKED_IN'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAction(req.requestId, v, 'CHECK_OUT', req.requestCode);
                                                }}
                                                className={`whitespace-nowrap text-[9px] font-bold uppercase px-2 py-1.5 rounded shadow-sm transition-colors ${
                                                    v.checkInOutStatus !== 'CHECKED_IN'
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                                                }`}
                                            >
                                                Check Out
                                            </button>

                                            {!isSecurity && !isReceptionist && (
                                                <div className={`ml-0.5 ${v.checkInOutStatus === 'CHECKED_IN' || v.checkInOutStatus === 'CHECKED_OUT' ? 'visible' : 'invisible'}`}>
                                                    <button
                                                        disabled={actionLoading === `${req.requestId}-${v.visitorIndex}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(`Reset check-in/out status for ${v.visitorName}?`)) {
                                                                onAction(req.requestId, v, 'RESET', req.requestCode);
                                                            }
                                                        }}
                                                        title="Reset Status"
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
