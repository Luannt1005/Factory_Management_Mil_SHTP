/**
 * String Manipulation & Normalization Utilities
 * Orgchart_TTI_onprem
 */

/**
 * Remove Vietnamese accents and convert string to lowercase
 * Useful for case-insensitive and accent-insensitive searching and filtering.
 */
export const removeAccents = (str?: string | null): string => {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};
