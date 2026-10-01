'use client';

import React from 'react';
import {
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    TrashIcon,
    NoSymbolIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { EmptyState } from '@/components/ui/EmptyState';
import { SheetEmployeeRow } from '@/types/headcount.types';

export interface SheetEditingCell {
    rowId: string;
    header: string;
}

const getStatusColor = (value: unknown, type: 'dl_idl' | 'status' | 'emp_type'): string => {
    const v = String(value || '').toLowerCase().trim();

    if (type === 'dl_idl') {
        if (v === 'dl') return 'bg-blue-100 text-blue-700 border-blue-200';
        if (v === 'idl') return 'bg-purple-100 text-purple-700 border-purple-200';
        if (v === 'staff') return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }

    if (type === 'status') {
        if (v.includes('active')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (v.includes('resign')) return 'bg-red-100 text-red-700 border-red-200';
        if (v.includes('maternity')) return 'bg-pink-100 text-pink-700 border-pink-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }

    if (type === 'emp_type') {
        if (v.includes('official')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        if (v.includes('probation')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }

    return 'bg-gray-50 text-gray-600 border-gray-100';
};

interface SheetManagerTableCoreProps {
    headers: string[];
    rows: SheetEmployeeRow[];
    modifiedRows: Set<string>;
    editingCell: SheetEditingCell | null;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalRecords: number;
    saving: boolean;
    showApprovalOnly?: boolean;
    dateColumns: string[];
    onCellClick: (rowId: string, header: string) => void;
    onCellChange: (rowId: string, header: string, value: string) => void;
    onCellBlur: () => void;
    onAvatarClick: (e: React.MouseEvent, rowId: string) => void;
    onApprovalAction: (rowId: string, action: 'approve' | 'reject') => void;
    onDeleteRow: (rowId: string, empName: string) => void;
    onGoToPage: (page: number) => void;
    formatDate: (val: unknown) => string;
    isLineManagerCol: (header: string) => boolean;
    getAvatarUrl: (empId: unknown) => string;
    getFallbackAvatarUrl: (name: string) => string;
    styles: Record<string, string>;
}

export const SheetManagerTableCore: React.FC<SheetManagerTableCoreProps> = ({
    headers,
    rows,
    modifiedRows,
    editingCell,
    currentPage,
    totalPages,
    itemsPerPage,
    totalRecords,
    saving,
    showApprovalOnly = false,
    dateColumns,
    onCellClick,
    onCellChange,
    onCellBlur,
    onAvatarClick,
    onApprovalAction,
    onDeleteRow,
    onGoToPage,
    formatDate,
    isLineManagerCol,
    getAvatarUrl,
    getFallbackAvatarUrl,
    styles,
}) => {
    return (
        <>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {headers.map((header) => (
                                <th key={header}>{header.replace(/\r\n/g, ' ')}</th>
                            ))}
                            <th className="w-24 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className={modifiedRows.has(row.id) ? styles.modified : ''}>
                                {headers.map((header) => {
                                    const isEditing = editingCell?.rowId === row.id && editingCell?.header === header;
                                    const isLM = isLineManagerCol(header);
                                    const isPending = isLM && row.lineManagerStatus === 'pending';
                                    const rawVal = row[header];

                                    return (
                                        <td
                                            key={`${row.id}-${header}`}
                                            onClick={() => onCellClick(row.id, header)}
                                        >
                                            {isEditing ? (
                                                header === 'DL/IDL/Staff' ? (
                                                    <select
                                                        autoFocus
                                                        value={String(rawVal ?? '')}
                                                        onChange={(e) => onCellChange(row.id, header, e.target.value)}
                                                        onBlur={onCellBlur}
                                                        className={styles.cellInput}
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="DL">DL</option>
                                                        <option value="IDL">IDL</option>
                                                        <option value="Staff">Staff</option>
                                                    </select>
                                                ) : header === 'Status' ? (
                                                    <select
                                                        autoFocus
                                                        value={String(rawVal ?? '')}
                                                        onChange={(e) => onCellChange(row.id, header, e.target.value)}
                                                        onBlur={onCellBlur}
                                                        className={styles.cellInput}
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="Active">Active</option>
                                                        <option value="Active (Probation)">Active (Probation)</option>
                                                        <option value="Resigned">Resigned</option>
                                                        <option value="Maternity">Maternity</option>
                                                    </select>
                                                ) : header === 'Employee\r\n Type' ? (
                                                    <select
                                                        autoFocus
                                                        value={String(rawVal ?? '')}
                                                        onChange={(e) => onCellChange(row.id, header, e.target.value)}
                                                        onBlur={onCellBlur}
                                                        className={styles.cellInput}
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="Official">Official</option>
                                                        <option value="Probation">Probation</option>
                                                        <option value="Contractor">Contractor</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        autoFocus
                                                        value={String(rawVal ?? '')}
                                                        onChange={(e) => onCellChange(row.id, header, e.target.value)}
                                                        onBlur={onCellBlur}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === 'Escape') onCellBlur();
                                                        }}
                                                        className={styles.cellInput}
                                                    />
                                                )
                                            ) : (
                                                <div className={`flex items-center gap-3 min-h-[40px] ${styles.cellContent}`}>
                                                    {/* Avatar for FullName */}
                                                    {header === 'FullName ' && (
                                                        <div
                                                            className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-page)] shadow-sm relative group cursor-pointer"
                                                            onClick={(e) => onAvatarClick(e, row.id)}
                                                            title="Click to change photo"
                                                        >
                                                            <img
                                                                src={row['Employee\r\n Type'] === 'hc_open'
                                                                    ? '/headcount_open.png'
                                                                    : getAvatarUrl(row['Emp ID'])}
                                                                alt=""
                                                                loading="lazy"
                                                                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = getFallbackAvatarUrl(String(row['FullName '] || 'User'));
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                                                                <ArrowPathIcon className="w-4 h-4 text-white" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Cell Content */}
                                                    <div className="flex-grow">
                                                        {(header === 'DL/IDL/Staff' || header === 'Employee\r\n Type' || header === 'Status') ? (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${
                                                                header === 'DL/IDL/Staff'
                                                                    ? getStatusColor(rawVal, 'dl_idl')
                                                                    : header === 'Employee\r\n Type'
                                                                        ? getStatusColor(rawVal, 'emp_type')
                                                                        : getStatusColor(rawVal, 'status')
                                                            }`}>
                                                                {String(rawVal ?? '')}
                                                            </span>
                                                        ) : (
                                                            <span className={`block truncate ${header === 'FullName ' ? 'font-semibold text-[var(--color-text-title)]' : ''}`}>
                                                                {dateColumns.includes(header) ? formatDate(rawVal) : String(rawVal ?? '')}
                                                            </span>
                                                        )}

                                                        {/* Pending Review Info */}
                                                        {isPending && (
                                                            <div className="mt-1 p-1 bg-amber-50 rounded border border-amber-100 inline-block">
                                                                <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                                                                    <ArrowPathIcon className="w-3 h-3 animate-spin" />
                                                                    → {row.pendingLineManager}
                                                                </span>
                                                                {row.requester && (
                                                                    <span className="text-[9px] text-[var(--color-text-muted)] italic block mt-0.5 px-0.5">
                                                                        by {row.requester}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {showApprovalOnly && (
                                            <>
                                                <button
                                                    onClick={() => onApprovalAction(row.id, 'approve')}
                                                    disabled={saving}
                                                    className="p-1 text-green-500 hover:bg-green-50 rounded"
                                                    title="Approve"
                                                >
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onApprovalAction(row.id, 'reject')}
                                                    disabled={saving}
                                                    className="p-1 text-orange-500 hover:bg-orange-50 rounded"
                                                    title="Reject"
                                                >
                                                    <NoSymbolIcon className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteRow(row.id, String(row['FullName '] || row.id));
                                            }}
                                            disabled={saving}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Delete Employee"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={headers.length + 1} className="py-12">
                                    <EmptyState
                                        title="No records found"
                                        description="No employee records found matching your filters in this sheet."
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.pagination}>
                <div className="flex items-center justify-between px-4">
                    <div className={styles.toolbarInfo}>
                        Showing <strong>{rows.length}</strong> of <strong>{itemsPerPage}</strong> per page
                        {totalRecords > 0 && <span className="ml-2 text-[var(--color-text-muted)]">({totalRecords} total)</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onGoToPage(1)}
                            disabled={currentPage === 1}
                            className="p-1.5 border border-[var(--color-border)] rounded disabled:opacity-30 hover:bg-[var(--color-bg-page)] text-[var(--color-text-body)]"
                        >
                            <ChevronDoubleLeftIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onGoToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 border border-[var(--color-border)] rounded disabled:opacity-30 hover:bg-[var(--color-bg-page)] text-[var(--color-text-body)]"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 bg-[var(--color-bg-page)] rounded font-medium text-[var(--color-text-body)] border border-[var(--color-border)]">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => onGoToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-1.5 border border-[var(--color-border)] rounded disabled:opacity-30 hover:bg-[var(--color-bg-page)] text-[var(--color-text-body)]"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onGoToPage(totalPages)}
                            disabled={currentPage >= totalPages}
                            className="p-1.5 border border-[var(--color-border)] rounded disabled:opacity-30 hover:bg-[var(--color-bg-page)] text-[var(--color-text-body)]"
                        >
                            <ChevronDoubleRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SheetManagerTableCore;
