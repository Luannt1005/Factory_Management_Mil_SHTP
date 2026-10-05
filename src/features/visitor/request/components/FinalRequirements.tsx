'use client';

import React from 'react';
import type { VisitorRequestDetails } from '@/types/visitor-request.types';
import { InputLabel, SectionHeader, FormInput } from './FormControls';

export interface FinalRequirementsProps {
    details: VisitorRequestDetails;
    onUpdateDetail: (key: string, value: string) => void;
}

export const FinalRequirements: React.FC<FinalRequirementsProps> = ({
    details,
    onUpdateDetail
}) => {
    return (
        <>
            <SectionHeader title="Final Requirements" />
            <div className="grid grid-cols-[1fr_1fr] gap-y-4 gap-x-8">
                <div>
                    <InputLabel>Factory Tour Requested?</InputLabel>
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => onUpdateDetail('factoryTour', 'Yes')} 
                            className={`flex-1 p-2.5 rounded-md border border-slate-200 font-bold text-[12px] cursor-pointer ${details.factoryTour === 'Yes' ? 'bg-mwk text-white' : 'bg-white text-slate-600'}`}
                        >
                            YES
                        </button>
                        <button 
                            type="button" 
                            onClick={() => onUpdateDetail('factoryTour', 'No')} 
                            className={`flex-1 p-2.5 rounded-md border border-slate-200 font-bold text-[12px] cursor-pointer ${details.factoryTour === 'No' ? 'bg-mwk text-white' : 'bg-white text-slate-600'}`}
                        >
                            NO
                        </button>
                    </div>
                </div>
                <div>
                    <InputLabel>Meal Registration?</InputLabel>
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => onUpdateDetail('mealRegistration', 'Yes')} 
                            className={`flex-1 p-2.5 rounded-md border border-slate-200 font-bold text-[12px] cursor-pointer ${details.mealRegistration === 'Yes' ? 'bg-mwk text-white' : 'bg-white text-slate-600'}`}
                        >
                            YES
                        </button>
                        <button 
                            type="button" 
                            onClick={() => onUpdateDetail('mealRegistration', 'No')} 
                            className={`flex-1 p-2.5 rounded-md border border-slate-200 font-bold text-[12px] cursor-pointer ${details.mealRegistration === 'No' ? 'bg-mwk text-white' : 'bg-white text-slate-600'}`}
                        >
                            NO
                        </button>
                    </div>
                </div>
                {details.mealRegistration === 'Yes' && (
                    <div>
                        <InputLabel required>Charged Cost Center</InputLabel>
                        <FormInput 
                            type="text" 
                            required 
                            placeholder="000-00-0000" 
                            value={details.costCenter || ''} 
                            onChange={(e) => onUpdateDetail('costCenter', e.target.value)} 
                        />
                    </div>
                )}
            </div>
        </>
    );
};
