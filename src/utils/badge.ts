/**
 * Badge & Category Styling Utilities
 * Orgchart_TTI_onprem
 */

/**
 * Returns Tailwind CSS classes for visitor category badges
 */
export const getCategoryBadgeClass = (category?: string | null): string => {
    const cat = category?.toUpperCase() || '';
    if (cat.includes('VENDOR') && cat.includes('CONTRACTOR')) return 'text-indigo-600 bg-indigo-50';
    if (cat.includes('VENDOR')) return 'text-blue-600 bg-blue-50';
    if (cat.includes('CONTRACTOR')) return 'text-cyan-600 bg-cyan-50';
    if (cat.includes('INTERVIEWEE')) return 'text-emerald-600 bg-emerald-50';
    if (cat.includes('EXPAT')) return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
};

/**
 * Returns Tailwind CSS classes for request/visitor status badges
 */
export const getStatusBadgeClass = (status?: string | null): string => {
    const s = status?.toUpperCase() || '';
    if (s === 'APPROVED' || s === 'COMPLETE') return 'text-green-600 bg-green-50';
    if (s === 'REJECTED') return 'text-red-600 bg-red-50';
    if (s === 'PENDING' || s === 'IN PROCESS') return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
};

export type StatusTone = 'success' | 'error' | 'warning';

/**
 * Maps a request/approval status to its tone
 * APPROVED / COMPLETE -> success, REJECTED -> error, everything else (PENDING, IN PROCESS, ...) -> warning
 */
export const getStatusTone = (status?: string | null): StatusTone => {
    switch (status) {
        case 'COMPLETE':
        case 'APPROVED':
            return 'success';
        case 'REJECTED':
            return 'error';
        default:
            return 'warning';
    }
};

const STATUS_PILL_CLASS: Record<StatusTone, string> = {
    success: 'bg-status-success/8 text-status-success border border-status-success/20',
    error: 'bg-status-error/8 text-status-error border border-status-error/20',
    warning: 'bg-status-warning/8 text-status-warning border border-status-warning/20',
};

const STATUS_DOT_CLASS: Record<StatusTone, string> = {
    success: 'bg-status-success',
    error: 'bg-status-error',
    warning: 'bg-status-warning',
};

const STATUS_TEXT_CLASS: Record<StatusTone, string> = {
    success: 'text-status-success',
    error: 'text-status-error',
    warning: 'text-status-warning',
};

/**
 * Tinted pill (soft background, colored text, soft border) for a request/approval status
 */
export const getStatusPillClass = (status?: string | null): string => STATUS_PILL_CLASS[getStatusTone(status)];

/**
 * Solid dot color for a request/approval status
 */
export const getStatusDotClass = (status?: string | null): string => STATUS_DOT_CLASS[getStatusTone(status)];

/**
 * Text color for a request/approval status
 */
export const getStatusTextClass = (status?: string | null): string => STATUS_TEXT_CLASS[getStatusTone(status)];

const STATUS_SOFT_CLASS: Record<StatusTone, string> = {
    success: 'bg-status-success/8 text-status-success',
    error: 'bg-status-error/8 text-status-error',
    warning: 'bg-status-warning/8 text-status-warning',
};

const STATUS_GLOW_CLASS: Record<StatusTone, string> = {
    success: 'shadow-[0_0_4px_color-mix(in_srgb,var(--color-status-success)_33%,transparent)]',
    error: 'shadow-[0_0_4px_color-mix(in_srgb,var(--color-status-error)_33%,transparent)]',
    warning: 'shadow-[0_0_4px_color-mix(in_srgb,var(--color-status-warning)_33%,transparent)]',
};

/**
 * Tinted background + colored text (no border) for a request/approval status
 */
export const getStatusSoftClass = (status?: string | null): string => STATUS_SOFT_CLASS[getStatusTone(status)];

/**
 * Soft colored glow around a status dot
 */
export const getStatusGlowClass = (status?: string | null): string => STATUS_GLOW_CLASS[getStatusTone(status)];
