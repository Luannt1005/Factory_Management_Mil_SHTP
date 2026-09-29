'use client';

import React from 'react';
import type { IntervieweeInfo } from '@/types/visitor-request.types';
import { ExcelVisitorUpload } from './ExcelVisitorUpload';
import { FormInput } from './FormControls';
import { cleanNameInput, formatName, capitalizeWords } from '../utils/formatters';

export interface IntervieweeFormProps {
    interviewees: IntervieweeInfo[];
    onAddInterviewee: () => void;
    onRemoveInterviewee: (index: number) => void;
    onUpdateInterviewee: (index: number, field: keyof IntervieweeInfo, value: string) => void;
    onImportInterviewees: (interviewees: IntervieweeInfo[]) => void;
}

export const IntervieweeForm: React.FC<IntervieweeFormProps> = ({
    interviewees,
    onAddInterviewee,
    onRemoveInterviewee,
    onUpdateInterviewee,
    onImportInterviewees
}) => {
    const handleChange = (index: number, field: keyof IntervieweeInfo, value: string) => {
        const processed = (field === 'name' || field === 'interviewerName')
            ? cleanNameInput(value)
            : value;
        onUpdateInterviewee(index, field, processed);
    };

    const handleBlur = (index: number, field: keyof IntervieweeInfo) => {
        const currentVal = interviewees[index]?.[field];
        if (typeof currentVal === 'string' && currentVal.trim()) {
            const processed = (field === 'name' || field === 'interviewerName')
                ? formatName(currentVal)
                : capitalizeWords(currentVal);
            onUpdateInterviewee(index, field, processed);
        }
    };

    return (
        <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                {interviewees.length < 20 ? (
                    <button 
                        type="button" 
                        onClick={onAddInterviewee} 
                        style={{ backgroundColor: 'transparent', color: '#db011c', border: '1px solid #db011c', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        + ADD ANOTHER CANDIDATE
                    </button>
                ) : (
                    <div style={{ fontSize: '11px', color: '#db011c', fontWeight: 700 }}>MAX 20 CANDIDATES REACHED</div>
                )}
                
                <ExcelVisitorUpload 
                    type="interviewee" 
                    onImportInterviewees={onImportInterviewees} 
                />
            </div>
            
            {interviewees.map((candidate, idx) => (
                <div key={idx} style={{ position: 'relative', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: interviewees.length > 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: '16px' }}>
                    <div style={{ width: '95px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>CANDIDATE {idx + 1}</span>
                    </div>
                    <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Name <span style={{ color: '#db011c' }}>*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="Candidate name" 
                            value={candidate.name} 
                            onChange={(e) => handleChange(idx, 'name', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'name')} 
                            style={{ textTransform: 'capitalize' }} 
                        />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Job Title <span style={{ color: '#db011c' }}>*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="e.g. Engineer" 
                            value={candidate.jobTitle} 
                            onChange={(e) => handleChange(idx, 'jobTitle', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'jobTitle')} 
                        />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Department <span style={{ color: '#db011c' }}>*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="e.g. IT / QA" 
                            value={candidate.interviewDepartment} 
                            onChange={(e) => handleChange(idx, 'interviewDepartment', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'interviewDepartment')} 
                        />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Interviewer <span style={{ color: '#db011c' }}>*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="Interviewer name" 
                            value={candidate.interviewerName} 
                            onChange={(e) => handleChange(idx, 'interviewerName', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'interviewerName')} 
                            style={{ textTransform: 'capitalize' }} 
                        />
                    </div>
                    {interviewees.length > 1 ? (
                        <div style={{ width: '55px', flexShrink: 0, textAlign: 'right' }}>
                            <button 
                                type="button" 
                                onClick={() => onRemoveInterviewee(idx)} 
                                style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                REMOVE
                            </button>
                        </div>
                    ) : (
                        <div style={{ width: '55px', flexShrink: 0 }}></div>
                    )}
                </div>
            ))}
        </>
    );
};
