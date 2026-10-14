'use client';

import type { CSSProperties, ReactNode } from 'react';
import type {
    CardBackground,
    CardBorderColor,
    CardCustomText,
    CardElementLayout,
    CardFooterColor,
    CardPresetSettings,
    CardTextAlign,
    CardTextTone,
    VisitorCardData,
} from '@/types/visitor-card.types';
import { resolveCardText } from '@/features/visitor/cards/utils/cardData';
import { cardFont } from '@/features/visitor/cards/utils/cardFont';
import CardQrCode from './CardQrCode';

const BORDER_CLASS: Record<CardBorderColor, string> = {
    red: 'border-mwk',
    black: 'border-black',
    gold: 'border-badge-gold',
    slate: 'border-slate-500',
    white: 'border-white',
};

const ACCENT_TEXT_CLASS: Record<CardBorderColor, string> = {
    red: 'text-mwk',
    black: 'text-gray-400',
    gold: 'text-badge-gold',
    slate: 'text-slate-400',
    white: 'text-gray-400',
};

const BACKGROUND_CLASS: Record<CardBackground, { card: string; text: string; muted: string }> = {
    dark: { card: 'bg-slate-800', text: 'text-white', muted: 'text-white/60' },
    black: { card: 'bg-black', text: 'text-white', muted: 'text-white/60' },
    white: { card: 'bg-white', text: 'text-gray-900', muted: 'text-gray-500' },
};

const FOOTER_CLASS: Record<CardFooterColor, string> = {
    red: 'bg-mwk text-white',
    black: 'bg-black text-white',
    gold: 'bg-badge-gold text-black',
    slate: 'bg-slate-600 text-white',
};

const ALIGN_CLASS: Record<CardTextAlign, { text: string; flex: string }> = {
    left: { text: 'text-left', flex: 'justify-start' },
    center: { text: 'text-center', flex: 'justify-center' },
    right: { text: 'text-right', flex: 'justify-end' },
};

/** Text classes of a custom text (font, alignment, weight, case, colour tone) - shared with the inline editor */
export function customTextClass(settings: CardPresetSettings, t: CardCustomText): string {
    const bg = BACKGROUND_CLASS[settings.style.background];
    const tone: Record<CardTextTone, string> = {
        primary: '',
        muted: bg.muted,
        accent: ACCENT_TEXT_CLASS[settings.style.borderColor],
    };
    // Every card text is Anton (single weight, set on the card root); "Headline" only spaces it wider
    const font = t.font === 'impact' ? 'font-normal tracking-wide leading-[1.05]' : 'font-normal tracking-[0.02em] leading-tight';
    return `${ALIGN_CLASS[t.align].text} ${font} ${t.uppercase ? 'uppercase' : ''} ${tone[t.tone]}`;
}

/** Box position / size in mm (data-driven, so it is applied as inline values) */
export function boxStyle(el: CardElementLayout): CSSProperties {
    return { left: `${el.x}mm`, top: `${el.y}mm`, width: `${el.w}mm`, height: `${el.h}mm` };
}

function mm(value: number): string {
    return `${Math.round(value * 100) / 100}mm`;
}

interface VisitorCardProps {
    card: VisitorCardData;
    settings: CardPresetSettings;
    /** Optional overlay rendered on top (used by the designer for drag handles) */
    overlay?: ReactNode;
    /** Custom text currently being typed in the designer (rendered by the editor instead) */
    hiddenCustomTextId?: string | null;
}

/**
 * Badge rendered at its physical size. Fixed elements (logo, QR, footer code) and the user's
 * custom texts are absolutely positioned in mm, so the screen preview, the designer and the
 * A4 print output are identical.
 */
export default function VisitorCard({ card, settings, overlay, hiddenCustomTextId }: VisitorCardProps) {
    const { size, style, elements, customTexts } = settings;
    const bg = BACKGROUND_CLASS[style.background];
    const f = card.fields;

    return (
        <div
            className={`visitor-card relative shrink-0 overflow-hidden ${cardFont.className} ${bg.card} ${bg.text}`}
            style={{ width: `${size.widthMm}mm`, height: `${size.heightMm}mm` }}
        >
            {/* Footer first so other elements can sit on top of it */}
            {elements.footer.visible && (
                <div
                    className={`absolute flex items-center px-[2mm] ${ALIGN_CLASS[elements.footer.align].flex} ${FOOTER_CLASS[style.footerColor]}`}
                    style={boxStyle(elements.footer)}
                >
                    <span className="truncate tracking-[0.06em]" style={{ fontSize: mm(elements.footer.fontSize) }}>
                        {f.cardCode || 'VISITOR'}
                    </span>
                </div>
            )}

            {elements.logo.visible && (
                <div className="absolute" style={boxStyle(elements.logo)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps print output identical to screen */}
                    <img src="/Milwaukee-logo-red.png" alt="Milwaukee Tool" className="h-full w-full object-contain" />
                </div>
            )}

            {elements.qr.visible && (
                <div
                    className="absolute rounded-[1mm] bg-white ring-1 ring-black/10"
                    style={{ ...boxStyle(elements.qr), padding: mm(elements.qr.w * 0.055) }}
                >
                    <CardQrCode value={f.qrValue} className="block h-full w-full" />
                </div>
            )}

            {customTexts.filter((t) => t.visible && t.text.trim() && t.id !== hiddenCustomTextId).map((t) => {
                const resolved = resolveCardText(t.text, f);
                // A text made only of empty fields (e.g. "Interviewer: {interviewerName}" on a vendor card) is hidden
                if (t.hideIfEmpty && resolved.allEmpty) return null;
                return (
                    <div key={t.id} className={`absolute flex items-center overflow-hidden ${ALIGN_CLASS[t.align].flex}`} style={boxStyle(t)}>
                        <p className={`w-full whitespace-pre-line break-words ${customTextClass(settings, t)}`} style={{ fontSize: mm(t.fontSize) }}>
                            {resolved.text}
                        </p>
                    </div>
                );
            })}

            {/* Frame drawn on top so it overlaps footer / edge elements like a printed border */}
            {style.borderWidthMm > 0 && (
                <div
                    className={`pointer-events-none absolute inset-0 border-solid ${BORDER_CLASS[style.borderColor]}`}
                    style={{ borderWidth: mm(style.borderWidthMm) }}
                />
            )}

            {overlay}
        </div>
    );
}
