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
