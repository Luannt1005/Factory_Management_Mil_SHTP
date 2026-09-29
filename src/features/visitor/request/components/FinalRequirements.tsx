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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                <div>
                    <InputLabel>Factory Tour Requested?</InputLabel>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            type="button" 
                            onClick={() => onUpdateDetail('factoryTour', 'Yes')} 
                            style={{ 
                                flex: 1, 
                                padding: '10px', 
                                borderRadius: '6px', 
                                border: '1px solid #e2e8f0', 
                                backgroundColor: details.factoryTour === 'Yes' ? '#db011c' : 'white', 
                                color: details.factoryTour === 'Yes' ? 'white' : '#475569', 
                                fontWeight: 700, 
                                fontSize: '12px', 
                                cursor: 'pointer' 
                            }}
                        >
                            YES
                        </button>
                        <button 
                            type="button" 
                            onClick={() => onUpdateDetail('factoryTour', 'No')} 
                            style={{ 
                                flex: 1, 
                                padding: '10px', 
                                borderRadius: '6px', 
                                border: '1px solid #e2e8f0', 
                                backgroundColor: details.factoryTour === 'No' ? '#db011c' : 'white', 
                                color: details.factoryTour === 'No' ? 'white' : '#475569', 
                                fontWeight: 700, 
                                fontSize: '12px', 
                                cursor: 'pointer' 
                            }}
                        >
                            NO
                        </button>
                    </div>
                </div>
                <div>
                    <InputLabel>Meal Registration?</InputLabel>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            type="button" 
                            onClick={() => onUpdateDetail('mealRegistration', 'Yes')} 
                            style={{ 
                                flex: 1, 
                                padding: '10px', 
                                borderRadius: '6px', 
                                border: '1px solid #e2e8f0', 
                                backgroundColor: details.mealRegistration === 'Yes' ? '#db011c' : 'white', 
                                color: details.mealRegistration === 'Yes' ? 'white' : '#475569', 
                                fontWeight: 700, 
                                fontSize: '12px', 
                                cursor: 'pointer' 
                            }}
                        >
                            YES
                        </button>
                        <button 
                            type="button" 
                            onClick={() => onUpdateDetail('mealRegistration', 'No')} 
                            style={{ 
                                flex: 1, 
                                padding: '10px', 
                                borderRadius: '6px', 
                                border: '1px solid #e2e8f0', 
                                backgroundColor: details.mealRegistration === 'No' ? '#db011c' : 'white', 
                                color: details.mealRegistration === 'No' ? 'white' : '#475569', 
                                fontWeight: 700, 
                                fontSize: '12px', 
                                cursor: 'pointer' 
                            }}
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
