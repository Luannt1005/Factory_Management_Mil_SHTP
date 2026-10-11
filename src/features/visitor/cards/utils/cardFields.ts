/**
 * Card data field catalog (pure module, shared by the API route and the studio UI).
 *
 * Every card carries the full set of fields; a field the request type does not have is ''.
 * Placeholders in custom text use the field key, e.g. "Host: {hostDepartment}".
 */

import type { CardFieldKey, CardFields, CardPresetScope, CardRequestType } from '@/types/visitor-card.types';
import { REQUEST_TYPE_LABELS, toCardRequestType } from '@/utils/visitorCategory';

export { toCardRequestType };

export type CardFieldGroup = 'Visitor' | 'Request' | 'Submitter' | 'Host & logistics' | 'System';

export interface CardFieldDef {
    key: CardFieldKey;
    label: string;
    group: CardFieldGroup;
    /** Request types that actually provide a value for this field */
    appliesTo: readonly CardRequestType[];
    /** Rendered as <input type="date"> in the card editor */
    input?: 'date';
}

const ALL: readonly CardRequestType[] = ['expat', 'vendor', 'interviewee'];

export const CARD_REQUEST_TYPE_LABELS: Record<CardRequestType, string> = REQUEST_TYPE_LABELS;

export const CARD_SCOPE_LABELS: Record<CardPresetScope, string> = {
    all: 'All categories',
    ...CARD_REQUEST_TYPE_LABELS,
};

/** Category value written on blank cards created for a template of this scope */
export const CARD_SCOPE_DEFAULT_CATEGORY: Record<CardPresetScope, string> = {
    all: 'Visitor',
    expat: 'MIL/TTI Expat / SHTP Business trip',
    vendor: 'Vendor',
    interviewee: 'Interviewee',
};

export const CARD_FIELD_DEFS: readonly CardFieldDef[] = [
    // Visitor
    { key: 'visitorName', label: 'Visitor name', group: 'Visitor', appliesTo: ALL },
    { key: 'visitorTitle', label: 'Title / Job title', group: 'Visitor', appliesTo: ALL },
    { key: 'visitorCompany', label: 'Company', group: 'Visitor', appliesTo: ALL },
    { key: 'cardCode', label: 'Visitor code', group: 'Visitor', appliesTo: ALL },
    { key: 'cardNumber', label: 'Physical card no.', group: 'Visitor', appliesTo: ALL },
    { key: 'interviewDepartment', label: 'Interview department', group: 'Visitor', appliesTo: ['interviewee'] },
    { key: 'interviewerName', label: 'Interviewer', group: 'Visitor', appliesTo: ['interviewee'] },
    // Request
    { key: 'requestCode', label: 'Request code', group: 'Request', appliesTo: ALL },
    { key: 'category', label: 'Visitor category', group: 'Request', appliesTo: ALL },
    { key: 'status', label: 'Request status', group: 'Request', appliesTo: ALL },
    { key: 'visitingSite', label: 'Visiting site', group: 'Request', appliesTo: ALL },
    { key: 'purposeOfVisit', label: 'Purpose of visit', group: 'Request', appliesTo: ALL },
    { key: 'purposeDetail', label: 'Purpose detail', group: 'Request', appliesTo: ALL },
    { key: 'dateFrom', label: 'Valid from', group: 'Request', appliesTo: ALL, input: 'date' },
    { key: 'dateTo', label: 'Valid to', group: 'Request', appliesTo: ALL, input: 'date' },
    { key: 'startTime', label: 'Interview time', group: 'Request', appliesTo: ['interviewee'] },
    { key: 'interviewArea', label: 'Interview area', group: 'Request', appliesTo: ['interviewee'] },
    // Submitter
    { key: 'submitterName', label: 'Submitter', group: 'Submitter', appliesTo: ALL },
    { key: 'submitterDepartment', label: 'Submitter department', group: 'Submitter', appliesTo: ALL },
    { key: 'submitterEmail', label: 'Submitter email', group: 'Submitter', appliesTo: ['expat', 'vendor', 'interviewee'] },
    // Host & logistics (Expat / Business trip only)
    { key: 'hostBu', label: 'Host BU', group: 'Host & logistics', appliesTo: ['expat'] },
    { key: 'hostFunctionalDept', label: 'Host functional dept', group: 'Host & logistics', appliesTo: ['expat'] },
    { key: 'hostDepartment', label: 'Host department', group: 'Host & logistics', appliesTo: ['expat'] },
    { key: 'rooms', label: 'Approved areas', group: 'Host & logistics', appliesTo: ['expat'] },
    { key: 'costCenter', label: 'Cost center', group: 'Host & logistics', appliesTo: ['expat'] },
    { key: 'factoryTour', label: 'Factory tour', group: 'Host & logistics', appliesTo: ['expat'] },
    { key: 'mealRegistration', label: 'Meal registration', group: 'Host & logistics', appliesTo: ['expat'] },
    // System
    { key: 'qrValue', label: 'QR content', group: 'System', appliesTo: ALL },
];

