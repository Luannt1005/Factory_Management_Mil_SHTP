'use client';

import { useRef, useState } from 'react';
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

interface AccessCardLookupProps {
    orgOptions: (HikOrg & { path: string })[];
    /** Called after a card was released so the other tabs reload */
    onReleased: () => Promise<void>;
}

interface ReleaseTarget {
    holder: HikCardHolder;
    isVisitor: boolean;
}

/**
 * Card lookup: type or swipe any card number to see who holds it in HikCentral (employee or
 * visitor), plus the Access Door history of that card.
 */
export default function AccessCardLookup({ orgOptions, onReleased }: AccessCardLookupProps) {
    const [cardNo, setCardNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CardLookupResponse | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [releaseTarget, setReleaseTarget] = useState<ReleaseTarget | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [releasing, setReleasing] = useState(false);
    const [releaseError, setReleaseError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const orgPath = (id: string) => orgOptions.find((o) => o.orgIndexCode === id)?.path ?? (id ? `#${id}` : '—');

    const runLookup = async (value: string) => {
        setLoading(true);
        setError(null);
        try {
            setResult(await accessDoorApi.lookupCard(value));
        } catch (err) {
            setResult(null);
            setError(err instanceof Error ? err.message : 'Lookup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const value = cardNo.trim();
        if (!CARD_NO_PATTERN.test(value)) {
            setError('Card number must be 1-20 letters or digits');
            return;
        }
        await runLookup(value);
        // Ready for the next swipe
        requestAnimationFrame(() => inputRef.current?.select());
    };

    const openRelease = (holder: HikCardHolder, isVisitor: boolean) => {
        setReleaseTarget({ holder, isVisitor });
        setConfirmed(false);
        setReleaseError(null);
    };

    const handleRelease = async () => {
        if (!releaseTarget || !result) return;
        setReleasing(true);
        setReleaseError(null);
        try {
            const res = await accessDoorApi.releaseCard(result.cardNo, releaseTarget.holder.personId);
            setMessage(
                res.mode === 'visitor-revoked'
                    ? `Card ${result.cardNo} revoked from visitor ${releaseTarget.holder.personName} and freed.`
                    : `Card ${result.cardNo} removed from ${releaseTarget.holder.personName}. The person and their other cards are unchanged.`
            );
            setReleaseTarget(null);
            await runLookup(result.cardNo);
            await onReleased();
        } catch (err) {
            setReleaseError(err instanceof Error ? err.message : 'Failed to remove the card');
        } finally {
            setReleasing(false);
        }
    };

    const active = result?.history.find((a) => a.status === 'active');

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <form onSubmit={handleLookup} className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
                <input
                    ref={inputRef}
                    autoFocus
                    value={cardNo}
                    onChange={(e) => setCardNo(e.target.value.replace(/\s/g, ''))}
                    placeholder="Type or swipe a card number"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={20}
                    className={`${studioInputClass} max-w-xs font-mono text-base tracking-wider`}
                    aria-label="Card number"
                />
                <button type="submit" className={studioPrimaryButtonClass} disabled={loading || !cardNo.trim()}>
                    {loading ? 'Looking up…' : 'Look up card'}
                </button>
                <span className="text-xs text-gray-400">Searches every person on HikCentral, employees included.</span>
            </form>

            <div className="space-y-4 p-4">
                {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
                {message && <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">{message}</p>}

                {!result && !error && (
                    <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
                        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-mwk-soft text-mwk">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                            </svg>
                        </span>
                        <p className="text-sm font-bold text-gray-900">Who holds this card?</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            Swipe or type any card number to see the employee or visitor holding it, and remove the card if needed.
                        </p>
                    </div>
                )}

                {result && (
                    <>
                        <section>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                Holder of card <span className="font-mono text-gray-900">{result.cardNo}</span> in HikCentral
                            </p>
                            {result.hikError ? (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{result.hikError}</p>
                            ) : result.holders.length === 0 ? (
                                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs font-semibold text-gray-600">
                                    Nobody holds this card in HikCentral - it is free to assign.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {result.holders.map((h) => {
                                        const isVisitor = Boolean(active && active.personId === h.personId) || active?.visitorCode === h.personCode;
                                        return (
                                            <div key={h.personId} className="rounded-xl border border-gray-200 px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-bold text-gray-900">{h.personName || '—'}</p>
                                                    <span
                                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                            isVisitor ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-600'
                                                        }`}
                                                    >
                                                        {isVisitor ? 'Visitor (Access Door)' : 'Employee / other person'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => openRelease(h, isVisitor)}
                                                        className="ml-auto cursor-pointer rounded-md border border-red-200 px-3 py-1 text-xs font-bold text-red-700 transition-colors hover:bg-red-50"
                                                    >
                                                        Remove card
                                                    </button>
                                                </div>
                                                <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Person code</dt>
                                                        <dd className="font-mono font-semibold text-gray-900">{h.personCode || '—'}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Department</dt>
                                                        <dd className="text-gray-800">{orgPath(h.orgIndexCode)}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Valid</dt>
                                                        <dd className="tabular-nums text-gray-800">
                                                            {formatFactoryDateTime(h.beginTime) || '—'} → {formatFactoryDateTime(h.endTime) || '—'}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cards</dt>
                                                        <dd className="font-mono text-gray-800">{h.cardNos.join(', ') || '—'}</dd>
                                                    </div>
                                                    {h.remark && (
                                                        <div className="sm:col-span-2 lg:col-span-4">
                                                            <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Remark</dt>
                                                            <dd className="text-gray-700">{h.remark}</dd>
                                                        </div>
                                                    )}
                                                </dl>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Access Door history of this card</p>
                            {result.history.length === 0 ? (
                                <p className="text-xs text-gray-500">This card has never been given to a visitor from Access Door.</p>
                            ) : (
                                <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                                        <thead className="border-b border-gray-200 bg-gray-50 font-bold uppercase tracking-wider text-gray-600">
                                            <tr>
                                                <th className="px-3 py-2">Visitor code</th>
                                                <th className="px-3 py-2">Visitor</th>
                                                <th className="px-3 py-2">Department</th>
                                                <th className="px-3 py-2 text-right">Valid to</th>
                                                <th className="px-3 py-2">Status</th>
                                                <th className="px-3 py-2">Assigned</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {result.history.map((a) => (
                                                <tr key={a.id}>
                                                    <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-gray-900">{a.visitorCode}</td>
                                                    <td className="px-3 py-2">
                                                        <p className="font-semibold text-gray-900">{a.visitorName}</p>
                                                        <p className="text-gray-500">{a.company}</p>
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-700">{a.orgName || (a.orgIndexCode ? `#${a.orgIndexCode}` : '—')}</td>
                                                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-gray-700">{formatFactoryDateTime(a.endTime)}</td>
                                                    <td className={`px-3 py-2 font-bold uppercase ${STATUS_TEXT[a.status] ?? 'text-gray-500'}`}>{a.status}</td>
                                                    <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                                                        {formatFactoryDateTime(a.assignedAt)} · {a.assignedBy}
                                                        {a.revokedAt && <span className="block text-gray-400">Revoked {formatFactoryDateTime(a.revokedAt)}</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>

            <StudioModal
                open={Boolean(releaseTarget)}
                eyebrow="Card lookup"
                title={releaseTarget && result ? `Remove card ${result.cardNo} from ${releaseTarget.holder.personName || 'this person'}?` : ''}
                onClose={() => !releasing && setReleaseTarget(null)}
                footer={
                    <>
                        <button type="button" className={studioSecondaryButtonClass} onClick={() => setReleaseTarget(null)} disabled={releasing}>Cancel</button>
                        <button
                            type="button"
                            className={studioPrimaryButtonClass}
                            onClick={handleRelease}
                            disabled={releasing || (!releaseTarget?.isVisitor && !confirmed)}
                        >
                            {releasing ? 'Removing…' : 'Remove card'}
                        </button>
                    </>
                }
            >
                {releaseTarget && (
                    <div className="space-y-3 text-sm text-gray-600">
                        {releaseTarget.isVisitor ? (
                            <p>
                                Visitor <span className="font-mono font-semibold text-gray-900">{releaseTarget.holder.personCode}</span> was given this card from Access Door.
                                The visitor is deleted from HikCentral, so the card stops opening doors and can be reused.
                            </p>
                        ) : (
                            <>
                                <p>
                                    <span className="font-semibold text-gray-900">{releaseTarget.holder.personName}</span>
                                    {releaseTarget.holder.personCode && <> (<span className="font-mono">{releaseTarget.holder.personCode}</span>)</>} is not an Access Door
                                    visitor (probably an employee). Only this card is taken off the person; the person, their department and their other cards stay unchanged.
                                </p>
                                <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">
                                    This person will no longer open doors with card {result?.cardNo}.
                                </p>
                                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-700">
                                    <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-mwk" />
                                    I confirm removing this card from this person
                                </label>
                            </>
                        )}
                        {releaseError && <p className="text-xs font-semibold text-red-600">{releaseError}</p>}
                    </div>
                )}
            </StudioModal>
        </div>
    );
}
