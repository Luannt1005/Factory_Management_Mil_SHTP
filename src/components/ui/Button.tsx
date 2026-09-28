import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
        'bg-[#db011c] text-white hover:bg-[#b90118] active:bg-[#9a0114] shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-[#db011c]/30',
    secondary:
        'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 shadow-xs focus-visible:ring-2 focus-visible:ring-gray-200',
    outline:
        'bg-transparent text-[#db011c] border border-[#db011c] hover:bg-red-50 active:bg-red-100 focus-visible:ring-2 focus-visible:ring-[#db011c]/20',
    danger:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-red-300',
    ghost:
        'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 border border-transparent focus-visible:ring-2 focus-visible:ring-gray-200',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'text-xs font-semibold px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm font-semibold px-4 py-2 rounded-lg gap-2',
    lg: 'text-base font-bold px-5 py-2.5 rounded-xl gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            disabled = false,
            type = 'button',
            icon,
            children,
            className = '',
            ...rest
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                type={type}
                disabled={isDisabled}
                className={`
                    inline-flex items-center justify-center
                    transition-colors duration-150 select-none
                    outline-none cursor-pointer
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none
                    ${variantStyles[variant]}
                    ${sizeStyles[size]}
                    ${className}
                `}
                {...rest}
            >
                {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                ) : icon ? (
                    <span className="shrink-0">{icon}</span>
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
