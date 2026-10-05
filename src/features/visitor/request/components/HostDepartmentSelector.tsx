'use client';

import React from 'react';
import type { HostDepartment } from '@/types/rooms.types';
import { InputLabel, SectionHeader } from './FormControls';

export interface HostDepartmentSelectorProps {
    hostDepartments: HostDepartment[];
    bu: string;
    functionalDept: string;
    department: string;
    onBuChange: (bu: string) => void;
    onFunctionalDeptChange: (functionalDept: string) => void;
    onDepartmentChange: (department: string) => void;
}

export const HostDepartmentSelector: React.FC<HostDepartmentSelectorProps> = ({
    hostDepartments,
    bu,
    functionalDept,
    department,
    onBuChange,
    onFunctionalDeptChange,
    onDepartmentChange
}) => {
    const selectedHost = hostDepartments.find(
        h => h.functional_dept === functionalDept && h.department === department
    );

    return (
        <>
            <SectionHeader title="Host Department" />
            <div className={"grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5"}>
                <div>
                    <InputLabel required>BU</InputLabel>
                    <select 
                        required
                        value={bu}
                        onChange={e => onBuChange(e.target.value)}
                        className="w-full py-2.5 px-3 rounded-md border border-slate-200 text-[14px] bg-slate-50 outline-none"
                    >
                        <option value="" disabled>Select BU</option>
                        {[...new Set(hostDepartments.map(h => h.bu).filter(Boolean))].map(b => (
                            <option key={b as string} value={b as string}>{b as string}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <InputLabel required>Functional Dept</InputLabel>
                    <select 
                        required
                        value={functionalDept}
                        onChange={e => onFunctionalDeptChange(e.target.value)}
                        disabled={!bu}
                        className={`w-full py-2.5 px-3 rounded-md border border-slate-200 text-[14px] bg-slate-50 outline-none ${bu ? 'opacity-100' : 'opacity-50'}`}
                    >
                        <option value="" disabled>Select Functional Dept</option>
                        {[...new Set(hostDepartments.filter(h => h.bu === bu).map(h => h.functional_dept).filter(Boolean))].map(dept => (
                            <option key={dept as string} value={dept as string}>{dept as string}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <InputLabel required>Department</InputLabel>
                    <select 
                        required
                        value={department}
                        onChange={e => onDepartmentChange(e.target.value)}
                        disabled={!functionalDept}
                        className={`w-full py-2.5 px-3 rounded-md border border-slate-200 text-[14px] bg-slate-50 outline-none ${functionalDept ? 'opacity-100' : 'opacity-50'}`}
                    >
                        <option value="" disabled>Select Department</option>
                        {hostDepartments.filter(h => h.functional_dept === functionalDept).map((h, i) => (
                            <option key={i} value={h.department}>{h.department}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            {selectedHost && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col gap-2 text-[13px]">
                    <div>
                        <span className="text-slate-500 font-semibold">Func Host Name:</span>
                        <span className="text-slate-900 font-bold ml-1">{selectedHost.functional_host_name || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 font-semibold">Dept Host Name:</span>
                        <span className="text-slate-900 font-bold ml-1">{selectedHost.department_host_name || 'N/A'}</span>
                    </div>
                </div>
            )}
        </>
    );
};
