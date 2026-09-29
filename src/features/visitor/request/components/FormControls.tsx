'use client';

import React from 'react';

export const InputLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', marginTop: '8px' }}>
        {children}
        {required && <span style={{ color: '#db011c', marginLeft: '4px' }}>*</span>}
    </label>
);

export const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ borderBottom: '1.5px solid #db011c', marginBottom: '24px', marginTop: '40px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'inline-block' }}>
            {title}
        </h2>
    </div>
);

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const FormInput = ({ style, onFocus, onBlur, onClick, ...rest }: FormInputProps) => (
    <input 
        {...rest} 
        style={{ 
            width: '100%', 
            padding: '10px 12px', 
            borderRadius: '6px', 
            border: '1px solid #e2e8f0', 
            fontSize: '14px', 
            backgroundColor: '#f8fafc', 
            color: '#1e293b', 
            outline: 'none',
            ...(style || {}) 
        }}
        onFocus={(e) => {
            e.currentTarget.style.borderColor = '#db011c';
            if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            if (onBlur) onBlur(e);
        }}
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
