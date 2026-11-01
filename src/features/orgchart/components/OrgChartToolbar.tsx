"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';

/** An employee the toolbar can jump to */
export interface EmployeeOption {
    id: string;
    name: string;
    title: string;
    dept: string;
}

export interface OrgChartToolbarProps {
    currentSector: string;
    currentType: string;
    groups: unknown[];
    employees?: EmployeeOption[];
    loading?: boolean;
    hasNodes?: boolean;
    onSelect: (sector: string) => void;
    onSelectType: (type: string) => void;
    onFocusEmployee?: (id: string) => void;
    onReset?: () => void;
    /** Name of the person whose organization the chart is limited to */
    scopeLabel?: string;
    /** True while only that organization is shown */
    scoped?: boolean;
    /** Employees outside that organization */
    outsideCount?: number;
    onToggleScope?: (scoped: boolean) => void;
}

const MAX_SUGGESTIONS = 8;

/** Lower case without Vietnamese accents, so "nguyen" finds "Nguyễn" */
const fold = (value: string): string =>
    value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

const trimZeros = (value: string): string => value.trim().replace(/^0+/, '');

const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-mwk' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
);

const controlClass = (active: boolean) =>
    `flex items-center gap-2 w-full h-9 px-3 bg-[var(--color-bg-card)] border rounded-lg transition-all duration-150 ${active
        ? 'border-mwk ring-2 ring-mwk/10'
        : 'border-gray-200 hover:border-gray-300'
    }`;

const panelClass = "absolute top-full left-0 mt-1 w-full min-w-[260px] bg-[var(--color-bg-card)] border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden";

