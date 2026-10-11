'use client';

import { useRef } from 'react';
import type {
    CardBackground,
    CardBorderColor,
    CardCustomText,
    CardElementLayout,
    CardFooterColor,
    CardPresetSettings,
    CardSelection,
    CardFieldKey,
    CardTextAlign,
    CardTextFont,
    CardTextTone,
} from '@/types/visitor-card.types';
import {
    CARD_ELEMENT_KEYS,
    CARD_ELEMENT_LABELS,
    CARD_SIZE_LIMITS,
    CARD_SIZE_PRESETS,
    CUSTOM_TEXT_MAX_LENGTH,
    FONT_SIZE_LIMITS,
    MAX_CUSTOM_TEXTS,
    NON_TEXT_ELEMENTS,
    PRESET_SCOPES,
    clampMm,
    clampToCard,
    createCustomText,
    resizeCardSettings,
} from '@/features/visitor/cards/utils/cardPresetSettings';
import { CARD_FIELD_GROUPS, CARD_SCOPE_LABELS, fieldDefsForScope } from '@/features/visitor/cards/utils/cardFields';

// ===============================
// Shared look
// ===============================

const labelClass = 'mb-1 block text-[11px] font-semibold text-gray-500';
const sectionTitleClass = 'text-[11px] font-bold uppercase tracking-wider text-gray-400';
const controlClass =
    'w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-mwk';

const BORDER_OPTIONS: { value: CardBorderColor; label: string; swatch: string }[] = [
    { value: 'red', label: 'Milwaukee Red', swatch: 'bg-mwk' },
    { value: 'black', label: 'Black', swatch: 'bg-black' },
    { value: 'gold', label: 'Gold', swatch: 'bg-badge-gold' },
    { value: 'slate', label: 'Slate', swatch: 'bg-slate-500' },
    { value: 'white', label: 'White', swatch: 'bg-white' },
];

const BACKGROUND_OPTIONS: { value: CardBackground; label: string; swatch: string }[] = [
    { value: 'dark', label: 'Dark slate', swatch: 'bg-slate-800' },
    { value: 'black', label: 'Pure black', swatch: 'bg-black' },
    { value: 'white', label: 'White (eco)', swatch: 'bg-white' },
];

const FOOTER_OPTIONS: { value: CardFooterColor; label: string; swatch: string }[] = [
    { value: 'red', label: 'Milwaukee Red', swatch: 'bg-mwk' },
    { value: 'black', label: 'Black', swatch: 'bg-black' },
    { value: 'gold', label: 'Gold', swatch: 'bg-badge-gold' },
    { value: 'slate', label: 'Slate', swatch: 'bg-slate-600' },
];

const TONE_OPTIONS: { value: CardTextTone; label: string }[] = [
    { value: 'primary', label: 'Normal' },
    { value: 'muted', label: 'Muted' },
    { value: 'accent', label: 'Accent' },
];

const FONT_OPTIONS: { value: CardTextFont; label: string }[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'impact', label: 'Impact' },
];

const ALIGN_OPTIONS: { value: CardTextAlign; label: string }[] = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
];

// ===============================
// Small controls
// ===============================

interface NumberFieldProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    onChange: (value: number) => void;
}

