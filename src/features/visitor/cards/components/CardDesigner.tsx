'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { CardCustomText, CardElementLayout, CardPresetSettings, CardSelection, VisitorCardData } from '@/types/visitor-card.types';
import { CARD_ELEMENT_KEYS, CARD_ELEMENT_LABELS, CUSTOM_TEXT_MAX_LENGTH, clampToCard } from '@/features/visitor/cards/utils/cardPresetSettings';
import VisitorCard, { boxStyle, customTextClass, textStyle } from './VisitorCard';

/** CSS pixels per millimetre at 96 dpi */
const PX_PER_MM = 96 / 25.4;
const SNAP_MM = 0.5;
/** Pointer travel (px) below which a press counts as a click, not a drag */
const CLICK_TOLERANCE_PX = 3;

const snap = (value: number) => Math.round(value / SNAP_MM) * SNAP_MM;

interface DragState {
    mode: 'move' | 'resize';
    selection: NonNullable<CardSelection>;
    startX: number;
    startY: number;
    start: CardElementLayout;
    moved: boolean;
}

interface CardDesignerProps {
    card: VisitorCardData;
    settings: CardPresetSettings;
    selection: CardSelection;
    onSelect: (selection: CardSelection) => void;
    onChange: (settings: CardPresetSettings) => void;
    /** Largest size (px) the preview may take; the card is scaled to fit */
    maxWidthPx?: number;
    maxHeightPx?: number;
}

/**
 * Live, editable badge preview on the real mm layout (scaled for display):
 * click an element to select it, drag to move, drag the corner handle to resize,
 * click a custom text to type into it directly (Enter = new line, Esc = done).
 */
