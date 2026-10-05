import React from 'react';

export interface FilterBarProps {
    children?: React.ReactNode;
    activeFilters?: React.ReactNode;
    onClearAll?: () => void;
    className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    children,
    activeFilters,
    onClearAll,
    className = '',
}) => {
    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {children && (
                <div className="flex flex-wrap items-center gap-3">
                    {children}
                </div>
            )}
            {activeFilters && (
                <div className="flex items-center gap-2 flex-wrap bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">
                        Active Filters:
                    </span>
                    {activeFilters}
                    {onClearAll && (
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="text-xs font-bold text-mwk hover:underline uppercase ml-auto transition-colors cursor-pointer"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
