import React from 'react';
import { getCategoryBadgeClass, getStatusBadgeClass } from '@/utils/badge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
    size?: 'sm' | 'md';
    /** Optional category string mapped via getCategoryBadgeClass */
    category?: string | null;
    /** Optional status string mapped via getStatusBadgeClass */
    status?: string | null;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'text-gray-700 bg-gray-100 border-gray-200',
    success: 'text-green-700 bg-green-50 border-green-200',
    danger: 'text-red-700 bg-red-50 border-red-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    info: 'text-blue-700 bg-blue-50 border-blue-200',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'text-[10px] font-bold px-2 py-0.5 rounded-full',
    md: 'text-xs font-semibold px-2.5 py-1 rounded-full',
};

export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    size = 'sm',
    category,
    status,
    children,
    className = '',
    ...rest
}) => {
    // If category or status is passed, use centralized badge utils for color classes
    let colorClass = variantStyles[variant];
    if (category) {
        colorClass = getCategoryBadgeClass(category);
    } else if (status) {
        colorClass = getStatusBadgeClass(status);
    }

    return (
        <span
            className={`
                inline-flex items-center gap-1.5 border
                leading-none select-none tracking-tight
                ${colorClass}
                ${sizeStyles[size]}
                ${className}
            `}
            {...rest}
        >
            {children || category || status}
        </span>
    );
};

Badge.displayName = 'Badge';
