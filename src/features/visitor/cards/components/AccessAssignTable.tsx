'use client';

import { useMemo, useRef, useState } from 'react';
import type { AccessAssignment, AccessSettings, HikAccessLevel, HikOrg } from '@/types/visitor-access.types';
import type { CardRequestType, VisitorCardData } from '@/types/visitor-card.types';
import { accessDoorApi } from '@/features/visitor/cards/services/accessDoorApi';
import { cardStudioApi } from '@/features/visitor/cards/services/cardStudioApi';
import { sourceToCard } from '@/features/visitor/cards/utils/cardData';
import { CARD_NO_PATTERN, defaultValidity, formatDayKey, isGuestOrg, matchGuestOrg, parseCodeList, resolveDefault } from '@/features/visitor/cards/utils/accessDoor';
import { studioInputClass, studioPrimaryButtonClass, studioSecondaryButtonClass } from './StudioModal';

type RowState = { state: 'idle' } | { state: 'working' } | { state: 'done'; message: string } | { state: 'error'; message: string };

interface AssignRow {
    card: VisitorCardData;
    requestType: CardRequestType;
    checked: boolean;
    cardNo: string;
    orgIndexCode: string;
    privilegeGroupId: string;
    beginTime: string;
    endTime: string;
    result: RowState;
}

interface BulkValues {
    orgIndexCode: string;
    privilegeGroupId: string;
    beginTime: string;
    endTime: string;
}

const APPROVED_STATUSES = ['APPROVED', 'COMPLETE'];
const EMPTY_BULK: BulkValues = { orgIndexCode: '', privilegeGroupId: '', beginTime: '', endTime: '' };

const cellInputClass =
    'w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 outline-none transition-colors focus:border-mwk disabled:bg-gray-50';

interface AccessAssignTableProps {
    orgOptions: (HikOrg & { path: string })[];
    accessLevels: HikAccessLevel[];
    levelsAvailable: boolean;
    settings: AccessSettings;
    activeByVisitor: Map<string, AccessAssignment>;
    activeByCard: Map<string, AccessAssignment>;
    onAssigned: () => Promise<void>;
    notify: (type: 'success' | 'error', message: string) => void;
}

/**
 * Bulk assignment: load visitors by visitor / request codes, type or swipe a card per row
 * (Enter jumps to the next row), then assign every ticked row in one go.
 */
