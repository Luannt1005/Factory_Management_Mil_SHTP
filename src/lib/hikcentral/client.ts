/**
 * HikCentral Professional OpenAPI client (SERVER ONLY - never import from client components).
 *
 * Every request is signed with the partner app key / secret (HMAC-SHA256, OpenAPI Developer Guide
 * V3.1.0 "Authentication"): the string to sign is
 *   METHOD \n Accept \n Content-Type \n x-ca-key:… \n x-ca-nonce:… \n x-ca-timestamp:… \n path
 * Config comes from .env.local: HIKCENTRAL_BASE_URL, HIKCENTRAL_APP_KEY, HIKCENTRAL_APP_SECRET,
 * HIKCENTRAL_USER_ID (default "admin").
 */

import crypto from 'node:crypto';
import https from 'node:https';
import type { HikAccessLevel, HikOrg, AccessApplicationFailure } from '@/types/visitor-access.types';

const ACCEPT = 'application/json';
const CONTENT_TYPE = 'application/json;charset=UTF-8';
const TIMEOUT_MS = 20000;
const PAGE_SIZE = 500;

/** Access level type used for door access (1 = access control, 2 = visitor module) */
export const ACCESS_CONTROL_TYPE = 1;

/** HikCentral answered with a non-zero code (or a non-JSON / HTTP error) */
export class HikCentralError extends Error {
    code: string;
    constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.name = 'HikCentralError';
    }
}

interface HikEnvelope<T> {
    code: string;
    msg: string;
    data?: T;
}

interface HikConfig {
    url: URL;
    appKey: string;
    appSecret: string;
    userId: string;
}

function readConfig(): HikConfig | null {
    const base = process.env.HIKCENTRAL_BASE_URL;
    const appKey = process.env.HIKCENTRAL_APP_KEY;
    const appSecret = process.env.HIKCENTRAL_APP_SECRET;
    if (!base || !appKey || !appSecret) return null;
    try {
        return { url: new URL(base), appKey, appSecret, userId: process.env.HIKCENTRAL_USER_ID || 'admin' };
    } catch {
        return null;
    }
}

export function isHikCentralConfigured(): boolean {
    return readConfig() !== null;
}

// The platform runs a self-signed certificate on the plant network; trust it for these calls only
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

/** Calls one OpenAPI endpoint and returns `data` when code === "0" */
export async function hikRequest<T>(path: string, body: unknown): Promise<T | undefined> {
    const config = readConfig();
    if (!config) throw new HikCentralError('config', 'HikCentral is not configured (HIKCENTRAL_* in .env.local)');

    const caHeaders: Record<string, string> = {
        'x-ca-key': config.appKey,
        'x-ca-nonce': crypto.randomUUID(),
        'x-ca-timestamp': String(Date.now()),
    };
    const signedNames = Object.keys(caHeaders).sort();
    const stringToSign = ['POST', ACCEPT, CONTENT_TYPE, ...signedNames.map((n) => `${n}:${caHeaders[n]}`), path].join('\n');
    const signature = crypto.createHmac('sha256', config.appSecret).update(stringToSign, 'utf8').digest('base64');
    const payload = JSON.stringify(body);

    const raw = await new Promise<string>((resolve, reject) => {
        const req = https.request(
            {
                hostname: config.url.hostname,
                port: config.url.port || 443,
                path,
                method: 'POST',
                agent,
                timeout: TIMEOUT_MS,
                headers: {
                    Accept: ACCEPT,
                    'Content-Type': CONTENT_TYPE,
                    'Content-Length': Buffer.byteLength(payload),
                    userId: config.userId,
                    'X-Ca-Key': caHeaders['x-ca-key'],
                    'X-Ca-Nonce': caHeaders['x-ca-nonce'],
                    'X-Ca-Timestamp': caHeaders['x-ca-timestamp'],
                    'X-Ca-Signature': signature,
                    'X-Ca-Signature-Headers': signedNames.join(','),
                },
            },
            (res) => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk: string) => (data += chunk));
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new HikCentralError(`http-${res.statusCode}`, `HikCentral returned HTTP ${res.statusCode}`));
                    } else {
                        resolve(data);
                    }
                });
            }
        );
        req.on('timeout', () => req.destroy(new HikCentralError('timeout', 'HikCentral did not answer in time')));
        req.on('error', (err) => reject(err instanceof HikCentralError ? err : new HikCentralError('network', `Cannot reach HikCentral (${err.message})`)));
        req.end(payload);
    });

    let envelope: HikEnvelope<T>;
    try {
        envelope = JSON.parse(raw) as HikEnvelope<T>;
    } catch {
        throw new HikCentralError('invalid-response', 'HikCentral returned an unexpected response');
    }
    if (String(envelope.code) !== '0') {
        throw new HikCentralError(String(envelope.code), describeHikError(String(envelope.code), envelope.msg));
    }
    return envelope.data;
}

