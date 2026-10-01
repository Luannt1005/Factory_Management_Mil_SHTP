'use client';

import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';

export interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    action,
    className = '',
}) => {
    return (
        <div
            className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
        >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-3 shrink-0">
                {icon ? icon : <InboxIcon className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />}
            </div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            {description && (
                <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
};
