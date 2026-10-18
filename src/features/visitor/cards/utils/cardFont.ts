import localFont from 'next/font/local';
import type { CardFontFamily, CardFontWeight } from '@/types/visitor-card.types';

/**
 * Typefaces printed on visitor cards (SIL OFL, licences in ../fonts/OFL-*.txt). The files are kept
 * in the repo so the build works on the on-premise server without internet access, and every one
 * covers Vietnamese. Arial / Times New Roman are system fonts of the Windows print stations.
 * Font-family values are applied inline, so they also work inside the print portal (outside the layout).
 */
const anton = localFont({ src: '../fonts/Anton-Regular.ttf', weight: '400', style: 'normal', display: 'block' });
const roboto = localFont({ src: '../fonts/Roboto-Variable.ttf', weight: '100 900', style: 'normal', display: 'block', preload: false });
const montserrat = localFont({ src: '../fonts/Montserrat-Variable.ttf', weight: '100 900', style: 'normal', display: 'block', preload: false });
const oswald = localFont({ src: '../fonts/Oswald-Variable.ttf', weight: '200 700', style: 'normal', display: 'block', preload: false });

/** Default card typeface (set on the card root) */
export const cardFont = anton;

export const CARD_FONT_STACKS: Record<CardFontFamily, string> = {
    anton: anton.style.fontFamily,
    roboto: roboto.style.fontFamily,
    montserrat: montserrat.style.fontFamily,
    oswald: oswald.style.fontFamily,
    arial: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    times: '"Times New Roman", Times, serif',
};

export const CARD_FONT_WEIGHT_VALUES: Record<CardFontWeight, number> = { light: 300, regular: 400, bold: 700 };
