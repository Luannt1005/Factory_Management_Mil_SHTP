/**
 * Room approval rules (pure functions, shared by the API routes and the registration form).
 *
 * "approverEmail" of a room holds one or more addresses separated by ";".
 * - send_all: the request goes to everyone in that list.
 * - selected: the submitter picks the one person who receives it from that list.
 */

import type { RoomApprovalMode } from '@/types/rooms.types';

export const ROOM_APPROVAL_MODES: readonly RoomApprovalMode[] = ['send_all', 'selected'];

export const ROOM_APPROVAL_MODE_LABELS: Record<RoomApprovalMode, string> = {
    send_all: 'Send all',
    selected: 'Selected',
};

export function isRoomApprovalMode(value: unknown): value is RoomApprovalMode {
    return typeof value === 'string' && (ROOM_APPROVAL_MODES as readonly string[]).includes(value);
}

/** Addresses of an approver cell, without blanks and duplicates (spelling kept as stored) */
export function parseApproverEmails(value: string | null | undefined): string[] {
    const seen = new Set<string>();
    return (value ?? '')
        .split(/[;,]/)
        .map((email) => email.trim())
        .filter((email) => {
            const key = email.toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

/** The submitter only has to choose when a "selected" room has more than one approver */
export function needsApproverChoice(mode: string | null | undefined, approverEmail: string | null | undefined): boolean {
    return mode === 'selected' && parseApproverEmails(approverEmail).length > 1;
}

/**
 * Approver value stored and sent for a room. Rooms without a choice keep their cell unchanged.
 * Only one address of the room's own list is accepted; returns null otherwise.
 */
export function resolveRoomApprover(mode: string | null | undefined, approverEmail: string | null | undefined, chosen: unknown): string | null {
    if (!needsApproverChoice(mode, approverEmail)) return approverEmail ?? null;
    if (typeof chosen !== 'string') return null;
    const picked = chosen.trim().toLowerCase();
    return parseApproverEmails(approverEmail).find((email) => email.toLowerCase() === picked) ?? null;
}
