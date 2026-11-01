'use client';

import { Fragment, useMemo, useRef, useState } from 'react';
import type { CardLookupResponse, HikCardHolder, HikOrg } from '@/types/visitor-access.types';
import { accessDoorApi } from '@/features/visitor/cards/services/accessDoorApi';
import { CARD_NO_PATTERN, formatFactoryDateTime } from '@/features/visitor/cards/utils/accessDoor';
import StudioModal, { studioInputClass, studioPrimaryButtonClass, studioSecondaryButtonClass } from './StudioModal';

const STATUS_TEXT: Record<string, string> = {
    active: 'text-green-700',
    failed: 'text-red-600',
    revoked: 'text-gray-500',
    replaced: 'text-gray-500',
};

/** Most cards looked up in one go (pasted list) */
const MAX_CARDS = 50;
/** Lookups sent to HikCentral at the same time */
const LOOKUP_CONCURRENCY = 4;

interface AccessCardLookupProps {
    orgOptions: (HikOrg & { path: string })[];
    /** Called after cards were released so the other tabs reload */
    onReleased: () => Promise<void>;
}

/** One looked-up card number */
interface LookupEntry {
    cardNo: string;
    loading: boolean;
    error: string | null;
    data: CardLookupResponse | null;
}

/** A card held by a person: what one ticked row removes */
interface ReleaseTarget {
    key: string;
    cardNo: string;
    holder: HikCardHolder;
    isVisitor: boolean;
}

type RowResult = { ok: boolean; message: string };

const targetKey = (cardNo: string, personId: string) => `${cardNo}|${personId}`;

/** Card numbers from typed / swiped / pasted text (spaces, commas, semicolons or new lines between them) */
function parseCardList(input: string): { cards: string[]; invalid: string[] } {
    const parts = input.split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean);
    const cards: string[] = [];
    const invalid: string[] = [];
    for (const part of parts) {
        if (!CARD_NO_PATTERN.test(part)) invalid.push(part);
        else if (!cards.includes(part)) cards.push(part);
    }
    return { cards, invalid };
}

/** Holder rows of a looked-up card; a holder is the Access Door visitor when the active record points at them */
function holderTargets(entry: LookupEntry): ReleaseTarget[] {
    if (!entry.data) return [];
    const active = entry.data.history.find((a) => a.status === 'active');
    return entry.data.holders.map((holder) => ({
        key: targetKey(entry.cardNo, holder.personId),
        cardNo: entry.cardNo,
        holder,
        isVisitor: Boolean(active && active.personId === holder.personId) || active?.visitorCode === holder.personCode,
    }));
}

/**
 * Card lookup: type, swipe or paste one or many card numbers to see who holds each card in
 * HikCentral (employee or visitor) with its Access Door history, then remove the ticked cards in bulk.
 */
