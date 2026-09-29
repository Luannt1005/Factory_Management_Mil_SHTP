'use client';

import React from 'react';
import type { VisitorInfo } from '@/types/visitor-request.types';
import { ExcelVisitorUpload } from './ExcelVisitorUpload';
import { FormInput } from './FormControls';
import { cleanNameInput, formatName, capitalizeWords } from '../utils/formatters';

export interface VisitorListProps {
    visitors: VisitorInfo[];
    onAddVisitor: () => void;
    onRemoveVisitor: (index: number) => void;
    onUpdateVisitor: (index: number, field: keyof VisitorInfo, value: string) => void;
    onImportVisitors: (visitors: VisitorInfo[]) => void;
}

export const VisitorList: React.FC<VisitorListProps> = ({
    visitors,
    onAddVisitor,
    onRemoveVisitor,
    onUpdateVisitor,
    onImportVisitors
}) => {
    const handleChange = (index: number, field: keyof VisitorInfo, value: string) => {
        const processed = field === 'name' ? cleanNameInput(value) : value;
        onUpdateVisitor(index, field, processed);
    };

    const handleBlur = (index: number, field: keyof VisitorInfo) => {
        const currentVal = visitors[index]?.[field];
        if (typeof currentVal === 'string' && currentVal.trim()) {
            const processed = field === 'name' ? formatName(currentVal) : capitalizeWords(currentVal);
            onUpdateVisitor(index, field, processed);
        }
    };

    return (
        <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                {visitors.length < 15 ? (
                    <button 
                        type="button" 
                        onClick={onAddVisitor} 
                        style={{ backgroundColor: 'transparent', color: '#db011c', border: '1px solid #db011c', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        + ADD ANOTHER VISITOR
                    </button>
                ) : (
                    <div style={{ fontSize: '11px', color: '#db011c', fontWeight: 700 }}>MAX 15 VISITORS REACHED</div>
                )}
                
                <ExcelVisitorUpload 
                    type="visitor" 
                    onImportVisitors={onImportVisitors} 
                />
            </div>
            
            {visitors.map((visitor, idx) => (
                <div key={idx} style={{ position: 'relative', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center', borderBottom: visitors.length > 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: '16px' }}>
                    <div style={{ width: '80px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>VISITOR {idx + 1}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Full Name <span style={{ color: '#db011c' }}>*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="e.g. Nguyen Van A" 
                            value={visitor.name} 
                            onChange={(e) => handleChange(idx, 'name', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'name')} 
                            style={{ textTransform: 'capitalize' }} 
                        />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Company <span style={{ color: '#db011c' }}>*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="e.g. TTI VN" 
                            value={visitor.company} 
                            onChange={(e) => handleChange(idx, 'company', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'company')} 
                        />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Title <span style={{ color: '#db011c' }}>*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="e.g. Manager" 
                            value={visitor.title} 
                            onChange={(e) => handleChange(idx, 'title', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'title')} 
                        />
                    </div>
                    {visitors.length > 1 ? (
                        <div style={{ width: '60px', flexShrink: 0, textAlign: 'right' }}>
                            <button 
                                type="button" 
                                onClick={() => onRemoveVisitor(idx)} 
                                style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                REMOVE
                            </button>
                        </div>
                    ) : (
                        <div style={{ width: '60px', flexShrink: 0 }}></div>
                    )}
                </div>
            ))}
        </>
    );
};
