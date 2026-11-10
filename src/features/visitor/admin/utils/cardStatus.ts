/**
 * Printed / assigned summary of a request in Admin Settings (pure functions).
 */

import type { VisitorAdminRequestRecord } from '@/types/visitor-admin.types';

export interface RequestCardStatus {
    total: number;
    printed: number;
    assigned: number;
    /** false: rejected or started before printing was recorded, so "not printed" would mean nothing */
    tracked: boolean;
    notPrintedNames: string[];
    assignedCardNos: string[];
}

function visitorNames(request: VisitorAdminRequestRecord): string[] {
    const fallback = request.visitor_name || request.interviewee_name || '';
    if (!request.visitors) return [fallback];
    try {
        const parsed: unknown = JSON.parse(request.visitors);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((v) => String((v as { name?: unknown } | null)?.name ?? '') || fallback);
        }
    } catch {
        // malformed list: count the request as one visitor
    }
    return [fallback];
}

export function getRequestCardStatus(request: VisitorAdminRequestRecord): RequestCardStatus {
    const names = visitorNames(request);
    const printedCodes = new Set(request.printed_codes ?? []);
    const assignedCards = request.assigned_cards ?? [];
    const requestCode = request.id.toUpperCase();
    const notPrintedNames = names.filter((_, index) => !printedCodes.has(`${requestCode}V${index + 1}`));

    return {
        total: names.length,
        printed: names.length - notPrintedNames.length,
        assigned: assignedCards.length,
        tracked: request.card_tracked ?? false,
        notPrintedNames,
        assignedCardNos: assignedCards.map((card) => card.card_no),
    };
}
