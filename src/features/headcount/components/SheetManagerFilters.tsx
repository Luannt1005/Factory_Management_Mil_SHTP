'use client';

import React from 'react';

interface SheetManagerFiltersProps {
    filters: Record<string, string>;
    filterColumns: string[];
    onFilterChange: (header: string, value: string) => void;
    onClearFilters: () => void;
    styles: Record<string, string>;
}

export const SheetManagerFilters: React.FC<SheetManagerFiltersProps> = ({
    filters,
    filterColumns,
    onFilterChange,
    onClearFilters,
    styles,
}) => {
    return (
        <div className={styles.filterBox}>
            <div className={styles.filterRow}>
                {filterColumns.map((header) => {
                    const isDLType = header === 'DL/IDL/Staff';
                    return (
                        <div key={header} className={styles.filterInputWrapper}>
                            <label className={styles.filterLabel}>{header.replace(/\r\n/g, ' ')}</label>
                            {isDLType ? (
                                <select
                                    value={filters[header] || ''}
                                    onChange={(e) => onFilterChange(header, e.target.value)}
                                    className={styles.filterInput}
                                >
                                    <option value="">All</option>
                                    <option value="DL">DL</option>
                                    <option value="IDL">IDL</option>
                                    <option value="Staff">Staff</option>
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={filters[header] || ''}
                                    onChange={(e) => onFilterChange(header, e.target.value)}
                                    className={styles.filterInput}
                                />
                            )}
                        </div>
                    );
                })}
                <div className="flex items-end">
                    <button
                        onClick={onClearFilters}
                        className={styles.btnReset}
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SheetManagerFilters;
