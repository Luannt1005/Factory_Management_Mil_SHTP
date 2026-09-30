'use client';

import { useEffect, useState, useCallback, useMemo, startTransition } from "react";
import {
    PlusIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    XMarkIcon,
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import styles from "./sheet.module.css";
import useSWR from 'swr';
import { swrFetcher } from '@/lib/api-client';
import { headcountApi } from "@/features/headcount/services/headcountApi";
import { HeadcountOpenFilters } from "@/features/headcount/components/HeadcountOpenFilters";
import { HeadcountOpenTable } from "@/features/headcount/components/HeadcountOpenTable";
import HeadcountAddModal from "./HeadcountAddModal";
import HeadcountEditModal from "./HeadcountEditModal";

interface SheetRow {
    id: string;
    [key: string]: any;
}

interface EditingCell {
    rowId: string;
    header: string;
}

// Configuration: Fetch large number to simulate "All" for client-side grouping
const ITEMS_PER_PAGE = 2000;

const VISIBLE_COLUMNS = [
    "Quantity",
    "Job Title",
    "Dept",
    "Line Manager",
    "Is Direct",
    "Cost Center",
    "Joining\r\n Date",
    "FullName ",
    "Status",
    "Location",
    "DL/IDL/Staff",
];

// Columns for the "Add Headcount" form
const ADD_FORM_COLUMNS = [
    "Job Title",
    "Dept",
    "BU Org 3",
    "Cost Center",
    "Line Manager",
    "Is Direct",
    "Joining\r\n Date",
    "Location",
    "DL/IDL/Staff",
    "Last Working\r\nDay"
];

const DATE_COLUMNS = ["Joining\r\n Date", "Last Working\r\nDay"];

const FILTER_COLUMNS = [
    "Dept",
    "BU Org 3",
    "Job Title",
    "DL/IDL/Staff"
];

// Helper functions
const normalizeFieldName = (fieldName: string): string => {
    return fieldName.replace(/[~*\/\[\]]/g, '_');
};

const denormalizeFieldName = (fieldName: string): string => {
    const mapping: { [key: string]: string } = {
        'DL_IDL_Staff': 'DL/IDL/Staff',
    };
    return mapping[fieldName] || fieldName;
};

const formatDate = (value: any): string => {
    if (!value) return "";
    try {
        if (typeof value === 'string' && value.includes('T')) {
            const date = new Date(value);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
            return value;
        }
        return String(value);
    } catch {
        return String(value);
    }
};

const formatDateToISO = (value: string): string => {
    if (!value) return "";
    try {
        if (value.includes('T')) return value;
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
            const [day, month, year] = value.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return date.toISOString();
        }
        return value;
    } catch {
        return value;
    }
};

interface GroupedRow extends SheetRow {
    ids: string[];
    count: number;
    isGroup: true;
}

