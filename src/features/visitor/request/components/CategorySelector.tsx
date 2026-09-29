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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
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
                        style={{
                            cursor: isDisabled ? 'not-allowed' : 'pointer', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            backgroundColor: isActive ? '#fff5f5' : (isDisabled ? '#f8fafc' : 'white'), 
                            border: isActive ? '1px solid #db011c' : '1px solid #e2e8f0',
                            textAlign: 'center', 
                            transition: 'all 0.2s', 
                            opacity: isDisabled ? 0.45 : 1,
                            boxShadow: isActive ? '0 4px 12px rgba(219,1,28,0.1)' : '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', letterSpacing: '0.02em', color: isActive ? '#db011c' : (isDisabled ? '#94a3b8' : '#334155') }}>
                            {cat.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {isSecurity && cat.id !== 'Interviewee' ? 'Not permitted for Security' : cat.desc}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
