/**
 * Visitor card content helpers (pure functions).
 */

import type { CardFields, CardPresetScope, CardRequestType, CardSize, CardSourceRecord, VisitorCardData } from '@/types/visitor-card.types';
import { completeCardFields } from './cardFields';

export { formatCardDate, formatCardDateRange, resolveCardText } from './cardFields';

/** A4 portrait */
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
/** Minimum white margin kept around the card grid (most office printers cannot print to the edge) */
export const PAGE_MARGIN_MM = 5;

export interface SheetGrid {
    cols: number;
    rows: number;
    perPage: number;
    offsetX: number;
    offsetY: number;
}

/** How many cards of this size fit on one A4 page (grid centred, cards touching so one cut serves two cards) */
export function computeSheetGrid(size: CardSize): SheetGrid {
    const usableW = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
    const usableH = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
    const cols = Math.max(1, Math.floor(usableW / size.widthMm));
    const rows = Math.max(1, Math.floor(usableH / size.heightMm));
    return {
        cols,
        rows,
        perPage: cols * rows,
        offsetX: (PAGE_WIDTH_MM - cols * size.widthMm) / 2,
        offsetY: (PAGE_HEIGHT_MM - rows * size.heightMm) / 2,
    };
}

/** Sample content per request category, shown in the designer when no matching card is loaded */
export const SAMPLE_CARDS: Record<CardRequestType, VisitorCardData> = {
    vendor: {
        id: 'sample-vendor',
        fields: completeCardFields({
            visitorName: 'Nguyen Van An',
            visitorTitle: 'Technician',
            visitorCompany: 'Dong Sai Gon Co., Ltd',
            cardCode: 'V06102623V1',
            cardNumber: '015',
            requestCode: 'V06102623',
            category: 'Vendor',
            status: 'COMPLETE',
            visitingSite: 'SHTP',
            purposeOfVisit: 'Business / Meeting',
            purposeDetail: 'Survey the annual health check area',
            dateFrom: '2026-10-06',
            dateTo: '2026-10-14',
            submitterName: 'Bao Nguyen',
            submitterDepartment: 'EHS',
            submitterEmail: 'bao.nguyen@ttigroup.com.vn',
            qrValue: 'V06102623V1',
        }),
    },
    expat: {
        id: 'sample-expat',
        fields: completeCardFields({
            visitorName: 'John Carter',
            visitorTitle: 'Quality Director',
            visitorCompany: 'Milwaukee Tool US',
            cardCode: 'E06102601V1',
            cardNumber: '102',
            requestCode: 'E06102601',
            category: 'MIL/TTI Expat / SHTP Business trip',
            status: 'COMPLETE',
            visitingSite: 'SHTP/DDK',
            purposeOfVisit: 'Business trip',
            purposeDetail: 'Quarterly quality review',
            dateFrom: '2026-10-06',
            dateTo: '2026-10-10',
            submitterName: 'Linh Tran',
            submitterDepartment: 'Quality',
            submitterEmail: 'linh.tran@ttigroup.com.vn',
            hostBu: 'MIL',
            hostFunctionalDept: 'Operations',
            hostDepartment: 'Quality Assurance',
            rooms: 'Assembly Line 1, QA Lab',
            costCenter: 'CC-4102',
            factoryTour: 'Yes',
            mealRegistration: 'Yes',
            qrValue: 'E06102601V1',
        }),
    },
    interviewee: {
        id: 'sample-interviewee',
        fields: completeCardFields({
            visitorName: 'Le Thi Mai',
            visitorTitle: 'Process Engineer',
            visitorCompany: 'Engineering',
            cardCode: 'A07102601V1',
            requestCode: 'A07102601',
            category: 'Interviewee',
            status: 'COMPLETE',
            visitingSite: 'SHTP',
            purposeOfVisit: 'Interview',
            purposeDetail: 'Meeting room 2',
            dateFrom: '2026-10-07',
            dateTo: '2026-10-07',
            startTime: '09:30',
            interviewArea: 'Meeting room 2',
            interviewDepartment: 'Engineering',
            interviewerName: 'Tran Minh Quan',
            submitterName: 'HR / TA',
            submitterDepartment: 'HR / Talent Acquisition',
            qrValue: 'A07102601V1',
        }),
    },
};

/** Default sample (universal templates) */
export const SAMPLE_CARD: VisitorCardData = SAMPLE_CARDS.vendor;

export function sampleCardFor(scope: CardPresetScope): VisitorCardData {
    return scope === 'all' ? SAMPLE_CARD : SAMPLE_CARDS[scope];
}

function newCardId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** ISO / timestamp -> "YYYY-MM-DD" in local time (value of <input type="date">) */
export function toInputDate(value?: string | null): string {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Card from an API source record (fields are completed so nothing is null / undefined) */
export function sourceToCard(source: CardSourceRecord): VisitorCardData {
    const fields = completeCardFields(source.fields);
    fields.dateFrom = toInputDate(fields.dateFrom);
    fields.dateTo = toInputDate(fields.dateTo) || fields.dateFrom;
    if (!fields.qrValue) fields.qrValue = fields.cardCode;
    return { id: newCardId(), fields };
}

export function createBlankCard(category = 'Visitor'): VisitorCardData {
    const today = toInputDate(new Date().toISOString());
    return {
        id: newCardId(),
        fields: completeCardFields({ visitorName: 'VISITOR NAME', category, dateFrom: today, dateTo: today }),
    };
}

/** Returns a copy of the card with some fields replaced */
export function withFields(card: VisitorCardData, patch: Partial<CardFields>): VisitorCardData {
    return { ...card, fields: completeCardFields({ ...card.fields, ...patch }) };
}

/** Splits cards into pages of perPage cards */
export function paginateCards<T>(cards: T[], perPage: number): T[][] {
    const size = Math.max(1, perPage);
    const pages: T[][] = [];
    for (let i = 0; i < cards.length; i += size) {
        pages.push(cards.slice(i, i + size));
    }
    return pages;
}
