'use client';

import React from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { GroupedHeadcountRow } from '@/types/headcount.types';

export interface HeadcountEditingCell {
    rowId: string;
    header: string;
}

interface HeadcountOpenTableProps<T extends GroupedHeadcountRow = GroupedHeadcountRow> {
    groupedRows: T[];
    visibleColumns: string[];
    dateColumns: string[];
    modifiedRows: Set<string>;
    editingCell: HeadcountEditingCell | null;
    isLoading: boolean;
    totalRawRows: number;
    onCellClick: (rowId: string, header: string) => void;
    onCellChange: (groupRowId: string, header: string, value: string) => void;
    onCellBlur: () => void;
    onEditGroup: (group: T) => void;
    onDeleteGroup: (group: T) => void;
    formatDate: (val: unknown) => string;
    styles: Record<string, string>;
}

export function HeadcountOpenTable<T extends GroupedHeadcountRow = GroupedHeadcountRow>({
    groupedRows,
    visibleColumns,
    dateColumns,
    modifiedRows,
    editingCell,
    isLoading,
    totalRawRows,
    onCellClick,
    onCellChange,
    onCellBlur,
    onEditGroup,
    onDeleteGroup,
    formatDate,
    styles,
}: HeadcountOpenTableProps<T>) {
    return (
        <>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {visibleColumns.map((header) => (
                                <th key={header}>{header.replace(/\r\n/g, ' ')}</th>
                            ))}
                            <th className="w-24 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedRows.map((row) => (
                            <tr key={row.id} className={row.ids.some(id => modifiedRows.has(id)) ? styles.modified : ''}>
                                {visibleColumns.map((header) => {
                                    const isEditing = editingCell?.rowId === row.id && editingCell?.header === header;
                                    const isQuantity = header === 'Quantity';
                                    const rawVal = row[header];

                                    return (
                                        <td
                                            key={`${row.id}-${header}`}
                                            onClick={() => onCellClick(row.id, header)}
                                        >
                                            {isEditing ? (
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
                                            ) : (
                                                <div className={styles.cellContent}>
                                                    {isQuantity ? (
                                                        <span className="inline-flex items-center justify-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">
                                                            {row.count ?? row.quantity}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {dateColumns.includes(header)
                                                                ? formatDate(rawVal)
                                                                : String(rawVal ?? '')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="text-center whitespace-nowrap px-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditGroup(row);
                                            }}
                                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                            title="Edit Details"
                                        >
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteGroup(row);
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete Position(s)"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {groupedRows.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={visibleColumns.length + 1} className="text-center py-8 text-gray-500">
                                    No open headcount positions found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-xs text-gray-400 text-center">
                Showing {groupedRows.length} grouped positions from {totalRawRows} total entries.
            </div>
        </>
    );
}

export default HeadcountOpenTable;
