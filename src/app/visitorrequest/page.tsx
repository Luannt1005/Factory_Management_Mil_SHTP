'use client';

import { useState, useEffect, useRef } from 'react';
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
    const isHrVisitor = (session?.user as any)?.app_role_names?.includes('Hr Visitor') || (session?.user as any)?.role === 'admin';
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'request' | 'dashboard'>('request');
    const [rooms, setRooms] = useState<any[]>([]);
    const [hostDepartments, setHostDepartments] = useState<any[]>([]);
    const [step, setStep] = useState(1);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [formData, setFormData] = useState({
        visitors: [{ name: '', title: '', company: '' }],
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
                    if (prev.visitingSite === 'Both') return true;
                    return room.site_location === prev.visitingSite;
                });
                if (validRoomIds.length !== prev.roomIds.length) {
                    return { ...prev, roomIds: validRoomIds };
                }
                return prev;
            });
        }
    }, [formData.visitingSite, rooms]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let apiUrl = '/api/requests';
            if (formData.visitorCategory === 'Interviewee') {
                apiUrl = '/api/interviewee_requests';
            }

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert('Registration successful!');
                setStep(1);
                setFormData({
                    visitors: [{ name: '', title: '', company: '' }],
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
                    functionalDept: '',
                    department: ''
                });
                if (formData.visitorCategory === 'Interviewee') {
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
        if (formData.visitors.length < 10) {
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

    const downloadTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            { 'Full Name': 'Nguyen Van A', 'Company': 'TTI VN', 'Title': 'Software Engineer' },
            { 'Full Name': 'Tran Thi B', 'Company': 'TTI VN', 'Title': 'Project Manager' }
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitors');
        XLSX.writeFile(workbook, 'Visitor_Information_Template.xlsx');
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
                    name: row['Full Name'] || '',
                    company: row['Company'] || '',
                    title: row['Title'] || ''
                })).filter(v => v.name);

                if (newVisitors.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        visitors: newVisitors.slice(0, 10) // Limit to max 10
                    }));
                    alert(`Successfully imported ${Math.min(newVisitors.length, 10)} visitors from Excel.`);
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

    const capitalizeWords = (str: string) => {
        if (!str) return str;
        // capitalize after space, hyphen, or at start
        return str.replace(/(^\w|\s\w|-\w)/g, m => m.toUpperCase());
    };

    const updateVisitor = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newVisitors = [...prev.visitors];
            const capitalizedValue = typeof value === 'string' ? capitalizeWords(value) : value;
            newVisitors[index] = { ...newVisitors[index], [field]: capitalizedValue };
            return { ...prev, visitors: newVisitors };
        });
    };

    const toggleSite = (site: string) => {
        setFormData(prev => {
            const isSHTP = prev.visitingSite === 'SHTP' || prev.visitingSite === 'Both';
            const isDDK = prev.visitingSite === 'DDK' || prev.visitingSite === 'Both';

            let nextSHTP = isSHTP;
            let nextDDK = isDDK;

            if (site === 'SHTP') nextSHTP = !isSHTP;
            else nextDDK = !isDDK;

            if (!nextSHTP && !nextDDK) return prev;

            let nextVal = 'SHTP';
            if (nextSHTP && nextDDK) nextVal = 'Both';
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
                                const isDisabled = cat.id === 'Interviewee' && !isHrVisitor;
                                
                                return (
                                    <div 
                                        key={cat.id}
                                        onClick={() => {
                                            if (isDisabled) {
                                                alert("You need Hr Visitor role to create an Interviewee request.");
                                                return;
                                            }
                                            if (cat.id === 'Vendor/Contractor') {
                                                setFormData({...formData, visitorCategory: 'Vendor'});
                                            } else {
                                                setFormData({...formData, visitorCategory: cat.id});
                                            }
                                        }}
                                        style={{
                                            cursor: isDisabled ? 'not-allowed' : 'pointer', padding: '20px', borderRadius: '8px', backgroundColor: isActive ? '#fff5f5' : 'white', 
                                            border: isActive ? '1px solid #db011c' : '1px solid #e2e8f0',
                                            textAlign: 'center', transition: 'all 0.2s', opacity: isDisabled ? 0.5 : 1,
                                            boxShadow: isActive ? '0 4px 12px rgba(219,1,28,0.1)' : '0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', letterSpacing: '0.02em', color: isActive ? '#db011c' : '#334155' }}>
                                            {cat.label}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            {cat.desc}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Form Container */}
                        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            {/* Active Category Badge */}
                            <div style={{ display: 'inline-block', backgroundColor: '#db011c', color: 'white', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '4px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {(formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor' || formData.visitorCategory === 'Vendor/Contractor') ? 'VENDOR / CONTRACTOR' : formData.visitorCategory === 'Interviewee' ? 'INTERVIEWEE' : 'MIL / TTI EXPAT'}
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); setShowReviewModal(true); }}>
                                
                                {/* VISITOR INFORMATION */}
                                <SectionHeader title="Visitor Information" />
                                
                                {formData.visitorCategory === 'Interviewee' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                                        <div>
                                            <InputLabel required>Interviewee Name</InputLabel>
                                            <Input type="text" required placeholder="Enter interviewee full name" value={formData.intervieweeName} onChange={(e: any) => setFormData({...formData, intervieweeName: capitalizeWords(e.target.value)})} />
                                        </div>
                                        <div>
                                            <InputLabel required>Job Title</InputLabel>
                                            <Input type="text" required placeholder="e.g. Software Engineer" value={formData.jobTitle} onChange={(e: any) => setFormData({...formData, jobTitle: capitalizeWords(e.target.value)})} />
                                        </div>
                                        <div>
                                            <InputLabel required>Interview Department</InputLabel>
                                            <Input type="text" required placeholder="e.g. IT" value={formData.interviewDepartment} onChange={(e: any) => setFormData({...formData, interviewDepartment: capitalizeWords(e.target.value)})} />
                                        </div>
                                        <div>
                                            <InputLabel required>Interviewer Name</InputLabel>
                                            <Input type="text" required placeholder="Enter interviewer name" value={formData.interviewerName} onChange={(e: any) => setFormData({...formData, interviewerName: capitalizeWords(e.target.value)})} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            {formData.visitors.length < 10 ? (
                                                <button type="button" onClick={addVisitor} style={{ backgroundColor: 'transparent', color: '#db011c', border: '1px solid #db011c', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                                    + ADD ANOTHER VISITOR
                                                </button>
                                            ) : (
                                                <div style={{ fontSize: '11px', color: '#db011c', fontWeight: 700 }}>MAX 10 VISITORS REACHED</div>
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
                                                <div style={{ width: '70px', flexShrink: 0 }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>VISITOR {idx + 1}</span>
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
                                    <>
                                        <SectionHeader title="Vendor Details" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <InputLabel required>Specific Vendor Category</InputLabel>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                        <input type="radio" name="vendorType" checked={formData.visitorCategory === 'Vendor'} onChange={() => setFormData({...formData, visitorCategory: 'Vendor'})} /> Vendor
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                        <input type="radio" name="vendorType" checked={formData.visitorCategory === 'Contractor'} onChange={() => setFormData({...formData, visitorCategory: 'Contractor'})} /> Contractor
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* VISIT DETAILS */}
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
                                            <Input type="text" required placeholder="e.g. Meeting Room 4" value={formData.interviewArea} onChange={(e: any) => setFormData({...formData, interviewArea: e.target.value})} />
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                                        <div>
                                            <InputLabel required>Visiting Site</InputLabel>
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <div 
                                                    onClick={() => toggleSite('SHTP')}
                                                    style={{ flex: 1, padding: '12px', textAlign: 'center', border: (formData.visitingSite === 'SHTP' || formData.visitingSite === 'Both') ? '2px solid #db011c' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: (formData.visitingSite === 'SHTP' || formData.visitingSite === 'Both') ? '#fff5f5' : 'white', fontWeight: 700, fontSize: '13px' }}
                                                >
                                                    SHTP
                                                </div>
                                                <div 
                                                    onClick={() => toggleSite('DDK')}
                                                    style={{ flex: 1, padding: '12px', textAlign: 'center', border: (formData.visitingSite === 'DDK' || formData.visitingSite === 'Both') ? '2px solid #db011c' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: (formData.visitingSite === 'DDK' || formData.visitingSite === 'Both') ? '#fff5f5' : 'white', fontWeight: 700, fontSize: '13px' }}
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
                                                <InputLabel required>Functional Dept</InputLabel>
                                                <select 
                                                    required
                                                    value={formData.functionalDept}
                                                    onChange={e => setFormData({ ...formData, functionalDept: e.target.value, department: '' })}
                                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' }}
                                                >
                                                    <option value="" disabled>Select Functional Dept</option>
                                                    {[...new Set(hostDepartments.map(h => h.functional_dept))].map(dept => (
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
                                                    {hostDepartments.filter(h => h.functional_dept === formData.functionalDept).map(h => (
                                                        <option key={h.id} value={h.department}>{h.department}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        {formData.functionalDept && formData.department && (
                                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '13px', color: '#334155' }}>
                                                <div style={{ marginBottom: '4px' }}><strong>Functional Dept Host:</strong> {hostDepartments.find(h => h.functional_dept === formData.functionalDept && h.department === formData.department)?.functional_host_name || 'N/A'}</div>
                                                <div><strong>Department Host:</strong> {hostDepartments.find(h => h.functional_dept === formData.functionalDept && h.department === formData.department)?.department_host_name || 'N/A'}</div>
                                            </div>
                                        )}

                                        <SectionHeader title="Room Access" />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                            {rooms.filter(room => formData.visitingSite === 'Both' || room.site_location === formData.visitingSite).map((r: any) => {
                                                const isSelected = formData.roomIds.includes(r.id);
                                                return (
                                                    <div 
                                                        key={r.id} 
                                                        onClick={() => toggleRoom(r.id)}
                                                        style={{ padding: '12px', border: isSelected ? '2px solid #db011c' : '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: isSelected ? '#fff5f5' : 'white', cursor: 'pointer' }}
                                                    >
                                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{r.name}</div>
                                                        {r.description && (
                                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 400 }}>{r.description}</div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {(() => {
                                            const ratio = rooms.length > 0 ? (formData.roomIds.length / rooms.length) : 0;
                                            const isVPTriggered = ratio > 0.6;
                                            return (
                                                <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: isVPTriggered ? '#dcfce7' : '#fffbeb', borderLeft: `4px solid ${isVPTriggered ? '#22c55e' : '#f59e0b'}`, borderRadius: '4px', fontSize: '12px', color: isVPTriggered ? '#166534' : '#92400e', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }}>
                                                        {isVPTriggered ? (
                                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 11.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                                        ) : (
                                                            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                                                        )}
                                                    </svg>
                                                    <span style={{ fontWeight: 500 }}>
                                                        {isVPTriggered ? (
                                                            <><strong>Over 60% of total rooms selected ({Math.round(ratio * 100)}%):</strong> This request WILL BE additionally sent to VP Lee Hon Kay for approval.</>
                                                        ) : (
                                                            <><strong>Note:</strong> If over 60% of total rooms are selected, the request will additionally be sent to VP Lee Hon Kay for approval. (Current: {Math.round(ratio * 100)}%)</>
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })()}
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

                            {formData.visitorCategory === 'Interviewee' && (
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Interviewee Name</span>
                                        <span className="font-semibold text-gray-900">{formData.intervieweeName}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Job Title</span>
                                        <span className="font-semibold text-gray-900">{formData.jobTitle}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Department</span>
                                        <span className="font-semibold text-gray-900">{formData.interviewDepartment}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Interviewer Name</span>
                                        <span className="font-semibold text-gray-900">{formData.interviewerName}</span>
                                    </div>
                                </div>
                            )}

                            {(formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor') && (
                                <div className="pt-2">
                                    <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Scope of Work / Purpose Detail</span>
                                    <div className="pt-1 text-sm whitespace-pre-wrap font-medium text-gray-900">
                                        {formData.purposeDetail}
                                    </div>
                                </div>
                            )}

                            {isExpatCategory && (
                                <div className="grid grid-cols-2 gap-4 pt-2">
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

                            {formData.visitorCategory !== 'Interviewee' && (
                                <div className="pt-2">
                                    <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Visitors ({formData.visitors.length})</span>
                                    <ul className="space-y-2">
                                        {formData.visitors.map((v, i) => (
                                            <li key={i} className="py-2 flex items-center justify-between border-b border-gray-100 last:border-0">
                                                <div>
                                                    <span className="font-bold text-[#0f172a]">{v.name}</span>
                                                    <span className="text-gray-500 text-xs ml-2">— {v.title}</span>
                                                </div>
                                                <span className="text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded">{v.company}</span>
                                            </li>
                                        ))}
                                    </ul>
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
