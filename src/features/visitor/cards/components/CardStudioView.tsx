'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CardBulkEditPayload, CardPresetSettings, CardSelection, VisitorCardData, CardPresetScope } from '@/types/visitor-card.types';
import { useCardPresets } from '@/features/visitor/cards/hooks/useCardPresets';
import { cardStudioApi } from '@/features/visitor/cards/services/cardStudioApi';
import { DEFAULT_CARD_SETTINGS, PRESET_SCOPES, areSettingsEqual } from '@/features/visitor/cards/utils/cardPresetSettings';
import { computeSheetGrid, createBlankCard, paginateCards, sampleCardFor, sourceToCard, withFields } from '@/features/visitor/cards/utils/cardData';
import { CARD_SCOPE_DEFAULT_CATEGORY, CARD_SCOPE_LABELS, cardMatchesScope } from '@/features/visitor/cards/utils/cardFields';
import VisitorCard from './VisitorCard';
import { CardLayersPanel, CardStyleInspector, SelectedElementInspector } from './CardSettingsPanel';
import CardDesigner from './CardDesigner';
import CardEditModal from './CardEditModal';
import CardBulkEditModal from './CardBulkEditModal';
import CardPrintSheet from './CardPrintSheet';
import PresetNameModal, { type PresetNameMode } from './PresetNameModal';
import StudioModal, { studioInputClass, studioPrimaryButtonClass, studioSecondaryButtonClass } from './StudioModal';

const INSPECTOR_TABS = [
    { key: 'element', label: 'Element' },
    { key: 'card', label: 'Card' },
] as const;
const SCOPE_SHORT_LABEL: Record<string, string> = {
    expat: 'Expat',
    vendor: 'Vendor / Contractor',
    interviewee: 'Interviewee',
};

/** "Name · Category" in the template dropdown (universal templates show the name only) */
function presetOptionLabel(name: string, scope: string): string {
    return SCOPE_SHORT_LABEL[scope] ? `${name} · ${SCOPE_SHORT_LABEL[scope]}` : name;
}

/** Upper bound on request codes accepted from the URL */
const MAX_URL_CODES = 50;
const PREFS_KEY = 'visitorCardStudio.prefs.v1';

interface StudioPrefs {
    presetId?: string;
}

function readPrefs(): StudioPrefs {
    try {
        const raw = window.localStorage.getItem(PREFS_KEY);
        return raw ? (JSON.parse(raw) as StudioPrefs) : {};
    } catch {
        return {};
    }
}

function writePrefs(prefs: StudioPrefs): void {
    try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
        // per-viewer convenience only
    }
}

type Notice = { type: 'success' | 'error'; message: string } | null;
type StudioTab = 'design' | 'print';