/** Search box with suggestions; picking one jumps the chart to that employee */
function EmployeeSearch({
    mode,
    employees,
    onPick
}: {
    mode: 'id' | 'name';
    employees: EmployeeOption[];
    onPick: (id: string) => void;
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutside = (event: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const matches = useMemo(() => {
        const q = query.trim();
        if (!q) return [];
        if (mode === 'id') {
            const id = trimZeros(q);
            if (!id) return [];
            const exact = employees.filter(e => trimZeros(e.id) === id);
            const starts = employees.filter(e => trimZeros(e.id) !== id && trimZeros(e.id).startsWith(id));
            return [...exact, ...starts].slice(0, MAX_SUGGESTIONS);
        }
        const words = fold(q).split(/\s+/).filter(Boolean);
        return employees
            .filter(e => {
                const name = fold(e.name);
                return words.every(w => name.includes(w));
            })
            .slice(0, MAX_SUGGESTIONS);
    }, [query, mode, employees]);

    const pick = (employee: EmployeeOption) => {
        setQuery(mode === 'id' ? employee.id : employee.name);
        setOpen(false);
        onPick(employee.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setHighlight(h => Math.min(h + 1, Math.max(matches.length - 1, 0)));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight(h => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (matches[highlight]) pick(matches[highlight]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const placeholder = mode === 'id' ? 'Employee ID' : 'Employee name';

    return (
        <div className="relative" ref={boxRef}>
            <div className={controlClass(open && query.trim() !== '')}>
                <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                    type="text"
                    inputMode={mode === 'id' ? 'numeric' : 'text'}
                    value={query}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full min-w-0 bg-transparent text-sm font-semibold text-[var(--color-text-title)] placeholder:font-medium placeholder:text-gray-400 focus:outline-none"
                />
                {query && (
                    <button
                        type="button"
                        aria-label="Clear"
                        onClick={() => { setQuery(''); setOpen(false); }}
                        className="shrink-0 text-gray-400 hover:text-mwk cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {open && query.trim() !== '' && (
                <div className={panelClass}>
                    {matches.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-[var(--color-text-muted)]">No employee found</p>
                    ) : (
                        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                            {matches.map((employee, index) => (
                                <button
                                    key={employee.id}
                                    type="button"
                                    onMouseEnter={() => setHighlight(index)}
                                    onClick={() => pick(employee)}
                                    className={`w-full px-3 py-2 text-left flex items-center gap-3 border-t border-gray-100 first:border-t-0 cursor-pointer ${index === highlight ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                                >
                                    <span className="shrink-0 min-w-[64px] px-1.5 py-0.5 rounded bg-gray-100 text-[11px] font-bold text-gray-600 text-center tabular-nums">
                                        {employee.id}
                                    </span>
                                    <span className="min-w-0">
                                        <span className={`block text-xs font-bold truncate ${index === highlight ? 'text-mwk' : 'text-[var(--color-text-title)]'}`}>{employee.name}</span>
                                        <span className="block text-[11px] text-[var(--color-text-muted)] truncate">
                                            {[employee.title, employee.dept].filter(Boolean).join(' · ')}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function OrgChartToolbar({
    currentSector,
    currentType,
    groups,
    employees = [],
    loading = false,
    hasNodes = false,
    onSelect,
    onSelectType,
    onFocusEmployee,
    onReset,
    scopeLabel,
    scoped = false,
    outsideCount = 0,
    onToggleScope
}: OrgChartToolbarProps) {
    const [activeDropdown, setActiveDropdown] = useState<'dept' | 'type' | null>(null);
    const [sectorQuery, setSectorQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter valid groups
    const sectorRegistry = useMemo(() => {
        return (groups || []).filter((g): g is string => typeof g === 'string' && g.trim() !== '');
    }, [groups]);

    const typeOptions = ['Staff', 'IDL'];

    // Handle clicking outside to close
    useEffect(() => {
        const handleOutsideInteraction = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleOutsideInteraction);
        return () => document.removeEventListener("mousedown", handleOutsideInteraction);
    }, []);

    // Helper for selection
    const handleSelect = (sector: string) => {
        setActiveDropdown(null);
        onSelect(sector);
    };

    const handleTypeToggle = (type: string) => {
        if (type === 'all') {
            onSelectType('all');
            setActiveDropdown(null);
            return;
        }

        const current = currentType === 'all' ? [] : currentType.split(',');
        let next: string[] = [];
        if (current.includes(type)) {
            next = current.filter(t => t !== type);
        } else {
            next = [...current, type];
        }

        if (next.length === 0) {
            onSelectType('all');
        } else {
            onSelectType(next.join(','));
        }
    };

    // Filter list based on search
    const filteredSectors = sectorRegistry.filter(s =>
        fold(s).includes(fold(sectorQuery))
    );

    const selectedTypeCount = currentType === 'all' ? 0 : currentType.split(',').length;
    const hasActiveFilters = currentSector !== 'all' || currentType !== 'all';
    const canSearch = hasNodes && employees.length > 0 && !!onFocusEmployee;

    return (
        <div className="w-full bg-[var(--color-bg-card)] border-b border-gray-200 shadow-sm top-0 z-50">
            <div className="px-4 py-2.5">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-2">

                    {/* Find employee */}
                    {canSearch && (
                        <>
                            <div className="w-full sm:w-36">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-0.5">ID</label>
                                <EmployeeSearch mode="id" employees={employees} onPick={onFocusEmployee} />
                            </div>
                            <div className="w-full sm:w-60">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-0.5">Name</label>
                                <EmployeeSearch mode="name" employees={employees} onPick={onFocusEmployee} />
                            </div>
                            <div className="hidden sm:block self-stretch w-px bg-gray-200 mx-1" />
                        </>
                    )}

                    <div className="contents" ref={dropdownRef}>
                        {/* Department Filter */}
                        <div className="relative w-full sm:w-72">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-0.5">Department</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'dept' ? null : 'dept')}
                                className={`${controlClass(activeDropdown === 'dept')} justify-between cursor-pointer`}
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentSector === "all" ? 'bg-gray-300' : 'bg-mwk'}`}></span>
                                    <span className="text-sm font-semibold text-[var(--color-text-title)] truncate">
                                        {currentSector === "all" ? "All Departments" : currentSector}
                                    </span>
                                </span>
                                <ChevronIcon open={activeDropdown === 'dept'} />
                            </button>

                            {activeDropdown === 'dept' && (
                                <div className={panelClass}>
                                    <div className="p-2 border-b border-gray-100">
                                        <input
                                            type="text"
                                            placeholder="Search department..."
                                            value={sectorQuery}
                                            onChange={(e) => setSectorQuery(e.target.value)}
                                            autoFocus
                                            className="w-full h-8 bg-gray-50 border border-gray-200 px-3 text-xs text-[var(--color-text-body)] rounded-md focus:outline-none focus:border-mwk focus:bg-[var(--color-bg-card)] placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                                        <button type="button" onClick={() => handleSelect("all")} className={`w-full px-4 py-2 text-left text-xs font-semibold flex justify-between cursor-pointer ${currentSector === "all" ? "bg-red-50 text-mwk" : "text-[var(--color-text-body)] hover:bg-gray-50"}`}>
                                            <span>All Departments</span>
                                            {currentSector === "all" && <span className="w-1.5 h-1.5 rounded-full bg-mwk self-center"></span>}
                                        </button>
                                        {filteredSectors.map((sector) => (
                                            <button type="button" key={sector} onClick={() => handleSelect(sector)} className={`w-full px-4 py-2 text-left text-xs font-semibold flex justify-between border-t border-gray-100 cursor-pointer ${currentSector === sector ? "bg-red-50 text-mwk" : "text-[var(--color-text-body)] hover:bg-gray-50"}`}>
                                                <span className="truncate pr-4">{sector}</span>
                                                {currentSector === sector && <span className="w-1.5 h-1.5 rounded-full bg-mwk self-center shrink-0"></span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Type Filter */}
                        <div className="relative w-full sm:w-40">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-0.5">Type</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                                className={`${controlClass(activeDropdown === 'type')} justify-between cursor-pointer`}
                            >
                                <span className="text-sm font-semibold text-[var(--color-text-title)] truncate">
                                    {currentType === "all"
                                        ? "All Types"
                                        : selectedTypeCount > 1
                                            ? `${selectedTypeCount} Selected`
                                            : currentType}
                                </span>
                                <ChevronIcon open={activeDropdown === 'type'} />
                            </button>

                            {activeDropdown === 'type' && (
                                <div className={`${panelClass} min-w-0`}>
                                    <button type="button" onClick={() => handleTypeToggle("all")} className={`w-full px-4 py-2 text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${currentType === "all" ? "bg-red-50 text-mwk" : "text-[var(--color-text-body)] hover:bg-gray-50"}`}>
                                        <span>All Types</span>
                                        {currentType === "all" && <span className="w-1.5 h-1.5 rounded-full bg-mwk"></span>}
                                    </button>
                                    {typeOptions.map((type) => {
                                        const isSelected = currentType.split(',').includes(type);
                                        return (
                                            <button type="button" key={type} onClick={() => handleTypeToggle(type)} className={`w-full px-4 py-2 text-left text-xs font-semibold flex items-center justify-between border-t border-gray-100 cursor-pointer ${isSelected ? "bg-red-50 text-mwk" : "text-[var(--color-text-body)] hover:bg-gray-50"}`}>
                                                <span>{type}</span>
                                                <span className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-mwk border-mwk' : 'border-gray-300'}`}>
                                                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Organization scope: Lee Hon Kay's branch only, or everyone */}
                    {onToggleScope && (
                        <div className="w-full sm:w-auto">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-0.5">Scope</label>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={scoped}
                                onClick={() => onToggleScope(!scoped)}
                                title={scoped
                                    ? `Showing only the organization under ${scopeLabel}. Click to also show the ${outsideCount} people outside it.`
                                    : `Showing everyone. Click to keep only the organization under ${scopeLabel}.`}
                                className={`flex items-center gap-2.5 w-full h-9 px-3 border rounded-lg transition-all duration-150 cursor-pointer ${scoped
                                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                                    : 'bg-[var(--color-bg-card)] border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className={`relative w-8 h-[18px] rounded-full shrink-0 transition-colors ${scoped ? 'bg-mwk' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${scoped ? 'translate-x-3.5' : ''}`}></span>
                                </span>
                                <span className={`text-sm font-semibold truncate ${scoped ? 'text-mwk' : 'text-[var(--color-text-title)]'}`}>
                                    {scoped ? `${scopeLabel}'s org only` : 'Everyone'}
                                </span>
                                {outsideCount > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${scoped ? 'bg-white text-gray-500 border border-red-100' : 'bg-gray-100 text-gray-500'}`}>
                                        {scoped ? `${outsideCount} hidden` : `+${outsideCount}`}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    {hasActiveFilters && onReset && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="h-9 px-3 text-xs font-bold text-gray-500 hover:text-mwk rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                            Clear filters
                        </button>
                    )}

                    {loading && (
                        <span className="h-9 flex items-center text-[11px] text-gray-400 animate-pulse ml-auto">Syncing...</span>
                    )}
                </div>
            </div>
        </div>
    );
}
