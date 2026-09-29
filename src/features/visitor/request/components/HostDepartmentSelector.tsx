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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                    <InputLabel required>BU</InputLabel>
                    <select 
                        required
                        value={bu}
                        onChange={e => onBuChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' }}
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
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', opacity: bu ? 1 : 0.5 }}
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
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', opacity: functionalDept ? 1 : 0.5 }}
                    >
                        <option value="" disabled>Select Department</option>
                        {hostDepartments.filter(h => h.functional_dept === functionalDept).map((h, i) => (
                            <option key={i} value={h.department}>{h.department}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            {selectedHost && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Func Host Name:</span>
                        <span style={{ color: '#0f172a', fontWeight: 700, marginLeft: '4px' }}>{selectedHost.functional_host_name || 'N/A'}</span>
                    </div>
                    <div>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Dept Host Name:</span>
                        <span style={{ color: '#0f172a', fontWeight: 700, marginLeft: '4px' }}>{selectedHost.department_host_name || 'N/A'}</span>
                    </div>
                </div>
            )}
        </>
    );
};
