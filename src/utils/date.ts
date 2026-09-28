/**
 * Date and Time Formatting Utilities
 * Orgchart_TTI_onprem
 */

export interface FormatDateTimeOptions {
    /**
     * If true, output includes seconds: DD/MM/YYYY HH:mm:ss
     * If false (default), output is: DD/MM/YYYY HH:mm
     */
    includeSeconds?: boolean;
}

/**
 * Format a date string or Date object to DD/MM/YYYY
 * Returns fallback (default '') if input is null, undefined, or empty.
 */
export const formatDateShort = (dateString?: string | Date | null, fallback: string = ''): string => {
    if (!dateString) return fallback;
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(d.getTime())) return fallback;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Format a timestamp to DD/MM/YYYY HH:mm (or with seconds if requested)
 * Returns '-' if input is null, undefined, or empty.
 */
export const formatDateTime = (
    timeString?: string | Date | null,
    options?: FormatDateTimeOptions
): string => {
    if (!timeString) return '-';
    const d = typeof timeString === 'string' ? new Date(timeString) : timeString;
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (options?.includeSeconds) {
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format a timestamp to DD/MM/YYYY HH:mm:ss
 * Convenience wrapper for formatDateTime with includeSeconds: true
 */
export const formatDateTimeWithSeconds = (timeString?: string | Date | null): string => {
    return formatDateTime(timeString, { includeSeconds: true });
};

/**
 * Format a timestamp to HH:mm
 * Returns '-' if input is null, undefined, or empty.
 */
export const formatTimeOnly = (timeString?: string | Date | null): string => {
    if (!timeString) return '-';
    const d = typeof timeString === 'string' ? new Date(timeString) : timeString;
    if (isNaN(d.getTime())) return '-';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};
