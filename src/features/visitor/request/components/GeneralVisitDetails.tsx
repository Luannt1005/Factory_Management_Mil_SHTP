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
        <div className="grid grid-cols-[1fr_1fr] gap-y-4 gap-x-8">
            <div>
                <InputLabel required>Visiting Site</InputLabel>
                <div className="flex gap-4">
                    <div 
                        onClick={() => onToggleSite('SHTP')}
                        className={`flex-1 p-3 text-center rounded-md cursor-pointer font-bold text-[13px] ${(visitingSite === 'SHTP' || visitingSite === 'SHTP/DDK') ? 'border-2 border-mwk bg-mwk-soft' : 'border border-slate-200 bg-white'}`}
                    >
                        SHTP
                    </div>
                    <div 
                        onClick={() => onToggleSite('DDK')}
                        className={`flex-1 p-3 text-center rounded-md cursor-pointer font-bold text-[13px] ${(visitingSite === 'DDK' || visitingSite === 'SHTP/DDK') ? 'border-2 border-mwk bg-mwk-soft' : 'border border-slate-200 bg-white'}`}
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
                    className="w-full py-2.5 px-3 rounded-md border border-slate-200 text-[14px] bg-slate-50 outline-none"
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
                    <div className="text-[11px] text-slate-500 mt-1">
                        * Tối đa 7 ngày làm việc tính từ Start Date (Max 7 working days)
                    </div>
                )}
                {isExpatCategory && (
                    <div className="text-[11px] text-slate-500 mt-1">
                        * Tối đa 6 tháng tính từ Start Date (Max 6 months)
                    </div>
                )}
            </div>
            {(visitorCategory === 'Vendor' || visitorCategory === 'Contractor') && (
                <div className="col-span-full">
                    <InputLabel required>Scope of Work / Purpose Detail</InputLabel>
                    <textarea 
                        rows={3}
                        required
                        placeholder="Describe the reason for visit..."
                        value={purposeDetail}
                        onChange={(e) => onPurposeDetailChange(e.target.value)}
                        className="w-full py-2.5 px-3 rounded-md border border-slate-200 text-[14px] bg-slate-50 outline-none resize-y"
                    />
                </div>
            )}
        </div>
    );
};
