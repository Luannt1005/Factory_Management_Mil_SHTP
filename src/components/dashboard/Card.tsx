import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'lg',
    onClick,
}) => {
    return (
        <div
            className={`bg-white rounded-xl border border-gray-100 shadow-sm ${paddingStyles[padding]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