export default function CardDesigner({
    card,
    settings,
    selection,
    onSelect,
    onChange,
    maxWidthPx = 520,
    maxHeightPx = 640,
}: CardDesignerProps) {
    const drag = useRef<DragState | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { size } = settings;

    const naturalWidthPx = size.widthMm * PX_PER_MM;
    const naturalHeightPx = size.heightMm * PX_PER_MM;
    const scale = Math.min(2.6, maxWidthPx / naturalWidthPx, maxHeightPx / naturalHeightPx);

    // Leave edit mode when the text is deselected or removed
    const editingText = editingId ? settings.customTexts.find((t) => t.id === editingId) : undefined;
    useEffect(() => {
        if (editingId && (!editingText || selection?.kind !== 'custom' || selection.id !== editingId)) {
            setEditingId(null);
        }
    }, [editingId, editingText, selection]);

    // Focus the editor with the caret at the end
    useEffect(() => {
        const el = textareaRef.current;
        if (editingId && el) {
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
        }
    }, [editingId]);

    const getLayout = (sel: NonNullable<CardSelection>): CardElementLayout | undefined =>
        sel.kind === 'element' ? settings.elements[sel.key] : settings.customTexts.find((t) => t.id === sel.id);

    const applyLayout = (sel: NonNullable<CardSelection>, next: CardElementLayout) => {
        if (sel.kind === 'element') {
            const el = clampToCard({ ...settings.elements[sel.key], ...next }, size, sel.key === 'qr');
            onChange({ ...settings, elements: { ...settings.elements, [sel.key]: el } });
        } else {
            onChange({
                ...settings,
                customTexts: settings.customTexts.map((t) => (t.id === sel.id ? clampToCard({ ...t, ...next }, size) : t)),
            });
        }
    };

    /** Updates the typed text and grows the box when new lines no longer fit */
    const updateText = (t: CardCustomText, text: string) => {
        const lines = text.split('\n').length;
        const needed = lines * t.fontSize * t.lineHeight + 0.6;
        const h = needed > t.h ? Math.min(size.heightMm - t.y, Math.ceil(needed * 2) / 2) : t.h;
        onChange({
            ...settings,
            customTexts: settings.customTexts.map((c) => (c.id === t.id ? clampToCard({ ...c, text: text.slice(0, CUSTOM_TEXT_MAX_LENGTH), h }, size) : c)),
        });
    };

    const startDrag = (e: ReactPointerEvent<HTMLElement>, sel: NonNullable<CardSelection>, mode: DragState['mode']) => {
        e.preventDefault();
        e.stopPropagation();
        const start = getLayout(sel);
        if (!start) return;
        onSelect(sel);
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { mode, selection: sel, startX: e.clientX, startY: e.clientY, start: { ...start }, moved: false };
    };

    const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
        const d = drag.current;
        if (!d) return;
        e.stopPropagation();
        if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < CLICK_TOLERANCE_PX) return;
        d.moved = true;
        const dx = (e.clientX - d.startX) / (PX_PER_MM * scale);
        const dy = (e.clientY - d.startY) / (PX_PER_MM * scale);
        if (d.mode === 'move') {
            applyLayout(d.selection, { ...d.start, x: snap(d.start.x + dx), y: snap(d.start.y + dy) });
        } else {
            const square = d.selection.kind === 'element' && d.selection.key === 'qr';
            const w = snap(d.start.w + dx);
            applyLayout(d.selection, { ...d.start, w, h: square ? w : snap(d.start.h + dy) });
        }
    };

    const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
        const d = drag.current;
        if (d && e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        // A plain click on a custom text opens the inline editor
        if (d && !d.moved && d.mode === 'move' && d.selection.kind === 'custom') {
            setEditingId(d.selection.id);
        }
        drag.current = null;
    };

    const onEditorKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
            e.preventDefault();
            setEditingId(null);
        }
    };

    const isSelected = (sel: NonNullable<CardSelection>) =>
        selection !== null &&
        (sel.kind === 'element'
            ? selection.kind === 'element' && selection.key === sel.key
            : selection.kind === 'custom' && selection.id === sel.id);

    const handles: { sel: NonNullable<CardSelection>; layout: CardElementLayout; label: string; text?: CardCustomText }[] = [
        ...CARD_ELEMENT_KEYS.filter((k) => settings.elements[k].visible).map((k) => ({
            sel: { kind: 'element' as const, key: k },
            layout: settings.elements[k],
            label: CARD_ELEMENT_LABELS[k],
        })),
        ...settings.customTexts.filter((t) => t.visible).map((t) => ({
            sel: { kind: 'custom' as const, id: t.id },
            layout: t as CardElementLayout,
            label: 'Click to type · drag to move',
            text: t,
        })),
    ];

    const overlay = (
        <div className="absolute inset-0 z-20" onPointerDown={() => onSelect(null)}>
            {handles.map(({ sel, layout, label, text }) => {
                const active = isSelected(sel);
                const editing = text !== undefined && text.id === editingId;
                return (
                    <div
                        key={sel.kind === 'element' ? sel.key : sel.id}
                        title={editing ? undefined : label}
                        className={`absolute touch-none select-none ${editing ? 'cursor-text' : text ? 'cursor-pointer' : 'cursor-move'} ${
                            active ? 'z-10 outline outline-[0.35mm] outline-sky-400' : 'outline-dashed outline-[0.2mm] outline-transparent hover:outline-sky-300'
                        } ${text && !text.text.trim() && !editing ? 'outline-dashed outline-[0.2mm] outline-sky-300/60' : ''}`}
                        style={boxStyle(layout)}
                        onPointerDown={(e) => !editing && startDrag(e, sel, 'move')}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                    >
                        {editing && text && (
                            <textarea
                                ref={textareaRef}
                                value={text.text}
                                maxLength={CUSTOM_TEXT_MAX_LENGTH}
                                onChange={(e) => updateText(text, e.target.value)}
                                onKeyDown={onEditorKeyDown}
                                onBlur={() => setEditingId(null)}
                                onPointerDown={(e) => e.stopPropagation()}
                                placeholder="Type here"
                                aria-label="Custom text"
                                className={`block h-full w-full resize-none overflow-hidden bg-white/10 text-inherit outline-none placeholder:text-current/40 ${customTextClass(settings, text)}`}
                                style={textStyle(text)}
                            />
                        )}
                        {active && !editing && (
                            <span
                                className="absolute -bottom-[1.2mm] -right-[1.2mm] h-[2.4mm] w-[2.4mm] cursor-nwse-resize rounded-[0.4mm] border-[0.3mm] border-white bg-sky-500"
                                onPointerDown={(e) => startDrag(e, sel, 'resize')}
                                onPointerMove={onPointerMove}
                                onPointerUp={endDrag}
                                onPointerCancel={endDrag}
                                aria-label={`Resize ${label}`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex justify-center">
            {/* Wrapper reserves the scaled size; the card itself keeps its true mm layout */}
            <div style={{ width: naturalWidthPx * scale, height: naturalHeightPx * scale }}>
                <div className="origin-top-left" style={{ transform: `scale(${scale})` }}>
                    <VisitorCard card={card} settings={settings} overlay={overlay} hiddenCustomTextId={editingId} />
                </div>
            </div>
        </div>
    );
}
