'use client';

import { useState, useEffect, useRef } from 'react';
import MeetingRoomCascader from '@/components/MeetingRoomCascader';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, BuildingOffice2Icon, GlobeAsiaAustraliaIcon, UserGroupIcon, BuildingOfficeIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Dashboard from '../visitordashboard/page';
import * as XLSX from 'xlsx';
import { useSession } from 'next-auth/react';

const InputLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', marginTop: '8px' }}>
        {children}
        {required && <span style={{ color: '#db011c', marginLeft: '4px' }}>*</span>}
    </label>
);

const Input = (props: any) => (
    <input 
        {...props} 
        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', color: '#1e293b', outline: 'none' }}
        onFocus={(e) => e.target.style.borderColor = '#db011c'}
        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        onClick={(e) => {
            if (props.type === 'date' || props.type === 'time') {
                try {
                    (e.target as any).showPicker();
                } catch (err) {}
            }
            if (props.onClick) props.onClick(e);
        }}
    />
);

const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ borderBottom: '1.5px solid #db011c', marginBottom: '24px', marginTop: '40px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'inline-block' }}>
            {title}
        </h2>
    </div>
);

export default function NewRequestPage() {
    const { data: session } = useSession();
    const appRoleNames = (session?.user as any)?.app_role_names || [];
    const isAdmin = (session?.user as any)?.role === 'admin';
    const isHrVisitor = appRoleNames.includes('Hr Visitor') || isAdmin;
    const isSecurity = appRoleNames.includes('Security') && !isAdmin && !isHrVisitor;
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'request' | 'dashboard'>('request');
    const [rooms, setRooms] = useState<any[]>([]);
    const [hostDepartments, setHostDepartments] = useState<any[]>([]);
    const [meetingRooms, setMeetingRooms] = useState<any[]>([]);
    const [step, setStep] = useState(1);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervieweeFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [formData, setFormData] = useState({
        visitors: [{ name: '', title: '', company: '' }],
        interviewees: [{ name: '', jobTitle: '', interviewDepartment: '', interviewerName: '' }],
        startDate: '',
        endDate: '',
        purposeOfVisit: 'Business / Meeting',
        visitorCategory: '',
        visitingSite: 'SHTP',
        purposeDetail: '',
        details: {
            factoryTour: 'No',
            mealRegistration: 'No',
            costCenter: ''
        },
        roomIds: [] as string[],
        intervieweeName: '',
        jobTitle: '',
        interviewDepartment: '',
        interviewerName: '',
        startTime: '',
        interviewArea: '',
        bu: '',
        functionalDept: '',
        department: ''
    });

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await fetch('/api/admin/rooms');
                if (res.ok) {
                    const data = await res.json();
                    setRooms(data.rooms);
                }
            } catch (err) {
                console.error("Failed to fetch rooms", err);
            }
        };
        const fetchMeetingRooms = async () => {
        try {
            const res = await fetch('/api/admin/meeting-rooms');
            if (res.ok) {
                const data = await res.json();
                setMeetingRooms(data.meetingRooms || []);
            }
        } catch (error) {
            console.error('Failed to fetch meeting rooms:', error);
        }
    };

    const fetchHostDepartments = async () => {
            try {
                const res = await fetch('/api/admin/host-departments?all=false');
                if (res.ok) {
                    const data = await res.json();
                    setHostDepartments(data.hostDepartments);
                }
            } catch (err) {}
        };
        fetchRooms();
        fetchHostDepartments();
        fetchMeetingRooms();
    }, []);

    useEffect(() => {
        if (formData.visitorCategory !== 'MIL/TTI Expat / SHTP Business trip') {
            setFormData(prev => ({ ...prev, roomIds: [] }));
        }
    }, [formData.visitorCategory]);

    useEffect(() => {
        if (rooms.length > 0 && formData.roomIds.length > 0) {
            setFormData(prev => {
                const validRoomIds = prev.roomIds.filter(id => {
                    const room = rooms.find(r => r.id === id);
                    if (!room) return false;
                    if (prev.visitingSite === 'SHTP/DDK') return true;
                    return room.site_location === prev.visitingSite;
                });
                if (validRoomIds.length !== prev.roomIds.length) {
                    return { ...prev, roomIds: validRoomIds };
                }
                return prev;
            });
        }
    }, [formData.visitingSite, rooms]);

    useEffect(() => {
        if (isSecurity && !formData.visitorCategory) {
            setFormData(prev => ({ ...prev, visitorCategory: 'Interviewee' }));
        }
    }, [isSecurity, formData.visitorCategory]);

    const handleSubmit = async () => {
        if (isSecurity && formData.visitorCategory !== 'Interviewee') {
            alert("Security role is only authorized to submit Interviewee requests.");
            return;
        }
        setLoading(true);
        try {
            const isInterviewee = formData.visitorCategory === 'Interviewee';
            const visitorsList = isInterviewee
                ? formData.interviewees.map(c => ({
                    name: c.name,
                    title: c.jobTitle,
                    company: c.interviewDepartment || 'Candidate',
                    interviewDepartment: c.interviewDepartment,
                    interviewerName: c.interviewerName
                }))
                : formData.visitors;

            const payload = {
                ...formData,
                visitors: visitorsList,
                visitorName: visitorsList[0]?.name || '',
                visitorTitle: visitorsList[0]?.title || '',
                currentCompany: isInterviewee ? 'Candidate' : (visitorsList[0]?.company || ''),
                purposeOfVisit: isInterviewee ? 'Interview' : formData.purposeOfVisit,
                purposeDetail: isInterviewee ? formData.interviewArea : formData.purposeDetail,
                endDate: isInterviewee ? formData.startDate : formData.endDate,
                details: {
                    ...formData.details,
                    startTime: formData.startTime,
                    interviewArea: formData.interviewArea
                }
            };

            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                alert('Registration successful!');
                setStep(1);
                setFormData({
                    visitors: [{ name: '', title: '', company: '' }],
                    interviewees: [{ name: '', jobTitle: '', interviewDepartment: '', interviewerName: '' }],
                    startDate: '',
                    endDate: '',
                    purposeOfVisit: 'Business / Meeting',
                    visitorCategory: '',
                    visitingSite: 'SHTP',
                    purposeDetail: '',
                    details: { factoryTour: 'No', mealRegistration: 'No', costCenter: '' },
                    roomIds: [],
                    intervieweeName: '',
                    jobTitle: '',
                    interviewDepartment: '',
                    interviewerName: '',
                    startTime: '',
                    interviewArea: '',
                    bu: '',
                    functionalDept: '',
                    department: ''
                });
                if (isInterviewee) {
                    router.push('/visitordashboard?tab=interviewee');
                } else {
                    router.push('/visitordashboard?tab=general');
                }
            } else {
                const error = await res.json();
                alert(`Lỗi: ${error.error}`);
            }
        } catch (err) {
            alert('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const addVisitor = () => {
        if (formData.visitors.length < 15) {
            setFormData(prev => ({
                ...prev,
                visitors: [...prev.visitors, { name: '', title: '', company: '' }]
            }));
        }
    };

    const removeVisitor = (index: number) => {
        if (formData.visitors.length > 1) {
            setFormData(prev => ({
                ...prev,
                visitors: prev.visitors.filter((_, i) => i !== index)
            }));
        }
    };

    const addInterviewee = () => {
        if (formData.interviewees.length < 20) {
            setFormData(prev => ({
                ...prev,
                interviewees: [...prev.interviewees, { name: '', jobTitle: '', interviewDepartment: '', interviewerName: '' }]
            }));
        }
    };

    const removeInterviewee = (index: number) => {
        if (formData.interviewees.length > 1) {
            setFormData(prev => ({
                ...prev,
                interviewees: prev.interviewees.filter((_, i) => i !== index)
            }));
        }
    };

    const formatName = (str: string) => {
        if (!str) return '';
        // Remove special characters, numbers, symbols, keeping only letters and spaces
        const clean = str.replace(/[^\p{L}\s]/gu, '');
        // Capitalize first letter of each word and lowercase the rest
        return clean.replace(/(\p{L}+)/gu, (match) => {
            return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
        });
    };

    const capitalizeWords = (str: string) => {
        if (!str) return str;
        return str.replace(/(\p{L}+)/gu, (match) => {
            return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
        });
    };

    const updateInterviewee = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newInterviewees = [...prev.interviewees];
            let processedValue = value;
            if (typeof value === 'string') {
                if (field === 'name' || field === 'interviewerName') {
                    processedValue = formatName(value);
                } else {
                    processedValue = capitalizeWords(value);
                }
            }
            newInterviewees[index] = { ...newInterviewees[index], [field]: processedValue };
            return { ...prev, interviewees: newInterviewees };
        });
    };

    const downloadTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            { 'Full Name': 'Nguyen Van A', 'Company': 'TTI VN', 'Title': 'Software Engineer' },
            { 'Full Name': 'Tran Thi B', 'Company': 'TTI VN', 'Title': 'Project Manager' }
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitors');
        XLSX.writeFile(workbook, 'Visitor_Information_Template.xlsx');
    };

    const downloadIntervieweeTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            { 'Interviewee Name': 'Nguyen Van A', 'Job Title': 'Software Engineer', 'Department': 'IT', 'Interviewer Name': 'Le Van C' },
            { 'Interviewee Name': 'Tran Thi B', 'Job Title': 'Quality Inspector', 'Department': 'QA', 'Interviewer Name': 'Pham Van D' }
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Interviewees');
        XLSX.writeFile(workbook, 'Interviewee_Registration_Template.xlsx');
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
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                const newVisitors = jsonData.map(row => ({
                    name: formatName(row['Full Name'] || ''),
                    company: capitalizeWords(row['Company'] || ''),
                    title: capitalizeWords(row['Title'] || '')
                })).filter(v => v.name);

                if (newVisitors.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        visitors: newVisitors.slice(0, 15) // Limit to max 15
                    }));
                    alert(`Successfully imported ${Math.min(newVisitors.length, 15)} visitors from Excel.`);
                } else {
                    alert('No valid visitor data found in the Excel file. Please use the provided template.');
                }
            } catch (err) {
                console.error(err);
                alert('Error parsing Excel file. Please ensure you are using the correct template format.');
            }
        };
        reader.readAsArrayBuffer(file);
        
        // Reset file input so the same file can be uploaded again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleIntervieweeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                const newInterviewees = jsonData.map(row => ({
                    name: formatName(row['Interviewee Name'] || row['Candidate Name'] || row['Full Name'] || row['Name'] || ''),
                    jobTitle: capitalizeWords(row['Job Title'] || row['Applied Job Title'] || row['Position'] || row['Title'] || ''),
                    interviewDepartment: capitalizeWords(row['Department'] || row['Interview Department'] || row['Dept'] || ''),
                    interviewerName: formatName(row['Interviewer Name'] || row['Interviewer'] || '')
                })).filter(v => v.name);

                if (newInterviewees.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        interviewees: newInterviewees.slice(0, 20) // Limit to max 20
                    }));
                    alert(`Successfully imported ${Math.min(newInterviewees.length, 20)} candidates from Excel.`);
                } else {
                    alert('No valid candidate data found in the Excel file. Please use the provided template.');
                }
            } catch (err) {
                console.error(err);
                alert('Error parsing Excel file. Please ensure you are using the correct template format.');
            }
        };
        reader.readAsArrayBuffer(file);
        if (intervieweeFileInputRef.current) {
            intervieweeFileInputRef.current.value = '';
        }
    };

    const updateVisitor = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newVisitors = [...prev.visitors];
            let processedValue = value;
            if (typeof value === 'string') {
                if (field === 'name') {
                    processedValue = formatName(value);
                } else {
                    processedValue = capitalizeWords(value);
                }
            }
            newVisitors[index] = { ...newVisitors[index], [field]: processedValue };
            return { ...prev, visitors: newVisitors };
        });
    };

    const toggleSite = (site: string) => {
        setFormData(prev => {
            const isSHTP = prev.visitingSite === 'SHTP' || prev.visitingSite === 'SHTP/DDK';
            const isDDK = prev.visitingSite === 'DDK' || prev.visitingSite === 'SHTP/DDK';

            let nextSHTP = isSHTP;
            let nextDDK = isDDK;

            if (site === 'SHTP') nextSHTP = !isSHTP;
            else nextDDK = !isDDK;

            if (!nextSHTP && !nextDDK) return prev;

            let nextVal = 'SHTP';
            if (nextSHTP && nextDDK) nextVal = 'SHTP/DDK';
            else if (nextDDK) nextVal = 'DDK';

            return { ...prev, visitingSite: nextVal };
        });
    };

    const updateDetails = (key: string, value: any) => {
        setFormData({ ...formData, details: { ...formData.details, [key]: value } });
    };

    const toggleRoom = (id: string) => {
        setFormData(prev => ({
            ...prev,
            roomIds: prev.roomIds.includes(id)
                ? prev.roomIds.filter(rid => rid !== id)
                : [...prev.roomIds, id]
        }));
    };

    const isExpatCategory = formData.visitorCategory === 'MIL/TTI Expat / SHTP Business trip';

    // Calculate date limits
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    // Vendor/Contractor max end date (7 working days from today)
    const addWorkingDays = (startDate: Date, days: number) => {
        let date = new Date(startDate);
        let addedDays = 0;
        while (addedDays < days) {
            date.setDate(date.getDate() + 1);
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                addedDays++;
            }
        }
        return date;
    };
    
    let maxEndDateStr = undefined;
    if (formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor' || formData.visitorCategory === 'Vendor/Contractor') {
        const maxDate = addWorkingDays(today, 7);
        maxEndDateStr = maxDate.getFullYear() + '-' + String(maxDate.getMonth() + 1).padStart(2, '0') + '-' + String(maxDate.getDate()).padStart(2, '0');
    } else if (isExpatCategory) {
        const maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + 6);
        maxEndDateStr = maxDate.getFullYear() + '-' + String(maxDate.getMonth() + 1).padStart(2, '0') + '-' + String(maxDate.getDate()).padStart(2, '0');
    }

    return (
        <div className="w-full">
            <div className="w-full mx-auto">
                
                {activeTab === 'request' ? (
                    <>
                        <div style={{ marginBottom: '12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Select visitor category to begin registration
                        </div>
                        
                        {/* Category Selection Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { id: 'Vendor/Contractor', label: 'VENDOR / CONTRACTOR', desc: 'Suppliers, service providers & contractors' },
                                { id: 'MIL/TTI Expat / SHTP Business trip', label: 'MIL / TTI EXPAT', desc: 'Milwaukee & TTI overseas employees' },
                                { id: 'Interviewee', label: 'INTERVIEWEE', desc: 'Job candidates visiting for interview' }
                            ].map(cat => {
                                const isActive = formData.visitorCategory === cat.id || (cat.id === 'Vendor/Contractor' && (formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor'));
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
                                                setFormData({...formData, visitorCategory: 'Vendor'});
                                            } else {
                                                setFormData({...formData, visitorCategory: cat.id});
                                            }
                                        }}
                                        style={{
                                            cursor: isDisabled ? 'not-allowed' : 'pointer', padding: '20px', borderRadius: '8px', backgroundColor: isActive ? '#fff5f5' : (isDisabled ? '#f8fafc' : 'white'), 
                                            border: isActive ? '1px solid #db011c' : '1px solid #e2e8f0',
                                            textAlign: 'center', transition: 'all 0.2s', opacity: isDisabled ? 0.45 : 1,
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

                        {/* Form Container */}
                        {formData.visitorCategory && (
                            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                {/* Active Category Badge */}
                                <div style={{ display: 'inline-block', backgroundColor: '#db011c', color: 'white', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '4px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {(formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor' || formData.visitorCategory === 'Vendor/Contractor') ? 'VENDOR / CONTRACTOR' : formData.visitorCategory === 'Interviewee' ? 'INTERVIEWEE' : 'MIL / TTI EXPAT'}
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); setShowReviewModal(true); }}>
                                    
                                    {/* VISITOR INFORMATION */}
                                    <SectionHeader title="Visitor Information" />
                                    <div style={{ fontSize: '13px', color: '#ef4444', fontStyle: 'italic', marginBottom: '20px', marginTop: '-12px', fontWeight: 500 }}>
                                        * Note: Please enter the name exactly as shown on the ID/Passport, including Vietnamese diacritics where applicable. We are not responsible for incorrect information.
                                    </div>
                                    
                                    {formData.visitorCategory === 'Interviewee' ? (
                                        <>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                {formData.interviewees.length < 20 ? (
                                                    <button type="button" onClick={addInterviewee} style={{ backgroundColor: 'transparent', color: '#db011c', border: '1px solid #db011c', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                                        + ADD ANOTHER CANDIDATE
                                                    </button>
                                                ) : (
                                                    <div style={{ fontSize: '11px', color: '#db011c', fontWeight: 700 }}>MAX 20 CANDIDATES REACHED</div>
                                                )}
                                                
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button type="button" onClick={downloadIntervieweeTemplate} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                        </svg>
                                                        DOWNLOAD TEMPLATE
                                                    </button>
                                                    
                                                    <input 
                                                        type="file" 
                                                        accept=".xlsx, .xls" 
                                                        ref={intervieweeFileInputRef} 
                                                        onChange={handleIntervieweeFileUpload} 
                                                        style={{ display: 'none' }} 
                                                        />
                                                    <button type="button" onClick={() => intervieweeFileInputRef.current?.click()} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                                        </svg>
                                                        UPLOAD EXCEL
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {formData.interviewees.map((candidate, idx) => (
                                                <div key={idx} style={{ position: 'relative', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: formData.interviewees.length > 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: '16px' }}>
                                                    <div style={{ width: '95px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>CANDIDATE {idx + 1}</span>
                                                    </div>
                                                    <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Name <span style={{ color: '#db011c' }}>*</span></label>
                                                        <Input type="text" required placeholder="Candidate name" value={candidate.name} onChange={(e: any) => updateInterviewee(idx, 'name', e.target.value)} />
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Job Title <span style={{ color: '#db011c' }}>*</span></label>
                                                        <Input type="text" required placeholder="e.g. Engineer" value={candidate.jobTitle} onChange={(e: any) => updateInterviewee(idx, 'jobTitle', e.target.value)} />
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Department <span style={{ color: '#db011c' }}>*</span></label>
                                                        <Input type="text" required placeholder="e.g. IT / QA" value={candidate.interviewDepartment} onChange={(e: any) => updateInterviewee(idx, 'interviewDepartment', e.target.value)} />
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Interviewer <span style={{ color: '#db011c' }}>*</span></label>
                                                        <Input type="text" required placeholder="Interviewer name" value={candidate.interviewerName} onChange={(e: any) => updateInterviewee(idx, 'interviewerName', e.target.value)} />
                                                    </div>
                                                    {formData.interviewees.length > 1 ? (
                                                        <div style={{ width: '55px', flexShrink: 0, textAlign: 'right' }}>
                                                            <button type="button" onClick={() => removeInterviewee(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>REMOVE</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ width: '55px', flexShrink: 0 }}></div>
                                                    )}
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                {formData.visitors.length < 15 ? (
                                                    <button type="button" onClick={addVisitor} style={{ backgroundColor: 'transparent', color: '#db011c', border: '1px solid #db011c', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                                        + ADD ANOTHER VISITOR
                                                    </button>
                                                ) : (
                                                    <div style={{ fontSize: '11px', color: '#db011c', fontWeight: 700 }}>MAX 15 VISITORS REACHED</div>
                                                )}
                                                
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button type="button" onClick={downloadTemplate} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                                                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                                        </svg>
                                                        UPLOAD EXCEL
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {formData.visitors.map((visitor, idx) => (
                                                <div key={idx} style={{ position: 'relative', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center', borderBottom: formData.visitors.length > 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: '16px' }}>
                                                    <div style={{ width: '80px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>VISITOR {idx + 1}</span>
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Full Name <span style={{ color: '#db011c' }}>*</span></label>
                                                        <Input type="text" required placeholder="e.g. Nguyen Van A" value={visitor.name} onChange={(e: any) => updateVisitor(idx, 'name', e.target.value)} />
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Company <span style={{ color: '#db011c' }}>*</span></label>
                                                        <Input type="text" required placeholder="e.g. TTI VN" value={visitor.company} onChange={(e: any) => updateVisitor(idx, 'company', e.target.value)} />
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Title <span style={{ color: '#db011c' }}>*</span></label>
                                                        <Input type="text" required placeholder="e.g. Manager" value={visitor.title} onChange={(e: any) => updateVisitor(idx, 'title', e.target.value)} />
                                                    </div>
                                                    {formData.visitors.length > 1 ? (
                                                        <div style={{ width: '60px', flexShrink: 0, textAlign: 'right' }}>
                                                            <button type="button" onClick={() => removeVisitor(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>REMOVE</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ width: '60px', flexShrink: 0 }}></div>
                                                    )}
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* VENDOR DETAILS */}
                                    {(formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor' || formData.visitorCategory === 'Vendor/Contractor') && (
                                        <div style={{ marginTop: '24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
                                                <input 
                                                    type="radio" 
                                                    name="vendorContractorType" 
                                                    value="Vendor"
                                                    checked={formData.visitorCategory === 'Vendor'}
                                                    onChange={() => setFormData({...formData, visitorCategory: 'Vendor'})}
                                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                />
                                                Vendor
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
                                                <input 
                                                    type="radio" 
                                                    name="vendorContractorType" 
                                                    value="Contractor"
                                                    checked={formData.visitorCategory === 'Contractor'}
                                                    onChange={() => setFormData({...formData, visitorCategory: 'Contractor'})}
                                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                />
                                                Contractor
                                            </label>
                                        </div>
                                    )}

                                    <SectionHeader title="Visit Details" />
                                    
                                    {formData.visitorCategory === 'Interviewee' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                                            <div>
                                                <InputLabel required>Start Date</InputLabel>
                                                <Input type="date" required min={todayStr} value={formData.startDate} onChange={(e: any) => setFormData({...formData, startDate: e.target.value})} />
                                            </div>
                                            <div>
                                                <InputLabel required>Start Time</InputLabel>
                                                <Input type="time" required value={formData.startTime} onChange={(e: any) => setFormData({...formData, startTime: e.target.value})} />
                                            </div>
                                            <div>
                                                <InputLabel required>Interview Area</InputLabel>
                                                <MeetingRoomCascader 
                                                    meetingRooms={meetingRooms} 
                                                    value={formData.interviewArea || ''} 
                                                    onChange={(val: string) => setFormData({...formData, interviewArea: val})}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                                            <div>
                                                <InputLabel required>Visiting Site</InputLabel>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <div 
                                                        onClick={() => toggleSite('SHTP')}
                                                        style={{ flex: 1, padding: '12px', textAlign: 'center', border: (formData.visitingSite === 'SHTP' || formData.visitingSite === 'SHTP/DDK') ? '2px solid #db011c' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: (formData.visitingSite === 'SHTP' || formData.visitingSite === 'SHTP/DDK') ? '#fff5f5' : 'white', fontWeight: 700, fontSize: '13px' }}
                                                    >
                                                        SHTP
                                                    </div>
                                                    <div 
                                                        onClick={() => toggleSite('DDK')}
                                                        style={{ flex: 1, padding: '12px', textAlign: 'center', border: (formData.visitingSite === 'DDK' || formData.visitingSite === 'SHTP/DDK') ? '2px solid #db011c' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: (formData.visitingSite === 'DDK' || formData.visitingSite === 'SHTP/DDK') ? '#fff5f5' : 'white', fontWeight: 700, fontSize: '13px' }}
                                                    >
                                                        DDK
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <InputLabel required>Purpose of Visit</InputLabel>
                                                <select 
                                                    required
                                                    value={formData.purposeOfVisit}
                                                    onChange={e => setFormData({ ...formData, purposeOfVisit: e.target.value })}
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
                                                <Input type="date" required min={todayStr} value={formData.startDate} onChange={(e: any) => setFormData({...formData, startDate: e.target.value})} />
                                            </div>
                                            <div>
                                                <InputLabel required>End Date</InputLabel>
                                                <Input type="date" required min={formData.startDate || todayStr} max={maxEndDateStr} value={formData.endDate} onChange={(e: any) => setFormData({...formData, endDate: e.target.value})} />
                                            </div>
                                            {(formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor') && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <InputLabel required>Scope of Work / Purpose Detail</InputLabel>
                                                    <textarea 
                                                        rows={3}
                                                        required
                                                        placeholder="Describe the reason for visit..."
                                                        value={formData.purposeDetail}
                                                        onChange={(e: any) => setFormData({...formData, purposeDetail: e.target.value})}
                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', resize: 'vertical' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isExpatCategory && (
                                        <>
                                            <SectionHeader title="Host Department" />
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                                <div>
                                                    <InputLabel required>BU</InputLabel>
                                                    <select 
                                                        required
                                                        value={formData.bu}
                                                        onChange={e => setFormData({ ...formData, bu: e.target.value, functionalDept: '', department: '' })}
                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' }}
                                                    >
                                                        <option value="" disabled>Select BU</option>
                                                        {[...new Set(hostDepartments.map(h => h.bu).filter(Boolean))].map(bu => (
                                                            <option key={bu as string} value={bu as string}>{bu as string}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <InputLabel required>Functional Dept</InputLabel>
                                                    <select 
                                                        required
                                                        value={formData.functionalDept}
                                                        onChange={e => setFormData({ ...formData, functionalDept: e.target.value, department: '' })}
                                                        disabled={!formData.bu}
                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', opacity: formData.bu ? 1 : 0.5 }}
                                                    >
                                                        <option value="" disabled>Select Functional Dept</option>
                                                        {[...new Set(hostDepartments.filter(h => h.bu === formData.bu).map(h => h.functional_dept).filter(Boolean))].map(dept => (
                                                            <option key={dept as string} value={dept as string}>{dept as string}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <InputLabel required>Department</InputLabel>
                                                    <select 
                                                        required
                                                        value={formData.department}
                                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                        disabled={!formData.functionalDept}
                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', opacity: formData.functionalDept ? 1 : 0.5 }}
                                                    >
                                                        <option value="" disabled>Select Department</option>
                                                        {hostDepartments.filter(h => h.functional_dept === formData.functionalDept).map((h, i) => (
                                                            <option key={i} value={h.department}>{h.department}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            {(() => {
                                                const selectedHost = hostDepartments.find(h => h.functional_dept === formData.functionalDept && h.department === formData.department);
                                                if (!selectedHost) return null;
                                                return (
                                                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                                        <div><span style={{ color: '#64748b', fontWeight: 600 }}>Func Host Name:</span> <span style={{ color: '#0f172a', fontWeight: 700, marginLeft: '4px' }}>{selectedHost.functional_host_name || 'N/A'}</span></div>
                                                        <div><span style={{ color: '#64748b', fontWeight: 600 }}>Dept Host Name:</span> <span style={{ color: '#0f172a', fontWeight: 700, marginLeft: '4px' }}>{selectedHost.department_host_name || 'N/A'}</span></div>
                                                    </div>
                                                );
                                            })()}

                                            <SectionHeader title="Select Rooms" />
                                            {rooms.length === 0 ? (
                                                <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>No rooms available.</div>
                                            ) : (
                                                <>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                                                        {rooms.filter(room => formData.visitingSite === 'SHTP/DDK' || room.site_location === formData.visitingSite).map(room => (
                                                            <div 
                                                                key={room.id}
                                                                onClick={() => toggleRoom(room.id)}
                                                                style={{ 
                                                                    padding: '12px', borderRadius: '8px', border: formData.roomIds.includes(room.id) ? '2px solid #db011c' : '1px solid #e2e8f0',
                                                                    backgroundColor: formData.roomIds.includes(room.id) ? '#fff5f5' : 'white', cursor: 'pointer', transition: 'all 0.15s'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: formData.roomIds.includes(room.id) ? 'none' : '1px solid #cbd5e1', backgroundColor: formData.roomIds.includes(room.id) ? '#db011c' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        {formData.roomIds.includes(room.id) && (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style={{ width: '12px', height: '12px' }}>
                                                                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ fontWeight: 800, fontSize: '13px', color: formData.roomIds.includes(room.id) ? '#db011c' : '#1e293b' }}>
                                                                        {room.name}
                                                                    </div>
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: '#64748b', paddingLeft: '24px' }}>{room.description || 'No description'}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {(() => {
                                                        const ratio = rooms.length > 0 ? (formData.roomIds.length / rooms.length) : 0;
                                                        const isBULeaderTriggered = ratio > 0.6;
                                                        return (
                                                            <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: isBULeaderTriggered ? '#fee2e2' : '#dcfce7', borderLeft: `4px solid ${isBULeaderTriggered ? '#ef4444' : '#22c55e'}`, borderRadius: '4px', fontSize: '12px', color: isBULeaderTriggered ? '#991b1b' : '#166534', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }}>
                                                                    {isBULeaderTriggered ? (
                                                                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                                                                    ) : (
                                                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 11.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                                                    )}
                                                                </svg>
                                                                <span style={{ fontWeight: 500 }}>
                                                                    {isBULeaderTriggered ? (
                                                                        <><strong>Over 60% of total rooms selected ({Math.round(ratio * 100)}%):</strong> This request WILL BE additionally sent to BU Leader for approval.</>
                                                                    ) : (
                                                                        <><strong>Note:</strong> If over 60% of total rooms are selected, the request will additionally be sent to BU Leader for approval. (Current: {Math.round(ratio * 100)}%)</>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </>
                                            )}
                                        </>
                                    )}

                                    {/* FINAL REQUIREMENTS */}
                                    {isExpatCategory && (
                                                <>
                                                    <SectionHeader title="Final Requirements" />
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                                                        <div>
                                                            <InputLabel>Factory Tour Requested?</InputLabel>
                                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                                <button type="button" onClick={() => updateDetails('factoryTour', 'Yes')} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: formData.details.factoryTour === 'Yes' ? '#db011c' : 'white', color: formData.details.factoryTour === 'Yes' ? 'white' : '#475569', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>YES</button>
                                                                <button type="button" onClick={() => updateDetails('factoryTour', 'No')} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: formData.details.factoryTour === 'No' ? '#db011c' : 'white', color: formData.details.factoryTour === 'No' ? 'white' : '#475569', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>NO</button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <InputLabel>Meal Registration?</InputLabel>
                                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                                <button type="button" onClick={() => updateDetails('mealRegistration', 'Yes')} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: formData.details.mealRegistration === 'Yes' ? '#db011c' : 'white', color: formData.details.mealRegistration === 'Yes' ? 'white' : '#475569', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>YES</button>
                                                                <button type="button" onClick={() => updateDetails('mealRegistration', 'No')} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: formData.details.mealRegistration === 'No' ? '#db011c' : 'white', color: formData.details.mealRegistration === 'No' ? 'white' : '#475569', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>NO</button>
                                                            </div>
                                                        </div>
                                                        {formData.details.mealRegistration === 'Yes' && (
                                                            <div>
                                                                <InputLabel required>Charged Cost Center</InputLabel>
                                                                <Input type="text" required placeholder="000-00-0000" value={formData.details.costCenter} onChange={(e: any) => updateDetails('costCenter', e.target.value)} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}



                                            {/* Actions */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <button 
                                                        type="submit" 
                                                        disabled={loading}
                                                        style={{ backgroundColor: '#db011c', color: 'white', fontSize: '13px', fontWeight: 800, padding: '10px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(219,1,28,0.2)' }}
                                                    >
                                                        {loading ? 'PROCESSING...' : 'SUBMIT REQUEST'}
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                                    Fields marked <span style={{ color: '#db011c' }}>*</span> are required
                                                </div>
                                            </div>
                                </form>
                            </div>
                        )}
                        {/* End Form Container */}
                    </>
                ) : (
                    <div style={{ marginTop: '16px' }}>
                        <Dashboard />
                    </div>
                )}
            </div>

            {/* KEEP EXISTING MODALS */}
            {/* KEEP EXISTING MODALS */}
            
            {showReviewModal && mounted && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4 text-[#0f172a]">Review Registration</h2>
                        <div className="space-y-4 text-sm text-gray-700">
                            {formData.visitorCategory === 'Interviewee' ? (
                                <div className="pb-4 border-b border-gray-200">
                                    <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Candidates / Interviewees ({formData.interviewees.length})</span>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="py-2 text-[10px] uppercase font-bold text-gray-400">#</th>
                                                    <th className="py-2 text-[10px] uppercase font-bold text-gray-400">Interviewee Name</th>
                                                    <th className="py-2 text-[10px] uppercase font-bold text-gray-400">Job Title</th>
                                                    <th className="py-2 text-[10px] uppercase font-bold text-gray-400">Department</th>
                                                    <th className="py-2 text-[10px] uppercase font-bold text-gray-400">Interviewer Name</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.interviewees.map((candidate, i) => (
                                                    <tr key={i} className="border-b border-gray-100 last:border-0">
                                                        <td className="py-2 text-xs font-bold text-gray-400">{i + 1}</td>
                                                        <td className="py-2 font-bold text-[#0f172a]">{candidate.name || '—'}</td>
                                                        <td className="py-2 text-gray-700 font-medium">{candidate.jobTitle || '—'}</td>
                                                        <td className="py-2 text-gray-700 font-medium">
                                                            <span className="text-gray-700 text-xs font-bold bg-gray-100 px-2 py-1 rounded inline-block">{candidate.interviewDepartment || '—'}</span>
                                                        </td>
                                                        <td className="py-2 text-gray-700 font-medium">{candidate.interviewerName || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="pb-4 border-b border-gray-200">
                                    <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Visitors ({formData.visitors.length})</span>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="py-2 text-[10px] uppercase font-bold text-gray-400">Name</th>
                                                    <th className="py-2 text-[10px] uppercase font-bold text-gray-400">Title</th>
                                                    <th className="py-2 text-[10px] uppercase font-bold text-gray-400">Company</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.visitors.map((v, i) => (
                                                    <tr key={i} className="border-b border-gray-100 last:border-0">
                                                        <td className="py-2 font-bold text-[#0f172a]">{v.name}</td>
                                                        <td className="py-2 text-gray-700 font-medium">{v.title}</td>
                                                        <td className="py-2">
                                                            <span className="text-gray-700 text-xs font-bold bg-gray-100 px-2 py-1 rounded inline-block">{v.company}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pb-4">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Category</span>
                                    <span className="font-semibold text-gray-900">{formData.visitorCategory}</span>
                                </div>
                                {formData.visitorCategory !== 'Interviewee' ? (
                                    <>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Purpose</span>
                                            <span className="font-semibold text-gray-900">{formData.purposeOfVisit}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Site</span>
                                            <span className="font-semibold text-gray-900">{formData.visitingSite}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Dates</span>
                                            <span className="font-semibold text-gray-900">{formData.startDate} to {formData.endDate || formData.startDate}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Interview Date</span>
                                            <span className="font-semibold text-gray-900">{formData.startDate}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Start Time</span>
                                            <span className="font-semibold text-gray-900">{formData.startTime}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Interview Area</span>
                                            <span className="font-semibold text-gray-900">{formData.interviewArea}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {(formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor') && (
                                <div className="pt-2 border-t border-gray-200">
                                    <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Scope of Work / Purpose Detail</span>
                                    <div className="pt-1 text-sm whitespace-pre-wrap font-medium text-gray-900">
                                        {formData.purposeDetail}
                                    </div>
                                </div>
                            )}

                            {isExpatCategory && (
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Functional Dept</span>
                                        <span className="font-semibold text-gray-900">{formData.functionalDept}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Department</span>
                                        <span className="font-semibold text-gray-900">{formData.department}</span>
                                    </div>
                                    {formData.details.costCenter && (
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Cost Center</span>
                                            <span className="font-semibold text-gray-900">{formData.details.costCenter}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {isExpatCategory && formData.roomIds.length > 0 && (
                                <div className="pt-2">
                                    <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Selected Rooms ({formData.roomIds.length})</span>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.roomIds.map(rid => {
                                            const r = rooms.find(room => room.id === rid);
                                            return r ? (
                                                <span key={rid} className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">
                                                    {r.name}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}

                            {isExpatCategory && (
                                <div className="pt-2">
                                    <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Requirements</span>
                                    <div className="flex gap-4">
                                        <div className="py-1 text-sm">
                                            Factory Tour: <span className={`font-bold ${formData.details.factoryTour === 'Yes' ? 'text-green-600' : 'text-gray-500'}`}>{formData.details.factoryTour}</span>
                                        </div>
                                        <div className="py-1 text-sm">
                                            Meal: <span className={`font-bold ${formData.details.mealRegistration === 'Yes' ? 'text-green-600' : 'text-gray-500'}`}>{formData.details.mealRegistration}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={() => setShowReviewModal(false)} className="px-6 py-2 rounded-lg border border-gray-300 font-bold text-gray-600 hover:bg-gray-50">Edit Information</button>
                            <button onClick={() => { setShowReviewModal(false); handleSubmit(); }} className="px-6 py-2 rounded-lg bg-[#db011c] text-white font-bold hover:bg-red-700 shadow-md">Confirm & Submit</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