export const CARD_FIELD_GROUPS: readonly CardFieldGroup[] = ['Visitor', 'Request', 'Submitter', 'Host & logistics', 'System'];

export const CARD_FIELD_KEYS: readonly CardFieldKey[] = CARD_FIELD_DEFS.map((d) => d.key);

const FIELD_KEY_SET = new Set<string>(CARD_FIELD_KEYS);

export function isCardFieldKey(value: string): value is CardFieldKey {
    return FIELD_KEY_SET.has(value);
}

/** Fields offered for a template category ('all' = every field) */
export function fieldDefsForScope(scope: CardPresetScope): readonly CardFieldDef[] {
    return scope === 'all' ? CARD_FIELD_DEFS : CARD_FIELD_DEFS.filter((d) => d.appliesTo.includes(scope));
}

/** Whether a card may be printed with a template of this category */
export function cardMatchesScope(fields: CardFields, scope: CardPresetScope): boolean {
    return scope === 'all' || toCardRequestType(fields.category) === scope;
}

/** A card with every field present and empty */
export function emptyCardFields(): CardFields {
    return Object.fromEntries(CARD_FIELD_KEYS.map((k) => [k, ''])) as CardFields;
}

/** Fills every missing / null / non-string field with '' so the UI never shows "null" or "undefined" */
export function completeCardFields(input: Partial<Record<string, unknown>> | null | undefined): CardFields {
    const fields = emptyCardFields();
    if (!input) return fields;
    for (const key of CARD_FIELD_KEYS) {
        const value = input[key];
        if (value === null || value === undefined) continue;
        fields[key] = typeof value === 'string' ? value.trim() : String(value).trim();
    }
    return fields;
}

// ===============================
// Placeholders
// ===============================

/** Short names kept for texts written before the full field list existed */
const LEGACY_PLACEHOLDERS: Record<string, CardFieldKey> = {
    name: 'visitorName',
    code: 'cardCode',
    company: 'visitorCompany',
    title: 'visitorTitle',
};

/** "YYYY-MM-DD" -> "DD/MM/YYYY" for printing */
export function formatCardDate(value: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

export function formatCardDateRange(from: string, to: string): string {
    if (!from && !to) return '';
    if (!to || to === from) return formatCardDate(from || to);
    if (!from) return formatCardDate(to);
    return `${formatCardDate(from)} - ${formatCardDate(to)}`;
}

/** Value printed for a placeholder name ('' when unknown or empty) */
export function cardPlaceholderValue(name: string, fields: CardFields): string {
    if (name === 'date' || name === 'dateRange') return formatCardDateRange(fields.dateFrom, fields.dateTo);
    const key = LEGACY_PLACEHOLDERS[name] ?? name;
    if (!isCardFieldKey(key)) return '';
    if (key === 'dateFrom' || key === 'dateTo') return formatCardDate(fields[key]);
    return fields[key] ?? '';
}

const PLACEHOLDER_PATTERN = /\{([a-zA-Z]+)\}/g;

/**
 * Replaces {fieldKey} placeholders. `allEmpty` is true when the text has placeholders and
 * every one of them resolved to '' (used by "hide if empty").
 */
export function resolveCardText(template: string, fields: CardFields): { text: string; allEmpty: boolean } {
    let placeholders = 0;
    let filled = 0;
    const text = template.replace(PLACEHOLDER_PATTERN, (_, name: string) => {
        placeholders++;
        const value = cardPlaceholderValue(name, fields);
        if (value) filled++;
        return value;
    });
    return { text, allEmpty: placeholders > 0 && filled === 0 };
}
