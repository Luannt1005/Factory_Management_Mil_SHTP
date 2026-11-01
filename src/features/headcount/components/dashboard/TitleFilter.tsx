'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { OrgNode } from '@/types/orgchart.types';

interface TitleFilterProps {
    nodes: OrgNode[];
    onSelect: (title: string | null) => void;
    selectedTitle: string | null;
}

// Predefined general job categories matching the logic in StatsCards
const JOB_CATEGORIES = [
    { label: 'Director', value: 'director' },
    { label: 'Manager', value: 'manager' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Shift Leader', value: 'shift leader' },
    { label: 'Line Leader', value: 'line leader' },
    { label: 'Engineer', value: 'engineer' },
    { label: 'Specialist', value: 'specialist' },
    { label: 'Coordinator', value: 'coordinator' },
    { label: 'Technician', value: 'technician' },
    { label: 'Operator', value: 'operator' },
    { label: 'WH Keeper', value: 'warehouse keeper' },
    { label: 'Trainee', value: 'trainee' },
];

const TitleFilter: React.FC<TitleFilterProps> = ({ nodes, onSelect, selectedTitle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter categories that have at least one match in the current data
    const availableCategories = useMemo(() => {
        return JOB_CATEGORIES.filter(cat => {
            const keywords = cat.value.split(" ");
            return nodes.some(node => {
                const title = (node['Job Title'] || node.title || '').toLowerCase();
                return keywords.every(k => title.includes(k));
            });
        });
    }, [nodes]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (cat: { label: string, value: string }) => {
        onSelect(cat.value);
        setIsOpen(false);
    };

    const handleClear = () => {
        onSelect(null);
    };

    // Determine display value
    const selectedLabel = JOB_CATEGORIES.find(c => c.value === selectedTitle)?.label || selectedTitle;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className={`
                    w-full sm:w-48 py-1.5 px-3 text-xs font-medium text-left shadow-sm cursor-pointer
                    bg-white border rounded-lg flex items-center justify-between
                    focus:outline-none focus:ring-1 focus:ring-mwk
                    transition-all duration-200
                    ${selectedTitle
                        ? 'border-red-200 bg-red-50 text-mwk'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }
                `}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedLabel || 'Select role...'}</span>

                {selectedTitle ? (
                    <div
                        className="p-0.5 rounded-full hover:bg-red-100 text-red-400 hover:text-mwk shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClear();
                        }}
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                ) : (
                    <svg className={`w-3.5 h-3.5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className="absolute z-50 w-48 mt-1 bg-(--color-bg-card) border border-(--color-border-light) rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                    {availableCategories.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted">No available roles</div>
                    ) : (
                        availableCategories.map((cat) => (
                            <button
                                key={cat.value}
                                className={`w-full text-left px-3 py-2 hover:bg-red-50 cursor-pointer flex items-center justify-between transition-colors border-b border-(--color-border-light) last:border-0 text-xs font-medium ${selectedTitle === cat.value ? 'bg-red-50 text-mwk' : 'text-body'
                                    }`}
                                onClick={() => handleSelect(cat)}
                            >
                                <span>{cat.label}</span>
                                {selectedTitle === cat.value && (
                                    <svg className="w-3 h-3 text-mwk" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default TitleFilter;
