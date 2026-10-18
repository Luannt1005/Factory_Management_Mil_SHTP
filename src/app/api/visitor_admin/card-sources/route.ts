export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { hasPageAccess } from '@/lib/auth-server';
import { canPrintVisitorCards } from '@/utils/visitorRoles';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { completeCardFields, toCardRequestType } from '@/features/visitor/cards/utils/cardFields';
import type { CardFields, CardSourceRecord } from '@/types/visitor-card.types';

/**
 * GET /api/visitor_admin/card-sources?code=V06102623 | V06102623V2 | A07102601
 *
 * Returns one card per visitor with the complete card field set for all three request types
 * (Expat / Business trip, Vendor / Contractor, Interviewee). Fields a request type does not
 * have are returned as ''. Read-only; used by the Visitor Card Studio (/visitoradmin/cards).
 */

const MAX_CODE_LENGTH = 60;
const PREFIX_SEARCH_LIMIT = 10;

interface VisitorRequestRow {
    id: string;
    visitorName: string | null;
    visitorTitle: string | null;
    currentCompany: string | null;
    startDate: Date | string | null;
    endDate: Date | string | null;
    purposeOfVisit: string | null;
    purposeDetail: string | null;
    visitorCategory: string | null;
    visitingSite: string | null;
    status: string | null;
    details: string | null;
    visitors: string | null;
    submitter_name: string | null;
    submitter_email: string | null;
    submitter_department: string | null;
}

