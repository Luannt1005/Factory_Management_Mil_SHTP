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
            <div className="flex flex-wrap gap-2.5 justify-between items-center mb-4">
                {interviewees.length < 20 ? (
                    <button 
                        type="button" 
                        onClick={onAddInterviewee} 
                        className="bg-transparent text-mwk border border-mwk py-1.5 px-3 rounded-md text-[11px] font-bold cursor-pointer"
                    >
                        + ADD ANOTHER CANDIDATE
                    </button>
                ) : (
                    <div className="text-[11px] text-mwk font-bold">MAX 20 CANDIDATES REACHED</div>
                )}
                
                <ExcelVisitorUpload 
                    type="interviewee" 
                    onImportInterviewees={onImportInterviewees} 
                />
            </div>
            
            {interviewees.map((candidate, idx) => (
                <div key={idx} className={`relative mb-4 flex gap-3 items-center pb-4 ${interviewees.length > 1 ? 'border-b border-dashed border-slate-200' : ''}`}>
                    <div className="w-[95px] shrink-0 whitespace-nowrap">
                        <span className="text-[12px] font-bold text-slate-500 whitespace-nowrap">CANDIDATE {idx + 1}</span>
                    </div>
                    <div className="flex-[1.2] flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Name <span className="text-mwk">*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="Candidate name" 
                            value={candidate.name} 
                            onChange={(e) => handleChange(idx, 'name', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'name')} 
                            className="capitalize" 
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Job Title <span className="text-mwk">*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="e.g. Engineer" 
                            value={candidate.jobTitle} 
                            onChange={(e) => handleChange(idx, 'jobTitle', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'jobTitle')} 
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Department <span className="text-mwk">*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="e.g. IT / QA" 
                            value={candidate.interviewDepartment} 
                            onChange={(e) => handleChange(idx, 'interviewDepartment', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'interviewDepartment')} 
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Interviewer <span className="text-mwk">*</span></label>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="Interviewer name" 
                            value={candidate.interviewerName} 
                            onChange={(e) => handleChange(idx, 'interviewerName', e.target.value)} 
                            onBlur={() => handleBlur(idx, 'interviewerName')} 
                            className="capitalize" 
                        />
                    </div>
                    {interviewees.length > 1 ? (
                        <div className="w-[55px] shrink-0 text-right">
                            <button 
                                type="button" 
                                onClick={() => onRemoveInterviewee(idx)} 
                                className="text-red-500 bg-transparent text-[11px] font-bold cursor-pointer"
                            >
                                REMOVE
                            </button>
                        </div>
                    ) : (
                        <div className="w-[55px] shrink-0"></div>
                    )}
                </div>
            ))}
        </>
    );
};