const HeadcountManager = () => {

    const [currentPage, setCurrentPage] = useState(1);
    const [headers, setHeaders] = useState<string[]>(VISIBLE_COLUMNS);
    const [rows, setRows] = useState<SheetRow[]>([]);
    const [originalRows, setOriginalRows] = useState<SheetRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [debouncedFilters, setDebouncedFilters] = useState<{ [key: string]: string }>({});

    // Inline editing state (kept for compatibility, though we encourage Modal)
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GroupedRow | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilters(filters);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [filters]);

    // ======= DATA FETCHING =======
    const queryParams = new URLSearchParams();
    queryParams.set('page', currentPage.toString());
    queryParams.set('limit', ITEMS_PER_PAGE.toString());
    queryParams.set('employee_type', 'hc_open');

    Object.entries(debouncedFilters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
            queryParams.set(key, value.trim());
        }
    });

    const apiUrl = headcountApi.buildSheetQueryUrl(queryParams);

    const { data: apiResult, error: swrError, mutate, isLoading, isValidating } = useSWR(
        apiUrl,
        swrFetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 5000,
            revalidateIfStale: true,
            keepPreviousData: true,
        }
    );

    useEffect(() => {
        if (apiResult?.success && modifiedRows.size === 0) {
            startTransition(() => {
                setRows(apiResult.data || []);
                requestIdleCallback?.(() => {
                    setOriginalRows(structuredClone?.(apiResult.data || []) || JSON.parse(JSON.stringify(apiResult.data || [])));
                }) ?? setTimeout(() => {
                    setOriginalRows(structuredClone?.(apiResult.data || []) || JSON.parse(JSON.stringify(apiResult.data || [])));
                }, 0);
            });
        } else if (apiResult?.error) {
            setError(apiResult.error);
        }
    }, [apiResult, modifiedRows.size]);

    useEffect(() => {
        if (swrError) setError(swrError.message || "Network error");
    }, [swrError]);

    const handleFilterChange = (header: string, value: string) => {
        setFilters((prev) => ({ ...prev, [header]: value }));
    };

    // ======= GROUPING LOGIC =======
    const groupedRows = useMemo(() => {
        const groups: { [key: string]: GroupedRow } = {};

        rows.forEach(row => {
            // Create a key based on visible columns (excluding Quantity which is derived, and excluding specific per-row IDs)
            // We include typical grouping fields
            const groupKeyObj = {
                title: row["Job Title"],
                dept: row["Dept"],
                manager: row["Line Manager"],
                direct: row["Is Direct"],
                cost: row["Cost Center"],
                join: row["Joining\r\n Date"],
                name: row["FullName "],
                loc: row["Location"],
                status: row["Status"]
            };
            const groupKey = JSON.stringify(groupKeyObj);

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    ...row,
                    id: `group-${groupKey}-${row.id}`, // Fake ID for the group row
                    ids: [row.id],
                    count: 1,
                    isGroup: true
                };
            } else {
                groups[groupKey].ids.push(row.id);
                groups[groupKey].count++;
            }
        });

        return Object.values(groups);
    }, [rows]);

    const handleCellClick = (rowId: string, header: string) => {
        if (header === 'Quantity') return; // Cannot edit quantity directly
        setEditingCell({ rowId, header });
    };

    // Inline edit handler (updates local state)
    const handleCellChange = (groupRowId: string, header: string, value: string) => {
        // Find the group
        const group = groupedRows.find(g => g.id === groupRowId);
        if (!group) return;

        // Determine which rows to update (ALL rows in the group)
        const idsToUpdate = group.ids;

        setRows((prev) =>
            prev.map((row) => idsToUpdate.includes(row.id) ? { ...row, [header]: value } : row)
        );

        // Mark all underlying rows as modified
        setModifiedRows((prev) => {
            const next = new Set(prev);
            idsToUpdate.forEach(id => next.add(id));
            return next;
        });
    };

    const handleAddRow = () => setShowAddModal(true);

    // Prepare for Edit Modal
    const handleEditGroup = (group: GroupedRow) => {
        setEditingGroup(group);
        setShowEditModal(true);
    };

    const handleSaveHeadcount = async (formData: any, quantity: number) => {
        try {
            const dataToSave: any = {};
            Object.keys(formData).forEach(key => {
                let value = formData[key] || "";
                if (DATE_COLUMNS.includes(key) && value) {
                    if (/\d{4}-\d{2}-\d{2}/.test(value)) {
                        dataToSave[key] = new Date(value).toISOString();
                    } else {
                        dataToSave[key] = value;
                    }
                } else {
                    dataToSave[key] = value;
                }
            });

            dataToSave['employee_type'] = 'hc_open';

            const result = await headcountApi.bulkAddHeadcount(quantity, dataToSave);
            if (result.success) {
                setSuccessMessage(`✅ Added ${result.count || quantity} open positions successfully`);
                await mutate();
                setTimeout(() => setSuccessMessage(null), 3000);
                return true;
            } else {
                setError(result.error || "Failed to create headcount");
                return false;
            }
        } catch (err) {
            console.error(err);
            setError("Network error while adding headcount");
            return false;
        }
    };

    // Save Handler for Edit Modal (Immediate Update)
    const handleSaveEditedGroup = async (formData: any, newQuantity?: number): Promise<boolean> => {
        if (!editingGroup) return false;

        try {
            const dataToSave: any = {};
            // Prepare data payload
            Object.keys(formData).forEach(key => {
                let value = formData[key] || "";
                if (DATE_COLUMNS.includes(key) && value) {
                    if (/\d{4}-\d{2}-\d{2}/.test(value)) {
                        dataToSave[key] = new Date(value).toISOString();
                    } else {
                        dataToSave[key] = value;
                    }
                } else {
                    dataToSave[key] = value;
                }
            });

            const currentCount = editingGroup.ids.length;
            // Use provided newQuantity or fall back to current
            const targetQuantity = (newQuantity !== undefined && newQuantity !== null) ? newQuantity : currentCount;

            // 1. Identify IDs to update (Keep)
            const idsToKeep = targetQuantity >= currentCount
                ? editingGroup.ids
                : editingGroup.ids.slice(0, targetQuantity);

            // 2. Identify IDs to delete (Excess)
            const idsToDelete = targetQuantity < currentCount
                ? editingGroup.ids.slice(targetQuantity)
                : [];

            // 3. Calculate how many to ADD
            const quantityToAdd = targetQuantity > currentCount
                ? targetQuantity - currentCount
                : 0;

            console.log(`Update: Keep ${idsToKeep.length}, Delete ${idsToDelete.length}, Add ${quantityToAdd}`);

            // === EXECUTE REQUESTS ===
            const promises: Promise<unknown>[] = [];

            // A. Update existing records
            idsToKeep.forEach(id => {
                promises.push(
                    headcountApi.updateEmployee(id, dataToSave)
                );
            });

            // B. Delete excess records
            idsToDelete.forEach(id => {
                promises.push(
                    headcountApi.deleteEmployee(id)
                );
            });

            // C. Add new records
            if (quantityToAdd > 0) {
                // Force employee_type
                dataToSave['employee_type'] = 'hc_open';
                promises.push(
                    headcountApi.bulkAddHeadcount(quantityToAdd, dataToSave)
                );
            }

            // Wait for all operations
            await Promise.all(promises);

            setSuccessMessage(`✅ Successfully updated position(s).`);
            setEditingGroup(null); // Clear editing state
            await mutate();
            setTimeout(() => setSuccessMessage(null), 3000);
            return true;

        } catch (err) {
            console.error(err);
            setError("Network error while updating headcount");
            return false;
        }
    };

    const handleSaveAll = async () => {
        if (modifiedRows.size === 0) return;
        setSaving(true);
        setError(null);
        let successCount = 0;

        try {
            for (const rowId of modifiedRows) {
                const row = rows.find((r) => r.id === rowId);
                const originalRow = originalRows.find((r) => r.id === rowId);
                if (!row || !originalRow) continue;

                const dataToSave: { [key: string]: any } = {};

                // Use VISIBLE_COLUMNS minus Quantity plus whatever else we need
                const allDirectCols = [...VISIBLE_COLUMNS, "Emp ID", "Last Working\r\nDay"].filter(c => c !== "Quantity");

                allDirectCols.forEach((header) => {
                    let value = row[header] || "";
                    if (DATE_COLUMNS.includes(header)) {
                        value = formatDateToISO(value);
                    }
                    dataToSave[header] = value;
                });

                const result = await headcountApi.updateEmployee(rowId, dataToSave);
                if (result.success) successCount++;
            }

            setSuccessMessage(`Successfully updated ${successCount} records.`);
            setModifiedRows(new Set());
            await mutate();
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGroup = async (group: GroupedRow) => {
        const count = group.ids.length;

        let deleteIds: string[] = [];

        if (count > 1) {
            const input = window.prompt(`Delete Options:\n\n- To delete ALL ${count} positions, type "ALL"\n- To delete ONE position, type "1" (or leave empty)`);
            if (input === null) return; // Cancel

            if (input.toUpperCase() === 'ALL') {
                if (!window.confirm(`⚠️ Confirm DELETE ALL ${count} positions?`)) return;
                deleteIds = group.ids;
            } else {
                // Delete just one (the last one usually, LIFO)
                deleteIds = [group.ids[group.ids.length - 1]];
            }
        } else {
            if (!window.confirm("Confirm delete this position?")) return;
            deleteIds = group.ids;
        }

        setSaving(true);
        try {
            let deleted = 0;

            // Simple parallel delete for better speed
            const deletePromises = deleteIds.map(id => headcountApi.deleteEmployee(id));
            await Promise.all(deletePromises);
            deleted = deletePromises.length;

            setSuccessMessage(`Deleted ${deleted} position(s).`);
            await mutate();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError("Error deleting positions");
        } finally {
            setSaving(false);
        }
    };

    if (isLoading && rows.length === 0) {
        return (
            <div className={styles.spinner}>
                <ArrowPathIcon className="w-12 h-12 text-[#DB011C] animate-spin mx-auto mb-4" />
                <span>Loading headcount data...</span>
                {isValidating && (
                    <p className="text-xs text-gray-500 mt-2 max-w-md text-center">
                        ⏱️ First request may take up to 60 seconds due to database cold start
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header Buttons (Title moved to layout header) */}
            <div className="flex items-center justify-end gap-3 mb-4">
                <div className="flex-1 flex items-center gap-2">
                    {isValidating && (
                        <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleAddRow} className={styles.btnCreate}>
                        <PlusIcon className="w-4 h-4 inline mr-1" />
                        Add Headcount
                    </button>

                    <button
                        onClick={handleSaveAll}
                        disabled={saving || modifiedRows.size === 0}
                        className={styles.btnSaveAll}
                    >
                        {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin inline mr-1" /> : <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />}
                        Save ({modifiedRows.size})
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {error && (
                    <div className={styles.error}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ExclamationCircleIcon className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                            <button onClick={() => setError(null)}><XMarkIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                )}
                {successMessage && (
                    <div className={styles.successMessage}>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>{successMessage}</span>
                        </div>
                    </div>
                )}

                <HeadcountOpenFilters
                    filters={filters}
                    filterColumns={FILTER_COLUMNS}
                    onFilterChange={handleFilterChange}
                    onClearFilters={() => setFilters({})}
                    styles={styles}
                />

                <HeadcountOpenTable
                    groupedRows={groupedRows}
                    visibleColumns={VISIBLE_COLUMNS}
                    dateColumns={DATE_COLUMNS}
                    modifiedRows={modifiedRows}
                    editingCell={editingCell}
                    isLoading={isLoading}
                    totalRawRows={rows.length}
                    onCellClick={handleCellClick}
                    onCellChange={handleCellChange}
                    onCellBlur={() => setEditingCell(null)}
                    onEditGroup={handleEditGroup}
                    onDeleteGroup={handleDeleteGroup}
                    formatDate={formatDate}
                    styles={styles}
                />

            </div>

            <HeadcountAddModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleSaveHeadcount}
                columns={ADD_FORM_COLUMNS}
            />

            <HeadcountEditModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleSaveEditedGroup}
                initialData={editingGroup}
                columns={ADD_FORM_COLUMNS}
                count={editingGroup?.count || 0}
            />
        </div>
    );
};

export default HeadcountManager;
