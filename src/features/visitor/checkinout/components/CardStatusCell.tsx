'use client';

import React from 'react';
import type { Visitor } from '@/types/visitor.types';
import { getCardIssueStatus } from '@/features/visitor/checkinout/utils/cardIssueStatus';

export interface CardStatusCellProps {
    visitor: Pick<Visitor, 'cardNumber' | 'cardPrintedAt'>;
    saving: boolean;
    /** Only Visitor admins and Receptionists can open the print page */
    canPrint: boolean;
    onIssue: () => void;
    onPrint: () => void;
    /** Visitor admins only: undo an issue. Without it the Issued button has no action. */
    onReverse?: () => void;
}

const BUTTON_CLASS = 'mx-auto block w-[104px] whitespace-nowrap rounded px-1 py-1.5 text-center text-[11px] font-bold transition-colors';
const PRINT_STATE_CLASS = 'text-[9px] font-medium';

/** One button per visitor: print the card first, then hand it out. Issued cards cannot be clicked again. */
export default function CardStatusCell({ visitor, saving, canPrint, onIssue, onPrint, onReverse }: CardStatusCellProps) {
    const status = getCardIssueStatus(visitor);

    if (status === 'issued') {
        const issued = (
            <button type="button" disabled title={visitor.cardNumber ?? undefined} className={`${BUTTON_CLASS} cursor-not-allowed bg-gray-200 text-gray-500`}>
                ISSUED
            </button>
        );
        if (!onReverse) return issued;
        return (
            // Same box as the other buttons, so every row lines up; the icon hangs outside on the right
            <div className="relative mx-auto w-[104px]">
                {issued}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Reverse this issue? The card goes back to "Printed, not issued".')) onReverse();
                    }}
                    disabled={saving}
                    title="Reverse issue (admin only)"
                    aria-label="Reverse issue"
                    className="absolute left-full top-1/2 ml-1 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        );
    }

    if (status === 'not_issued') {
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onIssue();
                }}
                disabled={saving}
                title="Card printed. Click when it is handed to the visitor."
                className={`${BUTTON_CLASS} cursor-pointer bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50`}
            >
                ISSUE <span className={PRINT_STATE_CLASS}>(Printed)</span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onPrint();
            }}
            disabled={!canPrint}
            title={canPrint ? 'Open the print page with every visitor of this request' : 'Card not printed yet. Only Visitor admins and Receptionists can print cards.'}
            className={`${BUTTON_CLASS} bg-mwk text-white ${canPrint ? 'cursor-pointer hover:bg-mwk-hover' : 'cursor-not-allowed opacity-50'}`}
        >
            ISSUE <span className={PRINT_STATE_CLASS}>(Not Printed)</span>
        </button>
    );
}