export default function AccessAssignTable({
    orgOptions,
    accessLevels,
    levelsAvailable,
    settings,
    activeByVisitor,
    activeByCard,
    onAssigned,
    notify,
}: AccessAssignTableProps) {
    const [codesInput, setCodesInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<AssignRow[]>([]);
    const [bulk, setBulk] = useState<BulkValues>(EMPTY_BULK);
    const [running, setRunning] = useState(false);
    const cardInputs = useRef<Map<string, HTMLInputElement>>(new Map());

    const orgName = (id: string) => orgOptions.find((o) => o.orgIndexCode === id)?.orgName ?? '';
    // Visitors only go into guest departments; others stay out of the dropdowns
    const guestOrgs = useMemo(() => orgOptions.filter(isGuestOrg), [orgOptions]);
    const levelName = (id: string) => accessLevels.find((l) => l.privilegeGroupId === id)?.privilegeGroupName ?? '';

    const updateRow = (code: string, patch: Partial<AssignRow>) =>
        setRows((prev) => prev.map((r) => (r.card.fields.cardCode === code ? { ...r, ...patch } : r)));

    // ===============================
    // Load visitors
    // ===============================
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const codes = parseCodeList(codesInput);
        if (codes.length === 0) return;
        setLoading(true);
        const existing = new Set(rows.map((r) => r.card.fields.cardCode));
        const added: AssignRow[] = [];
        const notFound: string[] = [];
        let failed = 0;

        for (const code of codes) {
            try {
                const sources = await cardStudioApi.lookupCardSources(code);
                if (sources.length === 0) notFound.push(code);
                for (const source of sources) {
                    const card = sourceToCard(source);
                    const f = card.fields;
                    if (!f.cardCode || existing.has(f.cardCode)) continue;
                    existing.add(f.cardCode);
                    const current = activeByVisitor.get(f.cardCode);
                    const validity = defaultValidity(f.dateFrom, f.dateTo);
                    added.push({
                        card,
                        requestType: source.requestType,
                        checked: true,
                        cardNo: '',
                        orgIndexCode:
                            current?.orgIndexCode ||
                            matchGuestOrg(guestOrgs, f.hostFunctionalDept, f.visitingSite) ||
                            resolveDefault(settings.defaultOrgs, source.requestType, f.visitingSite),
                        privilegeGroupId: current?.privilegeGroupId || resolveDefault(settings.defaultLevels, source.requestType, f.visitingSite),
                        beginTime: validity.beginTime,
                        endTime: validity.endTime,
                        result: { state: 'idle' },
                    });
                }
            } catch {
                failed++;
            }
        }

        setRows((prev) => [...prev, ...added]);
        setLoading(false);
        if (added.length > 0) setCodesInput('');
        const parts = [`Added ${added.length} visitor${added.length === 1 ? '' : 's'}.`];
        if (notFound.length) parts.push(`No visitors found for ${notFound.join(', ')}.`);
        if (failed) parts.push(`${failed} lookup${failed === 1 ? '' : 's'} failed.`);
        notify(added.length > 0 ? 'success' : 'error', parts.join(' '));
        if (added[0]) requestAnimationFrame(() => cardInputs.current.get(added[0].card.fields.cardCode)?.focus());
    };

    // ===============================
    // Validation
    // ===============================
    const duplicateCards = useMemo(() => {
        const counts = new Map<string, number>();
        rows.forEach((r) => r.cardNo && counts.set(r.cardNo, (counts.get(r.cardNo) ?? 0) + 1));
        return new Set(Array.from(counts.entries()).filter(([, n]) => n > 1).map(([c]) => c));
    }, [rows]);

    /** Why the row cannot be assigned ('' when ready) */
    const rowProblem = (r: AssignRow): string => {
        if (!r.cardNo) return 'Card No. missing';
        if (!CARD_NO_PATTERN.test(r.cardNo)) return 'Card No.: letters / digits only';
        if (duplicateCards.has(r.cardNo)) return 'Same card on another row';
        const holder = activeByCard.get(r.cardNo);
        if (holder && holder.visitorCode !== r.card.fields.cardCode) return `Held by ${holder.visitorCode}`;
        if (!r.orgIndexCode) return 'Department missing';
        if (!r.beginTime || !r.endTime || r.endTime <= r.beginTime) return 'Check validity';
        return '';
    };

    const pending = rows.filter((r) => r.result.state !== 'done');
    const ticked = pending.filter((r) => r.checked);
    const ready = ticked.filter((r) => !rowProblem(r));
    const allTicked = pending.length > 0 && pending.every((r) => r.checked);

    // ===============================
    // Bulk actions
    // ===============================
    const applyBulk = () => {
        setRows((prev) =>
            prev.map((r) =>
                r.checked && r.result.state !== 'done'
                    ? {
                          ...r,
                          orgIndexCode: bulk.orgIndexCode || r.orgIndexCode,
                          privilegeGroupId: bulk.privilegeGroupId === '__none' ? '' : bulk.privilegeGroupId || r.privilegeGroupId,
                          beginTime: bulk.beginTime || r.beginTime,
                          endTime: bulk.endTime || r.endTime,
                      }
                    : r
            )
        );
        setBulk(EMPTY_BULK);
    };

    const assignTicked = async () => {
        if (ready.length === 0) return;
        setRunning(true);
        let ok = 0;
        let failed = 0;
        // One by one: HikCentral recommends a low call rate for access control devices
        for (const r of ready) {
            const f = r.card.fields;
            updateRow(f.cardCode, { result: { state: 'working' } });
            try {
                const a = await accessDoorApi.assign({
                    visitorCode: f.cardCode,
                    requestCode: f.requestCode,
                    visitorName: f.visitorName,
                    company: f.visitorCompany,
                    category: f.category,
                    site: f.visitingSite,
                    cardNo: r.cardNo,
                    orgIndexCode: r.orgIndexCode,
                    orgName: orgName(r.orgIndexCode),
                    privilegeGroupId: levelsAvailable ? r.privilegeGroupId : '',
                    privilegeGroupName: levelsAvailable ? levelName(r.privilegeGroupId) : '',
                    beginTime: r.beginTime,
                    endTime: r.endTime,
                });
                ok++;
                updateRow(f.cardCode, { checked: false, result: { state: 'done', message: `Card ${a.cardNo} assigned` } });
            } catch (err) {
                failed++;
                updateRow(f.cardCode, { result: { state: 'error', message: err instanceof Error ? err.message : 'Failed' } });
            }
        }
        setRunning(false);
        notify(failed === 0 ? 'success' : 'error', `Assigned ${ok} card${ok === 1 ? '' : 's'}${failed ? `, ${failed} failed (see the Result column)` : ''}.`);
        await onAssigned();
    };

    const focusNext = (code: string) => {
        const index = rows.findIndex((r) => r.card.fields.cardCode === code);
        const next = rows.slice(index + 1).find((r) => r.result.state !== 'done');
        if (next) cardInputs.current.get(next.card.fields.cardCode)?.focus();
    };

    // ===============================
    // Render
    // ===============================
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Add visitors */}
            <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
                <div className="relative min-w-[280px] max-w-xl flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    {/* Pasted lists keep working: new lines become spaces and codes are split on spaces / commas */}
                    <input
                        value={codesInput}
                        onChange={(e) => setCodesInput(e.target.value)}
                        placeholder="Visitor or request codes, e.g. V06102623V3, V06102624"
                        className={`${studioInputClass} pl-9`}
                        aria-label="Visitor or request codes"
                    />
                </div>
                <button type="submit" className={studioPrimaryButtonClass} disabled={loading || !codesInput.trim()}>
                    {loading ? 'Searching…' : 'Add visitors'}
                </button>
                {rows.length > 0 ? (
                    <div className="ml-auto flex items-center gap-1">
                        <span className="mr-2 text-xs font-semibold text-gray-500">
                            {rows.length} visitor{rows.length === 1 ? '' : 's'}
                        </span>
                        <button
                            type="button"
                            className="cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                            onClick={() => setRows((prev) => prev.filter((r) => r.result.state !== 'done'))}
                            disabled={running}
                        >
                            Clear assigned
                        </button>
                        <button
                            type="button"
                            className="cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            onClick={() => window.confirm('Remove all rows from the table?') && setRows([])}
                            disabled={running}
                        >
                            Clear all
                        </button>
                    </div>
                ) : (
                    <span className="ml-auto hidden text-xs text-gray-400 lg:block">Separate several codes with commas or spaces</span>
                )}
            </form>

            {/* Bulk bar */}
            {rows.length > 0 && (
                <div className="flex flex-wrap items-end gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                    <span className="self-center text-xs font-bold text-gray-700">Ticked ({ticked.length}):</span>
                    <label className="block w-64">
                        <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Department</span>
                        <select value={bulk.orgIndexCode} onChange={(e) => setBulk((b) => ({ ...b, orgIndexCode: e.target.value }))} className={`${cellInputClass} cursor-pointer`}>
                            <option value="">Keep</option>
                            {guestOrgs.map((o) => <option key={o.orgIndexCode} value={o.orgIndexCode}>{o.path}</option>)}
                        </select>
                    </label>
                    {levelsAvailable && (
                        <label className="block w-48">
                            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Access level</span>
                            <select value={bulk.privilegeGroupId} onChange={(e) => setBulk((b) => ({ ...b, privilegeGroupId: e.target.value }))} className={`${cellInputClass} cursor-pointer`}>
                                <option value="">Keep</option>
                                <option value="__none">None (department only)</option>
                                {accessLevels.map((l) => <option key={l.privilegeGroupId} value={l.privilegeGroupId}>{l.privilegeGroupName}</option>)}
                            </select>
                        </label>
                    )}
                    <label className="block w-44">
                        <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Valid from</span>
                        <input type="datetime-local" value={bulk.beginTime} onChange={(e) => setBulk((b) => ({ ...b, beginTime: e.target.value }))} className={cellInputClass} />
                    </label>
                    <label className="block w-44">
                        <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Valid to</span>
                        <input type="datetime-local" value={bulk.endTime} onChange={(e) => setBulk((b) => ({ ...b, endTime: e.target.value }))} className={cellInputClass} />
                    </label>
                    <button
                        type="button"
                        className={studioSecondaryButtonClass}
                        onClick={applyBulk}
                        disabled={ticked.length === 0 || running || (!bulk.orgIndexCode && !bulk.privilegeGroupId && !bulk.beginTime && !bulk.endTime)}
                    >
                        Apply to ticked
                    </button>
                    <button type="button" className={`${studioPrimaryButtonClass} ml-auto`} onClick={assignTicked} disabled={ready.length === 0 || running}>
                        {running ? 'Assigning…' : `Assign ticked (${ready.length}${ready.length !== ticked.length ? ` of ${ticked.length}` : ''})`}
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
                    <thead className="border-b border-gray-200 bg-gray-50 font-bold uppercase tracking-wider text-gray-600">
                        <tr>
                            <th className="w-10 px-3 py-2.5">
                                <input
                                    type="checkbox"
                                    checked={allTicked}
                                    onChange={(e) => setRows((prev) => prev.map((r) => (r.result.state === 'done' ? r : { ...r, checked: e.target.checked })))}
                                    disabled={pending.length === 0 || running}
                                    className="h-3.5 w-3.5 cursor-pointer accent-mwk"
                                    aria-label="Tick all rows"
                                />
                            </th>
                            <th className="w-[130px] px-3 py-2.5">ID</th>
                            <th className="w-[200px] px-3 py-2.5">Name</th>
                            <th className="w-[170px] px-3 py-2.5">Functional Dept</th>
                            <th className="w-[130px] px-3 py-2.5">Visit</th>
                            <th className="w-[230px] px-3 py-2.5">Department</th>
                            {levelsAvailable && <th className="w-[180px] px-3 py-2.5">Access level</th>}
                            <th className="w-[170px] px-3 py-2.5">Valid from</th>
                            <th className="w-[170px] px-3 py-2.5">Valid to</th>
                            <th className="w-[150px] px-3 py-2.5">Card No.</th>
                            <th className="px-3 py-2.5">Result</th>
                            <th className="w-8 px-2 py-2.5" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={levelsAvailable ? 12 : 11} className="px-6 py-16">
                                    <div className="mx-auto flex max-w-md flex-col items-center text-center">
                                        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-mwk-soft text-mwk">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                                            </svg>
                                        </span>
                                        <p className="text-sm font-bold text-gray-900">No visitors yet</p>
                                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                            Add a visitor code (one visitor) or a request code (all its visitors) above, then swipe a card on each row and press
                                            <span className="font-semibold text-gray-700"> Assign</span>.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => {
                                const f = r.card.fields;
                                const code = f.cardCode;
                                const done = r.result.state === 'done';
                                const locked = done || running;
                                const problem = done ? '' : rowProblem(r);
                                const current = activeByVisitor.get(code);
                                const approved = APPROVED_STATUSES.includes(f.status.toUpperCase());
                                return (
                                    <tr key={code} className={`align-top ${done ? 'bg-green-50/40' : r.checked ? '' : 'opacity-60'}`}>
                                        <td className="px-3 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={r.checked}
                                                disabled={locked}
                                                onChange={(e) => updateRow(code, { checked: e.target.checked })}
                                                className="h-3.5 w-3.5 cursor-pointer accent-mwk"
                                                aria-label={`Tick ${code}`}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 font-mono font-bold text-gray-900">{code}</td>
                                        <td className="px-3 py-2.5">
                                            <p className="font-semibold text-gray-900">{f.visitorName || '—'}</p>
                                            <p className="text-gray-500">{f.visitorCompany}</p>
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-600">{f.hostFunctionalDept}</td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">
                                            <p>{formatDayKey(f.dateFrom)}{f.dateTo && f.dateTo !== f.dateFrom ? ` - ${formatDayKey(f.dateTo)}` : ''}</p>
                                            {!approved && <p className="font-semibold text-orange-600">{f.status || 'Not approved'}</p>}
                                            {current && <p className="font-semibold text-green-700">Holds card {current.cardNo}</p>}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <select
                                                value={r.orgIndexCode}
                                                disabled={locked}
                                                onChange={(e) => updateRow(code, { orgIndexCode: e.target.value })}
                                                className={`${cellInputClass} cursor-pointer`}
                                                aria-label={`Department for ${code}`}
                                            >
                                                <option value="">Choose…</option>
                                                {r.orgIndexCode && !guestOrgs.some((o) => o.orgIndexCode === r.orgIndexCode) && (
                                                    <option value={r.orgIndexCode}>{orgOptions.find((o) => o.orgIndexCode === r.orgIndexCode)?.path ?? `#${r.orgIndexCode}`}</option>
                                                )}
                                                {guestOrgs.map((o) => <option key={o.orgIndexCode} value={o.orgIndexCode}>{o.path}</option>)}
                                            </select>
                                        </td>
                                        {levelsAvailable && (
                                            <td className="px-3 py-2.5">
                                                <select
                                                    value={r.privilegeGroupId}
                                                    disabled={locked}
                                                    onChange={(e) => updateRow(code, { privilegeGroupId: e.target.value })}
                                                    className={`${cellInputClass} cursor-pointer`}
                                                    aria-label={`Access level for ${code}`}
                                                >
                                                    <option value="">None</option>
                                                    {accessLevels.map((l) => <option key={l.privilegeGroupId} value={l.privilegeGroupId}>{l.privilegeGroupName}</option>)}
                                                </select>
                                            </td>
                                        )}
                                        <td className="px-3 py-2.5">
                                            <input type="datetime-local" value={r.beginTime} disabled={locked} onChange={(e) => updateRow(code, { beginTime: e.target.value })} className={cellInputClass} aria-label={`Valid from for ${code}`} />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <input type="datetime-local" value={r.endTime} disabled={locked} onChange={(e) => updateRow(code, { endTime: e.target.value })} className={cellInputClass} aria-label={`Valid to for ${code}`} />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <input
                                                ref={(el) => {
                                                    if (el) cardInputs.current.set(code, el);
                                                    else cardInputs.current.delete(code);
                                                }}
                                                value={r.cardNo}
                                                disabled={locked}
                                                onChange={(e) => updateRow(code, { cardNo: e.target.value.replace(/\s/g, ''), result: { state: 'idle' } })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        focusNext(code);
                                                    }
                                                }}
                                                placeholder="Swipe / type"
                                                inputMode="numeric"
                                                autoComplete="off"
                                                maxLength={20}
                                                className={`${cellInputClass} font-mono font-bold tracking-wider`}
                                                aria-label={`Card No. for ${code}`}
                                            />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {r.result.state === 'working' && <span className="font-semibold text-gray-500">Assigning…</span>}
                                            {r.result.state === 'done' && <span className="font-semibold text-green-700">✓ {r.result.message}</span>}
                                            {r.result.state === 'error' && <span className="font-semibold text-red-600">{r.result.message}</span>}
                                            {r.result.state === 'idle' && problem && r.cardNo && <span className="font-semibold text-orange-600">{problem}</span>}
                                            {r.result.state === 'idle' && !problem && <span className="text-gray-400">Ready</span>}
                                        </td>
                                        <td className="px-2 py-2.5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setRows((prev) => prev.filter((x) => x.card.fields.cardCode !== code))}
                                                disabled={running}
                                                className="cursor-pointer text-gray-300 hover:text-red-600"
                                                aria-label={`Remove ${code}`}
                                                title="Remove row"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
