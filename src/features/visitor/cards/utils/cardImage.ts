/**
 * Prepares an imported picture for a card template (browser only).
 * Templates live in the database as JSON and are all loaded together, so the picture is
 * shrunk and re-encoded here: enough resolution for print, small enough to store.
 */

import { CARD_IMAGE_MAX_CHARS } from './cardPresetSettings';

export const CARD_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';

const ACCEPTED_TYPES = CARD_IMAGE_ACCEPT.split(',');
const MAX_FILE_BYTES = 15 * 1024 * 1024;
/** About 300 dpi on a card 135 mm wide */
const MAX_DIMENSION_PX = 1600;
const MIN_DIMENSION_PX = 200;
const SHRINK_STEP = 0.75;

export interface PreparedCardImage {
    src: string;
    width: number;
    height: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(file);
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('This file could not be read as an image.'));
        img.src = url;
    }).finally(() => URL.revokeObjectURL(url));
}

/** WebP keeps transparency at a small size; browsers that cannot encode it return PNG instead */
function encode(img: HTMLImageElement, width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser could not process the image.');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/webp', 0.9);
}

/** Validates the file and returns it as a data URL within the template size limit */
export async function prepareCardImage(file: File): Promise<PreparedCardImage> {
    if (!ACCEPTED_TYPES.includes(file.type)) throw new Error('Please choose a PNG, JPG or WebP image.');
    if (file.size > MAX_FILE_BYTES) throw new Error('The image is larger than 15 MB.');

    const img = await loadImage(file);
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('This file could not be read as an image.');

    let longest = Math.min(MAX_DIMENSION_PX, Math.max(img.naturalWidth, img.naturalHeight));
    while (longest >= MIN_DIMENSION_PX) {
        const scale = longest / Math.max(img.naturalWidth, img.naturalHeight);
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));
        const src = encode(img, width, height);
        if (src.length <= CARD_IMAGE_MAX_CHARS) return { src, width, height };
        longest = Math.floor(longest * SHRINK_STEP);
    }
    throw new Error('The image is too detailed to store on a card. Please use a simpler or smaller picture.');
}
