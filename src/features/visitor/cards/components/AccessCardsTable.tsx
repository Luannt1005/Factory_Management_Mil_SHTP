'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AccessAssignment, AccessCheckResponse } from '@/types/visitor-access.types';
import { accessDoorApi } from '@/features/visitor/cards/services/accessDoorApi';
import { formatFactoryDateTime } from '@/features/visitor/cards/utils/accessDoor';
import StudioModal, { studioInputClass, studioPrimaryButtonClass, studioSecondaryButtonClass } from './StudioModal';

type CheckState = AccessCheckResponse | { error: string } | 'loading';
type RevokeState = { state: 'working' } | { state: 'error'; message: string };

const STATUS_PILL: Record<AccessAssignment['status'], string> = {
    active: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    revoked: 'bg-gray-50 text-gray-500 border-gray-200',
    replaced: 'bg-gray-50 text-gray-500 border-gray-200',
};

/** Card numbers sort numerically when they are numbers ("9" before "10") */
function compareCardNo(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true });
}

function canRevoke(a: AccessAssignment): boolean {
    return a.status === 'active' || a.status === 'failed';
}

interface AccessCardsTableProps {
    /** Bumped by the parent after assignments change so the list reloads */
    refreshKey: number;
    onChanged: () => Promise<void>;
    notify: (type: 'success' | 'error', message: string) => void;
}

/**
 * Which card is with which visitor (active), or the full history. Ticked rows can be revoked
 * together: each person is deleted in HikCentral so the cards can be reused.
 */
