'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ExcelColumnFilterProps {
    title: string;
    allValues: (string | null | undefined)[];
    selectedValues: string[];
    onFilterChange: (selected: string[]) => void;
    align?: 'left' | 'right';
}

// Excel-style dropdown column filter component
export function ExcelColumnFilter({
    title,
    allValues,
    selectedValues,
    onFilterChange,
    align = 'left'
}: ExcelColumnFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Extract unique values
    const uniqueValues = useMemo(() => {
        const set = new Set<string>();
        for (const v of allValues) {
            if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
                set.add('(Blanks)');
            } else {
                set.add(String(v).trim());
            }
        }
        return Array.from(set).sort((a, b) => {
            if (a === '(Blanks)') return 1;
            if (b === '(Blanks)') return -1;
            return a.localeCompare(b);
        });
    }, [allValues]);

    const isFiltered = selectedValues.length > 0;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            let left = rect.left;
            if (align === 'right' || left + 230 > window.innerWidth) {
                left = Math.max(10, rect.right - 230);
            }
            let top = rect.bottom + 4;
            if (top + 280 > window.innerHeight) {
                top = Math.max(10, rect.top - 280);
            }
            setCoords({ top, left });
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onFilterChange([]); // Show all
        } else {
            onFilterChange(['__NONE__']); // Show none
        }
    };

    const handleToggleValue = (val: string) => {
        if (!isFiltered) {
            // Unchecking this val when initially all were active
            const remaining = uniqueValues.filter(v => v !== val);
            onFilterChange(remaining.length === 0 ? ['__NONE__'] : remaining);
        } else {
            if (selectedValues.includes('__NONE__')) {
                onFilterChange([val]);
            } else if (selectedValues.includes(val)) {
                const updated = selectedValues.filter(v => v !== val);
                onFilterChange(updated.length === 0 ? ['__NONE__'] : updated);
            } else {
                const updated = [...selectedValues, val];
                if (updated.length === uniqueValues.length) {
                    onFilterChange([]); // All selected = clear filter
                } else {
                    onFilterChange(updated);
                }
            }
        }
    };

    const isAllSelected = !isFiltered;

    return (
        <div className="inline-flex items-center gap-1.5 text-left">
            <span className="font-bold text-gray-700 text-xs uppercase tracking-wider select-none truncate" title={title}>
                {title}
            </span>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
                className={`p-1 rounded transition-all inline-flex items-center justify-center flex-shrink-0 ${
                    isFiltered
                        ? 'bg-[#db011c] text-white shadow-sm ring-2 ring-red-200'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/80'
                }`}
                title={`Filter ${title}`}
            >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            {isOpen && coords && typeof document !== 'undefined' && createPortal(
                <div
                    ref={popoverRef}
                    style={{ position: 'fixed', top: `${coords.top}px`, left: `${coords.left}px`, zIndex: 99999 }}
                    className="w-56 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 text-xs text-gray-700 font-normal select-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header in popover */}
                    <div className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2 flex items-center justify-between">
                        <span className="truncate">Filter: {title}</span>
                        {isFiltered && (
                            <span className="text-[10px] bg-red-100 text-[#db011c] px-1.5 py-0.5 rounded font-bold">Active</span>
                        )}
                    </div>

                    {/* Options list without search */}
                    <div className="max-h-56 overflow-y-auto space-y-1 mb-2 pr-1 py-0.5">
                        <label className="flex items-center gap-2 px-1.5 py-1 hover:bg-gray-50 rounded-md cursor-pointer font-bold text-gray-900 select-none">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="rounded text-[#db011c] focus:ring-red-500 w-3.5 h-3.5"
                            />
                            <span>(Select All)</span>
                        </label>

                        {uniqueValues.map((val) => {
                            const checked = isAllSelected || selectedValues.includes(val);
                            return (
                                <label key={val} className="flex items-center gap-2 px-1.5 py-1 hover:bg-gray-50 rounded-md cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleToggleValue(val)}
                                        className="rounded text-[#db011c] focus:ring-red-500 w-3.5 h-3.5"
                                    />
                                    <span className="truncate text-gray-700" title={val}>{val}</span>
                                </label>
                            );
                        })}

                        {uniqueValues.length === 0 && (
                            <div className="text-center py-3 text-gray-400">No items available</div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => {
                                onFilterChange([]);
                                setIsOpen(false);
                            }}
                            className="text-[11px] font-bold text-red-600 hover:text-red-800 underline"
                        >
                            Clear Filter
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="bg-[#db011c] text-white px-3.5 py-1 rounded-lg font-bold text-[11px] hover:bg-[#b90118] shadow-sm transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
