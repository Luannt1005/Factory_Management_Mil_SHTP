/**
 * Card template settings: defaults, validation and layout helpers.
 * Pure module (no React / browser APIs) so it is shared by the API route and the studio UI.
 *
 * A template has three fixed layout elements (logo, QR code, footer code); every piece of
 * visitor information is added by the user as custom text with {field} placeholders.
 */

import type {
    CardBackground,
    CardBorderColor,
    CardCustomText,
    CardElementKey,
    CardElementLayout,
    CardFooterColor,
    CardPresetScope,
    CardPresetSettings,
    CardSize,
    CardTextAlign,
    CardTextFont,
    CardTextTone,
} from '@/types/visitor-card.types';

export const BORDER_COLORS: readonly CardBorderColor[] = ['red', 'black', 'gold', 'slate', 'white'];
export const BACKGROUNDS: readonly CardBackground[] = ['dark', 'black', 'white'];
export const FOOTER_COLORS: readonly CardFooterColor[] = ['red', 'black', 'gold', 'slate'];
export const TEXT_ALIGNS: readonly CardTextAlign[] = ['left', 'center', 'right'];
export const TEXT_TONES: readonly CardTextTone[] = ['primary', 'muted', 'accent'];
export const TEXT_FONTS: readonly CardTextFont[] = ['standard', 'impact'];
export const PRESET_SCOPES: readonly CardPresetScope[] = ['all', 'expat', 'vendor', 'interviewee'];

export const CARD_ELEMENT_KEYS: readonly CardElementKey[] = ['logo', 'qr', 'footer'];

export const CARD_ELEMENT_LABELS: Record<CardElementKey, string> = {
    logo: 'Milwaukee logo',
    qr: 'QR code',
    footer: 'Footer card code',
};

/** Elements without text (font size / alignment do not apply) */
export const NON_TEXT_ELEMENTS: readonly CardElementKey[] = ['logo', 'qr'];

export const PRESET_NAME_MAX_LENGTH = 120;
export const CARD_SIZE_LIMITS = { min: 25, max: 150 } as const;
export const FONT_SIZE_LIMITS = { min: 1, max: 20 } as const;
export const MIN_ELEMENT_SIZE_MM = 2;
export const MAX_CUSTOM_TEXTS = 20;
export const CUSTOM_TEXT_MAX_LENGTH = 200;

/** Common badge sizes; any custom size within CARD_SIZE_LIMITS is also allowed */
export const CARD_SIZE_PRESETS: { label: string; size: CardSize }[] = [
    { label: 'CR80 portrait (54 × 86 mm)', size: { widthMm: 54, heightMm: 86 } },
    { label: 'CR80 landscape (86 × 54 mm)', size: { widthMm: 86, heightMm: 54 } },
    { label: 'Large badge (70 × 100 mm)', size: { widthMm: 70, heightMm: 100 } },
    { label: 'A7 (74 × 105 mm)', size: { widthMm: 74, heightMm: 105 } },
];

/** Layout of the fixed elements on a 54 × 86 mm badge */
const DEFAULT_ELEMENTS: Record<CardElementKey, CardElementLayout> = {
    logo: { visible: true, x: 13.5, y: 4, w: 27, h: 9, fontSize: 3, align: 'center' },
    qr: { visible: true, x: 32, y: 51, w: 18.5, h: 18.5, fontSize: 3, align: 'center' },
    footer: { visible: true, x: 0, y: 76, w: 54, h: 10, fontSize: 5, align: 'center' },
};

/** Settings of a brand-new (unsaved) template */
export const DEFAULT_CARD_SETTINGS: CardPresetSettings = {
    version: 2,
    requestType: 'all',
    size: { widthMm: 54, heightMm: 86 },
    style: { borderColor: 'red', borderWidthMm: 1.2, background: 'dark', footerColor: 'red' },
    elements: {
        logo: { ...DEFAULT_ELEMENTS.logo },
        qr: { ...DEFAULT_ELEMENTS.qr },
        footer: { ...DEFAULT_ELEMENTS.footer },
    },
    customTexts: [],
};

