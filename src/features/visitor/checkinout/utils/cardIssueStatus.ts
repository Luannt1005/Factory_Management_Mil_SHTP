/**
 * Card state of a visitor at the gate (pure function). Every visitor is in exactly one state:
 * any saved card value counts as handed out, whether it came from "Phát" or was typed by hand.
 */

import type { Visitor } from '@/types/visitor.types';

export type CardIssueStatus = 'issued' | 'not_issued' | 'not_printed';

export function getCardIssueStatus(visitor: Pick<Visitor, 'cardNumber' | 'cardPrintedAt'>): CardIssueStatus {
    if ((visitor.cardNumber ?? '').trim() !== '') return 'issued';
    return visitor.cardPrintedAt ? 'not_issued' : 'not_printed';
}
