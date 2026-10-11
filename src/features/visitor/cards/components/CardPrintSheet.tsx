'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CardPresetSettings, VisitorCardData } from '@/types/visitor-card.types';
import { computeSheetGrid, paginateCards } from '@/features/visitor/cards/utils/cardData';
import VisitorCard from './VisitorCard';

/**
 * Print-only stylesheet. Mounted only while the studio is open, so other pages keep their
 * normal print behaviour. Everything except the sheet is hidden; @page removes browser margins
 * so millimetre positions match the paper exactly.
 */
const PRINT_CSS = `
@media screen {
  .card-print-root { display: none; }
}
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body > *:not(.card-print-root) { display: none !important; }
  .card-print-root { display: block; }
  .card-print-page { break-after: page; page-break-after: always; }
  .card-print-page:last-child { break-after: auto; page-break-after: auto; }
  .card-print-root, .card-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

interface CardPrintSheetProps {
    cards: VisitorCardData[];
    settings: CardPresetSettings;
}

export default function CardPrintSheet({ cards, settings }: CardPrintSheetProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const { widthMm, heightMm } = settings.size;
    const { cols, rows, perPage, offsetX, offsetY } = computeSheetGrid(settings.size);
    const pages = paginateCards(cards, perPage);

    // Cut guides run edge-to-edge so a paper trimmer can be aligned on the margin marks
    const verticalCuts = Array.from({ length: cols + 1 }, (_, i) => offsetX + i * widthMm);
    const horizontalCuts = Array.from({ length: rows + 1 }, (_, i) => offsetY + i * heightMm);

    return createPortal(
        <div className="card-print-root">
            <style>{PRINT_CSS}</style>
            {pages.map((pageCards, pageIndex) => (
                <div key={pageIndex} className="card-print-page relative h-[297mm] w-[210mm] overflow-hidden bg-white">
                    {/* Positions are computed in mm from the layout, so they are applied as inline values */}
                    {verticalCuts.map((x) => (
                        <div key={`v-${x}`} className="absolute top-0 h-full border-l-[0.2mm] border-dashed border-gray-400" style={{ left: `${x}mm` }} />
                    ))}
                    {horizontalCuts.map((y) => (
                        <div key={`h-${y}`} className="absolute left-0 w-full border-t-[0.2mm] border-dashed border-gray-400" style={{ top: `${y}mm` }} />
                    ))}

                    <div
                        className="absolute grid"
                        style={{
                            left: `${offsetX}mm`,
                            top: `${offsetY}mm`,
                            gridTemplateColumns: `repeat(${cols}, ${widthMm}mm)`,
                            gridAutoRows: `${heightMm}mm`,
                        }}
                    >
                        {pageCards.map((card) => (
                            <VisitorCard key={card.id} card={card} settings={settings} />
                        ))}
                    </div>
                </div>
            ))}
        </div>,
        document.body
    );
}
