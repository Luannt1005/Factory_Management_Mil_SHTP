'use client';

import React from 'react';

export const InputLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 mt-2">
        {children}
        {required && <span className="text-mwk ml-1">*</span>}
    </label>
);

export const SectionHeader = ({ title }: { title: string }) => (
    <div className="border-b-[1.5px] border-mwk mb-6 mt-10">
        <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-2 inline-block">
            {title}
        </h2>
    </div>
);

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const FormInput = ({ className, onClick, ...rest }: FormInputProps) => (
    <input 
        {...rest} 
        className={`w-full py-2.5 px-3 rounded-md border border-slate-200 text-[14px] bg-slate-50 text-slate-800 outline-none focus:border-mwk ${className ?? ''}`}
        onClick={(e) => {
            if (rest.type === 'date' || rest.type === 'time') {
                try {
                    if ('showPicker' in e.currentTarget && typeof e.currentTarget.showPicker === 'function') {
                        e.currentTarget.showPicker();
                    }
                } catch (err) {}
            }
            if (onClick) onClick(e);
        }}
    />
);
