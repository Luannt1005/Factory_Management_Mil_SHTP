import React from 'react';

export interface PageHeaderProps {
    kicker?: string;
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    kicker,
    title,
    description,
    actions,
    children,
    className = '',
}) => {
    return (
        <div className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${className}`}>
            <div>
                {kicker && (
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {kicker}
                    </div>
                )}
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                )}
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-3">
                    {actions}
                </div>
            )}
            {children}
        </div>
    );
};
