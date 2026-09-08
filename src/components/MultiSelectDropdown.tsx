'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption {
    label: string;
    value: string;
}

interface MultiSelectDropdownProps {
    label?: string;
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export default function MultiSelectDropdown({
    label,
    options,
    selected,
    onChange,
    placeholder = 'All',
    className = ''
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (val: string) => {
        if (selected.includes(val)) {
            onChange(selected.filter(item => item !== val));
        } else {
            onChange([...selected, val]);
        }
    };

    const handleSelectAll = () => {
        if (selected.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(o => o.value));
        }
    };

    const isAllSelected = selected.length === options.length && options.length > 0;

    // Display text
    const getDisplayText = () => {
        if (selected.length === 0) {
            return placeholder;
        }
        if (selected.length === 1) {
            const found = options.find(o => o.value === selected[0]);
            return found ? found.label : selected[0];
        }
        return `${selected.length} selected`;
    };

    return (
        <div className={`relative flex items-center gap-2 ${isOpen ? 'z-30' : 'z-10'} ${className}`} ref={dropdownRef}>
            {label && (
                <label className="text-xs font-bold text-gray-500 uppercase tracking-tight whitespace-nowrap">
                    {label}
                </label>
            )}
            
            <div className={`relative ${isOpen ? 'z-30' : 'z-10'}`}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`text-sm border rounded-lg px-2.5 py-1 flex items-center justify-between gap-2 h-8 bg-white transition-all text-left min-w-[130px] max-w-[210px] ${
                        selected.length > 0 
                            ? 'border-red-400 ring-1 ring-red-100 font-semibold text-gray-900' 
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                >
                    <span className="truncate flex-1 text-xs" title={selected.length === 1 ? (options.find(o => o.value === selected[0])?.label || selected[0]) : undefined}>
                        {getDisplayText()}
                    </span>
                    
                    {selected.length > 0 && (
                        <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-200">
                            {selected.length}
                        </span>
                    )}

                    <svg 
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth="2" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-2 text-xs">
                        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-gray-100 px-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {label || 'Options'} ({selected.length}/{options.length})
                            </span>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                            >
                                {isAllSelected ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
                            {options.map((opt) => {
                                const isChecked = selected.includes(opt.value);
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => toggleOption(opt.value)}
                                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors select-none ${
                                            isChecked 
                                                ? 'bg-red-50/70 text-red-900 font-medium' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}} // handled by parent onClick
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer pointer-events-none"
                                        />
                                        <span className="truncate flex-1 text-xs">
                                            {opt.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
