/**
 * HikCentral OpenAPI connectivity check (READ-ONLY).
 *
 * Signs requests with HIKCENTRAL_APP_KEY / HIKCENTRAL_APP_SECRET (HMAC-SHA256, see the OpenAPI
 * Developer Guide "Authentication") and lists organizations, access levels and doors.
 * Nothing is created, changed or deleted on HikCentral.
 *
 * Usage: node scripts/hikcentral_check.js
 */
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const https = require('https');

const BASE_URL = (process.env.HIKCENTRAL_BASE_URL || '').replace(/\/+$/, '');
const APP_KEY = process.env.HIKCENTRAL_APP_KEY || '';
const APP_SECRET = process.env.HIKCENTRAL_APP_SECRET || '';
const USER_ID = process.env.HIKCENTRAL_USER_ID || 'admin';

if (!BASE_URL || !APP_KEY || !APP_SECRET) {
    console.error('Missing HIKCENTRAL_BASE_URL / HIKCENTRAL_APP_KEY / HIKCENTRAL_APP_SECRET in .env.local');
    process.exit(1);
}

// HikCentral servers usually run a self-signed certificate; trust it for this host only
const agent = new https.Agent({ rejectUnauthorized: false });

function sign(method, path, accept, contentType, headers) {
    const signedNames = Object.keys(headers).sort();
    const lines = [method, accept, contentType, ...signedNames.map((n) => `${n}:${headers[n]}`), path];
    const signature = crypto.createHmac('sha256', APP_SECRET).update(lines.join('\n'), 'utf8').digest('base64');
    return { signature, signedNames: signedNames.join(',') };
}

function call(path, body) {
    const accept = 'application/json';
    const contentType = 'application/json;charset=UTF-8';
    const caHeaders = {
        'x-ca-key': APP_KEY,
        'x-ca-nonce': crypto.randomUUID(),
        'x-ca-timestamp': String(Date.now()),
    };
    const { signature, signedNames } = sign('POST', path, accept, contentType, caHeaders);
    const payload = JSON.stringify(body);
    const url = new URL(BASE_URL + path);

    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                agent,
                timeout: 15000,
                headers: {
                    Accept: accept,
                    'Content-Type': contentType,
                    'Content-Length': Buffer.byteLength(payload),
                    userId: USER_ID,
                    'X-Ca-Key': caHeaders['x-ca-key'],
                    'X-Ca-Nonce': caHeaders['x-ca-nonce'],
                    'X-Ca-Timestamp': caHeaders['x-ca-timestamp'],
                    'X-Ca-Signature': signature,
                    'X-Ca-Signature-Headers': signedNames,
                },
            },
            (res) => {
                let data = '';
                res.on('data', (c) => (data += c));
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, json: JSON.parse(data) });
                    } catch {
                        resolve({ status: res.statusCode, text: data.slice(0, 300) });
                    }
                });
            }
        );
        req.on('timeout', () => req.destroy(new Error('Request timed out after 15s')));
        req.on('error', reject);
        req.end(payload);
    });
}

function report(title, res, pick) {
    console.log(`\n=== ${title} (HTTP ${res.status})`);
    if (!res.json) return console.log('Non-JSON response:', res.text);
    console.log(`code=${res.json.code} msg=${res.json.msg}`);
    const list = res.json.data && Array.isArray(res.json.data.list) ? res.json.data.list : [];
    if (res.json.data && res.json.data.total !== undefined) console.log(`total=${res.json.data.total}`);
    list.forEach((item) => console.log('  -', pick(item)));
}

(async () => {
    console.log(`HikCentral: ${BASE_URL} (userId=${USER_ID})`);
    try {
        report('Organizations', await call('/artemis/api/resource/v1/org/orgList', { pageNo: 1, pageSize: 100 }),
            (o) => `${o.orgIndexCode} | ${o.orgName} | parent=${o.parentOrgIndexCode ?? ''}`);
        report('Access levels (type 1 = access control)', await call('/artemis/api/acs/v1/privilege/group', { pageNo: 1, pageSize: 100, type: 1 }),
            (g) => `${g.privilegeGroupId} | ${g.privilegeGroupName} | schedule=${g.timeSchedule ? g.timeSchedule.indexCode : ''}`);
        report('Doors', await call('/artemis/api/resource/v1/acsDoor/acsDoorList', { pageNo: 1, pageSize: 100 }),
            (d) => `${d.acsDoorIndexCode ?? d.indexCode} | ${d.acsDoorName ?? d.name}`);
    } catch (err) {
        console.error('\nConnection failed:', err.message);
        process.exit(1);
    }
})();