function NumberField({ label, value, min, max, step = 0.5, suffix = 'mm', onChange }: NumberFieldProps) {
    return (
        <label className="block min-w-0">
            <span className={labelClass}>{label}</span>
            <div className="flex items-center rounded-md border border-gray-200 bg-white transition-colors focus-within:border-mwk">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        if (Number.isFinite(n)) onChange(clampMm(n, min, max));
                    }}
                    className="w-full min-w-0 bg-transparent px-2.5 py-1.5 text-xs font-semibold tabular-nums text-gray-900 outline-none"
                />
                <span className="pr-2 text-[10px] font-semibold text-gray-400">{suffix}</span>
            </div>
        </label>
    );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
    return (
        <div className={`grid rounded-md bg-gray-100 p-0.5 text-[11px] font-semibold ${options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`cursor-pointer whitespace-nowrap rounded px-2 py-1 transition-colors ${
                        value === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function SwatchRow<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; swatch: string }[]; onChange: (v: T) => void }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="whitespace-nowrap text-xs font-medium text-gray-700">{label}</span>
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label={label}>
                {options.map((opt) => {
                    const active = opt.value === value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            title={opt.label}
                            onClick={() => onChange(opt.value)}
                            className={`h-5 w-5 cursor-pointer rounded-full border transition-all ${opt.swatch} ${
                                active ? 'border-gray-900 ring-2 ring-gray-900/20 ring-offset-1' : 'border-gray-300 hover:scale-110'
                            }`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3 text-xs font-medium text-gray-700">
            <span>{label}</span>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-mwk" />
        </label>
    );
}

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    );
}

interface PanelProps {
    settings: CardPresetSettings;
    onChange: (settings: CardPresetSettings) => void;
    selection: CardSelection;
    onSelect: (selection: CardSelection) => void;
}

// ===============================
// Layers
// ===============================

/** Element + custom text list (visibility toggles, click to select) */
export function CardLayersPanel({ settings, onChange, selection, onSelect }: PanelProps) {
    const setElementVisible = (key: (typeof CARD_ELEMENT_KEYS)[number], visible: boolean) => {
        onChange({ ...settings, elements: { ...settings.elements, [key]: { ...settings.elements[key], visible } } });
        if (!visible && selection?.kind === 'element' && selection.key === key) onSelect(null);
    };

    const setTextVisible = (id: string, visible: boolean) =>
        onChange({ ...settings, customTexts: settings.customTexts.map((t) => (t.id === id ? { ...t, visible } : t)) });

    const addCustomText = (content = 'Custom text', font: CardTextFont = 'standard') => {
        const text = createCustomText(settings.size, settings.customTexts.length, content, font);
        onChange({ ...settings, customTexts: [...settings.customTexts, text] });
        onSelect({ kind: 'custom', id: text.id });
    };

    /** Adds a text bound to one data field (the visitor name uses the bold Impact badge font) */
    const addField = (key: CardFieldKey) => addCustomText(`{${key}}`, key === 'visitorName' ? 'impact' : 'standard');
    const scopedFields = fieldDefsForScope(settings.requestType);
    const full = settings.customTexts.length >= MAX_CUSTOM_TEXTS;

    const rowClass = (active: boolean, visible: boolean) =>
        `group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
            active ? 'bg-gray-900 text-white' : visible ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-50'
        }`;

    return (
        <div className="space-y-5">
            <div>
                <p className={`${sectionTitleClass} mb-1.5 px-2`}>Layout</p>
                <ul className="space-y-0.5">
                    {CARD_ELEMENT_KEYS.map((key) => {
                        const el = settings.elements[key];
                        const active = selection?.kind === 'element' && selection.key === key;
                        return (
                            <li key={key} className={rowClass(active, el.visible)}>
                                <button
                                    type="button"
                                    onClick={() => el.visible && onSelect({ kind: 'element', key })}
                                    className={`min-w-0 flex-1 truncate text-left text-xs font-medium ${el.visible ? 'cursor-pointer' : 'cursor-default line-through decoration-gray-300'}`}
                                >
                                    {CARD_ELEMENT_LABELS[key]}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setElementVisible(key, !el.visible)}
                                    title={el.visible ? 'Hide' : 'Show'}
                                    aria-label={`${el.visible ? 'Hide' : 'Show'} ${CARD_ELEMENT_LABELS[key]}`}
                                    className={`cursor-pointer rounded p-0.5 transition-opacity ${active ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-700'} ${el.visible ? 'opacity-0 group-hover:opacity-100' : ''}`}
                                >
                                    <EyeIcon open={el.visible} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div>
                <div className="mb-1.5 flex items-center justify-between px-2">
                    <p className={sectionTitleClass}>Visitor information</p>
                    <button
                        type="button"
                        onClick={() => addCustomText()}
                        disabled={full}
                        className="cursor-pointer rounded px-1.5 py-0.5 text-[11px] font-bold text-mwk transition-colors hover:bg-mwk-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        + Text
                    </button>
                </div>
                <div className="mb-2 px-1">
                    <select
                        value=""
                        disabled={full}
                        onChange={(e) => e.target.value && addField(e.target.value as CardFieldKey)}
                        className={`${controlClass} cursor-pointer`}
                        aria-label="Add data field"
                    >
                        <option value="">+ Add field…</option>
                        {CARD_FIELD_GROUPS.map((group) => {
                            const defs = scopedFields.filter((d) => d.group === group);
                            if (defs.length === 0) return null;
                            return (
                                <optgroup key={group} label={group}>
                                    {defs.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                                </optgroup>
                            );
                        })}
                    </select>
                </div>
                {settings.customTexts.length === 0 ? (
                    <p className="px-2 text-[11px] leading-relaxed text-gray-400">
                        Add the visitor details you need: pick a field (name, company, dates…) or a free text such as “Host: {'{hostDepartment}'}”.
                    </p>
                ) : (
                    <ul className="space-y-0.5">
                        {settings.customTexts.map((t) => {
                            const active = selection?.kind === 'custom' && selection.id === t.id;
                            return (
                                <li key={t.id} className={rowClass(active, t.visible)}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect({ kind: 'custom', id: t.id })}
                                        className="min-w-0 flex-1 cursor-pointer truncate text-left text-xs font-medium"
                                        title={t.text}
                                    >
                                        {t.text.split('\n')[0] || 'Empty text'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTextVisible(t.id, !t.visible)}
                                        title={t.visible ? 'Hide' : 'Show'}
                                        aria-label={t.visible ? 'Hide text' : 'Show text'}
                                        className={`cursor-pointer rounded p-0.5 transition-opacity ${active ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-700'} ${t.visible ? 'opacity-0 group-hover:opacity-100' : ''}`}
                                    >
                                        <EyeIcon open={t.visible} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

// ===============================
// Selected element inspector
// ===============================

export function SelectedElementInspector({ settings, onChange, selection, onSelect }: PanelProps) {
    const textRef = useRef<HTMLTextAreaElement | null>(null);
    const { size } = settings;

    const layout: CardElementLayout | CardCustomText | undefined = selection
        ? selection.kind === 'element'
            ? settings.elements[selection.key]
            : settings.customTexts.find((t) => t.id === selection.id)
        : undefined;

    if (!selection || !layout) {
        return (
            <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
                <p className="text-xs font-semibold text-gray-700">Nothing selected</p>
                <p className="mt-1 max-w-[220px] text-[11px] leading-relaxed text-gray-400">
                    Click an element on the card or in Layers to move, resize and style it. Click a custom text on the card to type into it.
                </p>
            </div>
        );
    }

    const isQr = selection.kind === 'element' && selection.key === 'qr';
    const isText = selection.kind === 'custom' || !NON_TEXT_ELEMENTS.includes(selection.key);
    const custom = selection.kind === 'custom' ? (layout as CardCustomText) : undefined;

    const update = (patch: Partial<CardCustomText>) => {
        if (selection.kind === 'element') {
            const el = clampToCard({ ...settings.elements[selection.key], ...patch }, size, isQr);
            onChange({ ...settings, elements: { ...settings.elements, [selection.key]: el } });
        } else {
            onChange({
                ...settings,
                customTexts: settings.customTexts.map((t) => (t.id === selection.id ? clampToCard({ ...t, ...patch }, size) : t)),
            });
        }
    };

    /** Inserts {fieldKey} at the caret of the text box */
    const insertField = (key: string) => {
        if (!custom || !key) return;
        const token = `{${key}}`;
        const el = textRef.current;
        const start = el?.selectionStart ?? custom.text.length;
        const end = el?.selectionEnd ?? custom.text.length;
        const next = (custom.text.slice(0, start) + token + custom.text.slice(end)).slice(0, CUSTOM_TEXT_MAX_LENGTH);
        update({ text: next });
        requestAnimationFrame(() => {
            if (!el) return;
            el.focus();
            el.setSelectionRange(start + token.length, start + token.length);
        });
    };

    const removeCustom = () => {
        if (!custom) return;
        onChange({ ...settings, customTexts: settings.customTexts.filter((t) => t.id !== custom.id) });
        onSelect(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-gray-900">
                    {selection.kind === 'element' ? CARD_ELEMENT_LABELS[selection.key] : 'Custom text'}
                </p>
                <button type="button" className="cursor-pointer text-[11px] font-semibold text-gray-400 hover:text-gray-700" onClick={() => onSelect(null)}>
                    Deselect
                </button>
            </div>

            {custom && (
                <div className="space-y-2">
                    <textarea
                        ref={textRef}
                        rows={3}
                        maxLength={CUSTOM_TEXT_MAX_LENGTH}
                        value={custom.text}
                        onChange={(e) => update({ text: e.target.value })}
                        className={`${controlClass} resize-y leading-relaxed`}
                        aria-label="Text"
                    />
                    <select
                        value=""
                        onChange={(e) => insertField(e.target.value)}
                        className={`${controlClass} cursor-pointer`}
                        aria-label="Insert data field"
                    >
                        <option value="">+ Insert {CARD_SCOPE_LABELS[settings.requestType]} field…</option>
                        {CARD_FIELD_GROUPS.map((group) => {
                            const defs = fieldDefsForScope(settings.requestType).filter((d) => d.group === group);
                            if (defs.length === 0) return null;
                            return (
                                <optgroup key={group} label={group}>
                                    {defs.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                                </optgroup>
                            );
                        })}
                    </select>
                    <Toggle label="Hide when its fields are empty" checked={custom.hideIfEmpty} onChange={(hideIfEmpty) => update({ hideIfEmpty })} />
                </div>
            )}

            <div>
                <p className={`${sectionTitleClass} mb-2`}>Position & size</p>
                <div className="grid grid-cols-2 gap-2">
                    <NumberField label="X" value={layout.x} min={0} max={size.widthMm} onChange={(x) => update({ x })} />
                    <NumberField label="Y" value={layout.y} min={0} max={size.heightMm} onChange={(y) => update({ y })} />
                    <NumberField label={isQr ? 'Size' : 'Width'} value={layout.w} min={2} max={size.widthMm} onChange={(w) => update(isQr ? { w, h: w } : { w })} />
                    {!isQr && <NumberField label="Height" value={layout.h} min={2} max={size.heightMm} onChange={(h) => update({ h })} />}
                </div>
            </div>

            {isText && (
                <div>
                    <p className={`${sectionTitleClass} mb-2`}>Text</p>
                    <div className="space-y-2">
                        <div className="grid grid-cols-[88px_1fr] items-end gap-2">
                            <NumberField label="Font size" value={layout.fontSize} min={FONT_SIZE_LIMITS.min} max={FONT_SIZE_LIMITS.max} step={0.1} onChange={(fontSize) => update({ fontSize })} />
                            <div>
                                <span className={labelClass}>Align</span>
                                <Segmented value={layout.align} options={ALIGN_OPTIONS} onChange={(align) => update({ align })} />
                            </div>
                        </div>
                        {custom && (
                            <>
                                <div>
                                    <span className={labelClass}>Font</span>
                                    <Segmented value={custom.font} options={FONT_OPTIONS} onChange={(font) => update({ font })} />
                                </div>
                                <div>
                                    <span className={labelClass}>Colour</span>
                                    <Segmented value={custom.tone} options={TONE_OPTIONS} onChange={(tone) => update({ tone })} />
                                </div>
                                <div className="flex items-center gap-4">
                                    {custom.font === 'standard' && <Toggle label="Bold" checked={custom.bold} onChange={(bold) => update({ bold })} />}
                                    <Toggle label="Uppercase" checked={custom.uppercase} onChange={(uppercase) => update({ uppercase })} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {custom && (
                <button
                    type="button"
                    onClick={removeCustom}
                    className="w-full cursor-pointer rounded-md border border-gray-200 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                    Delete text
                </button>
            )}
        </div>
    );
}

// ===============================
// Card-wide settings
// ===============================

export function CardStyleInspector({ settings, onChange }: Pick<PanelProps, 'settings' | 'onChange'>) {
    const { size } = settings;
    const setStyle = <K extends keyof CardPresetSettings['style']>(key: K, value: CardPresetSettings['style'][K]) =>
        onChange({ ...settings, style: { ...settings.style, [key]: value } });
    const setSize = (widthMm: number, heightMm: number) => onChange(resizeCardSettings(settings, { widthMm, heightMm }));
    const sizePresetIndex = CARD_SIZE_PRESETS.findIndex((p) => p.size.widthMm === size.widthMm && p.size.heightMm === size.heightMm);

    return (
        <div className="space-y-5">
            <div>
                <p className={`${sectionTitleClass} mb-2`}>Request category</p>
                <select
                    value={settings.requestType}
                    onChange={(e) => onChange({ ...settings, requestType: e.target.value as CardPresetSettings['requestType'] })}
                    className={`${controlClass} cursor-pointer`}
                    aria-label="Request category"
                >
                    {PRESET_SCOPES.map((scope) => <option key={scope} value={scope}>{CARD_SCOPE_LABELS[scope]}</option>)}
                </select>
                <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
                    {settings.requestType === 'all'
                        ? 'Universal template: cards of every category can be printed with it.'
                        : `Only ${CARD_SCOPE_LABELS[settings.requestType]} cards can be printed with this template. Data fields are limited to this category.`}
                </p>
            </div>

            <div>
                <p className={`${sectionTitleClass} mb-2`}>Card size</p>
                <select
                    value={sizePresetIndex >= 0 ? String(sizePresetIndex) : 'custom'}
                    onChange={(e) => {
                        const preset = CARD_SIZE_PRESETS[Number(e.target.value)];
                        if (preset) setSize(preset.size.widthMm, preset.size.heightMm);
                    }}
                    className={`${controlClass} mb-2 cursor-pointer`}
                    aria-label="Card size preset"
                >
                    {CARD_SIZE_PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
                    <option value="custom" disabled>Custom size</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                    <NumberField label="Width" value={size.widthMm} min={CARD_SIZE_LIMITS.min} max={CARD_SIZE_LIMITS.max} step={1} onChange={(w) => setSize(w, size.heightMm)} />
                    <NumberField label="Height" value={size.heightMm} min={CARD_SIZE_LIMITS.min} max={CARD_SIZE_LIMITS.max} step={1} onChange={(h) => setSize(size.widthMm, h)} />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400">Resizing scales every element proportionally.</p>
            </div>

            <div>
                <p className={`${sectionTitleClass} mb-2.5`}>Colours</p>
                <div className="space-y-2.5">
                    <SwatchRow label="Border" value={settings.style.borderColor} options={BORDER_OPTIONS} onChange={(v) => setStyle('borderColor', v)} />
                    <SwatchRow label="Background" value={settings.style.background} options={BACKGROUND_OPTIONS} onChange={(v) => setStyle('background', v)} />
                    <SwatchRow label="Footer banner" value={settings.style.footerColor} options={FOOTER_OPTIONS} onChange={(v) => setStyle('footerColor', v)} />
                </div>
                <div className="mt-3 w-1/2">
                    <NumberField label="Border width" value={settings.style.borderWidthMm} min={0} max={5} step={0.1} onChange={(v) => setStyle('borderWidthMm', v)} />
                </div>
            </div>

        </div>
    );
}