export default function AccessCardsTable({ refreshKey, onChanged, notify }: AccessCardsTableProps) {
    const [scope, setScope] = useState<'active' | 'all'>('active');
    const [search, setSearch] = useState('');
    const [list, setList] = useState<AccessAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ticked, setTicked] = useState<Set<string>>(new Set());
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [revoking, setRevoking] = useState<Record<string, RevokeState>>({});
    const [running, setRunning] = useState(false);
    const [checks, setChecks] = useState<Record<string, CheckState>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const rows = await accessDoorApi.listAssignments(scope, search);
            setList(scope === 'active' ? [...rows].sort((a, b) => compareCardNo(a.cardNo, b.cardNo)) : rows);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load card assignments');
        } finally {
            setLoading(false);
        }
    }, [scope, search]);

    useEffect(() => {
        const timer = setTimeout(load, 250);
        return () => clearTimeout(timer);
    }, [load, refreshKey]);

    // Drop ticks of rows that are no longer listed / revocable
    useEffect(() => {
        setTicked((prev) => new Set(Array.from(prev).filter((id) => list.some((a) => a.id === id && canRevoke(a)))));
    }, [list]);

    const revocable = useMemo(() => list.filter(canRevoke), [list]);
    const tickedRows = revocable.filter((a) => ticked.has(a.id));
    const allTicked = revocable.length > 0 && revocable.every((a) => ticked.has(a.id));

    const toggle = (id: string, on: boolean) =>
        setTicked((prev) => {
            const next = new Set(prev);
            if (on) next.add(id);
            else next.delete(id);
            return next;
        });

    const revokeTicked = async () => {
        setConfirmOpen(false);
        setRunning(true);
        let ok = 0;
        let failed = 0;
        for (const a of tickedRows) {
            setRevoking((prev) => ({ ...prev, [a.id]: { state: 'working' } }));
            try {
                await accessDoorApi.revoke(a.id);
                ok++;
                setRevoking((prev) => {
                    const next = { ...prev };
                    delete next[a.id];
                    return next;
                });
            } catch (err) {
                failed++;
                setRevoking((prev) => ({ ...prev, [a.id]: { state: 'error', message: err instanceof Error ? err.message : 'Revoke failed' } }));
            }
        }
        setRunning(false);
        notify(failed === 0 ? 'success' : 'error', `Revoked ${ok} card${ok === 1 ? '' : 's'}${failed ? `, ${failed} failed (see the Status column)` : ''}.`);
        await load();
        await onChanged();
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

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
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
                            {s === 'active' ? 'Cards in use' : 'History'}
                        </button>
                    ))}
                </div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search card no., visitor code, name, company…"
                    className={`${studioInputClass} max-w-sm py-1.5`}
                    aria-label="Search cards"
                />
                <span className="whitespace-nowrap text-xs font-semibold text-gray-500">
                    {loading ? 'Loading…' : `${list.length} ${scope === 'active' ? `card${list.length === 1 ? '' : 's'} in use` : 'records'}`}
                </span>
                <button
                    type="button"
                    className={`${studioPrimaryButtonClass} ml-auto`}
                    onClick={() => setConfirmOpen(true)}
                    disabled={tickedRows.length === 0 || running}
                >
                    {running ? 'Revoking…' : `Revoke ticked (${tickedRows.length})`}
                </button>
            </div>

            {error && <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{error}</p>}

            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
                    <thead className="border-b border-gray-200 bg-gray-50 font-bold uppercase tracking-wider text-gray-600">
                        <tr>
                            <th className="w-10 px-3 py-2.5">
                                <input
                                    type="checkbox"
                                    checked={allTicked}
                                    onChange={(e) => setTicked(e.target.checked ? new Set(revocable.map((a) => a.id)) : new Set())}
                                    disabled={revocable.length === 0 || running}
                                    className="h-3.5 w-3.5 cursor-pointer accent-mwk"
                                    aria-label="Tick all cards"
                                />
                            </th>
                            <th className="px-3 py-2.5">Card No.</th>
                            <th className="px-3 py-2.5">Visitor code</th>
                            <th className="px-3 py-2.5">Visitor</th>
                            <th className="px-3 py-2.5">Department / access level</th>
                            <th className="px-3 py-2.5 text-right">Valid from</th>
                            <th className="px-3 py-2.5 text-right">Valid to</th>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5">Assigned</th>
                            <th className="px-3 py-2.5 text-right">Devices</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {list.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-16 text-center">
                                    <p className="text-sm font-bold text-gray-900">
                                        {loading ? 'Loading…' : scope === 'active' ? 'No cards in use' : 'No assignments yet'}
                                    </p>
                                    {!loading && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            {search ? 'Nothing matches this search.' : 'Cards given to visitors in Assign cards appear here.'}
                                        </p>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            list.map((a) => {
                                const check = checks[a.id];
                                const rev = revoking[a.id];
                                const expired = a.status === 'active' && new Date(a.endTime).getTime() < Date.now();
                                return (
                                    <tr key={a.id} className={`align-top ${ticked.has(a.id) ? 'bg-mwk-soft' : ''}`}>
                                        <td className="px-3 py-2.5">
                                            {canRevoke(a) && (
                                                <input
                                                    type="checkbox"
                                                    checked={ticked.has(a.id)}
                                                    onChange={(e) => toggle(a.id, e.target.checked)}
                                                    disabled={running}
                                                    className="h-3.5 w-3.5 cursor-pointer accent-mwk"
                                                    aria-label={`Tick card ${a.cardNo}`}
                                                />
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-sm font-bold text-gray-900">{a.cardNo}</td>
                                        <td className="whitespace-nowrap px-3 py-2.5 font-mono font-semibold text-gray-700">{a.visitorCode}</td>
                                        <td className="px-3 py-2.5">
                                            <p className="font-semibold text-gray-900">{a.visitorName}</p>
                                            <p className="text-gray-500">{a.company}</p>
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-700">
                                            <p>{a.orgName || (a.orgIndexCode ? `#${a.orgIndexCode}` : '—')}</p>
                                            {a.privilegeGroupId && <p className="text-gray-500">{a.privilegeGroupName || a.privilegeGroupId}</p>}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-gray-700">{formatFactoryDateTime(a.beginTime)}</td>
                                        <td className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${expired ? 'font-semibold text-red-600' : 'text-gray-700'}`}>
                                            {formatFactoryDateTime(a.endTime)}
                                            {expired && <p className="text-[10px] uppercase">Expired - revoke</p>}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_PILL[a.status]}`}>{a.status}</span>
                                            {rev?.state === 'working' && <p className="mt-1 text-[11px] text-gray-500">Revoking…</p>}
                                            {rev?.state === 'error' && <p className="mt-1 max-w-[260px] text-[11px] text-red-600">{rev.message}</p>}
                                            {a.lastError && !rev && <p className="mt-1 max-w-[260px] text-[11px] text-red-600">{a.lastError}</p>}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">
                                            <p>{formatFactoryDateTime(a.assignedAt)}</p>
                                            <p>{a.assignedBy}</p>
                                            {a.revokedAt && <p className="text-gray-400">Revoked {formatFactoryDateTime(a.revokedAt)}</p>}
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            {a.status === 'active' && (
                                                <button type="button" className="cursor-pointer font-bold text-gray-500 hover:text-gray-900" onClick={() => handleCheck(a)} disabled={check === 'loading'}>
                                                    Check
                                                </button>
                                            )}
                                            {check === 'loading' && <p className="mt-1 text-[11px] text-gray-500">Checking…</p>}
                                            {check && check !== 'loading' && 'error' in check && <p className="mt-1 max-w-[220px] text-left text-[11px] text-red-600">{check.error}</p>}
                                            {check && check !== 'loading' && 'failures' in check && (
                                                <div className="mt-1 max-w-[240px] text-left text-[11px]">
                                                    {check.failures.length === 0 ? (
                                                        <p className="text-green-700">No device errors{check.pendingCount ? ` (${check.pendingCount} still applying)` : ''}.</p>
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
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <StudioModal
                open={confirmOpen}
                eyebrow="Access Door"
                title={`Revoke ${tickedRows.length} card${tickedRows.length === 1 ? '' : 's'}?`}
                onClose={() => setConfirmOpen(false)}
                footer={
                    <>
                        <button type="button" className={studioSecondaryButtonClass} onClick={() => setConfirmOpen(false)}>Cancel</button>
                        <button type="button" className={studioPrimaryButtonClass} onClick={revokeTicked}>Revoke cards</button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-gray-600">
                    Each visitor is deleted from HikCentral, so these cards stop opening doors and can be given to other visitors.
                </p>
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs">
                    {tickedRows.map((a) => (
                        <li key={a.id} className="flex gap-3">
                            <span className="w-24 shrink-0 font-mono font-bold text-gray-900">{a.cardNo}</span>
                            <span className="w-28 shrink-0 font-mono text-gray-600">{a.visitorCode}</span>
                            <span className="truncate text-gray-700">{a.visitorName}</span>
                        </li>
                    ))}
                </ul>
            </StudioModal>
        </div>
    );
}
