/**
 * Visitor request category helpers (pure functions, shared by every visitor sub-domain).
 */

import type { CardRequestType } from '@/types/visitor-card.types';

/** Maps a stored visitor category to one of the three request types */
export function toCardRequestType(category: string | null | undefined): CardRequestType {
    const c = (category || '').toLowerCase();
    if (c === 'interviewee') return 'interviewee';
    if (c.includes('expat') || c.includes('business trip')) return 'expat';
    return 'vendor';
}

export const REQUEST_TYPE_LABELS: Record<CardRequestType, string> = {
    expat: 'MIL/TTI Expat / SHTP Business trip',
    vendor: 'Vendor / Contractor',
    interviewee: 'Interviewee',
};
