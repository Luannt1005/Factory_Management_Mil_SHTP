'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DateRangePreset, DateRangeValue } from '@/types/date-range.types';

export type { DateRangePreset, DateRangeValue };

const PRESETS: { key: DateRangePreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'thisWeek', label: 'This week' },
    { key: 'nextWeek', label: 'Next week' },
    { key: 'lastWeek', label: 'Last week' },
    { key: 'thisMonth', label: 'This month' },
    { key: 'nextMonth', label: 'Next month' },
    { key: 'lastMonth', label: 'Last month' },
    { key: 'thisYear', label: 'This year' },
];

/** Local "YYYY-MM-DD" of a date */
export function dayKey(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

function addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
}

/** Monday of the week containing d (weeks run Monday-Sunday) */
function startOfWeek(d: Date): Date {
    return addDays(d, -((d.getDay() + 6) % 7));
}

/** Date range of a preset, based on today's local date */
export function presetRange(preset: DateRangePreset, today = new Date()): DateRangeValue {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const range = (from: Date, to: Date): DateRangeValue => ({ from: dayKey(from), to: dayKey(to), preset });
    const monthRange = (offset: number) => range(new Date(t.getFullYear(), t.getMonth() + offset, 1), new Date(t.getFullYear(), t.getMonth() + offset + 1, 0));
    const weekRange = (offset: number) => {
        const monday = addDays(startOfWeek(t), offset * 7);
        return range(monday, addDays(monday, 6));
    };
    switch (preset) {
        case 'today': return range(t, t);
        case 'tomorrow': return range(addDays(t, 1), addDays(t, 1));
        case 'yesterday': return range(addDays(t, -1), addDays(t, -1));
        case 'thisWeek': return weekRange(0);
        case 'nextWeek': return weekRange(1);
        case 'lastWeek': return weekRange(-1);
        case 'thisMonth': return monthRange(0);
        case 'nextMonth': return monthRange(1);
        case 'lastMonth': return monthRange(-1);
        case 'thisYear': return range(new Date(t.getFullYear(), 0, 1), new Date(t.getFullYear(), 11, 31));
    }
}

/** Presets that only look back in time (e.g. for completion dates) */
export const PAST_DATE_PRESETS: readonly DateRangePreset[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear'];

function shortDate(key: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    return m ? `${m[3]}/${m[2]}/${m[1].slice(2)}` : key;
}

/** Text on the trigger button */
function rangeLabel(value: DateRangeValue): string {
    if (value.preset) return PRESETS.find((p) => p.key === value.preset)?.label ?? '';
    if (!value.from && !value.to) return '';
    if (!value.to || value.from === value.to) return shortDate(value.from || value.to);
    return `${shortDate(value.from)} - ${shortDate(value.to)}`;
}

interface DateRangeFilterProps {
    label: string;
    value: DateRangeValue;
    onChange: (value: DateRangeValue) => void;
    /** Presets offered (all by default) */
    presets?: readonly DateRangePreset[];
    /** Control attached to the right of the field (e.g. a "Today" shortcut button) */
    addon?: ReactNode;
}

/**
 * Date range filter: a preset (Today, This week, This month...) or a custom From - To range.
 */
export default function DateRangeFilter({ label, value, onChange, presets, addon }: DateRangeFilterProps) {
    const presetOptions = presets ? PRESETS.filter((p) => presets.includes(p.key)) : PRESETS;
    const [open, setOpen] = useState(false);
    const [draftFrom, setDraftFrom] = useState(value.from);
    const [draftTo, setDraftTo] = useState(value.to);
    const rootRef = useRef<HTMLDivElement | null>(null);

    // Re-seed the custom inputs from the current value each time the popover opens
    const openPopover = () => {
        setDraftFrom(value.from);
        setDraftTo(value.to);
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: PointerEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const choosePreset = (preset: DateRangePreset) => {
        onChange(presetRange(preset));
        setOpen(false);
    };

    const applyCustom = () => {
        const from = draftFrom || draftTo;
        const to = draftTo || draftFrom;
        if (!from) return;
        // Swap when typed in reverse order
        onChange(from <= to ? { from, to } : { from: to, to: from });
        setOpen(false);
    };

    const clear = () => {
        onChange({ from: '', to: '' });
        setOpen(false);
    };

    const text = rangeLabel(value);
    const active = Boolean(value.from || value.to);

    return (
        <div ref={rootRef} className="relative">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</label>
            <div className="flex w-full">
            <button
                type="button"
                onClick={() => (open ? setOpen(false) : openPopover())}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={`flex h-[38px] w-full min-w-0 items-center justify-between gap-2 border bg-white px-3 text-left text-sm transition-all focus:border-mwk focus:outline-none ${
                    addon ? 'rounded-l' : 'rounded'
                } ${active ? 'border-mwk/60 text-gray-900' : 'border-gray-300 text-gray-400'}`}
            >
                <span className="truncate">{text || 'All dates'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4 shrink-0 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
            </button>
            {addon}
            </div>
            {active && value.preset && (
                <span className="pointer-events-none absolute -bottom-4 left-0 whitespace-nowrap text-[10px] font-medium text-gray-400">
                    {shortDate(value.from)}{value.to !== value.from ? ` - ${shortDate(value.to)}` : ''}
                </span>
            )}

            {open && (
                <div role="dialog" aria-label={`${label} filter`} className="absolute left-0 top-full z-50 mt-1 w-[300px] rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                    <div className="grid grid-cols-2 gap-1">
                        {presetOptions.map((p) => (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => choosePreset(p.key)}
                                className={`cursor-pointer rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition-colors ${
                                    value.preset === p.key ? 'bg-mwk text-white' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 border-t border-gray-100 pt-3">
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Custom range</p>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="date"
                                value={draftFrom}
                                onChange={(e) => setDraftFrom(e.target.value)}
                                className="h-8 min-w-0 flex-1 rounded border border-gray-300 px-1.5 text-xs focus:border-mwk focus:outline-none"
                                aria-label="From"
                            />
                            <span className="text-xs text-gray-400">-</span>
                            <input
                                type="date"
                                value={draftTo}
                                onChange={(e) => setDraftTo(e.target.value)}
                                className="h-8 min-w-0 flex-1 rounded border border-gray-300 px-1.5 text-xs focus:border-mwk focus:outline-none"
                                aria-label="To"
                            />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                            <button type="button" onClick={clear} className="cursor-pointer text-xs font-bold text-gray-400 hover:text-red-600">
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={applyCustom}
                                disabled={!draftFrom && !draftTo}
                                className="cursor-pointer rounded bg-mwk px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