/** User-facing text for platform error codes */
export function describeHikError(code: string, msg: string): string {
    if (code === '69') return 'The HikCentral app key is not allowed to use this API. Ask the HikCentral administrator to grant it (OpenAPI partner permissions).';
    return `HikCentral error ${code}: ${msg || 'unknown error'}`;
}

// ===============================
// Paged lists
// ===============================

interface PagedData<T> {
    total?: number;
    list?: T[];
}

async function listAllPages<T>(path: string, body: Record<string, unknown>, maxPages = 20): Promise<T[]> {
    const items: T[] = [];
    for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
        const data = await hikRequest<PagedData<T>>(path, { ...body, pageNo, pageSize: PAGE_SIZE });
        const list = data?.list ?? [];
        items.push(...list);
        if (list.length < PAGE_SIZE || (data?.total !== undefined && items.length >= data.total)) break;
    }
    return items;
}

function text(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
}

export async function listOrgs(): Promise<HikOrg[]> {
    const rows = await listAllPages<Record<string, unknown>>('/artemis/api/resource/v1/org/orgList', {});
    return rows.map((o) => ({
        orgIndexCode: text(o.orgIndexCode),
        orgName: text(o.orgName).trim(),
        parentOrgIndexCode: text(o.parentOrgIndexCode),
    }));
}

export async function listAccessLevels(): Promise<HikAccessLevel[]> {
    const rows = await listAllPages<Record<string, unknown>>('/artemis/api/acs/v1/privilege/group', { type: ACCESS_CONTROL_TYPE });
    return rows.map((g) => ({
        privilegeGroupId: text(g.privilegeGroupId),
        privilegeGroupName: text(g.privilegeGroupName),
        description: text(g.description),
    }));
}

// ===============================
// Persons
// ===============================

export interface HikPersonInput {
    personCode: string;
    familyName: string;
    givenName: string;
    orgIndexCode: string;
    cardNo: string;
    /** ISO 8601 with offset, e.g. 2026-10-16T08:00:00+07:00 */
    beginTime: string;
    endTime: string;
    remark: string;
}

const PERSON_NOT_FOUND_CODE = '128';

/** Person ID for a person code, or null when the code is not used on the platform */
export async function findPersonIdByCode(personCode: string): Promise<string | null> {
    try {
        const data = await hikRequest<{ personId?: string }>('/artemis/api/resource/v1/person/personCode/personInfo', { personCode });
        return data?.personId ? String(data.personId) : null;
    } catch (err) {
        // 128 = "The request resource does not exist" (verified against the plant server); anything else is a real error
        if (err instanceof HikCentralError && err.code === PERSON_NOT_FOUND_CODE) return null;
        throw err;
    }
}

function personBody(input: HikPersonInput) {
    return {
        personCode: input.personCode,
        personFamilyName: input.familyName,
        personGivenName: input.givenName,
        gender: 0,
        orgIndexCode: input.orgIndexCode,
        remark: input.remark,
        cards: [{ cardNo: input.cardNo }],
        beginTime: input.beginTime,
        endTime: input.endTime,
    };
}

