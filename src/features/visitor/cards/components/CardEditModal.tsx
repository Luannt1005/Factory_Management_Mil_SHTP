'use client';

import { useEffect, useState } from 'react';
import type { CardFieldKey, CardPresetSettings, VisitorCardData } from '@/types/visitor-card.types';
import {
    CARD_FIELD_DEFS,
    CARD_FIELD_GROUPS,
    CARD_REQUEST_TYPE_LABELS,
    toCardRequestType,
} from '@/features/visitor/cards/utils/cardFields';
import { withFields } from '@/features/visitor/cards/utils/cardData';
import StudioModal, { studioInputClass, studioPrimaryButtonClass, studioSecondaryButtonClass } from './StudioModal';
import VisitorCard from './VisitorCard';

interface CardEditModalProps {
    card: VisitorCardData | null;
    settings: CardPresetSettings;
    onSave: (card: VisitorCardData) => void;
    onClose: () => void;
}

/** Edits the data of one card only (layout and colours come from the active setting) */
export default function CardEditModal({ card, settings, onSave, onClose }: CardEditModalProps) {
    const [draft, setDraft] = useState<VisitorCardData | null>(card);
    const [qrFollowsCode, setQrFollowsCode] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        setDraft(card);
        setQrFollowsCode(!card || card.fields.qrValue === card.fields.cardCode);
        setShowAll(false);
    }, [card]);

    if (!card || !draft) return null;

    const requestType = toCardRequestType(draft.fields.category);

    const update = (key: CardFieldKey, value: string) => {
        setDraft((prev) => {
            if (!prev) return prev;
            const patch: Partial<Record<CardFieldKey, string>> = { [key]: value };
            // Keep the QR in sync with the visitor code unless the QR was customised
            if (key === 'cardCode' && qrFollowsCode) patch.qrValue = value;
            return withFields(prev, patch);
        });
        if (key === 'qrValue') setQrFollowsCode(false);
    };

    const visibleDefs = CARD_FIELD_DEFS.filter((d) => showAll || d.appliesTo.includes(requestType) || draft.fields[d.key]);

    return (
        <StudioModal
            open
            eyebrow="Edit card data"
            title={draft.fields.visitorName || 'Visitor card'}
            onClose={onClose}
            maxWidthClass="max-w-5xl"
            footer={
                <>
                    <button type="button" className={studioSecondaryButtonClass} onClick={onClose}>Cancel</button>
                    <button type="button" className={studioPrimaryButtonClass} onClick={() => onSave(draft)}>Apply to this card</button>
                </>
            }
        >
            <div className="flex flex-col gap-6 md:flex-row">
                <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <span className="text-xs text-gray-500">
                            Request type <span className="font-bold text-gray-900">{CARD_REQUEST_TYPE_LABELS[requestType]}</span>
                        </span>
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600">
                            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-mwk" />
                            Show all fields
                        </label>
                    </div>

                    <div className="space-y-4">
                        {CARD_FIELD_GROUPS.map((group) => {
                            const defs = visibleDefs.filter((d) => d.group === group);
                            if (defs.length === 0) return null;
                            return (
                                <fieldset key={group}>
                                    <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">{group}</legend>
                                    <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
                                        {defs.map((def) => {
                                            const notApplicable = !def.appliesTo.includes(requestType);
                                            return (
                                                <label key={def.key} className="block min-w-0">
                                                    <span className="mb-0.5 flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-gray-500">
                                                        {def.label}
                                                        <code className="font-mono text-[10px] font-normal text-gray-300">{`{${def.key}}`}</code>
                                                    </span>
                                                    <input
                                                        type={def.input === 'date' ? 'date' : 'text'}
                                                        value={draft.fields[def.key]}
                                                        onChange={(e) => update(def.key, def.key === 'cardCode' ? e.target.value.toUpperCase() : e.target.value)}
                                                        placeholder={notApplicable ? 'Not used by this request type' : ''}
                                                        className={`${studioInputClass} py-1.5 text-[13px]`}
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                        Empty fields print nothing. QR content follows the visitor code unless you change it. Changes apply to this card only.
                    </p>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-2 md:sticky md:top-0 md:self-start">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Preview</span>
                    <VisitorCard card={draft} settings={settings} />
                </div>
            </div>
        </StudioModal>
    );
}
