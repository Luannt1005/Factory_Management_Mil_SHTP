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
}

const BUTTON_CLASS = 'mx-auto block w-[104px] whitespace-nowrap rounded px-1 py-1.5 text-center text-[11px] font-bold transition-colors';
const PRINT_STATE_CLASS = 'text-[9px] font-medium';

/** One button per visitor: print the card first, then hand it out. Issued cards cannot be clicked again. */
export default function CardStatusCell({ visitor, saving, canPrint, onIssue, onPrint }: CardStatusCellProps) {
    const status = getCardIssueStatus(visitor);

    if (status === 'issued') {
        return (
            <button type="button" disabled title={visitor.cardNumber ?? undefined} className={`${BUTTON_CLASS} cursor-not-allowed bg-gray-200 text-gray-500`}>
                ISSUED
            </button>
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
