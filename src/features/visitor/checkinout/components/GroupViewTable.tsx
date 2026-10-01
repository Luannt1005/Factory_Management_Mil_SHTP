'use client';

import React, { Fragment } from 'react';
import type {
    CheckInOutAction,
    CheckInOutRequestRecord,
    CheckInOutVisitorRecord,
} from '@/types/checkinout.types';
import { formatDateShort, formatDateTime } from '@/utils/date';
import { getCategoryBadgeClass } from '@/utils/badge';

export interface GroupViewTableProps {
    groups: (CheckInOutRequestRecord & { filteredVisitors?: CheckInOutVisitorRecord[] })[];
    expandedRequest: string | null;
    onToggleExpand: (requestId: string) => void;
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

export default function GroupViewTable({
    groups,
    expandedRequest,
    onToggleExpand,
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
}: GroupViewTableProps) {
    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-[#1a1a1a] text-white font-bold text-xs uppercase tracking-wider">
                        <th className="py-3 px-6 w-[200px]">REQUEST CODE</th>
                        <th className="py-3 px-4 min-w-[150px]">SUBMITTER</th>
                        <th className="py-3 px-4 min-w-[220px]">VISITOR(S)</th>
                        <th className="py-3 px-4 w-[140px]">CATEGORY</th>
                        <th className="py-3 px-4 w-[180px]">DATE</th>
                        <th className="py-3 px-6 w-[110px] text-right">SITE</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {groups.map((req, idx) => {
                        const isExpanded = expandedRequest === req.requestId;
                        return (
                            <Fragment key={req.requestId}>
                                <tr
                                    className={`cursor-pointer transition-colors ${isExpanded ? 'bg-red-50/20' : idx % 2 === 0 ? 'bg-white' : 'bg-[#fff5f5]/30'} hover:bg-gray-50`}
                                    onClick={() => onToggleExpand(req.requestId)}
                                >
                                    <td className="py-4 px-6 font-bold text-sm text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenModal(req);
                                                }}
                                                className="hover:text-[#db011c] hover:underline cursor-pointer truncate max-w-[140px]"
                                                title={req.requestCode || req.requestId}
                                            >
                                                {req.requestCode || req.requestId}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenModal(req);
                                                }}
                                                className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-[#db011c] hover:bg-[#b00116] rounded shadow-2xs shrink-0"
                                                title="Mở Modal Check In/Out"
                                            >
                                                Modal
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-xs font-bold text-gray-700 truncate max-w-[180px]" title={req.submitterName || '-'}>
                                        {req.submitterName || '-'}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-900 font-semibold truncate max-w-[240px]" title={req.visitors?.[0]?.visitorName || req.submitterName}>
                                        <span>{req.visitors?.[0]?.visitorName || '-'}</span>
                                        {req.filteredVisitors && req.filteredVisitors.length > 0 && (
                                            <span className="text-[11px] text-gray-500 font-bold ml-2">
                                                ({req.filteredVisitors.length} {req.visitorCategory === 'Interviewee' ? 'Candidate(s)' : 'Visitor(s)'})
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase whitespace-nowrap ${getCategoryBadgeClassCustom(req.visitorCategory)}`}>
                                            {req.visitorCategory?.replace(/MIL\/TTI Expat \/ SHTP Business trip/i, 'MIL EXPAT')}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-700 font-medium whitespace-nowrap">
                                        {formatDateShortCustom(req.startDate)} - {formatDateShortCustom(req.endDate)}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-700 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="truncate" title={req.visitingSite}>{req.visitingSite}</span>
                                            <div className="text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr>
                                        <td colSpan={6} className="p-0 border-b border-gray-200 bg-[#f8fafc]">
                                            <div className="p-4 overflow-x-auto">
                                                {req.filteredVisitors && req.filteredVisitors.length > 0 ? (
                                                    <table className="w-full min-w-[1200px] text-left border-collapse bg-white rounded-lg border border-gray-200 shadow-xs">
                                                        <thead>
                                                            <tr className="bg-gray-100 text-gray-600 font-bold text-[9px] uppercase tracking-wider border-b border-gray-200">
                                                                <th className="py-2.5 px-3 w-[125px]">VISITOR CODE</th>
                                                                <th className="py-2.5 px-3 min-w-[140px]">FULL NAME</th>
                                                                <th className="py-2.5 px-3 min-w-[120px]">SUBMITTER</th>
                                                                <th className="py-2.5 px-3 min-w-[100px]">TITLE</th>
                                                                <th className="py-2.5 px-3 min-w-[120px]">COMPANY</th>
                                                                <th className="py-2.5 px-3 text-center w-[155px]">DATE</th>
                                                                <th className="py-2.5 px-3 text-center w-[105px]">CARD NUMBER</th>
                                                                <th className="py-2.5 px-3 text-center w-[125px]">TIME IN</th>
                                                                <th className="py-2.5 px-3 text-center w-[125px]">TIME OUT</th>
                                                                <th className="py-2.5 px-4 text-center w-[160px]">ACTION</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {req.filteredVisitors.map((v: CheckInOutVisitorRecord, vIdx: number) => (
                                                                <tr key={vIdx} className="hover:bg-gray-50/80 transition-colors">
                                                                    <td className="py-2.5 px-3 text-xs font-black text-[#db011c] truncate">{v.visitorCode}</td>
                                                                    <td className="py-2.5 px-3 text-xs font-bold text-gray-900 truncate max-w-[180px]">{v.visitorName}</td>
                                                                    <td className="py-2.5 px-3 text-[11px] font-bold text-gray-700 truncate max-w-[140px]">{req.submitterName || '-'}</td>
                                                                    <td className="py-2.5 px-3 text-[11px] text-gray-600 truncate max-w-[120px]">{v.visitorTitle || '-'}</td>
                                                                    <td className="py-2.5 px-3 text-[11px] font-medium text-gray-600 truncate max-w-[140px]">{v.visitorCompany || req.visitingSite}</td>
                                                                    <td className="py-2.5 px-3 text-[10px] font-medium text-gray-600 text-center whitespace-nowrap">{formatDateShortCustom(req.startDate)} - {formatDateShortCustom(req.endDate)}</td>
                                                                    <td className="py-2.5 px-3 text-center">
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
                                                                    <td className={`py-2.5 px-3 text-[10px] font-bold text-center whitespace-nowrap ${v.checkInTime ? 'text-green-600' : 'text-gray-400'}`}>
                                                                        {formatDateTimeCustom(v.checkInTime)}
                                                                    </td>
                                                                    <td className={`py-2.5 px-3 text-[10px] font-bold text-center whitespace-nowrap ${v.checkOutTime ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        {formatDateTimeCustom(v.checkOutTime)}
                                                                    </td>
                                                                    <td className="py-2.5 px-4 text-center">
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
                                                                                            type="button"
                                                                                            disabled={actionLoading === `${req.requestId}-${v.visitorIndex}`}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                if (window.confirm(`Reset check-in/out status for ${v.visitorName}?`)) {
                                                                                                    onAction(req.requestId, v, 'RESET', req.requestCode);
                                                                                                }
                                                                                            }}
                                                                                            title="Reset Status"
                                                                                            aria-label="Reset Status"
                                                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 cursor-pointer"
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
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="text-sm text-gray-500 py-2">No visitors data available.</div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
