import localFont from 'next/font/local';

/**
 * Typeface of every text printed on a visitor card (Anton, SIL OFL - see ../fonts/OFL.txt).
 * The font file is kept in the repo so the build works on the on-premise server without
 * internet access. The class sets font-family directly, so it also applies inside the
 * print portal (outside the layout).
 */
export const cardFont = localFont({
    src: '../fonts/Anton-Regular.ttf',
    weight: '400',
    style: 'normal',
    display: 'block',
});
