'use client';

import { useEffect, useState } from 'react';
import type { CardBulkEditPayload } from '@/types/visitor-card.types';
import StudioModal, { studioInputClass, studioLabelClass, studioPrimaryButtonClass, studioSecondaryButtonClass } from './StudioModal';

interface CardBulkEditModalProps {
    open: boolean;
    cardCount: number;
    onApply: (payload: CardBulkEditPayload) => void;
    onClose: () => void;
}

/** Changes validity dates, company and/or site on every card; empty fields are left untouched */
export default function CardBulkEditModal({ open, cardCount, onApply, onClose }: CardBulkEditModalProps) {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [company, setCompany] = useState('');
    const [site, setSite] = useState('');

    useEffect(() => {
        if (open) {
            setDateFrom('');
            setDateTo('');
            setCompany('');
            setSite('');
        }
    }, [open]);

    const hasChanges = Boolean(dateFrom || dateTo || company.trim() || site.trim());

    const handleApply = () => {
        const payload: CardBulkEditPayload = {};
        if (dateFrom) payload.dateFrom = dateFrom;
        if (dateTo) payload.dateTo = dateTo;
        if (company.trim()) payload.visitorCompany = company.trim();
        if (site.trim()) payload.visitingSite = site.trim();
        onApply(payload);
    };

    return (
        <StudioModal
            open={open}
            eyebrow="Bulk edit"
            title={`Update ${cardCount} card${cardCount === 1 ? '' : 's'}`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className={studioSecondaryButtonClass} onClick={onClose}>Cancel</button>
                    <button type="button" className={studioPrimaryButtonClass} onClick={handleApply} disabled={!hasChanges}>Apply to all cards</button>
                </>
            }
        >
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="bulk-from" className={studioLabelClass}>Valid from</label>
                    <input id="bulk-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={studioInputClass} />
                </div>
                <div>
                    <label htmlFor="bulk-to" className={studioLabelClass}>Valid to</label>
                    <input id="bulk-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={studioInputClass} />
                </div>
                <div className="col-span-2">
                    <label htmlFor="bulk-company" className={studioLabelClass}>Company</label>
                    <input id="bulk-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Leave empty to keep each card's company" className={studioInputClass} />
                </div>
                <div className="col-span-2">
                    <label htmlFor="bulk-site" className={studioLabelClass}>Visiting site</label>
                    <input id="bulk-site" value={site} onChange={(e) => setSite(e.target.value)} placeholder="e.g. SHTP, DDK" className={studioInputClass} />
                </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">Only the fields you fill in are changed. Each card keeps its own name and code.</p>
        </StudioModal>
    );
}
