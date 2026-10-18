/**
 * Access Door helpers (pure module, shared by the API routes and the studio UI).
 */

import type { AccessAssignment, AccessAssignmentRow, AccessSettings, AssignCardPayload, HikOrg } from '@/types/visitor-access.types';
import type { CardRequestType } from '@/types/visitor-card.types';

/** Factory time zone used for validity times sent to HikCentral (Vietnam, no DST) */
export const FACTORY_UTC_OFFSET = '+07:00';

/** HikCentral person code: up to 16 letters / digits (the visitor code, e.g. V06102623V3) */
export const PERSON_CODE_PATTERN = /^[A-Z0-9]{1,16}$/;
/** Card number as printed on the card / typed by the USB reader */
export const CARD_NO_PATTERN = /^[0-9A-Za-z]{1,20}$/;
const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Sites a default can be set for ("*" = any site) */
export const ACCESS_SITES = ['*', 'SHTP', 'DDK'] as const;
/** Categories a default can be set for ("*" = any category) */
export const ACCESS_CATEGORIES: readonly ('*' | CardRequestType)[] = ['*', 'expat', 'vendor', 'interviewee'];

/** Department suggested as the global default when none is configured yet */
export const SUGGESTED_VISITOR_ORG_NAME = 'TTI Guest';

export const EMPTY_ACCESS_SETTINGS: AccessSettings = { defaultOrgs: {}, defaultLevels: {} };

export function accessDefaultKey(category: '*' | CardRequestType, site: string): string {
    return `${category}|${site}`;
}

/** Most specific default: category+site, category, site, then the global default ('' when none) */
export function resolveDefault(defaults: Record<string, string>, category: CardRequestType, site: string): string {
    const s = site.toUpperCase();
    const siteKey = s === 'SHTP' || s === 'DDK' ? s : '*';
    const keys = [accessDefaultKey(category, siteKey), accessDefaultKey(category, '*'), accessDefaultKey('*', siteKey), accessDefaultKey('*', '*')];
    for (const key of keys) {
        if (defaults[key]) return defaults[key];
    }
    return '';
}

/** Departments with "Parent / Child" labels (sub-departments such as "Manager" repeat under many parents) */
export function buildOrgPaths(orgs: HikOrg[]): (HikOrg & { path: string })[] {
    const byId = new Map(orgs.map((o) => [o.orgIndexCode, o]));
    const path = (o: HikOrg, depth = 0): string => {
        const parent = byId.get(o.parentOrgIndexCode);
        // The root ("All Departments") is left out of the label
        return parent && depth < 10 && parent.parentOrgIndexCode && parent.parentOrgIndexCode !== '0'
            ? `${path(parent, depth + 1)} / ${o.orgName}`
            : o.orgName;
    };
    return orgs.map((o) => ({ ...o, path: path(o) })).sort((a, b) => a.path.localeCompare(b.path));
}