export default function AccessCardLookup({ orgOptions, onReleased }: AccessCardLookupProps) {
    const [input, setInput] = useState('');
    const [entries, setEntries] = useState<LookupEntry[]>([]);
    const [inputError, setInputError] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [rowResults, setRowResults] = useState<Map<string, RowResult>>(new Map());
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    const [releaseTargets, setReleaseTargets] = useState<ReleaseTarget[] | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [releasing, setReleasing] = useState(false);
    const [progress, setProgress] = useState(0);

    const orgPath = (id: string) => orgOptions.find((o) => o.orgIndexCode === id)?.path ?? (id ? `#${id}` : '—');

    const targets = useMemo(() => entries.flatMap(holderTargets), [entries]);
    const selectedTargets = targets.filter((t) => selected.has(t.key));
    const anyLoading = entries.some((e) => e.loading);
    const heldCount = new Set(targets.map((t) => t.cardNo)).size;
    const freeCount = entries.filter((e) => e.data && !e.data.hikError && e.data.holders.length === 0).length;

    // ===============================
    // Lookup
    // ===============================
    const updateEntry = (cardNo: string, patch: Partial<LookupEntry>) =>
        setEntries((prev) => prev.map((e) => (e.cardNo === cardNo ? { ...e, ...patch } : e)));

    /** Looks the cards up again (new ones go on top, ones already in the list refresh in place) */
    const lookupCards = async (cards: string[]) => {
        setEntries((prev) => {
            const fresh = cards.filter((c) => !prev.some((e) => e.cardNo === c));
            const refreshed = prev.map((e) => (cards.includes(e.cardNo) ? { ...e, loading: true, error: null } : e));
            return [...fresh.map((cardNo) => ({ cardNo, loading: true, error: null, data: null })), ...refreshed];
        });
        // Ticks and results of these cards no longer match what HikCentral will return
        setSelected((prev) => new Set(Array.from(prev).filter((k) => !cards.includes(k.split('|')[0]))));
        setRowResults((prev) => new Map(Array.from(prev).filter(([k]) => !cards.includes(k.split('|')[0]))));

        const queue = [...cards];
        const worker = async () => {
            for (let cardNo = queue.shift(); cardNo !== undefined; cardNo = queue.shift()) {
                try {
                    updateEntry(cardNo, { loading: false, error: null, data: await accessDoorApi.lookupCard(cardNo) });
                } catch (err) {
                    updateEntry(cardNo, { loading: false, error: err instanceof Error ? err.message : 'Lookup failed', data: null });
                }
            }
        };
        await Promise.all(Array.from({ length: Math.min(LOOKUP_CONCURRENCY, cards.length) }, worker));
    };

    const handleLookup = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setMessage(null);
        const { cards, invalid } = parseCardList(input);
        if (cards.length === 0) {
            setInputError(invalid.length ? `Not a card number: ${invalid.slice(0, 5).join(', ')}` : 'Type, swipe or paste at least one card number');
            return;
        }
        setInputError(
            [
                invalid.length ? `Skipped ${invalid.length} invalid value${invalid.length === 1 ? '' : 's'} (${invalid.slice(0, 5).join(', ')}).` : '',
                cards.length > MAX_CARDS ? `Only the first ${MAX_CARDS} cards were looked up.` : '',
            ].filter(Boolean).join(' ') || null
        );
        setInput('');
        await lookupCards(cards.slice(0, MAX_CARDS));
        // Ready for the next swipe
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    // A card reader types the number and presses Enter: look it up right away (Shift+Enter adds a line)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleLookup();
        }
    };

    const removeEntry = (cardNo: string) => {
        setEntries((prev) => prev.filter((e) => e.cardNo !== cardNo));
        setSelected((prev) => new Set(Array.from(prev).filter((k) => !k.startsWith(`${cardNo}|`))));
    };

    const clearAll = () => {
        setEntries([]);
        setSelected(new Set());
        setExpanded(new Set());
        setRowResults(new Map());
        setMessage(null);
        setInputError(null);
    };

    // ===============================
    // Selection
    // ===============================
    const toggleTarget = (key: string, on: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (on) next.add(key);
            else next.delete(key);
            return next;
        });

    const allSelected = targets.length > 0 && targets.every((t) => selected.has(t.key));
    const toggleAll = (on: boolean) => setSelected(on ? new Set(targets.map((t) => t.key)) : new Set());

    const toggleHistory = (cardNo: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(cardNo)) next.delete(cardNo);
            else next.add(cardNo);
            return next;
        });

    // ===============================
    // Remove (one or many)
    // ===============================
    const openRelease = (list: ReleaseTarget[]) => {
        if (list.length === 0) return;
        setReleaseTargets(list);
        setConfirmed(false);
        setProgress(0);
    };

    const handleRelease = async () => {
        if (!releaseTargets) return;
        setReleasing(true);
        const results = new Map<string, RowResult>();
        // One at a time: HikCentral handles a person per call, and a failure stays on its own row
        for (const [i, t] of releaseTargets.entries()) {
            try {
                const res = await accessDoorApi.releaseCard(t.cardNo, t.holder.personId);
                results.set(t.key, {
                    ok: true,
                    message: res.mode === 'visitor-revoked' ? 'Visitor revoked, card freed' : 'Card removed from this person',
                });
            } catch (err) {
                results.set(t.key, { ok: false, message: err instanceof Error ? err.message : 'Failed to remove the card' });
            }
            setProgress(i + 1);
        }

        const done = Array.from(results.values()).filter((r) => r.ok).length;
        const failed = results.size - done;
        const succeededCards = Array.from(new Set(releaseTargets.filter((t) => results.get(t.key)?.ok).map((t) => t.cardNo)));

        setReleasing(false);
        setReleaseTargets(null);
        setMessage({
            type: failed ? 'error' : 'success',
            text: failed
                ? `${done} card${done === 1 ? '' : 's'} removed, ${failed} failed - see the rows marked in red.`
                : `${done} card${done === 1 ? '' : 's'} removed. Visitors were revoked; employees only lost the card, their other cards are unchanged.`,
        });

        // Refresh the freed cards; failed rows keep their tick and error message
        if (succeededCards.length) {
            await lookupCards(succeededCards);
            await onReleased();
        }
        setRowResults((prev) => {
            const next = new Map(prev);
            results.forEach((r, k) => !r.ok && next.set(k, r));
            return next;
        });
        setSelected((prev) => new Set(Array.from(prev).filter((k) => results.get(k)?.ok === false)));
    };

    const releaseEmployees = releaseTargets?.filter((t) => !t.isVisitor) ?? [];
    const releaseVisitors = releaseTargets?.filter((t) => t.isVisitor) ?? [];

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <form onSubmit={handleLookup} className="flex flex-wrap items-start gap-2 border-b border-gray-100 px-4 py-3">
                <textarea
                    ref={inputRef}
                    autoFocus
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type, swipe or paste card numbers"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                    className={`${studioInputClass} min-h-[38px] max-w-md resize-y font-mono text-base tracking-wider`}
                    aria-label="Card numbers"
                />
                <button type="submit" className={studioPrimaryButtonClass} disabled={anyLoading || !input.trim()}>
                    {anyLoading ? 'Looking up…' : 'Look up cards'}
                </button>
                <span className="self-center text-xs text-gray-400">
                    Swipe cards one after another, or paste a list (up to {MAX_CARDS}). Searches every person on HikCentral, employees included.
                </span>
            </form>

            <div className="space-y-3 p-4">
                {inputError && <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">{inputError}</p>}
                {message && (
                    <p
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                            message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                    >
                        {message.text}
                    </p>
                )}

                {entries.length === 0 ? (
                    <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
                        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-mwk-soft text-mwk">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                            </svg>
                        </span>
                        <p className="text-sm font-bold text-gray-900">Who holds these cards?</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            Swipe or type card numbers to see the employee or visitor holding each one, then tick the cards to remove them together.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Summary + bulk actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs text-gray-500">
                                <span className="font-bold text-gray-900">{entries.length}</span> card{entries.length === 1 ? '' : 's'} looked up ·{' '}
                                <span className="font-bold text-gray-900">{heldCount}</span> in use · <span className="font-bold text-gray-900">{freeCount}</span> free
                            </p>
                            <div className="ml-auto flex items-center gap-2">
                                <button type="button" onClick={clearAll} className={studioSecondaryButtonClass} disabled={releasing}>
                                    Clear list
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openRelease(selectedTargets)}
                                    disabled={selectedTargets.length === 0 || releasing || anyLoading}
                                    className={studioPrimaryButtonClass}
                                >
                                    Revoke selected ({selectedTargets.length})
                                </button>
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
                                <thead className="border-b border-gray-200 bg-gray-50 font-bold uppercase tracking-wider text-gray-600">
                                    <tr>
                                        <th className="w-10 px-3 py-2">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                                disabled={targets.length === 0}
                                                className="h-3.5 w-3.5 cursor-pointer accent-mwk"
                                                aria-label="Tick every card in use"
                                            />
                                        </th>
                                        <th className="px-3 py-2">Card</th>
                                        <th className="px-3 py-2">Holder</th>
                                        <th className="px-3 py-2">Type</th>
                                        <th className="px-3 py-2">Department</th>
                                        <th className="px-3 py-2">Valid</th>
                                        <th className="px-3 py-2">Other cards</th>
                                        <th className="px-3 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {entries.map((entry) => {
                                        const rows = holderTargets(entry);
                                        const history = entry.data?.history ?? [];
                                        const showHistory = expanded.has(entry.cardNo);
                                        const cardCell = (
                                            <td className="whitespace-nowrap px-3 py-2 font-mono text-sm font-semibold text-gray-900">{entry.cardNo}</td>
                                        );
                                        const actions = (target?: ReleaseTarget) => (
                                            <td className="whitespace-nowrap px-3 py-2 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {history.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleHistory(entry.cardNo)}
                                                            className="cursor-pointer rounded-md border border-gray-200 px-2 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:bg-gray-50"
                                                        >
                                                            History ({history.length})
                                                        </button>
                                                    )}
                                                    {target && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openRelease([target])}
                                                            disabled={releasing}
                                                            className="cursor-pointer rounded-md border border-red-200 px-2 py-1 text-[11px] font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEntry(entry.cardNo)}
                                                        className="cursor-pointer rounded-md px-1.5 py-1 text-gray-400 transition-colors hover:text-gray-700"
                                                        aria-label={`Take card ${entry.cardNo} off the list`}
                                                        title="Take off the list"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        );

                                        // Loading / failed / free cards: one row without a tick box
                                        let body: React.ReactNode;
                                        if (entry.loading || entry.error || !entry.data || entry.data.hikError || rows.length === 0) {
                                            const note = entry.loading ? (
                                                <span className="text-gray-400">Looking up…</span>
                                            ) : entry.error || entry.data?.hikError ? (
                                                <span className="font-semibold text-red-600">{entry.error || entry.data?.hikError}</span>
                                            ) : (
                                                <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
                                                    Free - nobody holds this card
                                                </span>
                                            );
                                            body = (
                                                <tr>
                                                    <td className="px-3 py-2" />
                                                    {cardCell}
                                                    <td className="px-3 py-2" colSpan={5}>{note}</td>
                                                    {actions()}
                                                </tr>
                                            );
                                        } else {
                                            body = rows.map((t) => {
                                                const h = t.holder;
                                                const result = rowResults.get(t.key);
                                                return (
                                                    <tr key={t.key} className={selected.has(t.key) ? 'bg-red-50/40' : ''}>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected.has(t.key)}
                                                                onChange={(e) => toggleTarget(t.key, e.target.checked)}
                                                                className="h-3.5 w-3.5 cursor-pointer accent-mwk"
                                                                aria-label={`Tick card ${t.cardNo} of ${h.personName}`}
                                                            />
                                                        </td>
                                                        {cardCell}
                                                        <td className="px-3 py-2">
                                                            <p className="font-semibold text-gray-900">{h.personName || '—'}</p>
                                                            <p className="font-mono text-gray-500">{h.personCode || '—'}</p>
                                                            {h.remark && <p className="text-gray-400">{h.remark}</p>}
                                                            {result && !result.ok && <p className="font-semibold text-red-600">{result.message}</p>}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span
                                                                className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                                    t.isVisitor ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-600'
                                                                }`}
                                                            >
                                                                {t.isVisitor ? 'Visitor' : 'Employee / other'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-700">{orgPath(h.orgIndexCode)}</td>
                                                        <td className="whitespace-nowrap px-3 py-2 tabular-nums text-gray-700">
                                                            {formatFactoryDateTime(h.beginTime) || '—'}
                                                            <span className="block text-gray-400">→ {formatFactoryDateTime(h.endTime) || '—'}</span>
                                                        </td>
                                                        <td className="px-3 py-2 font-mono text-gray-500">
                                                            {h.cardNos.filter((c) => c !== t.cardNo).join(', ') || '—'}
                                                        </td>
                                                        {actions(t)}
                                                    </tr>
                                                );
                                            });
                                        }

                                        return (
                                            <Fragment key={entry.cardNo}>
                                                {body}
                                                {showHistory && history.length > 0 && (
                                                    <tr>
                                                        <td colSpan={8} className="bg-gray-50 px-3 py-3">
                                                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                                Access Door history of card <span className="font-mono text-gray-900">{entry.cardNo}</span>
                                                            </p>
                                                            <table className="w-full border-collapse overflow-hidden rounded-lg bg-white text-left text-xs">
                                                                <thead className="border-b border-gray-200 font-bold uppercase tracking-wider text-gray-500">
                                                                    <tr>
                                                                        <th className="px-3 py-1.5">Visitor code</th>
                                                                        <th className="px-3 py-1.5">Visitor</th>
                                                                        <th className="px-3 py-1.5">Department</th>
                                                                        <th className="px-3 py-1.5 text-right">Valid to</th>
                                                                        <th className="px-3 py-1.5">Status</th>
                                                                        <th className="px-3 py-1.5">Assigned</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {history.map((a) => (
                                                                        <tr key={a.id}>
                                                                            <td className="whitespace-nowrap px-3 py-1.5 font-mono font-semibold text-gray-900">{a.visitorCode}</td>
                                                                            <td className="px-3 py-1.5">
                                                                                <span className="font-semibold text-gray-900">{a.visitorName}</span>
                                                                                {a.company && <span className="text-gray-500"> · {a.company}</span>}
                                                                            </td>
                                                                            <td className="px-3 py-1.5 text-gray-700">{a.orgName || (a.orgIndexCode ? `#${a.orgIndexCode}` : '—')}</td>
                                                                            <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-gray-700">{formatFactoryDateTime(a.endTime)}</td>
                                                                            <td className={`px-3 py-1.5 font-bold uppercase ${STATUS_TEXT[a.status] ?? 'text-gray-500'}`}>{a.status}</td>
                                                                            <td className="whitespace-nowrap px-3 py-1.5 text-gray-500">
                                                                                {formatFactoryDateTime(a.assignedAt)} · {a.assignedBy}
                                                                                {a.revokedAt && <span className="block text-gray-400">Revoked {formatFactoryDateTime(a.revokedAt)}</span>}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <StudioModal
                open={Boolean(releaseTargets)}
                eyebrow="Card lookup"
                title={
                    releaseTargets?.length === 1
                        ? `Remove card ${releaseTargets[0].cardNo} from ${releaseTargets[0].holder.personName || 'this person'}?`
                        : `Remove ${releaseTargets?.length ?? 0} cards?`
                }
                onClose={() => !releasing && setReleaseTargets(null)}
                footer={
                    <>
                        <button type="button" className={studioSecondaryButtonClass} onClick={() => setReleaseTargets(null)} disabled={releasing}>Cancel</button>
                        <button
                            type="button"
                            className={studioPrimaryButtonClass}
                            onClick={handleRelease}
                            disabled={releasing || (releaseEmployees.length > 0 && !confirmed)}
                        >
                            {releasing
                                ? `Removing… ${progress}/${releaseTargets?.length ?? 0}`
                                : releaseTargets?.length === 1 ? 'Remove card' : `Remove ${releaseTargets?.length ?? 0} cards`}
                        </button>
                    </>
                }
            >
                {releaseTargets && (
                    <div className="space-y-3 text-sm text-gray-600">
                        {releaseVisitors.length > 0 && (
                            <p>
                                <span className="font-semibold text-gray-900">{releaseVisitors.length} visitor card{releaseVisitors.length === 1 ? '' : 's'}</span> given from
                                Access Door: the visitor is deleted from HikCentral, so the card stops opening doors and can be reused.
                            </p>
                        )}
                        {releaseEmployees.length > 0 && (
                            <>
                                <p>
                                    <span className="font-semibold text-gray-900">{releaseEmployees.length} card{releaseEmployees.length === 1 ? '' : 's'} held by employees / other people</span>:
                                    only the card is taken off the person; the person, their department and their other cards stay unchanged.
                                </p>
                                <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">
                                    These people will no longer open doors with the removed card.
                                </p>
                            </>
                        )}

                        <ul className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 text-xs">
                            {releaseTargets.map((t) => (
                                <li key={t.key} className="flex items-center gap-3 px-3 py-1.5">
                                    <span className="w-28 shrink-0 font-mono font-semibold text-gray-900">{t.cardNo}</span>
                                    <span className="min-w-0 flex-1 truncate text-gray-800">
                                        {t.holder.personName || '—'}
                                        {t.holder.personCode && <span className="font-mono text-gray-400"> · {t.holder.personCode}</span>}
                                    </span>
                                    <span className={`shrink-0 text-[10px] font-bold uppercase ${t.isVisitor ? 'text-purple-700' : 'text-gray-500'}`}>
                                        {t.isVisitor ? 'Visitor' : 'Employee / other'}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {releaseEmployees.length > 0 && (
                            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={confirmed}
                                    onChange={(e) => setConfirmed(e.target.checked)}
                                    disabled={releasing}
                                    className="h-3.5 w-3.5 cursor-pointer accent-mwk"
                                />
                                I confirm removing {releaseEmployees.length === 1 ? 'this card from this person' : 'these cards from these people'}
                            </label>
                        )}
                    </div>
                )}
            </StudioModal>
        </div>
    );
}
