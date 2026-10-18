'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AccessAssignment, AccessCheckResponse, AccessOptionsResponse, AccessSettings } from '@/types/visitor-access.types';
import type { VisitorCardData, CardRequestType } from '@/types/visitor-card.types';
import { accessDoorApi } from '@/features/visitor/cards/services/accessDoorApi';
import { cardStudioApi } from '@/features/visitor/cards/services/cardStudioApi';
import { sourceToCard } from '@/features/visitor/cards/utils/cardData';
import {
    CARD_NO_PATTERN,
    EMPTY_ACCESS_SETTINGS,
    accessDefaultKey,
    buildOrgPaths,
    defaultValidity,
    resolveDefault,
    toFactoryLocal,
} from '@/features/visitor/cards/utils/accessDoor';
import { REQUEST_TYPE_LABELS } from '@/utils/visitorCategory';
import AccessSettingsModal from './AccessSettingsModal';
import StudioModal, { studioInputClass, studioLabelClass, studioPrimaryButtonClass, studioSecondaryButtonClass } from './StudioModal';

type Notice = { type: 'success' | 'error'; message: string } | null;

interface FoundVisitor {
    card: VisitorCardData;
    requestType: CardRequestType;
}

interface AssignForm {
    cardNo: string;
    orgIndexCode: string;
    /** Optional direct access level ('' = doors come from the department) */
    privilegeGroupId: string;
    beginTime: string;
    endTime: string;
}

const APPROVED_STATUSES = ['APPROVED', 'COMPLETE'];

const STATUS_PILL: Record<AccessAssignment['status'], string> = {
    active: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    revoked: 'bg-gray-50 text-gray-500 border-gray-200',
    replaced: 'bg-gray-50 text-gray-500 border-gray-200',
};

