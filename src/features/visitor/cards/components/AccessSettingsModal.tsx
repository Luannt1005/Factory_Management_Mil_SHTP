'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AccessSettings, HikAccessLevel, HikOrg } from '@/types/visitor-access.types';
import {
    ACCESS_CATEGORIES,
    ACCESS_SITES,
    SUGGESTED_VISITOR_ORG_NAME,
    accessDefaultKey,
    buildOrgPaths,
} from '@/features/visitor/cards/utils/accessDoor';
import { REQUEST_TYPE_LABELS } from '@/utils/visitorCategory';
import StudioModal, { studioLabelClass, studioPrimaryButtonClass, studioSecondaryButtonClass } from './StudioModal';

interface AccessSettingsModalProps {
    open: boolean;
    settings: AccessSettings;
    orgs: HikOrg[];
    accessLevels: HikAccessLevel[];
    optionErrors: { orgs?: string; accessLevels?: string };
    onSave: (settings: AccessSettings) => Promise<void>;
    onClose: () => void;
}

type DefaultsKind = 'defaultOrgs' | 'defaultLevels';

const selectClass = 'w-full cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-900 outline-none focus:border-mwk';
const GLOBAL_KEY = accessDefaultKey('*', '*');

export default function AccessSettingsModal({ open, settings, orgs, accessLevels, optionErrors, onSave, onClose }: AccessSettingsModalProps) {
    const [draft, setDraft] = useState<AccessSettings>(settings);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        // Suggest the guest department as the global default the first time
        const suggested = !settings.defaultOrgs[GLOBAL_KEY] ? orgs.find((o) => o.orgName === SUGGESTED_VISITOR_ORG_NAME) : undefined;
        setDraft(suggested ? { ...settings, defaultOrgs: { ...settings.defaultOrgs, [GLOBAL_KEY]: suggested.orgIndexCode } } : settings);
        setError(null);
    }, [open, settings, orgs]);

    const orgOptions = useMemo(() => buildOrgPaths(orgs), [orgs]);

    const setDefault = (kind: DefaultsKind, key: string, value: string) =>
        setDraft((prev) => {
            const next = { ...prev[kind] };
            if (value) next[key] = value;
            else delete next[key];
            return { ...prev, [kind]: next };
        });

    const handleSave = async () => {
        if (!draft.defaultOrgs[GLOBAL_KEY]) {
            setError('Choose the default department for "All categories / Any site"');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onSave(draft);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save access settings');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const categoryLabel = (c: (typeof ACCESS_CATEGORIES)[number]) => (c === '*' ? 'All categories' : REQUEST_TYPE_LABELS[c]);

    const matrix = (kind: DefaultsKind, options: { value: string; label: string }[]) => (
        <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 font-bold uppercase tracking-wider text-gray-600">
                    <tr>
                        <th className="px-3 py-2">Category</th>
                        {ACCESS_SITES.map((s) => <th key={s} className="px-3 py-2">{s === '*' ? 'Any site' : s}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {ACCESS_CATEGORIES.map((c) => (
                        <tr key={c}>
                            <td className="whitespace-nowrap px-3 py-2 font-semibold text-gray-700">{categoryLabel(c)}</td>
                            {ACCESS_SITES.map((s) => {
                                const key = accessDefaultKey(c, s);
                                return (
                                    <td key={key} className="max-w-[200px] px-2 py-1.5">
                                        <select
                                            value={draft[kind][key] ?? ''}
                                            onChange={(e) => setDefault(kind, key, e.target.value)}
                                            className={selectClass}
                                            aria-label={`${categoryLabel(c)} - ${s === '*' ? 'any site' : s}`}
                                        >
                                            <option value="">{key === GLOBAL_KEY && kind === 'defaultOrgs' ? 'Required…' : '—'}</option>
                                            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <StudioModal
            open
            eyebrow="Access Door"
            title="Access settings"
            onClose={onClose}
            maxWidthClass="max-w-4xl"
            footer={
                <>
                    <button type="button" className={studioSecondaryButtonClass} onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="button" className={studioPrimaryButtonClass} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : 'Save settings'}
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                <section>
                    <p className={studioLabelClass}>Default department (HikCentral organization)</p>
                    <p className="mb-2 text-xs text-gray-500">
                        Pre-selected when assigning a card; the person is created in this department, and its access levels on HikCentral open the doors.
                        The most specific match wins (category + site, category, site, then all).
                    </p>
                    {optionErrors.orgs ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{optionErrors.orgs}</p>
                    ) : (
                        matrix('defaultOrgs', orgOptions.map((o) => ({ value: o.orgIndexCode, label: `${o.path} · #${o.orgIndexCode}` })))
                    )}
                </section>

                <section>
                    <p className={studioLabelClass}>Default access level (optional)</p>
                    {optionErrors.accessLevels || accessLevels.length === 0 ? (
                        <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                            Access levels are not available to this app key, so doors come from the department only.
                        </p>
                    ) : (
                        <>
                            <p className="mb-2 text-xs text-gray-500">Adds the person to this access level as well, on top of the department.</p>
                            {matrix('defaultLevels', accessLevels.map((l) => ({ value: l.privilegeGroupId, label: l.privilegeGroupName })))}
                        </>
                    )}
                </section>

                {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
            </div>
        </StudioModal>
    );
}
