'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, BuildingOffice2Icon, GlobeAsiaAustraliaIcon, UserGroupIcon, BuildingOfficeIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Dashboard from '../visitordashboard/page';

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
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'request' | 'dashboard'>('request');
    const [rooms, setRooms] = useState<any[]>([]);
    const [step, setStep] = useState(1);
    const [showReviewModal, setShowReviewModal] = useState(false);

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
        interviewArea: ''
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
        fetchRooms();
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
                    interviewArea: ''
                });
                setActiveTab('dashboard');
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

    const updateVisitor = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newVisitors = [...prev.visitors];
            newVisitors[index] = { ...newVisitors[index], [field]: value };
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
                                
                                return (
                                    <div 
                                        key={cat.id}
                                        onClick={() => {
                                            if (cat.id === 'Vendor/Contractor') {
                                                setFormData({...formData, visitorCategory: 'Vendor'});
                                            } else {
                                                setFormData({...formData, visitorCategory: cat.id});
                                            }
                                        }}
                                        style={{
                                            cursor: 'pointer', padding: '20px', borderRadius: '8px', backgroundColor: isActive ? '#fff5f5' : 'white', 
                                            border: isActive ? '1px solid #db011c' : '1px solid #e2e8f0',
                                            textAlign: 'center', transition: 'all 0.2s',
                                            boxShadow: isActive ? '0 0 0 1px #db011c' : '0 1px 2px rgba(0,0,0,0.05)'
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

                            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                                
                                {/* VISITOR INFORMATION */}
                                <SectionHeader title="Visitor Information" />
                                
                                {formData.visitorCategory === 'Interviewee' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                                        <div>
                                            <InputLabel required>Interviewee Name</InputLabel>
                                            <Input type="text" required placeholder="Enter interviewee full name" value={formData.intervieweeName} onChange={(e: any) => setFormData({...formData, intervieweeName: e.target.value})} />
                                        </div>
                                        <div>
                                            <InputLabel required>Job Title</InputLabel>
                                            <Input type="text" required placeholder="e.g. Software Engineer" value={formData.jobTitle} onChange={(e: any) => setFormData({...formData, jobTitle: e.target.value})} />
                                        </div>
                                        <div>
                                            <InputLabel required>Interview Department</InputLabel>
                                            <Input type="text" required placeholder="e.g. IT" value={formData.interviewDepartment} onChange={(e: any) => setFormData({...formData, interviewDepartment: e.target.value})} />
                                        </div>
                                        <div>
                                            <InputLabel required>Interviewer Name</InputLabel>
                                            <Input type="text" required placeholder="Enter interviewer name" value={formData.interviewerName} onChange={(e: any) => setFormData({...formData, interviewerName: e.target.value})} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {formData.visitors.length < 10 && (
                                                <button type="button" onClick={addVisitor} style={{ backgroundColor: 'transparent', color: '#db011c', border: '1px solid #db011c', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', marginBottom: '16px' }}>
                                                    + ADD ANOTHER VISITOR
                                                </button>
                                            )}
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
                                                    <Input type="text" required placeholder="e.g. Bosch Vietnam" value={visitor.company} onChange={(e: any) => updateVisitor(idx, 'company', e.target.value)} />
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
                                            <Input type="date" required value={formData.startDate} onChange={(e: any) => setFormData({...formData, startDate: e.target.value})} />
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
                                            <Input type="date" required value={formData.startDate} onChange={(e: any) => setFormData({...formData, startDate: e.target.value})} />
                                        </div>
                                        <div>
                                            <InputLabel required>End Date</InputLabel>
                                            <Input type="date" required value={formData.endDate} onChange={(e: any) => setFormData({...formData, endDate: e.target.value})} />
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
                                        <SectionHeader title="Room Access" />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                            {rooms.filter(room => formData.visitingSite === 'Both' || room.site_location === formData.visitingSite).map((r: any) => {
                                                const isSelected = formData.roomIds.includes(r.id);
                                                return (
                                                    <div 
                                                        key={r.id} 
                                                        onClick={() => toggleRoom(r.id)}
                                                        style={{ padding: '12px', border: isSelected ? '2px solid #db011c' : '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: isSelected ? '#fff5f5' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                                                    >
                                                        {r.name}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </>
                                )}

                                {/* FINAL REQUIREMENTS */}
                                {formData.visitorCategory !== 'Interviewee' && (
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

                                {/* Warning Box */}
                                <div style={{ marginTop: '32px', marginBottom: '24px', padding: '12px 16px', backgroundColor: '#fff9e6', border: '1px solid #fce49c', color: '#9c7811', fontSize: '12px', borderRadius: '6px', fontWeight: 500 }}>
                                    Vendors accessing production areas must present a valid safety induction certificate and wear PPE. PPE available at Gate A.
                                </div>

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
                                        <button 
                                            type="button" 
                                            onClick={() => alert('Draft saved (simulated)')}
                                            style={{ backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: 800, padding: '10px 24px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                                        >
                                            SAVE DRAFT
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
            
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl p-8">
                        <h2 className="text-2xl font-bold mb-4">Review Registration</h2>
                        <p>Please review your data before submitting.</p>
                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={() => setShowReviewModal(false)} className="px-6 py-2 rounded-lg border font-bold">Cancel</button>
                            <button onClick={() => { setShowReviewModal(false); handleSubmit(); }} className="px-6 py-2 rounded-lg bg-[#db011c] text-white font-bold">Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
