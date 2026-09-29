'use client';

import React from 'react';
import { InputLabel, FormInput } from './FormControls';

export interface GeneralVisitDetailsProps {
    visitingSite: string;
    purposeOfVisit: string;
    startDate: string;
    endDate: string;
    purposeDetail: string;
    todayStr: string;
    maxEndDateStr?: string;
    isVendorOrContractor: boolean;
    isExpatCategory: boolean;
    visitorCategory: string;
    onToggleSite: (site: string) => void;
    onPurposeChange: (purpose: string) => void;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onPurposeDetailChange: (detail: string) => void;
}

export const GeneralVisitDetails: React.FC<GeneralVisitDetailsProps> = ({
    visitingSite,
    purposeOfVisit,
    startDate,
    endDate,
    purposeDetail,
    todayStr,
    maxEndDateStr,
    isVendorOrContractor,
    isExpatCategory,
    visitorCategory,
    onToggleSite,
    onPurposeChange,
    onStartDateChange,
    onEndDateChange,
    onPurposeDetailChange
}) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            <div>
                <InputLabel required>Visiting Site</InputLabel>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div 
                        onClick={() => onToggleSite('SHTP')}
                        style={{ 
                            flex: 1, 
                            padding: '12px', 
                            textAlign: 'center', 
                            border: (visitingSite === 'SHTP' || visitingSite === 'SHTP/DDK') ? '2px solid #db011c' : '1px solid #e2e8f0', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            backgroundColor: (visitingSite === 'SHTP' || visitingSite === 'SHTP/DDK') ? '#fff5f5' : 'white', 
                            fontWeight: 700, 
                            fontSize: '13px' 
                        }}
                    >
                        SHTP
                    </div>
                    <div 
                        onClick={() => onToggleSite('DDK')}
                        style={{ 
                            flex: 1, 
                            padding: '12px', 
                            textAlign: 'center', 
                            border: (visitingSite === 'DDK' || visitingSite === 'SHTP/DDK') ? '2px solid #db011c' : '1px solid #e2e8f0', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            backgroundColor: (visitingSite === 'DDK' || visitingSite === 'SHTP/DDK') ? '#fff5f5' : 'white', 
                            fontWeight: 700, 
                            fontSize: '13px' 
                        }}
                    >
                        DDK
                    </div>
                </div>
            </div>
            <div>
                <InputLabel required>Purpose of Visit</InputLabel>
                <select 
                    required
                    value={purposeOfVisit}
                    onChange={e => onPurposeChange(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' }}
                >
                    <option>Business / Meeting</option>
                    <option>Installation & Maintenance</option>
                    <option>Technical Support</option>
                    <option>Audit / Inspection</option>
                </select>
            </div>
            <div>
                <InputLabel required>Start Date</InputLabel>
                <FormInput 
                    type="date" 
                    required 
                    min={todayStr} 
                    value={startDate} 
                    onChange={(e) => onStartDateChange(e.target.value)} 
                />
            </div>
            <div>
                <InputLabel required>End Date</InputLabel>
                <FormInput 
                    type="date" 
                    required 
                    min={startDate || todayStr} 
                    max={maxEndDateStr} 
                    value={endDate} 
                    onChange={(e) => onEndDateChange(e.target.value)} 
                />
                {isVendorOrContractor && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        * Tối đa 7 ngày làm việc tính từ Start Date (Max 7 working days)
                    </div>
                )}
                {isExpatCategory && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        * Tối đa 6 tháng tính từ Start Date (Max 6 months)
                    </div>
                )}
            </div>
            {(visitorCategory === 'Vendor' || visitorCategory === 'Contractor') && (
                <div style={{ gridColumn: '1 / -1' }}>
                    <InputLabel required>Scope of Work / Purpose Detail</InputLabel>
                    <textarea 
                        rows={3}
                        required
                        placeholder="Describe the reason for visit..."
                        value={purposeDetail}
                        onChange={(e) => onPurposeDetailChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', resize: 'vertical' }}
                    />
                </div>
            )}
        </div>
    );
};
