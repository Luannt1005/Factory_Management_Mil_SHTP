'use client';

import React, { Fragment } from 'react';
import {
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
    Transition,
} from '@headlessui/react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps {
    label?: string;
    value?: string;
    onChange?: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    helperText?: string;
    required?: boolean;
    id?: string;
    name?: string;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    disabled = false,
    error,
    helperText,
    required = false,
    id,
    name,
    className = '',
}) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className={`w-full space-y-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-xs font-semibold text-gray-700 select-none"
                >
                    {label} {required && <span className="text-[#db011c]">*</span>}
                </label>
            )}

            <div className="relative">
                <Listbox value={value} onChange={onChange} disabled={disabled} name={name}>
                    {({ open }) => (
                        <>
                            <ListboxButton
                                id={selectId}
                                aria-invalid={!!error}
                                aria-describedby={
                                    error
                                        ? `${selectId}-error`
                                        : helperText
                                          ? `${selectId}-helper`
                                          : undefined
                                }
                                className={`
                                    w-full h-10 px-3 pr-10 rounded-lg text-sm text-left
                                    border bg-gray-50/80 transition-colors
                                    outline-none flex items-center justify-between
                                    disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                                    ${
                                        error
                                            ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                                            : open
                                              ? 'border-[#db011c] bg-white ring-2 ring-red-100'
                                              : 'border-gray-200 focus:border-[#db011c] focus:bg-white focus:ring-2 focus:ring-red-100'
                                    }
                                `}
                            >
                                <span
                                    className={`block truncate ${
                                        selectedOption ? 'text-gray-800' : 'text-gray-400'
                                    }`}
                                >
                                    {selectedOption ? selectedOption.label : placeholder}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <ChevronDownIcon
                                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                                            open ? 'rotate-180 text-[#db011c]' : ''
                                        }`}
                                        aria-hidden="true"
                                    />
                                </span>
                            </ListboxButton>

                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-xl ring-1 ring-black/5 focus:outline-none border border-gray-100">
                                    {options.length === 0 ? (
                                        <div className="py-2.5 px-3 text-xs text-gray-400 text-center">
                                            No options available
                                        </div>
                                    ) : (
                                        options.map((option) => (
                                            <ListboxOption
                                                key={option.value}
                                                value={option.value}
                                                disabled={option.disabled}
                                                className={({ active, selected, disabled: optDisabled }) => `
                                                    relative cursor-pointer select-none py-2 pl-9 pr-4 transition-colors
                                                    ${optDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                                                    ${
                                                        active
                                                            ? 'bg-red-50/70 text-[#db011c]'
                                                            : selected
                                                              ? 'text-[#db011c] font-semibold bg-red-50/30'
                                                              : 'text-gray-800'
                                                    }
                                                `}
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span
                                                            className={`block truncate ${
                                                                selected ? 'font-semibold' : 'font-normal'
                                                            }`}
                                                        >
                                                            {option.label}
                                                        </span>
                                                        {selected && (
                                                            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#db011c]">
                                                                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </ListboxOption>
                                        ))
                                    )}
                                </ListboxOptions>
                            </Transition>
                        </>
                    )}
                </Listbox>
            </div>

            {error ? (
                <p id={`${selectId}-error`} className="text-xs text-red-600 font-medium">
                    {error}
                </p>
            ) : helperText ? (
                <p id={`${selectId}-helper`} className="text-xs text-gray-500">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
};