export default function CardStudioView() {
    const searchParams = useSearchParams();
    const { presets, mode, loading: presetsLoading, loadError, createPreset, updatePreset, deletePreset, suggestCopyName } = useCardPresets();

    /** null = a new template that has not been saved yet */
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const [workingSettings, setWorkingSettings] = useState<CardPresetSettings>(DEFAULT_CARD_SETTINGS);
    const [selection, setSelectionState] = useState<CardSelection>(null);
    const [inspectorTab, setInspectorTab] = useState<'element' | 'card'>('card');
    /** Selecting something on the card or in Layers jumps the inspector to that element */
    const setSelection = useCallback((next: CardSelection) => {
        setSelectionState(next);
        if (next) setInspectorTab('element');
    }, []);
    // Opening the studio for a request (?request=...) starts on the print tab
    const [tab, setTab] = useState<StudioTab>(() => (searchParams.get('request') || searchParams.get('requests') ? 'print' : 'design'));
    const [cards, setCards] = useState<VisitorCardData[]>([]);
    const cardsRef = useRef<VisitorCardData[]>([]);
    useEffect(() => {
        cardsRef.current = cards;
    }, [cards]);
    const scope = workingSettings.requestType;
    const scopeRef = useRef(scope);
    useEffect(() => {
        scopeRef.current = scope;
    }, [scope]);

    const [lookupCode, setLookupCode] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);

    const [nameModal, setNameModal] = useState<{ mode: PresetNameMode; initialName: string } | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<VisitorCardData | null>(null);

    const selectedPreset = useMemo(() => presets.find((p) => p.id === selectedPresetId) ?? null, [presets, selectedPresetId]);
    const savedSettings = selectedPreset?.settings ?? DEFAULT_CARD_SETTINGS;
    const templateName = selectedPreset?.name ?? 'Untitled template';
    const isDirty = !areSettingsEqual(workingSettings, savedSettings);

    // ===============================
    // Opened from Admin Settings: ?requests=V06102623,V06102624&type=vendor (or legacy ?request=)
    // ===============================
    const requestedType = searchParams.get('type');
    const initialScope: CardPresetScope | null =
        requestedType && (PRESET_SCOPES as readonly string[]).includes(requestedType) && requestedType !== 'all'
            ? (requestedType as CardPresetScope)
            : null;
    const initialCodes = useMemo(
        () =>
            (searchParams.get('requests') || searchParams.get('request') || '')
                .split(',')
                .map((c) => c.trim().replace(/^#/, '').toUpperCase())
                .filter((c) => /^[A-Z0-9_-]{1,60}$/.test(c))
                .slice(0, MAX_URL_CODES),
        [searchParams]
    );

    // ===============================
    // Preferences (last template)
    // ===============================
    const prefsRestored = useRef(false);
    useEffect(() => {
        if (presetsLoading || prefsRestored.current) return;
        prefsRestored.current = true;
        // A category passed from Admin Settings decides the template instead of the remembered one
        if (initialScope) return;
        const prefs = readPrefs();
        const remembered = prefs.presetId ? presets.find((p) => p.id === prefs.presetId) : undefined;
        if (remembered) {
            setSelectedPresetId(remembered.id);
            setWorkingSettings(remembered.settings);
        }
    }, [presetsLoading, presets, initialScope]);

    useEffect(() => {
        if (prefsRestored.current) writePrefs({ presetId: selectedPresetId ?? undefined });
    }, [selectedPresetId]);

    // ===============================
    // Visitor source data
    // ===============================
    /**
     * Looks up every code and adds its cards. Only cards matching `scope` (the template category)
     * are added; the result of all codes is reported in one notice.
     */
    const addFromCodes = useCallback(async (rawCodes: string[], scopeOverride?: CardPresetScope, extraMessage = '') => {
        const codes = rawCodes.map((c) => c.trim().replace(/^#/, '').toUpperCase()).filter(Boolean);
        if (codes.length === 0) return;
        const activeScope = scopeOverride ?? scopeRef.current;
        setLookupLoading(true);
        setNotice(null);

        const existing = new Set(cardsRef.current.map((c) => c.fields.cardCode).filter(Boolean));
        const fresh: VisitorCardData[] = [];
        const notFound: string[] = [];
        const wrongCategory: string[] = [];
        let rejected = 0;
        let failed = 0;

        for (const code of codes) {
            try {
                // The API returns the whole request for a request code and a single card for a visitor code (…V2)
                const all = (await cardStudioApi.lookupCardSources(code)).map(sourceToCard);
                if (all.length === 0) {
                    notFound.push(code);
                    continue;
                }
                // A category template only accepts cards of its own category
                const matching = all.filter((c) => cardMatchesScope(c.fields, activeScope));
                if (matching.length === 0) {
                    wrongCategory.push(code);
                    continue;
                }
                rejected += all.length - matching.length;
                for (const card of matching) {
                    if (card.fields.cardCode && existing.has(card.fields.cardCode)) continue;
                    if (card.fields.cardCode) existing.add(card.fields.cardCode);
                    fresh.push(card);
                }
            } catch {
                failed++;
            }
        }

        if (fresh.length > 0) setCards((prev) => [...prev, ...fresh]);

        const parts: string[] = [];
        if (extraMessage) parts.push(extraMessage);
        if (fresh.length > 0) {
            parts.push(`Added ${fresh.length} card${fresh.length === 1 ? '' : 's'} from ${codes.length === 1 ? codes[0] : `${codes.length} requests`}.`);
            const notApproved = fresh.filter((c) => !['APPROVED', 'COMPLETE'].includes(c.fields.status.toUpperCase())).length;
            if (notApproved > 0) parts.push(`${notApproved} of them belong to a request that is not approved yet.`);
        } else if (notFound.length === 0 && wrongCategory.length === 0 && failed === 0) {
            parts.push('These cards are already in the list.');
        }
        if (rejected > 0) parts.push(`Skipped ${rejected} card${rejected === 1 ? '' : 's'} of another category.`);
        if (wrongCategory.length > 0) {
            parts.push(`${wrongCategory.join(', ')} ${wrongCategory.length === 1 ? 'is' : 'are'} not ${CARD_SCOPE_LABELS[activeScope]} and cannot be printed with this template.`);
        }
        if (notFound.length > 0) parts.push(`No visitors found for ${notFound.join(', ')}.`);
        if (failed > 0) parts.push(`${failed} lookup${failed === 1 ? '' : 's'} failed, please try again.`);

        const isError = fresh.length === 0 && (notFound.length > 0 || wrongCategory.length > 0 || failed > 0);
        setNotice({ type: isError ? 'error' : 'success', message: parts.join(' ') });
        if (!isError) setLookupCode('');
        setLookupLoading(false);
    }, []);

    const addFromCode = useCallback((code: string) => addFromCodes([code]), [addFromCodes]);

    // Pick the template of the requested category, then load the requests' cards
    const initialLoaded = useRef(false);
    useEffect(() => {
        if (initialLoaded.current || initialCodes.length === 0 || presetsLoading) return;
        initialLoaded.current = true;

        if (!initialScope) {
            addFromCodes(initialCodes);
            return;
        }
        const prefs = readPrefs();
        const candidates = presets.filter((p) => p.settings.requestType === initialScope);
        const template = candidates.find((p) => p.id === prefs.presetId) ?? candidates[0];
        if (template) {
            setSelectedPresetId(template.id);
            setWorkingSettings(template.settings);
            addFromCodes(initialCodes, initialScope, `Using template “${template.name}”.`);
        } else {
            setSelectedPresetId(null);
            setWorkingSettings({ ...DEFAULT_CARD_SETTINGS, requestType: initialScope });
            addFromCodes(
                initialCodes,
                initialScope,
                `No saved template for ${CARD_SCOPE_LABELS[initialScope]} yet, so an untitled ${CARD_SCOPE_LABELS[initialScope]} template is used. Design and save it in Card Design.`
            );
        }
    }, [initialCodes, initialScope, presets, presetsLoading, addFromCodes]);

    // ===============================
    // Preset actions
    // ===============================
    const handleSelectPreset = (id: string) => {
        if (id === (selectedPresetId ?? '')) return;
        if (isDirty && !window.confirm('Discard unsaved changes to the current template?')) return;
        if (!id) {
            startNewTemplate();
            return;
        }
        const preset = presets.find((p) => p.id === id);
        if (!preset) return;
        const nextScope = preset.settings.requestType;
        const mismatched = cardsRef.current.filter((c) => !cardMatchesScope(c.fields, nextScope));
        if (mismatched.length > 0) {
            const ok = window.confirm(
                `"${preset.name}" is for ${CARD_SCOPE_LABELS[nextScope]} cards only. Remove ${mismatched.length} card${mismatched.length === 1 ? '' : 's'} of other categories from the print list?`
            );
            if (!ok) return;
            setCards((prev) => prev.filter((c) => cardMatchesScope(c.fields, nextScope)));
        }
        setSelectedPresetId(preset.id);
        setWorkingSettings(preset.settings);
        setSelection(null);
    };

    /** Blank template with only the fixed layout (logo, QR, footer) */
    function startNewTemplate() {
        setSelectedPresetId(null);
        setWorkingSettings(DEFAULT_CARD_SETTINGS);
        setSelection(null);
    }

    const handleNewTemplate = () => {
        if (isDirty && !window.confirm('Discard unsaved changes to the current template?')) return;
        startNewTemplate();
    };

    const handleSaveOverwrite = async () => {
        if (!selectedPreset) {
            setNameModal({ mode: 'create', initialName: '' });
            return;
        }
        try {
            const updated = await updatePreset(selectedPreset.id, { settings: workingSettings });
            setWorkingSettings(updated.settings);
            setNotice({ type: 'success', message: `Saved "${updated.name}".` });
        } catch (err) {
            setNotice({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save template' });
        }
    };

    const handleNameSubmit = async (name: string) => {
        if (!nameModal) return;
        if (nameModal.mode === 'rename') {
            if (!selectedPreset) return;
            const updated = await updatePreset(selectedPreset.id, { name });
            setNotice({ type: 'success', message: `Renamed to "${updated.name}".` });
        } else {
            // "create" saves the working settings; "duplicate" copies the saved preset as-is
            const settings = nameModal.mode === 'create' ? workingSettings : savedSettings;
            const created = await createPreset(name, settings);
            setSelectedPresetId(created.id);
            setWorkingSettings(created.settings);
            setNotice({ type: 'success', message: `Saved template "${created.name}".` });
        }
        setNameModal(null);
    };

    const handleDeletePreset = async () => {
        if (!selectedPreset) return;
        try {
            const name = selectedPreset.name;
            await deletePreset(selectedPreset.id);
            startNewTemplate();
            setNotice({ type: 'success', message: `Deleted "${name}".` });
        } catch (err) {
            setNotice({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete template' });
        } finally {
            setConfirmDeleteOpen(false);
        }
    };

    // ===============================
    // Card actions
    // ===============================
    const handleBulkApply = (payload: CardBulkEditPayload) => {
        setCards((prev) => prev.map((c) => withFields(c, payload)));
        setBulkOpen(false);
        setNotice({ type: 'success', message: `Updated ${cards.length} card${cards.length === 1 ? '' : 's'}.` });
    };

    const handleSaveCard = (updated: VisitorCardData) => {
        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setEditingCard(null);
    };

    const removeCard = (id: string) => setCards((prev) => prev.filter((c) => c.id !== id));

    const sheetGrid = computeSheetGrid(workingSettings.size);
    const pageCount = paginateCards(cards, sheetGrid.perPage).length;
    const previewCard = cards.find((c) => cardMatchesScope(c.fields, scope)) ?? sampleCardFor(scope);
    const mismatchedCards = cards.filter((c) => !cardMatchesScope(c.fields, scope));

    const presetSelect = (id: string) => (
        <select
            id={id}
            value={selectedPresetId ?? ''}
            onChange={(e) => handleSelectPreset(e.target.value)}
            disabled={presetsLoading}
            className="min-w-[260px] cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-mwk"
        >
            <option value="">{selectedPresetId ? '+ New blank template' : 'Untitled template (not saved)'}</option>
            {presets.length > 0 && (
                <optgroup label={mode === 'server' ? 'Shared templates' : 'Templates on this computer'}>
                    {presets.map((p) => <option key={p.id} value={p.id}>{presetOptionLabel(p.name, p.settings.requestType)}</option>)}
                </optgroup>
            )}
        </select>
    );

    const dirtyBadge = isDirty && (
        <span className="whitespace-nowrap rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] font-bold text-gray-500">Unsaved changes</span>
    );

    const tabs: { key: StudioTab; label: string; count?: number }[] = [
        { key: 'design', label: 'Card Design' },
        { key: 'print', label: 'Print Cards', count: cards.length },
    ];

    return (
        <div className="min-h-full bg-[var(--color-bg-page)] p-4 sm:p-6">
            {/* Tabs */}
            <div className="mb-4 flex gap-6 border-b border-gray-200" role="tablist">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.key}
                        onClick={() => setTab(t.key)}
                        className={`-mb-px flex cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-2.5 text-sm font-bold transition-colors ${
                            tab === t.key ? 'border-mwk text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        {t.label}
                        {t.count !== undefined && t.count > 0 && (
                            <span className="rounded-full bg-gray-900 px-1.5 py-px text-[10px] font-bold text-white">{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {(mode === 'local' || loadError) && (
                <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-600">
                    {loadError
                        ? `Could not load shared settings: ${loadError}`
                        : 'Shared setting storage is not available, so settings are saved on this computer only. Run scripts/create_visitor_card_presets.js to share them with every admin.'}
                </div>
            )}

            {tab === 'design' ? (
                <>
                    {notice && renderNotice()}

                    {/* Editor workspace: toolbar + Layers | Inspector | Canvas */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-4 py-2.5">
                            <label htmlFor="preset-select-design" className="sr-only">Card setting</label>
                            {presetSelect('preset-select-design')}
                            {dirtyBadge}

                            <div className="ml-auto flex items-center gap-2">
                                {isDirty && (
                                    <button
                                        type="button"
                                        className="cursor-pointer whitespace-nowrap px-2 text-xs font-semibold text-gray-400 hover:text-gray-700"
                                        onClick={() => {
                                            setWorkingSettings(savedSettings);
                                            setSelection(null);
                                        }}
                                    >
                                        Discard changes
                                    </button>
                                )}
                                <div className="flex divide-x divide-gray-200 overflow-hidden rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">
                                    <button type="button" className="cursor-pointer px-3 py-1.5 transition-colors hover:bg-gray-50" onClick={handleNewTemplate}>
                                        New
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer px-3 py-1.5 transition-colors hover:bg-gray-50"
                                        onClick={() => setNameModal({ mode: 'create', initialName: selectedPreset ? suggestCopyName(selectedPreset.name) : '' })}
                                    >
                                        Save as…
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer px-3 py-1.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                                        disabled={!selectedPreset}
                                        onClick={() => selectedPreset && setNameModal({ mode: 'duplicate', initialName: suggestCopyName(selectedPreset.name) })}
                                    >
                                        Duplicate
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer px-3 py-1.5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                                        disabled={!selectedPreset}
                                        onClick={() => selectedPreset && setNameModal({ mode: 'rename', initialName: selectedPreset.name })}
                                    >
                                        Rename
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer px-3 py-1.5 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                                        disabled={!selectedPreset}
                                        onClick={() => setConfirmDeleteOpen(true)}
                                    >
                                        Delete
                                    </button>
                                </div>
                                <button type="button" className={studioPrimaryButtonClass} onClick={handleSaveOverwrite} disabled={Boolean(selectedPreset) && !isDirty}>
                                    Save
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:h-[calc(100vh-17rem)] lg:min-h-[560px] lg:grid-cols-[220px_minmax(0,1fr)_480px]">
                            {/* Layers */}
                            <div className="custom-scrollbar border-b border-gray-200 p-3 lg:overflow-y-auto lg:border-b-0 lg:border-r">
                                <CardLayersPanel settings={workingSettings} onChange={setWorkingSettings} selection={selection} onSelect={setSelection} />
                            </div>

                            {/* Inspector */}
                            <div className="flex min-h-0 flex-col border-b border-gray-200 lg:border-b-0 lg:border-r">
                                <div className="flex shrink-0 gap-4 border-b border-gray-200 px-4" role="tablist">
                                    {INSPECTOR_TABS.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            role="tab"
                                            aria-selected={inspectorTab === key}
                                            onClick={() => setInspectorTab(key)}
                                            className={`-mb-px cursor-pointer border-b-2 py-2.5 text-xs font-bold transition-colors ${
                                                inspectorTab === key ? 'border-mwk text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <div className="custom-scrollbar min-h-0 flex-1 p-4 lg:overflow-y-auto">
                                    {inspectorTab === 'element' ? (
                                        <SelectedElementInspector settings={workingSettings} onChange={setWorkingSettings} selection={selection} onSelect={setSelection} />
                                    ) : (
                                        <CardStyleInspector settings={workingSettings} onChange={setWorkingSettings} />
                                    )}
                                </div>
                            </div>

                            {/* Canvas */}
                            <div className="flex min-h-0 flex-col bg-gray-50">
                                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2.5 text-[11px]">
                                    <span className="font-bold uppercase tracking-wider text-gray-400">Preview</span>
                                    <span className="truncate font-medium text-gray-500">
                                        {workingSettings.size.widthMm} × {workingSettings.size.heightMm} mm · {sheetGrid.perPage} per A4 ·{' '}
                                        {cards.length > 0 ? `data of ${previewCard.fields.visitorName || 'first card'}` : 'sample data'}
                                    </span>
                                </div>
                                <div className="flex min-h-[360px] flex-1 items-center justify-center bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:14px_14px] p-6">
                                    <CardDesigner
                                        card={previewCard}
                                        settings={workingSettings}
                                        selection={selection}
                                        onSelect={setSelection}
                                        onChange={setWorkingSettings}
                                        maxWidthPx={360}
                                        maxHeightPx={456}
                                    />
                                </div>
                                <p className="shrink-0 border-t border-gray-200 bg-white px-4 py-2 text-center text-[11px] text-gray-400">
                                    Click to select · Drag to move · Blue corner to resize · Click a custom text to type (Enter = new line, Esc = done)
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Print toolbar: pick the setting to apply, then edit / print cards */}
                    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                        <label htmlFor="preset-select-print" className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-gray-400">Apply setting</label>
                        {presetSelect('preset-select-print')}
                        <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-600">
                            {CARD_SCOPE_LABELS[scope]}
                        </span>
                        {dirtyBadge}
                        <button type="button" className="cursor-pointer whitespace-nowrap text-xs font-bold text-gray-400 hover:text-mwk" onClick={() => setTab('design')}>
                            Edit design →
                        </button>
                        <div className="ml-auto flex items-center gap-2">
                            <button type="button" className={studioSecondaryButtonClass} onClick={() => setBulkOpen(true)} disabled={cards.length === 0}>
                                Bulk edit
                            </button>
                            <button
                                type="button"
                                className={studioPrimaryButtonClass}
                                onClick={() => window.print()}
                                disabled={cards.length === 0 || mismatchedCards.length > 0}
                                title={mismatchedCards.length > 0 ? 'Remove cards of other categories first' : undefined}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                                </svg>
                                Print A4 / Save PDF
                            </button>
                        </div>
                    </div>

                    {mismatchedCards.length > 0 && (
                        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-800">
                            <span className="flex-1">
                                {mismatchedCards.length} card{mismatchedCards.length === 1 ? '' : 's'} in the list {mismatchedCards.length === 1 ? 'is' : 'are'} not{' '}
                                {CARD_SCOPE_LABELS[scope]} and cannot be printed with &ldquo;{templateName}&rdquo;.
                            </span>
                            <button
                                type="button"
                                className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                                onClick={() => setCards((prev) => prev.filter((c) => cardMatchesScope(c.fields, scope)))}
                            >
                                Remove {mismatchedCards.length} card{mismatchedCards.length === 1 ? '' : 's'}
                            </button>
                        </div>
                    )}

                    <div className="rounded-2xl border border-gray-200 bg-white">
                        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
                            <form
                                className="flex flex-1 items-center gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    addFromCode(lookupCode);
                                }}
                            >
                                <input
                                    value={lookupCode}
                                    onChange={(e) => setLookupCode(e.target.value)}
                                    placeholder="Request or visitor code (e.g. V06102623)"
                                    className={`${studioInputClass} max-w-xs`}
                                    aria-label="Request or visitor code"
                                />
                                <button type="submit" className={studioSecondaryButtonClass} disabled={lookupLoading || !lookupCode.trim()}>
                                    {lookupLoading ? 'Searching…' : 'Add cards'}
                                </button>
                            </form>
                            <button type="button" className={studioSecondaryButtonClass} onClick={() => setCards((prev) => [...prev, createBlankCard(CARD_SCOPE_DEFAULT_CATEGORY[scope])])}>
                                Blank card
                            </button>
                            <button
                                type="button"
                                className={studioSecondaryButtonClass}
                                disabled={cards.length === 0}
                                onClick={() => window.confirm('Remove all cards from the list?') && setCards([])}
                            >
                                Clear
                            </button>
                            <span className="ml-auto whitespace-nowrap text-xs font-semibold text-gray-500">
                                {sheetGrid.perPage} cards / A4 ({sheetGrid.cols} × {sheetGrid.rows})
                            </span>
                        </div>

                        {notice && <div className="px-4 pt-3">{renderNotice()}</div>}

                        <div className="flex items-center justify-between px-4 pt-3 text-xs text-gray-500">
                            <span>
                                <span className="font-extrabold text-gray-900">{cards.length}</span> card{cards.length === 1 ? '' : 's'} ·{' '}
                                <span className="font-extrabold text-gray-900">{pageCount}</span> A4 page{pageCount === 1 ? '' : 's'}
                            </span>
                            {cards.length > 0 && <span>Click a card to edit its content</span>}
                        </div>

                        {cards.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
                                <p className="text-sm font-bold text-gray-700">No cards yet</p>
                                <p className="max-w-sm text-xs text-gray-500">
                                    Enter a request or visitor code above, or use &ldquo;Print cards&rdquo; in a request&apos;s detail view in Admin Settings to load it automatically.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-5 p-4">
                                {cards.map((card) => (
                                    <div key={card.id} className="group relative">
                                        <button
                                            type="button"
                                            onClick={() => setEditingCard(card)}
                                            className="block cursor-pointer transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mwk"
                                            aria-label={`Edit card ${card.fields.visitorName}`}
                                        >
                                            <VisitorCard card={card} settings={workingSettings} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeCard(card.id)}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 opacity-0 shadow-sm transition-opacity hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                                            aria-label={`Remove card ${card.fields.visitorName}`}
                                            title="Remove card"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3 w-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modals */}
            <PresetNameModal
                mode={nameModal?.mode ?? null}
                initialName={nameModal?.initialName ?? ''}
                onSubmit={handleNameSubmit}
                onClose={() => setNameModal(null)}
            />
            <CardBulkEditModal open={bulkOpen} cardCount={cards.length} onApply={handleBulkApply} onClose={() => setBulkOpen(false)} />
            <CardEditModal card={editingCard} settings={workingSettings} onSave={handleSaveCard} onClose={() => setEditingCard(null)} />
            <StudioModal
                open={confirmDeleteOpen}
                eyebrow="Delete setting"
                title={`Delete "${templateName}"?`}
                onClose={() => setConfirmDeleteOpen(false)}
                footer={
                    <>
                        <button type="button" className={studioSecondaryButtonClass} onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
                        <button type="button" className={studioPrimaryButtonClass} onClick={handleDeletePreset}>Delete</button>
                    </>
                }
            >
                <p className="text-sm text-gray-600">
                    {mode === 'server'
                        ? 'This setting is shared, so it will be removed for every visitor admin.'
                        : 'This setting will be removed from this computer.'}
                </p>
            </StudioModal>

            {/* Print-only A4 sheets */}
            <CardPrintSheet cards={cards} settings={workingSettings} />
        </div>
    );

    function renderNotice() {
        if (!notice) return null;
        return (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700" role="status">
                <span className={`h-2 w-2 shrink-0 rounded-full ${notice.type === 'success' ? 'bg-emerald-500' : 'bg-mwk'}`} />
                <span className="flex-1">{notice.message}</span>
                <button type="button" onClick={() => setNotice(null)} className="cursor-pointer text-gray-400 hover:text-gray-700" aria-label="Dismiss">✕</button>
            </div>
        );
    }
}
