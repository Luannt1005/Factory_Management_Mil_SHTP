import React from 'react';

export interface FormFieldProps {
    label?: string;
    htmlFor?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    htmlFor,
    error,
    helperText,
    required = false,
    children,
    className = '',
}) => {
    return (
        <div className={`w-full space-y-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    className="block text-xs font-semibold text-gray-700 select-none"
                >
                    {label} {required && <span className="text-[#db011c]">*</span>}
                </label>
            )}

            {children}

            {error ? (
                <p
                    id={htmlFor ? `${htmlFor}-error` : undefined}
                    className="text-xs text-red-600 font-medium"
                >
                    {error}
                </p>
            ) : helperText ? (
                <p
                    id={htmlFor ? `${htmlFor}-helper` : undefined}
                    className="text-xs text-gray-500"
                >
                    {helperText}
                </p>
            ) : null}
        </div>
    );
};
