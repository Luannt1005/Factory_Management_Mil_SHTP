'use client';

import React from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    InformationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    onClose?: () => void;
}

const variantStyles: Record<
    AlertVariant,
    {
        container: string;
        title: string;
        body: string;
        iconColor: string;
        defaultIcon: React.ReactNode;
    }
> = {
    error: {
        container: 'bg-red-50/90 border-red-200 text-red-900',
        title: 'text-red-900',
        body: 'text-red-800',
        iconColor: 'text-[#db011c]',
        defaultIcon: <XCircleIcon className="w-5 h-5 shrink-0" aria-hidden="true" />,
    },
    success: {
        container: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
        title: 'text-emerald-900',
        body: 'text-emerald-800',
        iconColor: 'text-emerald-600',
        defaultIcon: <CheckCircleIcon className="w-5 h-5 shrink-0" aria-hidden="true" />,
    },
    warning: {
        container: 'bg-amber-50/90 border-amber-200 text-amber-900',
        title: 'text-amber-900',
        body: 'text-amber-800',
        iconColor: 'text-amber-600',
        defaultIcon: <ExclamationTriangleIcon className="w-5 h-5 shrink-0" aria-hidden="true" />,
    },
    info: {
        container: 'bg-blue-50/90 border-blue-200 text-blue-900',
        title: 'text-blue-900',
        body: 'text-blue-800',
        iconColor: 'text-blue-600',
        defaultIcon: <InformationCircleIcon className="w-5 h-5 shrink-0" aria-hidden="true" />,
    },
};

export const Alert: React.FC<AlertProps> = ({
    variant = 'info',
    title,
    children,
    icon,
    className = '',
    onClose,
}) => {
    const config = variantStyles[variant];
    const role = variant === 'error' ? 'alert' : 'status';

    return (
        <div
            role={role}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs transition-colors ${config.container} ${className}`}
        >
            <div className={`mt-0.5 ${config.iconColor}`}>
                {icon ? icon : config.defaultIcon}
            </div>

            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className={`font-semibold mb-0.5 leading-snug ${config.title}`}>
                        {title}
                    </h4>
                )}
                <div className={`leading-relaxed ${config.body}`}>{children}</div>
            </div>

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Dismiss alert"
                    className="p-1 -mr-1 -mt-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors cursor-pointer"
                >
                    <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                </button>
            )}
        </div>
    );
};
