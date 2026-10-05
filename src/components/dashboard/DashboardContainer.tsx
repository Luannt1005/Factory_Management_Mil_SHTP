'use client';

import React from 'react';

export interface DashboardContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
    children,
    className = '',
}) => {
    return (
        <div className={`w-full pb-10 flex flex-col gap-6 font-sans ${className}`}>
            {children}
        </div>
    );
};

export default DashboardContainer;
