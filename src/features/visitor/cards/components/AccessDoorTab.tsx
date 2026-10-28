'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AccessAssignment, AccessOptionsResponse, AccessSettings } from '@/types/visitor-access.types';
import { accessDoorApi } from '@/features/visitor/cards/services/accessDoorApi';
import { EMPTY_ACCESS_SETTINGS, accessDefaultKey, buildOrgPaths } from '@/features/visitor/cards/utils/accessDoor';
import AccessSettingsModal from './AccessSettingsModal';
import AccessAssignTable from './AccessAssignTable';
import AccessCardsTable from './AccessCardsTable';
import AccessCardLookup from './AccessCardLookup';

type Notice = { type: 'success' | 'error'; message: string } | null;
type AccessView = 'assign' | 'cards' | 'lookup';

/**
 * Access Door: gives visitors (by visitor code) physical cards in HikCentral - in bulk from a
 * table - and shows which card is with which visitor, with bulk revoke. Visitor admins only.
 */
export default function AccessDoorTab() {
    const [view, setView] = useState<AccessView>('assign');
    const [options, setOptions] = useState<AccessOptionsResponse | null>(null);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [settings, setSettings] = useState<AccessSettings>(EMPTY_ACCESS_SETTINGS);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [storageError, setStorageError] = useState<string | null>(null);
    const [active, setActive] = useState<AccessAssignment[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [notice, setNotice] = useState<Notice>(null);

    const accessLevels = useMemo(() => options?.accessLevels ?? [], [options]);
    const orgOptions = useMemo(() => buildOrgPaths(options?.orgs ?? []), [options]);
    const activeByVisitor = useMemo(() => new Map(active.map((a) => [a.visitorCode, a])), [active]);
    const activeByCard = useMemo(() => new Map(active.map((a) => [a.cardNo, a])), [active]);
    const defaultOrgId = settings.defaultOrgs[accessDefaultKey('*', '*')] ?? '';
    const defaultOrgName = orgOptions.find((o) => o.orgIndexCode === defaultOrgId)?.orgName ?? '';

    const notify = useCallback((type: 'success' | 'error', message: string) => setNotice({ type, message }), []);

    // ===============================
    // Loading
    // ===============================
    const loadOptions = useCallback(async () => {
        setOptionsLoading(true);
        try {
            setOptions(await accessDoorApi.getOptions());
        } catch (err) {
            setOptions({ configured: false, orgs: [], accessLevels: [], errors: { orgs: err instanceof Error ? err.message : 'Failed to reach HikCentral' } });
        } finally {
            setOptionsLoading(false);
        }
    }, []);

    const loadSettings = useCallback(async () => {
        try {
            setSettings(await accessDoorApi.getSettings());
            setStorageError(null);
        } catch (err) {
            setStorageError(err instanceof Error ? err.message : 'Failed to load access settings');
        }
    }, []);

    /** Active assignments: which visitor holds which card (used to warn before assigning) */
    const loadActive = useCallback(async () => {
        try {
            setActive(await accessDoorApi.listAssignments('active'));
            setStorageError(null);
        } catch (err) {
            setStorageError(err instanceof Error ? err.message : 'Failed to load card assignments');
        }
    }, []);

    const refreshAssignments = useCallback(async () => {
        await loadActive();
        setRefreshKey((k) => k + 1);
    }, [loadActive]);

    useEffect(() => {
        loadOptions();
        loadSettings();
        loadActive();
    }, [loadOptions, loadSettings, loadActive]);

    // ===============================
    // Render
    // ===============================
    const optionErrors = options?.errors ?? {};
    // Access levels are optional (doors can come from the department), so only the department list is required
    const hikProblem = optionErrors.orgs ?? null;
    const levelsAvailable = !optionErrors.accessLevels && accessLevels.length > 0;

    const views: { key: AccessView; label: string; count?: number }[] = [
        { key: 'assign', label: 'Assign cards' },
        { key: 'cards', label: 'Cards in use', count: active.length },
        { key: 'lookup', label: 'Card lookup' },
    ];

    return (
        <div className="space-y-4">
            {/* Toolbar: section switch + settings */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Access Door sections">
                    {views.map((v) => {
                        const selected = view === v.key;
                        return (
                            <button
                                key={v.key}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                onClick={() => setView(v.key)}
                                className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                                    selected ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                {v.label}
                                {v.count !== undefined && v.count > 0 && (
                                    <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${selected ? 'bg-mwk text-white' : 'bg-gray-300 text-gray-700'}`}>
                                        {v.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    disabled={optionsLoading}
                    title={defaultOrgId ? `Default department: ${defaultOrgName || `#${defaultOrgId}`}` : 'Default department not set'}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    Access settings
                </button>
            </div>

            {/* Only problems are shown; a working connection needs no banner */}
            {hikProblem && !optionsLoading && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-800">
                    <span className="flex-1">{hikProblem}</span>
                    <button type="button" className="cursor-pointer font-bold underline underline-offset-2" onClick={loadOptions}>
                        Retry
                    </button>
                </div>
            )}
            {storageError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-800">{storageError}</div>
            )}
            {notice && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700" role="status">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${notice.type === 'success' ? 'bg-emerald-500' : 'bg-mwk'}`} />
                    <span className="flex-1">{notice.message}</span>
                    <button type="button" onClick={() => setNotice(null)} className="cursor-pointer text-gray-400 hover:text-gray-700" aria-label="Dismiss">✕</button>
                </div>
            )}

            {/* Both views stay mounted so the assign table keeps its rows when switching */}
            <div className={view === 'assign' ? '' : 'hidden'}>
                <AccessAssignTable
                    orgOptions={orgOptions}
                    accessLevels={accessLevels}
                    levelsAvailable={levelsAvailable}
                    settings={settings}
                    activeByVisitor={activeByVisitor}
                    activeByCard={activeByCard}
                    onAssigned={refreshAssignments}
                    notify={notify}
                />
            </div>
            <div className={view === 'cards' ? '' : 'hidden'}>
                <AccessCardsTable refreshKey={refreshKey} onChanged={loadActive} notify={notify} />
            </div>
            {view === 'lookup' && <AccessCardLookup orgOptions={orgOptions} onReleased={refreshAssignments} />}

            <AccessSettingsModal
                open={settingsOpen}
                settings={settings}
                orgs={options?.orgs ?? []}
                accessLevels={accessLevels}
                optionErrors={optionErrors}
                onClose={() => setSettingsOpen(false)}
                onSave={async (next) => {
                    const saved = await accessDoorApi.saveSettings(next);
                    setSettings(saved);
                    setSettingsOpen(false);
                    notify('success', 'Access settings saved.');
                }}
            />
        </div>
    );
}
