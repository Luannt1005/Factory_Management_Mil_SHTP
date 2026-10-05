import React from 'react';

export interface MetricCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    unit?: string;
    growth?: number;
    growthSubtitle?: string;
    active?: boolean;
    onClick?: () => void;
    loading?: boolean;
    className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    subtitle,
    icon,
    unit,
    growth,
    growthSubtitle,
    active = false,
    onClick,
    loading = false,
    className = '',
}) => {
    if (loading) {
        return (
            <div className={`h-[105px] bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between ${className}`}>
                <div className="animate-pulse flex justify-between items-start">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                </div>
                <div className="animate-pulse">
                    <div className="h-7 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-2.5 bg-gray-200 rounded w-12"></div>
                </div>
            </div>
        );
    }

    const Component = onClick ? 'button' : 'div';

    const formatGrowth = (g?: number) => {
        if (g === undefined) return null;
        if (g > 0) {
            return (
                <span className="text-[#db011c] font-bold text-xs flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {g}%
                </span>
            );
        }
        if (g < 0) {
            return (
                <span className="text-gray-500 font-bold text-xs flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    {Math.abs(g)}%
                </span>
            );
        }
        return <span className="text-gray-400 font-bold text-xs">0%</span>;
    };

    return (
        <Component
            {...(onClick ? { type: 'button' as const, onClick } : {})}
            className={`
                h-[105px] p-4 w-full bg-white rounded-xl border text-left
                flex flex-col justify-between relative overflow-hidden
                transition-all duration-200
                ${onClick ? 'cursor-pointer' : ''}
                ${active
                    ? 'border-[#db011c] shadow-md ring-2 ring-red-100 bg-red-50/20'
                    : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                }
                ${className}
            `}
        >
            <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                    {label}
                </span>
                {icon ? (
                    <div className="text-[#db011c] shrink-0">{icon}</div>
                ) : (
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#db011c]' : 'bg-gray-200'}`} />
                )}
            </div>

            <div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </span>
                    {unit && <span className="text-base font-bold text-gray-700">{unit}</span>}
                </div>

                <div className="flex items-center gap-1.5 mt-1.5">
                    {formatGrowth(growth)}
                    {(subtitle || growthSubtitle) && (
                        <span className="text-[11px] font-medium text-gray-500 truncate">
                            {growthSubtitle || subtitle}
                        </span>
                    )}
                </div>
            </div>
        </Component>
    );
};
