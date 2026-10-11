'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface StudioModalProps {
    open: boolean;
    title: string;
    eyebrow?: string;
    onClose: () => void;
    children: ReactNode;
    footer: ReactNode;
    maxWidthClass?: string;
}

/** Shared modal shell for the card studio (same look as the visitor detail modal) */
export default function StudioModal({ open, title, eyebrow, onClose, children, footer, maxWidthClass = 'max-w-md' }: StudioModalProps) {
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="studio-modal-title"
                className={`flex max-h-full w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border-t-[8px] border-t-mwk bg-white text-gray-900 shadow-2xl animate-in zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-2 pt-5">
                    <div className="min-w-0">
                        {eyebrow && <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{eyebrow}</p>}
                        <h2 id="studio-modal-title" className="mt-1 truncate text-base font-extrabold tracking-tight">{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-3">{children}</div>
                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">{footer}</div>
            </div>
        </div>,
        document.body
    );
}

export const studioInputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-mwk';

export const studioLabelClass = 'mb-1 block text-xs font-bold text-gray-500';

export const studioPrimaryButtonClass =
    'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-mwk px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-mwk-hover disabled:cursor-not-allowed disabled:opacity-50';

export const studioSecondaryButtonClass =
    'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';