/** Characters HikCentral rejects in names: ' / \ : * ? " < > | */
export function cleanHikText(value: string, maxLength: number): string {
    return value.replace(/['/\\:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** "Nguyen Van An" -> family "Nguyen", given "Van An" (both are required by HikCentral) */
export function splitPersonName(fullName: string): { familyName: string; givenName: string } {
    const parts = cleanHikText(fullName, 256).split(' ').filter(Boolean);
    if (parts.length === 0) return { familyName: 'Visitor', givenName: 'Visitor' };
    if (parts.length === 1) return { familyName: parts[0], givenName: parts[0] };
    return { familyName: parts[0], givenName: parts.slice(1).join(' ') };
}

/** Person remark (max 128): request, company and category of the visit */
export function personRemark(p: Pick<AssignCardPayload, 'requestCode' | 'company' | 'category' | 'site'>): string {
    return cleanHikText(
        [p.requestCode && `Request ${p.requestCode}`, p.company, p.category, p.site].filter(Boolean).join(' - '),
        128
    );
}

/** "YYYY-MM-DDTHH:mm" (factory local time) -> ISO 8601 with the factory offset */
export function toHikDateTime(local: string): string {
    return `${local}:00${FACTORY_UTC_OFFSET}`;
}

/** Default validity from the request dates: start of the first day to end of the last day */
export function defaultValidity(dateFrom: string, dateTo: string): { beginTime: string; endTime: string } {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const from = /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? dateFrom : todayKey;
    const to = /^\d{4}-\d{2}-\d{2}$/.test(dateTo) && dateTo >= from ? dateTo : from;
    return { beginTime: `${from}T00:00`, endTime: `${to}T23:59` };
}

/** ISO timestamp -> "YYYY-MM-DDTHH:mm" in the factory time zone */
export function toFactoryLocal(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return shifted.toISOString().slice(0, 16);
}

/** Validates an assign request; returns the cleaned payload or an error message */
export function validateAssignPayload(input: unknown): { payload: AssignCardPayload } | { error: string } {
    if (typeof input !== 'object' || input === null) return { error: 'Invalid request body' };
    const src = input as Record<string, unknown>;
    const str = (key: string, max: number) => (typeof src[key] === 'string' ? (src[key] as string).trim().slice(0, max) : '');

    const visitorCode = str('visitorCode', 32).toUpperCase();
    const cardNo = str('cardNo', 32);
    const orgIndexCode = str('orgIndexCode', 64);
    const beginTime = str('beginTime', 16);
    const endTime = str('endTime', 16);
    const visitorName = cleanHikText(str('visitorName', 256), 256);

    if (!PERSON_CODE_PATTERN.test(visitorCode)) return { error: 'Visitor code must be up to 16 letters or digits (e.g. V06102623V3)' };
    if (!CARD_NO_PATTERN.test(cardNo)) return { error: 'Card number must be 1-20 letters or digits' };
    if (!visitorName) return { error: 'Visitor name is required' };
    if (!orgIndexCode) return { error: 'Choose the department' };
    if (!LOCAL_DATE_TIME_PATTERN.test(beginTime) || !LOCAL_DATE_TIME_PATTERN.test(endTime)) return { error: 'Valid from / to are required' };
    if (endTime <= beginTime) return { error: '"Valid to" must be after "Valid from"' };

    return {
        payload: {
            visitorCode,
            requestCode: str('requestCode', 64),
            visitorName,
            company: cleanHikText(str('company', 256), 256),
            category: str('category', 128),
            site: str('site', 32),
            cardNo,
            orgIndexCode,
            orgName: str('orgName', 256),
            privilegeGroupId: str('privilegeGroupId', 64),
            privilegeGroupName: str('privilegeGroupName', 128),
            beginTime,
            endTime,
        },
    };
}

const VALID_DEFAULT_KEYS = new Set(ACCESS_CATEGORIES.flatMap((c) => ACCESS_SITES.map((s) => accessDefaultKey(c, s))));

function pickDefaults(input: unknown): Record<string, string> {
    const src = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(src)) {
        if (VALID_DEFAULT_KEYS.has(key) && typeof value === 'string' && value.trim()) out[key] = value.trim().slice(0, 64);
    }
    return out;
}

/** Coerces stored / posted settings JSON (a single "orgIndexCode" of the first version becomes the global default) */
export function normalizeAccessSettings(input: unknown): AccessSettings {
    if (typeof input !== 'object' || input === null) return { defaultOrgs: {}, defaultLevels: {} };
    const src = input as Record<string, unknown>;
    const defaultOrgs = pickDefaults(src.defaultOrgs);
    if (!defaultOrgs[accessDefaultKey('*', '*')] && typeof src.orgIndexCode === 'string' && src.orgIndexCode.trim()) {
        defaultOrgs[accessDefaultKey('*', '*')] = src.orgIndexCode.trim().slice(0, 64);
    }
    return { defaultOrgs, defaultLevels: pickDefaults(src.defaultLevels) };
}

export function fromAssignmentRow(row: AccessAssignmentRow): AccessAssignment {
    return {
        id: row.id,
        visitorCode: row.visitor_code,
        requestCode: row.request_code ?? '',
        visitorName: row.visitor_name,
        company: row.company ?? '',
        category: row.category ?? '',
        site: row.site ?? '',
        cardNo: row.card_no,
        personId: row.person_id,
        orgIndexCode: row.org_index_code ?? '',
        orgName: row.org_name ?? '',
        privilegeGroupId: row.privilege_group_id ?? '',
        privilegeGroupName: row.privilege_group_name ?? '',
        beginTime: new Date(row.begin_time).toISOString(),
        endTime: new Date(row.end_time).toISOString(),
        status: row.status,
        lastError: row.last_error,
        assignedBy: row.assigned_by,
        assignedAt: new Date(row.assigned_at).toISOString(),
        revokedBy: row.revoked_by,
        revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
    };
}
