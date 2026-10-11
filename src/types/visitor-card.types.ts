/**
 * Visitor Card Studio Domain Types
 * Orgchart_TTI_onprem
 *
 * A card preset stores how badges look: card size, colours, and the position / size / font of
 * every element (all in millimetres, relative to the card's top-left corner).
 * Card content (name, code, dates...) is per card and never stored in a preset.
 */

export type CardBorderColor = 'red' | 'black' | 'gold' | 'slate' | 'white';
export type CardBackground = 'dark' | 'black' | 'white';
export type CardFooterColor = 'red' | 'black' | 'gold' | 'slate';
export type CardTextAlign = 'left' | 'center' | 'right';
export type CardTextTone = 'primary' | 'muted' | 'accent';

/** Fixed layout elements; all visitor information is added by the user as custom text / data fields */
export type CardElementKey = 'logo' | 'qr' | 'footer';

export type CardTextFont = 'standard' | 'impact';

/** Box of one element on the card (mm). For the QR code w and h are kept equal. */
export interface CardElementLayout {
    visible: boolean;
    x: number;
    y: number;
    w: number;
    h: number;
    /** Main text size in mm (ignored by logo / QR) */
    fontSize: number;
    align: CardTextAlign;
}

/** Free text added by the user; supports {fieldKey} placeholders for every CardFieldKey */
export interface CardCustomText extends CardElementLayout {
    id: string;
    text: string;
    bold: boolean;
    uppercase: boolean;
    tone: CardTextTone;
    font: CardTextFont;
    /** Hide the whole text when every placeholder in it resolves to an empty value */
    hideIfEmpty: boolean;
}

export interface CardSize {
    widthMm: number;
    heightMm: number;
}

export interface CardVisualStyle {
    borderColor: CardBorderColor;
    borderWidthMm: number;
    background: CardBackground;
    footerColor: CardFooterColor;
}

export interface CardPresetSettings {
    version: 2;
    /** Request category this template is for; cards of other categories cannot be added with it */
    requestType: CardPresetScope;
    size: CardSize;
    style: CardVisualStyle;
    elements: Record<CardElementKey, CardElementLayout>;
    customTexts: CardCustomText[];
}

export interface CardPreset {
    id: string;
    name: string;
    settings: CardPresetSettings;
    /** Built-in presets ship with the app and cannot be renamed, overwritten or deleted */
    builtIn: boolean;
    createdBy?: string | null;
    updatedAt?: string | null;
}

/**
 * Every data field a badge can print, across the three request types:
 * MIL/TTI Expat / SHTP Business trip, Vendor / Contractor, and Interviewee.
 * A field a request type does not have is an empty string.
 */
export type CardFieldKey =
    // Visitor (one card per visitor)
    | 'visitorName'
    | 'visitorTitle'
    | 'visitorCompany'
    | 'cardCode'
    | 'cardNumber'
    | 'interviewDepartment'
    | 'interviewerName'
    // Request
    | 'requestCode'
    | 'category'
    | 'status'
    | 'visitingSite'
    | 'purposeOfVisit'
    | 'purposeDetail'
    | 'dateFrom'
    | 'dateTo'
    | 'startTime'
    | 'interviewArea'
    // Submitter
    | 'submitterName'
    | 'submitterDepartment'
    | 'submitterEmail'
    // Host department & logistics
    | 'hostBu'
    | 'hostFunctionalDept'
    | 'hostDepartment'
    | 'costCenter'
    | 'factoryTour'
    | 'mealRegistration'
    | 'rooms'
    // QR payload
    | 'qrValue';

export type CardFields = Record<CardFieldKey, string>;

export type CardRequestType = 'expat' | 'vendor' | 'interviewee';

/** Category a template is bound to ('all' = universal template) */
export type CardPresetScope = CardRequestType | 'all';

/** Content of a single badge (editable per card, independent of the preset) */
export interface VisitorCardData {
    /** Local id used for React keys and per-card edits */
    id: string;
    fields: CardFields;
}

/** Fields of the card content that can be changed for all cards at once */
export type CardBulkEditPayload = Partial<Pick<CardFields, 'dateFrom' | 'dateTo' | 'visitorCompany' | 'visitingSite'>>;

/** One card returned by GET /api/visitor_admin/card-sources */
export interface CardSourceRecord {
    requestType: CardRequestType;
    fields: CardFields;
}

export interface CardSourcesApiResponse {
    cards: CardSourceRecord[];
}

/** Element currently selected in the designer: a built-in key or a custom text id */
export type CardSelection = { kind: 'element'; key: CardElementKey } | { kind: 'custom'; id: string } | null;

/** Row shape of "visitor_card_presets" in Visitor_database */
export interface CardPresetRow {
    id: string;
    name: string;
    settings: unknown;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface CardPresetPayload {
    name: string;
    settings: CardPresetSettings;
}

export interface CardPresetsApiResponse {
    presets: CardPresetRow[];
}

export interface CardPresetApiResponse {
    preset: CardPresetRow;
}
