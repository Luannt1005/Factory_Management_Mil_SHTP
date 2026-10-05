'use client';

import React from 'react';

export interface CategorySelectorProps {
    selectedCategory: string;
    isHrVisitor: boolean;
    isSecurity: boolean;
    onSelectCategory: (category: string) => void;
}

const CATEGORIES = [
    { id: 'Vendor/Contractor', label: 'VENDOR / CONTRACTOR', desc: 'Suppliers, service providers & contractors' },
    { id: 'MIL/TTI Expat / SHTP Business trip', label: 'MIL / TTI EXPAT', desc: 'Milwaukee & TTI overseas employees' },
    { id: 'Interviewee', label: 'INTERVIEWEE', desc: 'Job candidates visiting for interview' }
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
    selectedCategory,
    isHrVisitor,
    isSecurity,
    onSelectCategory
}) => {
    return (
        <div className="grid grid-cols-[repeat(3,1fr)] gap-4 mb-6">
            {CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat.id || (cat.id === 'Vendor/Contractor' && (selectedCategory === 'Vendor' || selectedCategory === 'Contractor'));
                const isDisabled = cat.id === 'Interviewee'
                    ? (!isHrVisitor && !isSecurity)
                    : isSecurity;
                
                return (
                    <div 
                        key={cat.id}
                        onClick={() => {
                            if (isDisabled) {
                                if (isSecurity) {
                                    alert("Security role is only authorized to create Interviewee requests.");
                                } else if (cat.id === 'Interviewee') {
                                    alert("You need Hr Visitor or Security role to create an Interviewee request.");
                                }
                                return;
                            }
                            if (cat.id === 'Vendor/Contractor') {
                                onSelectCategory('Vendor');
                            } else {
                                onSelectCategory(cat.id);
                            }
                        }}
                        className={`p-5 rounded-lg border text-center transition-all duration-200 ${isDisabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'} ${isActive ? 'bg-mwk-soft border-mwk shadow-[0_4px_12px_rgba(219,1,28,0.1)]' : `${isDisabled ? 'bg-slate-50' : 'bg-white'} border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)]`}`}
                    >
                        <div className={`font-bold text-[13px] mb-1.5 tracking-[0.02em] ${isActive ? 'text-mwk' : isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>
                            {cat.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                            {isSecurity && cat.id !== 'Interviewee' ? 'Not permitted for Security' : cat.desc}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
