import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            id,
            required,
            disabled,
            className = '',
            ...rest
        },
        ref
    ) => {
        // Fallback generated id if not provided but label is present
        const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-semibold text-gray-700 select-none"
                    >
                        {label} {required && <span className="text-[#db011c]">*</span>}
                    </label>
                )}

                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        required={required}
                        className={`
                            w-full h-10 px-3 rounded-lg text-sm text-gray-800
                            border bg-gray-50/80 transition-colors
                            placeholder:text-gray-400 outline-none
                            disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                            ${
                                error
                                    ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                                    : 'border-gray-200 focus:border-[#db011c] focus:bg-white focus:ring-2 focus:ring-red-100'
                            }
                            ${className}
                        `}
                        {...rest}
                    />
                </div>

                {error ? (
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                ) : helperText ? (
                    <p className="text-xs text-gray-500">{helperText}</p>
                ) : null}
            </div>
        );
    }
);

Input.displayName = 'Input';
