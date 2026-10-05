import React from 'react';

export interface TableCardProps {
    kicker?: string;
    title: string;
    badge?: string | number;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const TableCard: React.FC<TableCardProps> = ({
    kicker,
    title,
    badge,
    action,
    children,
    className = '',
}) => {
    return (
        <div className={`bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden ${className}`}>
            <div className="px-5 py-4 border-b border-gray-100 shrink-0 flex items-center justify-between gap-2">
                <div>
                    {kicker && (
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {kicker}
                        </div>
                    )}
                    <h2 className="text-sm font-black text-gray-900 uppercase">
                        {title}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {badge !== undefined && (
                        <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                            {badge}
                        </span>
                    )}
                    {action}
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
};
