import React from 'react';

export interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 5,
    className = '',
}) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rIdx) => (
                <tr
                    key={`skeleton-row-${rIdx}`}
                    className={`animate-pulse border-b border-gray-100/80 ${className}`}
                >
                    {Array.from({ length: columns }).map((_, cIdx) => (
                        <td key={`skeleton-col-${cIdx}`} className="py-3.5 px-4">
                            <div
                                className="h-4 bg-gray-200/80 rounded"
                                style={{
                                    width: `${55 + ((rIdx * 7 + cIdx * 13) % 40)}%`,
                                }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};
