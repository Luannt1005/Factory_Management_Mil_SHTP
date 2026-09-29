'use client';

import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import type { VisitorInfo, IntervieweeInfo } from '@/types/visitor-request.types';
import { formatName, capitalizeWords } from '../utils/formatters';

export interface ExcelVisitorUploadProps {
    type: 'visitor' | 'interviewee';
    onImportVisitors?: (visitors: VisitorInfo[]) => void;
    onImportInterviewees?: (interviewees: IntervieweeInfo[]) => void;
}

interface RawExcelRow {
    [key: string]: string | number | undefined;
}

export const ExcelVisitorUpload: React.FC<ExcelVisitorUploadProps> = ({
    type,
    onImportVisitors,
    onImportInterviewees
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = () => {
        if (type === 'visitor') {
            const worksheet = XLSX.utils.json_to_sheet([
                { 'Full Name': 'Nguyen Van A', 'Company': 'TTI VN', 'Title': 'Software Engineer' },
                { 'Full Name': 'Tran Thi B', 'Company': 'TTI VN', 'Title': 'Project Manager' }
            ]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitors');
            XLSX.writeFile(workbook, 'Visitor_Information_Template.xlsx');
        } else {
            const worksheet = XLSX.utils.json_to_sheet([
                { 'Interviewee Name': 'Nguyen Van A', 'Job Title': 'Software Engineer', 'Department': 'IT', 'Interviewer Name': 'Le Van C' },
                { 'Interviewee Name': 'Tran Thi B', 'Job Title': 'Quality Inspector', 'Department': 'QA', 'Interviewer Name': 'Pham Van D' }
            ]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Interviewees');
            XLSX.writeFile(workbook, 'Interviewee_Registration_Template.xlsx');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json<RawExcelRow>(worksheet);

                if (type === 'visitor') {
                    const newVisitors: VisitorInfo[] = jsonData.map(row => ({
                        name: formatName(String(row['Full Name'] || '')),
                        company: capitalizeWords(String(row['Company'] || '')),
                        title: capitalizeWords(String(row['Title'] || ''))
                    })).filter(v => v.name);

                    if (newVisitors.length > 0) {
                        onImportVisitors?.(newVisitors.slice(0, 15));
                        alert(`Successfully imported ${Math.min(newVisitors.length, 15)} visitors from Excel.`);
                    } else {
                        alert('No valid visitor data found in the Excel file. Please use the provided template.');
                    }
                } else {
                    const newInterviewees: IntervieweeInfo[] = jsonData.map(row => ({
                        name: formatName(String(row['Interviewee Name'] || row['Candidate Name'] || row['Full Name'] || row['Name'] || '')),
                        jobTitle: capitalizeWords(String(row['Job Title'] || row['Applied Job Title'] || row['Position'] || row['Title'] || '')),
                        interviewDepartment: capitalizeWords(String(row['Department'] || row['Interview Department'] || row['Dept'] || '')),
                        interviewerName: formatName(String(row['Interviewer Name'] || row['Interviewer'] || ''))
                    })).filter(v => v.name);

                    if (newInterviewees.length > 0) {
                        onImportInterviewees?.(newInterviewees.slice(0, 20));
                        alert(`Successfully imported ${Math.min(newInterviewees.length, 20)} candidates from Excel.`);
                    } else {
                        alert('No valid candidate data found in the Excel file. Please use the provided template.');
                    }
                }
            } catch (err) {
                console.error(err);
                alert('Error parsing Excel file. Please ensure you are using the correct template format.');
            }
        };
        reader.readAsArrayBuffer(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                type="button" 
                onClick={downloadTemplate} 
                style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                DOWNLOAD TEMPLATE
            </button>
            
            <input 
                type="file" 
                accept=".xlsx, .xls" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
            />
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                UPLOAD EXCEL
            </button>
        </div>
    );
};
