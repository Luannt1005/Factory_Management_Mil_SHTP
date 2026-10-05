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
            <div className="flex flex-wrap gap-2.5 justify-between items-center mb-4">
                {visitors.length < 15 ? (
                    <button 
                        type="button" 
                        onClick={onAddVisitor} 
                        className="bg-transparent text-mwk border border-mwk py-1.5 px-3 rounded-md text-[11px] font-bold cursor-pointer"
                    >
                        + ADD ANOTHER VISITOR
                    </button>
                ) : (
                    <div className="text-[11px] text-mwk font-bold">MAX 15 VISITORS REACHED</div>
                )}
                
                <ExcelVisitorUpload 
                    type="visitor" 
                    onImportVisitors={onImportVisitors} 
                />
            </div>
            
            {visitors.map((visitor, idx) => (
                <div key={idx} className={`relative mb-4 flex gap-4 items-center pb-4 ${visitors.length > 1 ? 'border-b border-dashed border-slate-200' : ''}`}>
                    <div className="w-20 shrink-0 whitespace-nowrap">
                        <span className="text-[12px] font-bold text-slate-500 whitespace-nowrap">VISITOR {idx + 1}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Full Name <span className="text-mwk">*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="e.g. Nguyen Van A" 
                            value={visitor.name} 
                            onChange={(e) => handleChange(idx, 'name', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'name')} 
                            className="capitalize" 
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Company <span className="text-mwk">*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="e.g. TTI VN" 
                            value={visitor.company} 
                            onChange={(e) => handleChange(idx, 'company', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'company')} 
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Title <span className="text-mwk">*</span></label>
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
                        <div className="w-15 shrink-0 text-right">
                            <button 
                                type="button" 
                                onClick={() => onRemoveVisitor(idx)} 
                                className="text-red-500 bg-transparent text-[11px] font-bold cursor-pointer"
                            >
                                REMOVE
                            </button>
                        </div>
                    ) : (
                        <div className="w-15 shrink-0"></div>
                    )}
                </div>
            ))}
        </>
    );
};