// ===============================
// Validation helpers
// ===============================

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
    return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function pickBool(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function pickText(value: unknown, maxLength: number): string {
    return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

/** Rounds to 0.1 mm and clamps into [min, max] */
export function clampMm(value: number, min: number, max: number): number {
    return Math.round(Math.min(max, Math.max(min, value)) * 10) / 10;
}

function pickNumber(value: unknown, fallback: number, min: number, max: number): number {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    return clampMm(n, min, max);
}

function normalizeLayout(input: unknown, fallback: CardElementLayout, size: CardSize, square = false): CardElementLayout {
    const src = isRecord(input) ? input : {};
    const w = pickNumber(src.w, fallback.w, MIN_ELEMENT_SIZE_MM, size.widthMm);
    const h = square ? w : pickNumber(src.h, fallback.h, MIN_ELEMENT_SIZE_MM, size.heightMm);
    return {
        visible: pickBool(src.visible, fallback.visible),
        x: pickNumber(src.x, fallback.x, 0, size.widthMm - w),
        y: pickNumber(src.y, fallback.y, 0, size.heightMm - h),
        w,
        h,
        fontSize: pickNumber(src.fontSize, fallback.fontSize, FONT_SIZE_LIMITS.min, FONT_SIZE_LIMITS.max),
        align: pickEnum(src.align, TEXT_ALIGNS, fallback.align),
    };
}

/** Templates saved before element positioning existed only had show/hide flags */
function upgradeV1(src: Record<string, unknown>): Record<string, unknown> {
    const display = isRecord(src.display) ? src.display : {};
    const elements: Record<string, CardElementLayout> = {
        logo: { ...DEFAULT_ELEMENTS.logo, visible: pickBool(display.showLogo, true) },
        qr: { ...DEFAULT_ELEMENTS.qr, visible: pickBool(display.showQr, true) },
        footer: { ...DEFAULT_ELEMENTS.footer, visible: pickBool(display.showFooterCode, true) },
    };
    return { ...src, elements, customTexts: [] };
}

/**
 * Coerces unknown JSON (request body, localStorage, DB row) into valid v2 settings.
 * Unknown keys (including elements removed from the fixed layout) are dropped; missing /
 * invalid values fall back to the defaults; every element is clamped inside the card.
 */
export function normalizeCardSettings(input: unknown): CardPresetSettings {
    let src = isRecord(input) ? input : {};
    if (src.version !== 2 && isRecord(src.display)) src = upgradeV1(src);

    const d = DEFAULT_CARD_SETTINGS;
    const sizeSrc = isRecord(src.size) ? src.size : {};
    const size: CardSize = {
        widthMm: pickNumber(sizeSrc.widthMm, d.size.widthMm, CARD_SIZE_LIMITS.min, CARD_SIZE_LIMITS.max),
        heightMm: pickNumber(sizeSrc.heightMm, d.size.heightMm, CARD_SIZE_LIMITS.min, CARD_SIZE_LIMITS.max),
    };
    const style = isRecord(src.style) ? src.style : {};
    const elementsSrc = isRecord(src.elements) ? src.elements : {};

    const elements = Object.fromEntries(
        CARD_ELEMENT_KEYS.map((k) => [k, normalizeLayout(elementsSrc[k], d.elements[k], size, k === 'qr')])
    ) as Record<CardElementKey, CardElementLayout>;

    const customTexts: CardCustomText[] = (Array.isArray(src.customTexts) ? src.customTexts : [])
        .slice(0, MAX_CUSTOM_TEXTS)
        .filter(isRecord)
        .map((t, i) => ({
            ...normalizeLayout(t, { visible: true, x: 3.5, y: 40, w: 47, h: 5, fontSize: 2.6, align: 'center' }, size),
            id: typeof t.id === 'string' && t.id ? t.id.slice(0, 64) : `text-${i}`,
            text: pickText(t.text, CUSTOM_TEXT_MAX_LENGTH),
            bold: pickBool(t.bold, true),
            uppercase: pickBool(t.uppercase, false),
            tone: pickEnum(t.tone, TEXT_TONES, 'primary'),
            font: pickEnum(t.font, TEXT_FONTS, 'standard'),
            hideIfEmpty: pickBool(t.hideIfEmpty, true),
        }));

    return {
        version: 2,
        requestType: pickEnum(src.requestType, PRESET_SCOPES, 'all'),
        size,
        style: {
            borderColor: pickEnum(style.borderColor, BORDER_COLORS, d.style.borderColor),
            borderWidthMm: pickNumber(style.borderWidthMm, d.style.borderWidthMm, 0, 5),
            background: pickEnum(style.background, BACKGROUNDS, d.style.background),
            footerColor: pickEnum(style.footerColor, FOOTER_COLORS, d.style.footerColor),
        },
        elements,
        customTexts,
    };
}

/** Returns the trimmed template name, or null when it is empty / too long */
export function validatePresetName(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const name = input.trim();
    if (!name || name.length > PRESET_NAME_MAX_LENGTH) return null;
    return name;
}

export function areSettingsEqual(a: CardPresetSettings, b: CardPresetSettings): boolean {
    return JSON.stringify(normalizeCardSettings(a)) === JSON.stringify(normalizeCardSettings(b));
}

// ===============================
// Layout helpers
// ===============================

function scaleLayout<T extends CardElementLayout>(el: T, sx: number, sy: number, square: boolean): T {
    const sf = Math.min(sx, sy);
    const w = el.w * sx;
    const h = square ? w : el.h * sy;
    return { ...el, x: el.x * sx, y: el.y * sy, w, h, fontSize: el.fontSize * sf };
}

/**
 * Changes the card size and scales every element proportionally (positions follow the
 * width / height ratio, font sizes the smaller ratio, the QR code stays square).
 */
export function resizeCardSettings(settings: CardPresetSettings, size: CardSize): CardPresetSettings {
    const sx = size.widthMm / settings.size.widthMm;
    const sy = size.heightMm / settings.size.heightMm;
    const elements = Object.fromEntries(
        CARD_ELEMENT_KEYS.map((k) => [k, scaleLayout(settings.elements[k], sx, sy, k === 'qr')])
    ) as Record<CardElementKey, CardElementLayout>;
    return normalizeCardSettings({
        ...settings,
        size,
        elements,
        customTexts: settings.customTexts.map((t) => scaleLayout(t, sx, sy, false)),
    });
}

/** Keeps an element box inside the card after a move / resize */
export function clampToCard<T extends CardElementLayout>(el: T, size: CardSize, square = false): T {
    const w = clampMm(el.w, MIN_ELEMENT_SIZE_MM, size.widthMm);
    const h = square ? w : clampMm(el.h, MIN_ELEMENT_SIZE_MM, size.heightMm);
    return {
        ...el,
        w,
        h,
        x: clampMm(el.x, 0, size.widthMm - w),
        y: clampMm(el.y, 0, size.heightMm - h),
    };
}

/** New custom text placed below the existing ones (optionally with initial content) */
export function createCustomText(size: CardSize, existingCount: number, text = 'Custom text', font: CardTextFont = 'standard'): CardCustomText {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `text-${Date.now()}`;
    const w = Math.min(47, size.widthMm - 4);
    const fontSize = font === 'impact' ? 5 : 2.6;
    const h = font === 'impact' ? 8 : 5;
    return clampToCard(
        {
            id,
            text,
            visible: true,
            x: (size.widthMm - w) / 2,
            y: Math.min(size.heightMm - h, 15 + existingCount * 6),
            w,
            h,
            fontSize,
            align: 'center',
            bold: true,
            uppercase: font === 'impact',
            tone: 'primary',
            font,
            hideIfEmpty: true,
        },
        size
    );
}
