import React from 'react';

export interface ChartCardProps {
    kicker?: string;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
    error?: string | null;
    empty?: boolean;
    emptyMessage?: string;
    className?: string;
    contentClassName?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    kicker,
    title,
    subtitle,
    action,
    children,
    loading = false,
    error,
    empty = false,
    emptyMessage = 'No data available',
    className = '',
    contentClassName = 'flex-1 min-h-0',
}) => {
    return (
        <div className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-full flex flex-col min-h-0 ${className}`}>
            {/* Header */}
            <div className="shrink-0 mb-4 flex items-center justify-between gap-2">
                <div>
                    {kicker && (
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {kicker}
                        </div>
                    )}
                    <h3 className="text-sm font-black text-gray-900 uppercase">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>

            {/* Content States */}
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[180px] animate-pulse">
                    <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="h-5 w-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            ) : error ? (
                <div className="flex-1 flex items-center justify-center text-red-500 text-sm min-h-[180px]">
                    {error}
                </div>
            ) : empty ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm min-h-[180px]">
                    {emptyMessage}
                </div>
            ) : (
                <div className={contentClassName}>
                    {children}
                </div>
            )}
        </div>
    );
};