interface IntervieweeRequestRow {
    id: string;
    visitorCode: string;
    osName: string | null;
    intervieweeName: string | null;
    jobTitle: string | null;
    interviewDepartment: string | null;
    interviewerName: string | null;
    startDate: Date | string | null;
    startTime: string | null;
    interviewArea: string | null;
    status: string | null;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function str(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

/** Date / timestamp -> "YYYY-MM-DD" in the server's local time zone (factory server = Vietnam time) */
function toDateKey(value: Date | string | null | undefined): string {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function buildVisitorRequestCards(
    row: VisitorRequestRow,
    onlyVisitorIndex: number | null,
    cardNumbers: Map<string, string>,
    approvedAreas: Map<string, string>
): CardSourceRecord[] {
    const details = parseJson(row.details);
    const d: JsonRecord = isRecord(details) ? details : {};
    const parsedVisitors = parseJson(row.visitors);
    let visitors: JsonRecord[] = Array.isArray(parsedVisitors) ? parsedVisitors.filter(isRecord) : [];
    if (visitors.length === 0) {
        visitors = [{ name: row.visitorName, title: row.visitorTitle, company: row.currentCompany }];
    }

    const requestCode = str(row.id).toUpperCase();
    const requestType = toCardRequestType(row.visitorCategory);
    const dateFrom = toDateKey(row.startDate);

    const requestFields: Partial<CardFields> = {
        requestCode,
        category: str(row.visitorCategory),
        status: str(row.status),
        visitingSite: str(row.visitingSite),
        purposeOfVisit: str(row.purposeOfVisit),
        purposeDetail: str(row.purposeDetail) || str(d.purposeDetail),
        dateFrom,
        dateTo: toDateKey(row.endDate) || dateFrom,
        startTime: str(d.startTime),
        interviewArea: str(d.interviewArea) || (requestType === 'interviewee' ? str(row.purposeDetail) : ''),
        submitterName: str(row.submitter_name),
        submitterDepartment: str(row.submitter_department),
        submitterEmail: str(row.submitter_email),
        hostBu: str(d.bu),
        hostFunctionalDept: str(d.functionalDept),
        hostDepartment: str(d.department),
        rooms: approvedAreas.get(str(row.id)) ?? '',
        costCenter: str(d.costCenter),
        factoryTour: str(d.factoryTour),
        mealRegistration: str(d.mealRegistration),
    };

    return visitors
        .map((v, index) => ({ v, index }))
        .filter(({ index }) => onlyVisitorIndex === null || index === onlyVisitorIndex)
        .map(({ v, index }) => {
            const cardCode = `${requestCode}V${index + 1}`;
            return {
                requestType,
                fields: completeCardFields({
                    ...requestFields,
                    visitorName: str(v.name) || (index === 0 ? str(row.visitorName) : ''),
                    visitorTitle: str(v.title) || str(v.jobTitle),
                    visitorCompany: str(v.company),
                    interviewDepartment: str(v.interviewDepartment),
                    interviewerName: str(v.interviewerName),
                    cardCode,
                    cardNumber: cardNumbers.get(`${row.id}:${index}`) ?? '',
                    qrValue: cardCode,
                }),
            };
        });
}

function buildIntervieweeCard(row: IntervieweeRequestRow, cardNumbers: Map<string, string>): CardSourceRecord {
    const cardCode = str(row.visitorCode).toUpperCase();
    const date = toDateKey(row.startDate);
    return {
        requestType: 'interviewee',
        fields: completeCardFields({
            visitorName: str(row.intervieweeName),
            visitorTitle: str(row.jobTitle),
            visitorCompany: str(row.interviewDepartment) || 'Candidate',
            cardCode,
            cardNumber: cardNumbers.get(`${row.id}:0`) ?? '',
            interviewDepartment: str(row.interviewDepartment),
            interviewerName: str(row.interviewerName),
            requestCode: cardCode,
            category: 'Interviewee',
            status: str(row.status),
            visitingSite: str(row.interviewArea),
            purposeOfVisit: row.jobTitle ? `Interview for ${str(row.jobTitle)}` : 'Interview',
            purposeDetail: str(row.interviewDepartment) || str(row.interviewArea),
            dateFrom: date,
            dateTo: date,
            startTime: str(row.startTime),
            interviewArea: str(row.interviewArea),
            submitterName: str(row.osName) || 'HR / TA',
            submitterDepartment: 'HR / Talent Acquisition',
            qrValue: cardCode,
        }),
    };
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Card lookups serve the Print Cards tab: Visitor admins and Receptionists
    if (!canPrintVisitorCards(session.user) || !(await hasPageAccess('/visitoradmin'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rawCode = new URL(request.url).searchParams.get('code') || '';
    const code = rawCode.trim().replace(/^#/, '').toUpperCase();
    if (!code || code.length > MAX_CODE_LENGTH) {
        return NextResponse.json({ error: 'A request or visitor code is required' }, { status: 400 });
    }

    // "V06102623V2" = request V06102623, visitor #2
    const visitorMatch = /^(.+)V(\d+)$/.exec(code);
    const baseCode = visitorMatch ? visitorMatch[1] : null;
    const visitorIndex = visitorMatch ? parseInt(visitorMatch[2], 10) - 1 : null;

    try {
        const pool = await getVisitorDbConnection();

        const visitorRequestSelect = `
            SELECT r.id::text AS id, r."visitorName", r."visitorTitle", r."currentCompany",
                   r."startDate", r."endDate", r."purposeOfVisit", r."purposeDetail",
                   r."visitorCategory", r."visitingSite", r.status,
                   r.details::text AS details, r.visitors::text AS visitors,
                   u.name AS submitter_name, u.email AS submitter_email, u.department AS submitter_department
            FROM "VisitorRequest" r
            LEFT JOIN "User" u ON u.id = r."submitterId"`;
        const intervieweeSelect = `
            SELECT id::text AS id, "visitorCode", "osName", "intervieweeName", "jobTitle", "interviewDepartment",
                   "interviewerName", "startDate", "startTime", "interviewArea", status
            FROM "IntervieweeRequest"`;

        // 1. Exact match on request id / visitor code / interviewee code
        const exactCodes = baseCode ? [code, baseCode] : [code];
        let { rows: vrRows } = await pool.query<VisitorRequestRow>(
            `${visitorRequestSelect} WHERE UPPER(r.id::text) = ANY($1::text[])`,
            [exactCodes]
        );
        let { rows: irRows } = await pool.query<IntervieweeRequestRow>(
            `${intervieweeSelect} WHERE UPPER("visitorCode") = $1`,
            [code]
        );

        // 2. Otherwise a prefix search (e.g. a partially typed code)
        if (vrRows.length === 0 && irRows.length === 0) {
            const pattern = `${escapeLike(code)}%`;
            ({ rows: vrRows } = await pool.query<VisitorRequestRow>(
                `${visitorRequestSelect} WHERE r.id::text ILIKE $1 ORDER BY r."createdAt" DESC LIMIT ${PREFIX_SEARCH_LIMIT}`,
                [pattern]
            ));
            ({ rows: irRows } = await pool.query<IntervieweeRequestRow>(
                `${intervieweeSelect} WHERE "visitorCode" ILIKE $1 ORDER BY "createdAt" DESC LIMIT ${PREFIX_SEARCH_LIMIT}`,
                [pattern]
            ));
        }

        const requestIds = [...vrRows.map((r) => r.id), ...irRows.map((r) => r.id)];
        const cardNumbers = new Map<string, string>();
        const approvedAreas = new Map<string, string>();

        if (requestIds.length > 0) {
            const { rows: checkRows } = await pool.query<{ requestId: string; visitorIndex: number; cardNumber: string | null }>(
                `SELECT "requestId", "visitorIndex", "cardNumber" FROM "VisitorCheckInOut"
                 WHERE "requestId" = ANY($1::text[]) AND "cardNumber" IS NOT NULL`,
                [requestIds]
            );
            checkRows.forEach((c) => cardNumbers.set(`${c.requestId}:${c.visitorIndex}`, str(c.cardNumber)));

            if (vrRows.length > 0) {
                const { rows: areaRows } = await pool.query<{ requestId: string; areas: string | null }>(
                    `SELECT ra."requestId", string_agg(DISTINCT rm.name, ', ' ORDER BY rm.name) AS areas
                     FROM "RequestApproval" ra
                     JOIN "RoomArea" rm ON rm.id = ra."roomAreaId"
                     WHERE ra."requestId" = ANY($1::text[]) AND ra.status = 'APPROVED'
                     GROUP BY ra."requestId"`,
                    [vrRows.map((r) => r.id)]
                );
                areaRows.forEach((a) => approvedAreas.set(a.requestId, str(a.areas)));
            }
        }

        const cards: CardSourceRecord[] = [
            ...vrRows.flatMap((row) => {
                // Only narrow to one visitor when the code was "<request>V<n>" (not the request itself)
                const narrow = baseCode !== null && row.id.toUpperCase() === baseCode && row.id.toUpperCase() !== code;
                return buildVisitorRequestCards(row, narrow ? visitorIndex : null, cardNumbers, approvedAreas);
            }),
            ...irRows.map((row) => buildIntervieweeCard(row, cardNumbers)),
        ];

        return NextResponse.json({ cards }, { status: 200 });
    } catch (err) {
        console.error('[card-sources] GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