/** ISO -> "dd/MM/yyyy HH:mm" in factory time */
function formatDateTime(iso: string | null): string {
    if (!iso) return '';
    const local = toFactoryLocal(iso);
    if (!local) return '';
    const [date, time] = local.split('T');
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y} ${time}`;
}

function formatDate(value: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

/**
 * Access Door: gives a visitor (by visitor code) a physical card with door access in HikCentral,
 * and lists / revokes the cards in use. Visitor admins only.
 */
export default function AccessDoorTab() {
    const [options, setOptions] = useState<AccessOptionsResponse | null>(null);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [settings, setSettings] = useState<AccessSettings>(EMPTY_ACCESS_SETTINGS);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [storageError, setStorageError] = useState<string | null>(null);

    const [lookupCode, setLookupCode] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [found, setFound] = useState<FoundVisitor[]>([]);
    const [selected, setSelected] = useState<FoundVisitor | null>(null);
    const [form, setForm] = useState<AssignForm>({ cardNo: '', orgIndexCode: '', privilegeGroupId: '', beginTime: '', endTime: '' });
    const [assigning, setAssigning] = useState(false);
    const cardInputRef = useRef<HTMLInputElement | null>(null);

    const [scope, setScope] = useState<'active' | 'all'>('active');
    const [search, setSearch] = useState('');
    const [assignments, setAssignments] = useState<AccessAssignment[]>([]);
    const [activeByVisitor, setActiveByVisitor] = useState<Map<string, AccessAssignment>>(new Map());
    const [listLoading, setListLoading] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState<AccessAssignment | null>(null);
    const [revoking, setRevoking] = useState(false);
    const [checks, setChecks] = useState<Record<string, AccessCheckResponse | { error: string } | 'loading'>>({});

    const [notice, setNotice] = useState<Notice>(null);

    const accessLevels = useMemo(() => options?.accessLevels ?? [], [options]);
    const orgOptions = useMemo(() => buildOrgPaths(options?.orgs ?? []), [options]);
    const orgName = useCallback(
        (id: string) => orgOptions.find((o) => o.orgIndexCode === id)?.orgName ?? '',
        [orgOptions]
    );
    const defaultOrgId = settings.defaultOrgs[accessDefaultKey('*', '*')] ?? '';
    const levelName = useCallback(
        (id: string) => accessLevels.find((l) => l.privilegeGroupId === id)?.privilegeGroupName ?? '',
        [accessLevels]
    );

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

    const loadAssignments = useCallback(async () => {
        setListLoading(true);
        try {
            const [list, active] = await Promise.all([
                accessDoorApi.listAssignments(scope, search),
                scope === 'active' && !search ? null : accessDoorApi.listAssignments('active'),
            ]);
            setAssignments(list);
            setActiveByVisitor(new Map((active ?? list).map((a) => [a.visitorCode, a])));
            setStorageError(null);
        } catch (err) {
            setStorageError(err instanceof Error ? err.message : 'Failed to load card assignments');
        } finally {
            setListLoading(false);
        }
    }, [scope, search]);

    useEffect(() => {
        loadOptions();
        loadSettings();
    }, [loadOptions, loadSettings]);

    useEffect(() => {
        const timer = setTimeout(loadAssignments, 250);
        return () => clearTimeout(timer);
    }, [loadAssignments]);

    // ===============================
    // Find & select a visitor
    // ===============================
    const selectVisitor = useCallback(
        (visitor: FoundVisitor) => {
            const f = visitor.card.fields;
            const current = activeByVisitor.get(f.cardCode);
            const validity = defaultValidity(f.dateFrom, f.dateTo);
            setSelected(visitor);
            setForm({
                cardNo: '',
                orgIndexCode: current?.orgIndexCode || resolveDefault(settings.defaultOrgs, visitor.requestType, f.visitingSite),
                privilegeGroupId: current?.privilegeGroupId || resolveDefault(settings.defaultLevels, visitor.requestType, f.visitingSite),
                beginTime: validity.beginTime,
                endTime: validity.endTime,
            });
            requestAnimationFrame(() => cardInputRef.current?.focus());
        },
        [activeByVisitor, settings]
    );

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = lookupCode.trim().replace(/^#/, '').toUpperCase();
        if (!code) return;
        setLookupLoading(true);
        setNotice(null);
        try {
            const sources = await cardStudioApi.lookupCardSources(code);
            const visitors = sources.map((s) => ({ card: sourceToCard(s), requestType: s.requestType }));
            setFound(visitors);
            if (visitors.length === 0) {
                setSelected(null);
                setNotice({ type: 'error', message: `No visitors found for ${code}.` });
            } else if (visitors.length === 1) {
                selectVisitor(visitors[0]);
            } else {
                setSelected(null);
            }
        } catch (err) {
            setNotice({ type: 'error', message: err instanceof Error ? err.message : 'Lookup failed' });
        } finally {
            setLookupLoading(false);
        }
    };

    // ===============================
    // Assign / revoke / check
    // ===============================
    const selectedFields = selected?.card.fields;
    const currentOfSelected = selectedFields ? activeByVisitor.get(selectedFields.cardCode) : undefined;
    const cardNoValid = CARD_NO_PATTERN.test(form.cardNo.trim());
    const canAssign = Boolean(selected && cardNoValid && form.orgIndexCode && form.beginTime && form.endTime && form.endTime > form.beginTime);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected || !selectedFields || !canAssign) return;
        setAssigning(true);
        setNotice(null);
        try {
            const assignment = await accessDoorApi.assign({
                visitorCode: selectedFields.cardCode,
                requestCode: selectedFields.requestCode,
                visitorName: selectedFields.visitorName,
                company: selectedFields.visitorCompany,
                category: selectedFields.category,
                site: selectedFields.visitingSite,
                cardNo: form.cardNo.trim(),
                orgIndexCode: form.orgIndexCode,
                orgName: orgName(form.orgIndexCode),
                privilegeGroupId: form.privilegeGroupId,
                privilegeGroupName: levelName(form.privilegeGroupId),
                beginTime: form.beginTime,
                endTime: form.endTime,
            });
            setNotice({
                type: 'success',
                message: `Card ${assignment.cardNo} assigned to ${assignment.visitorName} (${assignment.visitorCode}) in ${assignment.orgName || 'the department'}${
                    assignment.privilegeGroupName ? ` with "${assignment.privilegeGroupName}"` : ''
                }. HikCentral is applying it to the doors.`,
            });
            setForm((prev) => ({ ...prev, cardNo: '' }));
            await loadAssignments();
        } catch (err) {
            setNotice({ type: 'error', message: err instanceof Error ? err.message : 'Failed to assign the card' });
            await loadAssignments();
        } finally {
            setAssigning(false);
        }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        setRevoking(true);
        try {
            const revoked = await accessDoorApi.revoke(revokeTarget.id);
            setNotice({ type: 'success', message: `Card ${revoked.cardNo} revoked from ${revoked.visitorName} and freed for reuse.` });
            setRevokeTarget(null);
            await loadAssignments();
        } catch (err) {
            setNotice({ type: 'error', message: err instanceof Error ? err.message : 'Failed to revoke the card' });
        } finally {
            setRevoking(false);
        }
    };

    const handleCheck = async (a: AccessAssignment) => {
        setChecks((prev) => ({ ...prev, [a.id]: 'loading' }));
        try {
            const result = await accessDoorApi.check(a.id);
            setChecks((prev) => ({ ...prev, [a.id]: result }));
        } catch (err) {
            setChecks((prev) => ({ ...prev, [a.id]: { error: err instanceof Error ? err.message : 'Check failed' } }));
        }
    };

    // ===============================
    // Render
    // ===============================
    const optionErrors = options?.errors ?? {};
    // Access levels are optional (doors can come from the department), so only the department list is required
    const hikProblems = [optionErrors.orgs].filter((m): m is string => Boolean(m));
    const levelsAvailable = !optionErrors.accessLevels && accessLevels.length > 0;
    const orgMissing = !defaultOrgId;

    return (
        <div className="space-y-4">
            {/* Connection & configuration status */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        optionsLoading ? 'bg-gray-300' : hikProblems.length === 0 ? 'bg-emerald-500' : options?.orgs.length ? 'bg-amber-500' : 'bg-mwk'
                    }`}
                />
                <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-gray-900">
                        {optionsLoading
                            ? 'Connecting to HikCentral…'
                            : hikProblems.length === 0
                              ? `HikCentral connected · ${orgOptions.length} departments${levelsAvailable ? ` · ${accessLevels.length} access levels` : ''}`
                              : 'HikCentral is not available'}
                    </p>
                    <p className="truncate text-gray-500">
                        Default department:{' '}
                        {defaultOrgId ? (
                            <span className="font-semibold text-gray-700">{orgName(defaultOrgId) || `#${defaultOrgId}`}</span>
                        ) : (
                            <span className="font-semibold text-mwk">not set</span>
                        )}
                        {!optionsLoading && !levelsAvailable && ' · doors come from the department\'s access levels'}
                    </p>
                </div>
                <button type="button" className={studioSecondaryButtonClass} onClick={loadOptions} disabled={optionsLoading}>
                    Test connection
                </button>
                <button type="button" className={studioSecondaryButtonClass} onClick={() => setSettingsOpen(true)} disabled={optionsLoading}>
                    Access settings
                </button>
            </div>

            {hikProblems.length > 0 && !optionsLoading && (
                <div className="space-y-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-800">
                    {hikProblems.map((m) => <p key={m}>{m}</p>)}
                </div>
            )}
            {storageError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-800">{storageError}</div>
            )}
            {orgMissing && !storageError && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-semibold text-orange-800">
                    <span className="flex-1">Choose the default HikCentral department for visitors in Access settings.</span>
                    <button type="button" className="cursor-pointer font-bold underline underline-offset-2" onClick={() => setSettingsOpen(true)}>
                        Open Access settings
                    </button>
                </div>
            )}
            {notice && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700" role="status">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${notice.type === 'success' ? 'bg-emerald-500' : 'bg-mwk'}`} />
                    <span className="flex-1">{notice.message}</span>
                    <button type="button" onClick={() => setNotice(null)} className="cursor-pointer text-gray-400 hover:text-gray-700" aria-label="Dismiss">✕</button>
                </div>
            )}

            {/* Find visitor | Assign card */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
                <div className="rounded-2xl border border-gray-200 bg-white">
                    <form onSubmit={handleLookup} className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
                        <input
                            value={lookupCode}
                            onChange={(e) => setLookupCode(e.target.value)}
                            placeholder="Visitor or request code (e.g. V06102623V3)"
                            className={`${studioInputClass} max-w-xs`}
                            aria-label="Visitor or request code"
                        />
                        <button type="submit" className={studioSecondaryButtonClass} disabled={lookupLoading || !lookupCode.trim()}>
                            {lookupLoading ? 'Searching…' : 'Find visitor'}
                        </button>
                    </form>
                    {found.length === 0 ? (
                        <p className="px-4 py-12 text-center text-xs text-gray-500">
                            Enter a visitor code (one visitor) or a request code (every visitor of the request).
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {found.map((v) => {
                                const f = v.card.fields;
                                const current = activeByVisitor.get(f.cardCode);
                                const active = selectedFields?.cardCode === f.cardCode;
                                return (
                                    <li key={v.card.id}>
                                        <button
                                            type="button"
                                            onClick={() => selectVisitor(v)}
                                            className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors ${active ? 'bg-mwk-soft' : 'hover:bg-gray-50'}`}
                                        >
                                            <span className="w-28 shrink-0 font-mono font-bold text-gray-900">{f.cardCode}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-semibold text-gray-900">{f.visitorName || '—'}</span>
                                                <span className="block truncate text-gray-500">
                                                    {[f.visitorCompany, REQUEST_TYPE_LABELS[v.requestType], f.visitingSite].filter(Boolean).join(' · ')}
                                                </span>
                                            </span>
                                            <span className="hidden shrink-0 whitespace-nowrap text-gray-500 sm:block">
                                                {formatDate(f.dateFrom)}{f.dateTo && f.dateTo !== f.dateFrom ? ` - ${formatDate(f.dateTo)}` : ''}
                                            </span>
                                            {current ? (
                                                <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 font-bold text-green-700">Card {current.cardNo}</span>
                                            ) : (
                                                <span className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 font-semibold text-gray-400">No card</span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <form onSubmit={handleAssign} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="mb-3 text-sm font-bold text-gray-900">Assign card</p>
                    {!selected || !selectedFields ? (
                        <p className="py-10 text-center text-xs text-gray-500">Find a visitor and select them to assign a card.</p>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
                                <p className="truncate font-bold text-gray-900">{selectedFields.visitorName || '—'}</p>
                                <p className="truncate text-gray-500">
                                    <span className="font-mono font-semibold text-gray-700">{selectedFields.cardCode}</span>
                                    {selectedFields.visitorCompany ? ` · ${selectedFields.visitorCompany}` : ''}
                                </p>
                            </div>
                            {!APPROVED_STATUSES.includes(selectedFields.status.toUpperCase()) && (
                                <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">
                                    This request is {selectedFields.status || 'not approved'}, not approved yet.
                                </p>
                            )}
                            {currentOfSelected && (
                                <p className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
                                    Currently holds card <span className="font-bold text-gray-900">{currentOfSelected.cardNo}</span>. Assigning moves the visitor to the new card / access level.
                                </p>
                            )}

                            <label className="block">
                                <span className={studioLabelClass}>Card No.</span>
                                <input
                                    ref={cardInputRef}
                                    value={form.cardNo}
                                    onChange={(e) => setForm((prev) => ({ ...prev, cardNo: e.target.value.replace(/\s/g, '') }))}
                                    placeholder="Type or swipe the card"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={20}
                                    className={`${studioInputClass} font-mono text-base tracking-wider`}
                                />
                                {form.cardNo && !cardNoValid && <span className="mt-1 block text-[11px] font-semibold text-red-600">Letters and digits only, up to 20.</span>}
                            </label>

                            <label className="block">
                                <span className={studioLabelClass}>Department (org)</span>
                                <select
                                    value={form.orgIndexCode}
                                    onChange={(e) => setForm((prev) => ({ ...prev, orgIndexCode: e.target.value }))}
                                    disabled={orgOptions.length === 0}
                                    className={`${studioInputClass} cursor-pointer`}
                                >
                                    <option value="">{orgOptions.length === 0 ? 'No departments available' : 'Choose a department…'}</option>
                                    {orgOptions.map((o) => (
                                        <option key={o.orgIndexCode} value={o.orgIndexCode}>{o.path} · #{o.orgIndexCode}</option>
                                    ))}
                                </select>
                            </label>

                            {levelsAvailable && (
                                <label className="block">
                                    <span className={studioLabelClass}>Access level (optional)</span>
                                    <select
                                        value={form.privilegeGroupId}
                                        onChange={(e) => setForm((prev) => ({ ...prev, privilegeGroupId: e.target.value }))}
                                        className={`${studioInputClass} cursor-pointer`}
                                    >
                                        <option value="">None (department only)</option>
                                        {accessLevels.map((l) => (
                                            <option key={l.privilegeGroupId} value={l.privilegeGroupId}>{l.privilegeGroupName}</option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <label className="block min-w-0">
                                    <span className={studioLabelClass}>Valid from</span>
                                    <input
                                        type="datetime-local"
                                        value={form.beginTime}
                                        onChange={(e) => setForm((prev) => ({ ...prev, beginTime: e.target.value }))}
                                        className={`${studioInputClass} px-2 text-xs`}
                                    />
                                </label>
                                <label className="block min-w-0">
                                    <span className={studioLabelClass}>Valid to</span>
                                    <input
                                        type="datetime-local"
                                        value={form.endTime}
                                        onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                                        className={`${studioInputClass} px-2 text-xs`}
                                    />
                                </label>
                            </div>
                            {form.beginTime && form.endTime && form.endTime <= form.beginTime && (
                                <p className="text-[11px] font-semibold text-red-600">&ldquo;Valid to&rdquo; must be after &ldquo;Valid from&rdquo;.</p>
                            )}

                            <button type="submit" className={`${studioPrimaryButtonClass} w-full`} disabled={!canAssign || assigning}>
                                {assigning ? 'Assigning…' : currentOfSelected ? 'Reassign card' : 'Assign card'}
                            </button>
                            <p className="text-[11px] leading-relaxed text-gray-400">
                                Creates (or updates) HikCentral person <span className="font-mono">{selectedFields.cardCode}</span> with the visitor&apos;s name, this card
                                and validity in {orgName(form.orgIndexCode) || 'the chosen department'}
                                {form.privilegeGroupId ? ', then adds it to the access level.' : '; the department\'s access levels open the doors.'}
                            </p>
                        </div>
                    )}
                </form>
            </div>

            {/* Cards in use / history */}
            <div className="rounded-2xl border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-bold text-gray-900">{scope === 'active' ? 'Cards in use' : 'Assignment history'}</p>
                    <div className="grid grid-cols-2 rounded-md bg-gray-100 p-0.5 text-[11px] font-semibold" role="radiogroup" aria-label="Show">
                        {(['active', 'all'] as const).map((s) => (
                            <button
                                key={s}
                                type="button"
                                role="radio"
                                aria-checked={scope === s}
                                onClick={() => setScope(s)}
                                className={`cursor-pointer whitespace-nowrap rounded px-3 py-1 transition-colors ${scope === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {s === 'active' ? 'Active' : 'History'}
                            </button>
                        ))}
                    </div>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search code, name, card, company…"
                        className={`${studioInputClass} ml-auto max-w-xs py-1.5`}
                        aria-label="Search assignments"
                    />
                    <span className="whitespace-nowrap text-xs font-semibold text-gray-500">{listLoading ? 'Loading…' : `${assignments.length} shown`}</span>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
                        <thead className="border-b border-gray-200 bg-gray-50 font-bold uppercase tracking-wider text-gray-600">
                            <tr>
                                <th className="px-3 py-2.5">Visitor code</th>
                                <th className="px-3 py-2.5">Visitor</th>
                                <th className="px-3 py-2.5">Card No.</th>
                                <th className="px-3 py-2.5">Department / access level</th>
                                <th className="px-3 py-2.5 text-right">Valid from</th>
                                <th className="px-3 py-2.5 text-right">Valid to</th>
                                <th className="px-3 py-2.5">Status</th>
                                <th className="px-3 py-2.5">Assigned</th>
                                <th className="px-3 py-2.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {assignments.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-3 py-10 text-center text-gray-500">
                                        {listLoading ? 'Loading…' : scope === 'active' ? 'No cards in use.' : 'No assignments yet.'}
                                    </td>
                                </tr>
                            ) : (
                                assignments.map((a) => {
                                    const check = checks[a.id];
                                    return (
                                        <tr key={a.id} className="align-top">
                                            <td className="whitespace-nowrap px-3 py-2.5 font-mono font-bold text-gray-900">{a.visitorCode}</td>
                                            <td className="px-3 py-2.5">
                                                <p className="font-semibold text-gray-900">{a.visitorName}</p>
                                                <p className="text-gray-500">{a.company}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 font-mono font-bold text-gray-900">{a.cardNo}</td>
                                            <td className="px-3 py-2.5 text-gray-700">
                                                <p>{a.orgName || (a.orgIndexCode ? `#${a.orgIndexCode}` : '—')}</p>
                                                {a.privilegeGroupId && <p className="text-gray-500">{a.privilegeGroupName || a.privilegeGroupId}</p>}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-gray-700">{formatDateTime(a.beginTime)}</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-gray-700">{formatDateTime(a.endTime)}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_PILL[a.status]}`}>{a.status}</span>
                                                {a.lastError && <p className="mt-1 max-w-[260px] text-[11px] text-red-600">{a.lastError}</p>}
                                                {check === 'loading' && <p className="mt-1 text-[11px] text-gray-500">Checking devices…</p>}
                                                {check && check !== 'loading' && 'error' in check && <p className="mt-1 max-w-[260px] text-[11px] text-red-600">{check.error}</p>}
                                                {check && check !== 'loading' && 'failures' in check && (
                                                    <div className="mt-1 max-w-[280px] text-[11px]">
                                                        {check.failures.length === 0 ? (
                                                            <p className="text-green-700">
                                                                No device errors reported
                                                                {check.pendingCount ? ` (${check.pendingCount} item${check.pendingCount === 1 ? '' : 's'} still applying on the platform)` : ''}.
                                                            </p>
                                                        ) : (
                                                            check.failures.map((f, i) => (
                                                                <p key={i} className="text-red-600">
                                                                    {f.deviceName}{f.resourceName ? ` / ${f.resourceName}` : ''}: {f.errorItems.join(', ') || 'failed'}
                                                                </p>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">
                                                <p>{formatDateTime(a.assignedAt)}</p>
                                                <p>{a.assignedBy}</p>
                                                {a.revokedAt && <p className="text-gray-400">Revoked {formatDateTime(a.revokedAt)}</p>}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                                {a.status === 'active' && (
                                                    <button type="button" className="mr-3 cursor-pointer font-bold text-gray-500 hover:text-gray-900" onClick={() => handleCheck(a)} disabled={check === 'loading'}>
                                                        Check
                                                    </button>
                                                )}
                                                {(a.status === 'active' || a.status === 'failed') && (
                                                    <button type="button" className="cursor-pointer font-bold text-mwk hover:text-mwk-hover" onClick={() => setRevokeTarget(a)}>
                                                        {a.status === 'active' ? 'Revoke' : 'Clean up'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
                    setNotice({ type: 'success', message: 'Access settings saved.' });
                }}
            />

            <StudioModal
                open={Boolean(revokeTarget)}
                eyebrow="Access Door"
                title={revokeTarget ? `${revokeTarget.status === 'active' ? 'Revoke' : 'Clean up'} card ${revokeTarget.cardNo}?` : ''}
                onClose={() => !revoking && setRevokeTarget(null)}
                footer={
                    <>
                        <button type="button" className={studioSecondaryButtonClass} onClick={() => setRevokeTarget(null)} disabled={revoking}>Cancel</button>
                        <button type="button" className={studioPrimaryButtonClass} onClick={handleRevoke} disabled={revoking}>
                            {revoking ? 'Revoking…' : 'Revoke card'}
                        </button>
                    </>
                }
            >
                {revokeTarget && (
                    <p className="text-sm text-gray-600">
                        {revokeTarget.visitorName} ({revokeTarget.visitorCode}) is removed from &ldquo;{revokeTarget.privilegeGroupName || 'the access level'}&rdquo;
                        and deleted from HikCentral, so card {revokeTarget.cardNo} stops opening doors and can be given to another visitor.
                    </p>
                )}
            </StudioModal>
        </div>
    );
}