/** Creates the person with its card and returns the new person ID */
export async function addPerson(input: HikPersonInput): Promise<string> {
    const personId = await hikRequest<string>('/artemis/api/resource/v1/person/single/add', personBody(input));
    if (!personId) throw new HikCentralError('invalid-response', 'HikCentral did not return the new person ID');
    return String(personId);
}

/** Replaces the person's card, department and validity */
export async function updatePerson(personId: string, input: HikPersonInput): Promise<void> {
    await hikRequest('/artemis/api/resource/v1/person/single/update', { personId, ...personBody(input) });
}

/** Deletes the person, which also frees its card number */
export async function deletePerson(personId: string): Promise<void> {
    await hikRequest('/artemis/api/resource/v1/person/single/delete', { personId });
}

// ===============================
// Access levels
// ===============================

export async function addPersonToAccessLevel(privilegeGroupId: string, personId: string): Promise<void> {
    await hikRequest('/artemis/api/acs/v1/privilege/group/single/addPersons', {
        privilegeGroupId,
        type: ACCESS_CONTROL_TYPE,
        list: [{ id: personId }],
    });
}

export async function removePersonFromAccessLevel(privilegeGroupId: string, personId: string): Promise<void> {
    await hikRequest('/artemis/api/acs/v1/privilege/group/single/deletePersons', {
        privilegeGroupId,
        type: ACCESS_CONTROL_TYPE,
        list: [{ id: personId }],
    });
}

// ===============================
// Applying to devices
// ===============================

const ERROR_ITEM_LABELS: Record<string, string> = {
    '0': 'Device exception',
    '1': 'Incorrect card information',
    '2': 'Incorrect fingerprint information',
    '3': 'Incorrect face information',
    '4': 'Incorrect person information',
};

interface ApplicationErrorData {
    applicationErrorResult?: { list?: { deviceName?: string; errorList?: { personName?: string; resourceName?: string; errorItems?: string }[] }[] };
}

interface ApplicationStatsData {
    statisticResult?: { unApplicationCount?: number; editAndUnApplicationCount?: number };
}

/**
 * Device-side failures reported for this person, plus the platform-wide pending count.
 * The platform only reports failures by person name, so a failure matches when every word of
 * the visitor's name appears in it (family / given name order differs between screens).
 */
export async function getApplicationStatus(personName: string): Promise<{ failures: AccessApplicationFailure[]; pendingCount: number | null }> {
    const errors = await hikRequest<ApplicationErrorData>('/artemis/api/acs/v1/auth/applicationResult', {
        applicationResultType: 2,
        pageNo: 1,
        pageSize: PAGE_SIZE,
        type: ACCESS_CONTROL_TYPE,
    });
    const words = personName.toLowerCase().split(/\s+/).filter(Boolean);
    const failures: AccessApplicationFailure[] = [];
    for (const device of errors?.applicationErrorResult?.list ?? []) {
        for (const e of device.errorList ?? []) {
            const reported = (e.personName ?? '').toLowerCase();
            if (words.length === 0 || !words.every((w) => reported.includes(w))) continue;
            failures.push({
                deviceName: text(device.deviceName),
                resourceName: text(e.resourceName),
                errorItems: text(e.errorItems).split(',').filter(Boolean).map((c) => ERROR_ITEM_LABELS[c.trim()] ?? c.trim()),
            });
        }
    }

    let pendingCount: number | null = null;
    try {
        const stats = await hikRequest<ApplicationStatsData>('/artemis/api/acs/v1/auth/applicationResult', {
            applicationResultType: 1,
            type: ACCESS_CONTROL_TYPE,
        });
        const s = stats?.statisticResult;
        if (s) pendingCount = (s.unApplicationCount ?? 0) + (s.editAndUnApplicationCount ?? 0);
    } catch {
        // counters are informative only
    }
    return { failures, pendingCount };
}
