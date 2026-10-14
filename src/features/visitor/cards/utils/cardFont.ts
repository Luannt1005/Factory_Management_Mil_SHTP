import { Anton } from 'next/font/google';

/**
 * Typeface of every text printed on a visitor card. next/font downloads it at build time and
 * serves it from the app, so printing works on the on-premise network without Google access.
 * The class sets font-family directly, so it also applies inside the print portal (outside the layout).
 */
export const cardFont = Anton({
    weight: '400',
    subsets: ['latin', 'latin-ext', 'vietnamese'],
    display: 'block',
});
