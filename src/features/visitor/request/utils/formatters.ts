/**
 * Visitor Request Text Formatters & Sanitizers
 * Orgchart_TTI_onprem
 */

/**
 * Block numbers and special characters/symbols without modifying unicode codepoints or casing while typing.
 * This ensures Vietnamese IME (Unikey, Telex, VNI) works with 100% precision.
 */
export const cleanNameInput = (str: string): string => {
    if (!str) return '';
    return str.replace(/[0-9;:"!@#$%^&*()+={}\[\]<>?/\\|~`_=]/g, '');
};

/**
 * Capitalize first letter of each word, lowercasing the rest, supporting all Unicode Vietnamese letters.
 */
export const formatName = (str: string): string => {
    if (!str) return '';
    const nfc = str.normalize('NFC');
    const clean = nfc.replace(/[^\p{L}\p{M}\s'-]/gu, '');
    return clean.replace(/([\p{L}\p{M}]+)/gu, (match) => {
        return match.charAt(0).toLocaleUpperCase('vi-VN') + match.slice(1).toLocaleLowerCase('vi-VN');
    }).trim().replace(/\s+/g, ' ');
};

/**
 * Capitalize the first letter of each word for company names, titles, and departments.
 */
export const capitalizeWords = (str: string): string => {
    if (!str) return str;
    const nfc = str.normalize('NFC');
    return nfc.replace(/([\p{L}\p{M}]+)/gu, (match) => {
        return match.charAt(0).toLocaleUpperCase('vi-VN') + match.slice(1).toLocaleLowerCase('vi-VN');
    }).trim().replace(/\s+/g, ' ');
};
