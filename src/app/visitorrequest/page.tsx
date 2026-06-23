'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, BuildingOffice2Icon, GlobeAsiaAustraliaIcon, UserGroupIcon, BuildingOfficeIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Dashboard from '../visitordashboard/page';

export default function NewRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'request' | 'dashboard'>('request');
    const [rooms, setRooms] = useState<any[]>([]);
    const [step, setStep] = useState(1);
    const [showAllVisitorsModal, setShowAllVisitorsModal] = useState(false);
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
        // Interviewee specific
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

    const nextStep = () => {
        if (step === 1 && formData.visitorCategory === 'Vendor/Contractor') {
            alert('Please select whether you are a Vendor or Contractor.');
            return;
        }
        setStep(s => s + 1);
    };
    const prevStep = () => setStep(s => s - 1);

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

    const filteredRooms = rooms.filter((room: any) => {
        if (formData.visitingSite === 'Both') return true;
        return room.site_location === formData.visitingSite;
    });

    const groupedRooms = filteredRooms.reduce((acc: any, room: any) => {
        if (!acc[room.category]) acc[room.category] = [];
        acc[room.category].push(room);
        return acc;
    }, {});

    const toggleSite = (site: string) => {
        setFormData(prev => {
            const isSHTP = prev.visitingSite === 'SHTP' || prev.visitingSite === 'Both';
            const isDDK = prev.visitingSite === 'DDK' || prev.visitingSite === 'Both';

            let nextSHTP = isSHTP;
            let nextDDK = isDDK;

            if (site === 'SHTP') nextSHTP = !isSHTP;
            else nextDDK = !isDDK;

            // Ensure at least one is selected
            if (!nextSHTP && !nextDDK) return prev;

            let nextVal = 'SHTP';
            if (nextSHTP && nextDDK) nextVal = 'Both';
            else if (nextDDK) nextVal = 'DDK';

            return { ...prev, visitingSite: nextVal };
        });
    };

    const isExpatCategory = formData.visitorCategory === 'MIL/TTI Expat / SHTP Business trip';

    const addVisitor = () => {
        if (formData.visitors.length < 10) {
            setFormData(prev => ({
                ...prev,
                visitors: [...prev.visitors, { name: '', title: '', company: '' }]
            }));
            setShowAllVisitorsModal(true);
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

    const totalSteps = (formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor' || formData.visitorCategory === 'Vendor/Contractor' || formData.visitorCategory === 'Interviewee') ? 2 : 3;

    const StepIndicator = () => {
        const stepsArray = Array.from({ length: totalSteps }, (_, i) => i + 1);
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '3rem', gap: '1rem' }}>
                {stepsArray.map((i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            background: step >= i ? '#db011c' : '#e2e8f0',
                            color: step >= i ? 'white' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: step === i ? '0 0 0 5px rgba(219, 1, 28, 0.2)' : 'none',
                            border: '2px solid white'
                        }}>
                            {i}
                        </div>
                        {i < totalSteps && <div style={{ width: '60px', height: '3px', background: step > i ? '#db011c' : '#e2e8f0', margin: '0 8px', borderRadius: '3px', transition: 'background 0.4s' }} />}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '0.5rem 1.5rem' }}>
            {/* Tabs Navigation - Far left corner */}
            <div className="flex justify-start mb-8 border-b border-gray-200 w-full">
                <div className="flex space-x-8 px-2">
                    <button 
                        onClick={() => setActiveTab('request')}
                        className={`pb-3 pt-2 text-sm font-bold transition-all duration-200 cursor-pointer uppercase tracking-wide border-b-[3px] ${activeTab === 'request' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Registration
                    </button>
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`pb-3 pt-2 text-sm font-bold transition-all duration-200 cursor-pointer uppercase tracking-wide border-b-[3px] ${activeTab === 'dashboard' ? 'border-[#db011c] text-[#db011c]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        My Request
                    </button>
                </div>
            </div>

            <div className="container mx-auto" style={{ maxWidth: activeTab === 'request' ? '1000px' : '1200px', margin: '0 auto' }}>

                {activeTab === 'request' ? (
                    <div className="w-full">
                        {!formData.visitorCategory ? (
                            <div className="animate-in fade-in duration-500" style={{ maxWidth: '900px', margin: '2rem auto 4rem' }}>
                                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Welcome to Milwaukee Tool SHTP</h1>
                                    <p style={{ fontSize: '1.1rem', color: '#475569' }}>Please select your visitor category to begin registration.</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', maxWidth: '850px', margin: '0 auto' }}>
                                    {[
                                        { id: 'Vendor/Contractor', label: 'Vendor / Contractor', icon: BuildingOffice2Icon, desc: 'Suppliers, vendors, or contractors visiting or working on-site' },
                                        { id: 'MIL/TTI Expat / SHTP Business trip', label: 'MIL/TTI Expat / Business trip', icon: GlobeAsiaAustraliaIcon, desc: 'Internal employees on business trip' },
                                        { id: 'Interviewee', icon: UserGroupIcon, desc: 'Candidates visiting for job interviews' }
                                    ].map((cat) => {
                                        const IconComponent = cat.icon;
                                        return (
                                        <div
                                            key={cat.id}
                                            onClick={() => {
                                                setFormData({ ...formData, visitorCategory: cat.id });
                                                setStep(1);
                                            }}
                                            style={{
                                                padding: '2.5rem 1.5rem',
                                                borderRadius: '16px',
                                                border: '1px solid #e2e8f0',
                                                background: 'white',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                textAlign: 'center',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#db011c';
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(219, 1, 28, 0.1), 0 10px 10px -5px rgba(219, 1, 28, 0.04)';
                                                const iconDiv = e.currentTarget.querySelector('.icon-container') as HTMLElement;
                                                if (iconDiv) {
                                                    iconDiv.style.backgroundColor = '#db011c';
                                                    iconDiv.style.color = 'white';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                                                const iconDiv = e.currentTarget.querySelector('.icon-container') as HTMLElement;
                                                if (iconDiv) {
                                                    iconDiv.style.backgroundColor = '#f1f5f9';
                                                    iconDiv.style.color = '#334155';
                                                }
                                            }}
                                        >
                                            <div className="icon-container" style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '50%',
                                                backgroundColor: '#f1f5f9',
                                                color: '#334155',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.3s ease',
                                                marginBottom: '0.5rem'
                                            }}>
                                                <IconComponent className="w-10 h-10" />
                                            </div>
                                            <div>
                                                <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem' }}>{cat.label || cat.id}</h3>
                                                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>{cat.desc}</p>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-500">
                                {/* Header Image Section */}
                                <div style={{
                                    width: '100%',
                                    height: '280px',
                                    borderRadius: '24px 24px 0 0',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                    marginBottom: '-40px',
                                    zIndex: 1
                                }}>
                                    <img src="/visitor_header.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Milwaukee Welcome" />
                                    
                                    {/* Back/Change Category Button overlaid on image */}
                                    <button 
                                        onClick={() => setFormData({ ...formData, visitorCategory: '' })}
                                        className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 transition-all shadow-lg"
                                    >
                                        <ArrowLeftIcon className="w-4 h-4" />
                                        Change Category ({
                                            formData.visitorCategory === 'MIL/TTI Expat / SHTP Business trip' 
                                                ? 'Expat/Business trip' 
                                                : (formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor')
                                                    ? 'Vendor/Contractor'
                                                    : formData.visitorCategory
                                        })
                                    </button>

                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '2.5rem' }}>
                                        <h1 style={{ color: 'white', fontSize: '2.8rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                                            VISITOR REGISTRATION
                                        </h1>
                                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem' }}>
                                            Milwaukee Tool SHTP Facility Access
                                        </p>
                                    </div>
                                </div>

                                {/* Registration Form Box */}
                                <div className="bg-white" style={{ padding: '3rem', borderRadius: '24px', position: 'relative', zIndex: 0, border: '1px solid #e2e8f0' }}>
                                    <div className="animate-in fade-in duration-500">

                                        <StepIndicator />

                                        <div style={{ animation: 'slideFade 0.5s ease-out' }}>
                                    {step === 1 && (
                                        <section>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                                <div style={{ width: '4px', height: '30px', background: '#db011c' }} />
                                                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>Basic Information</h2>
                                            </div>
                                            <div className="flex flex-col gap-6">
                                                {formData.visitorCategory === 'Interviewee' ? (
                                                    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Interviewee Name *</label>
                                                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white transition-colors" required value={formData.intervieweeName} onChange={e => setFormData({ ...formData, intervieweeName: e.target.value })} placeholder="Enter interviewee full name" />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Job Title *</label>
                                                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white transition-colors" required value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="e.g. Software Engineer" />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Interview Department *</label>
                                                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white transition-colors" required value={formData.interviewDepartment} onChange={e => setFormData({ ...formData, interviewDepartment: e.target.value })} placeholder="e.g. IT" />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Interviewer Name *</label>
                                                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white transition-colors" required value={formData.interviewerName} onChange={e => setFormData({ ...formData, interviewerName: e.target.value })} placeholder="Enter interviewer name" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {(formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor' || formData.visitorCategory === 'Vendor/Contractor') && (
                                                            <div className="flex flex-col gap-4 mb-4 animate-in fade-in duration-300">
                                                                <label style={{ color: '#475569', fontWeight: 700 }}>Specific Visitor Category *</label>
                                                                <div className="grid grid-cols-2 gap-4" style={{ maxWidth: '500px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormData({ ...formData, visitorCategory: 'Vendor' })}
                                                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                                                                            formData.visitorCategory === 'Vendor' 
                                                                            ? 'border-[#db011c] bg-[#db011c]/5 text-[#db011c]' 
                                                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        <div className={`p-2 rounded-lg ${formData.visitorCategory === 'Vendor' ? 'bg-[#db011c]/10' : 'bg-gray-100'}`}>
                                                                            <BuildingOfficeIcon className="w-6 h-6" />
                                                                        </div>
                                                                        <span className="font-bold text-[15px]">Vendor</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormData({ ...formData, visitorCategory: 'Contractor' })}
                                                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                                                                            formData.visitorCategory === 'Contractor' 
                                                                            ? 'border-[#db011c] bg-[#db011c]/5 text-[#db011c]' 
                                                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        <div className={`p-2 rounded-lg ${formData.visitorCategory === 'Contractor' ? 'bg-[#db011c]/10' : 'bg-gray-100'}`}>
                                                                            <WrenchScrewdriverIcon className="w-6 h-6" />
                                                                        </div>
                                                                        <span className="font-bold text-[15px]">Contractor</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col gap-4">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Visiting Site *</label>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                                                <div
                                                                    onClick={() => toggleSite('SHTP')}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        borderRadius: '24px',
                                                                        overflow: 'hidden',
                                                                        border: (formData.visitingSite === 'SHTP' || formData.visitingSite === 'Both') ? '5px solid #db011c' : '2px solid #e2e8f0',
                                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                        position: 'relative',
                                                                        transform: (formData.visitingSite === 'SHTP' || formData.visitingSite === 'Both') ? 'scale(1.02)' : 'scale(1)',
                                                                        boxShadow: (formData.visitingSite === 'SHTP' || formData.visitingSite === 'Both') ? '0 20px 40px rgba(219, 1, 28, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
                                                                    }}
                                                                >
                                                                    <img src="/shtp.png" style={{ width: '100%', height: '220px', objectFit: 'cover' }} alt="SHTP Site" />
                                                                    <div style={{
                                                                        padding: '1.2rem',
                                                                        textAlign: 'center',
                                                                        fontWeight: 900,
                                                                        fontSize: '1.4rem',
                                                                        background: (formData.visitingSite === 'SHTP' || formData.visitingSite === 'Both') ? '#db011c' : 'white',
                                                                        color: (formData.visitingSite === 'SHTP' || formData.visitingSite === 'Both') ? 'white' : '#1e293b',
                                                                        letterSpacing: '0.05em'
                                                                    }}>
                                                                        SHTP SITE
                                                                    </div>
                                                                    {(formData.visitingSite === 'SHTP' || formData.visitingSite === 'Both') && (
                                                                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'white', color: '#db011c', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>✓</div>
                                                                    )}
                                                                </div>

                                                                <div
                                                                    onClick={() => toggleSite('DDK')}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        borderRadius: '24px',
                                                                        overflow: 'hidden',
                                                                        border: (formData.visitingSite === 'DDK' || formData.visitingSite === 'Both') ? '5px solid #db011c' : '2px solid #e2e8f0',
                                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                        position: 'relative',
                                                                        transform: (formData.visitingSite === 'DDK' || formData.visitingSite === 'Both') ? 'scale(1.02)' : 'scale(1)',
                                                                        boxShadow: (formData.visitingSite === 'DDK' || formData.visitingSite === 'Both') ? '0 20px 40px rgba(219, 1, 28, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
                                                                    }}
                                                                >
                                                                    <img src="/ddk.png" style={{ width: '100%', height: '220px', objectFit: 'cover' }} alt="DDK Site" />
                                                                    <div style={{
                                                                        padding: '1.2rem',
                                                                        textAlign: 'center',
                                                                        fontWeight: 900,
                                                                        fontSize: '1.4rem',
                                                                        background: (formData.visitingSite === 'DDK' || formData.visitingSite === 'Both') ? '#db011c' : 'white',
                                                                        color: (formData.visitingSite === 'DDK' || formData.visitingSite === 'Both') ? 'white' : '#1e293b',
                                                                        letterSpacing: '0.05em'
                                                                    }}>
                                                                        DDK SITE
                                                                    </div>
                                                                    {(formData.visitingSite === 'DDK' || formData.visitingSite === 'Both') && (
                                                                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'white', color: '#db011c', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>✓</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                                                <button onClick={nextStep} style={{ padding: '1rem 3rem', background: '#db011c', color: 'white', fontWeight: 700, borderRadius: '8px' }}>
                                                    Continue to Next Step →
                                                </button>
                                            </div>
                                        </section>
                                    )}

                                    {step === 2 && (
                                        <section>
                                            {formData.visitorCategory === 'Interviewee' ? (
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                                        <div style={{ width: '4px', height: '30px', background: '#db011c' }} />
                                                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>Schedule & Area</h2>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Start Date *</label>
                                                            <input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Start Time *</label>
                                                            <input type="time" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Interview Area *</label>
                                                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" required value={formData.interviewArea} onChange={e => setFormData({ ...formData, interviewArea: e.target.value })} placeholder="e.g. Meeting Room 4" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{ width: '4px', height: '30px', background: '#db011c' }} />
                                                            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>Visitors Information</h2>
                                                        </div>
                                                        {formData.visitors.length < 10 && (
                                                            <button type="button" onClick={addVisitor} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#db011c', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                                Add Visitor
                                                            </button>
                                                        )}
                                                    </div>

                                                    {formData.visitors.slice(0, 1).map((visitor, idx) => (
                                                        <div key={idx} style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', marginBottom: '1.5rem', position: 'relative' }}>
                                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginBottom: '1rem' }}>Visitor {idx + 1}</h3>
                                                            {formData.visitors.length > 1 && (
                                                                <button type="button" onClick={() => removeVisitor(idx)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                                                                    Remove
                                                                </button>
                                                            )}
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: formData.visitors.length > 1 ? '1.5rem' : '0' }}>
                                                                <div className="flex flex-col gap-2">
                                                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.9rem' }}>Full Name *</label>
                                                                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-white transition-colors" required value={visitor.name} onChange={e => updateVisitor(idx, 'name', e.target.value)} placeholder="Enter full name" />
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.9rem' }}>Title / Position *</label>
                                                                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-white transition-colors" required value={visitor.title} onChange={e => updateVisitor(idx, 'title', e.target.value)} placeholder="e.g. Sales Manager" />
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.9rem' }}>Company *</label>
                                                                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-white transition-colors" required value={visitor.company} onChange={e => updateVisitor(idx, 'company', e.target.value)} placeholder="Your company name" />
                                                                </div>
                                                            </div>

                                                            {formData.visitors.length > 1 && (
                                                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200/50 text-sm">
                                                                    <span className="font-semibold text-gray-500">
                                                                        ... and {formData.visitors.length - 1} more visitor(s)
                                                                    </span>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setShowAllVisitorsModal(true)} 
                                                                        className="font-black text-[#db011c] hover:text-[#900112] hover:underline bg-transparent border-none p-0 cursor-pointer"
                                                                    >
                                                                        View All
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '2rem' }}>
                                                        <div style={{ width: '4px', height: '30px', background: '#db011c' }} />
                                                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>Visit Details & Schedule</h2>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Purpose of Visit *</label>
                                                            <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" value={formData.purposeOfVisit} onChange={e => setFormData({ ...formData, purposeOfVisit: e.target.value })}>
                                                                <option>Business / Meeting</option>
                                                                <option>Installation & Maintenance</option>
                                                                <option>Technical Support</option>
                                                                <option>Audit / Inspection</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>Start Date *</label>
                                                            <input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label style={{ color: '#475569', fontWeight: 700 }}>End Date *</label>
                                                            <input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                                        </div>

                                                        {(formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor') && (
                                                            <div className="flex flex-col gap-2" style={{ gridColumn: '1 / -1' }}>
                                                                <label style={{ color: '#475569', fontWeight: 700 }}>Detail of purpose *</label>
                                                                <textarea
                                                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors"
                                                                    rows={3}
                                                                    required
                                                                    value={formData.purposeDetail}
                                                                    onChange={e => setFormData({ ...formData, purposeDetail: e.target.value })}
                                                                    placeholder="Please provide details of the visit purpose..."
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {isExpatCategory && (
                                                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' }}>Select Rooms for Access</h3>
                                                    {Object.entries(groupedRooms).map(([cat, items]: any) => (
                                                        <div key={cat} style={{ marginBottom: '1.5rem' }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.8rem' }}>{cat}</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                                                                {items.map((r: any) => {
                                                                    const isSelected = formData.roomIds.includes(r.id);
                                                                    return (
                                                                        <div 
                                                                            key={r.id} 
                                                                            onClick={() => toggleRoom(r.id)} 
                                                                            style={{
                                                                                borderRadius: '12px',
                                                                                cursor: 'pointer',
                                                                                background: 'white',
                                                                                border: isSelected ? '2px solid #db011c' : '1px solid #e2e8f0',
                                                                                boxShadow: isSelected ? '0 4px 12px rgba(219, 1, 28, 0.1)' : '0 2px 6px rgba(0, 0, 0, 0.02)',
                                                                                transition: 'all 0.2s ease',
                                                                                transform: isSelected ? 'translateY(-1px)' : 'none',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                padding: '1rem',
                                                                                gap: '0.8rem',
                                                                                position: 'relative'
                                                                            }}
                                                                        >
                                                                            <div style={{
                                                                                width: '20px',
                                                                                height: '20px',
                                                                                borderRadius: '6px',
                                                                                border: isSelected ? '2px solid #db011c' : '2px solid #cbd5e1',
                                                                                background: isSelected ? '#db011c' : 'transparent',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                color: 'white',
                                                                                fontSize: '0.75rem',
                                                                                fontWeight: 'bold',
                                                                                transition: 'all 0.2s ease',
                                                                                flexShrink: 0
                                                                            }}>
                                                                                {isSelected && '✓'}
                                                                            </div>
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', lineHeight: '1.2', marginBottom: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                    {r.name}
                                                                                </div>
                                                                                <div style={{ fontSize: '0.65rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                    Approver: {r.approver_email?.split('@')[0] || 'N/A'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
                                                <button onClick={prevStep} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>Back</button>
                                                {totalSteps === 2 ? (
                                                    <button type="button" onClick={() => setShowReviewModal(true)} disabled={loading} style={{
                                                        padding: '0.8rem 2.5rem',
                                                        background: 'linear-gradient(135deg, #db011c 0%, #900112 100%)',
                                                        color: 'white',
                                                        borderRadius: '8px',
                                                        fontWeight: 700,
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 15px rgba(219, 1, 28, 0.3)'
                                                    }}>
                                                        {loading ? 'Processing...' : 'REVIEW REGISTRATION'}
                                                    </button>
                                                ) : (
                                                    <button onClick={nextStep} style={{ background: '#1e293b', color: 'white', padding: '0.8rem 2.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Next Step →</button>
                                                )}
                                            </div>
                                        </section>
                                    )}

                                    {step === 3 && (
                                        <section>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                                <div style={{ width: '4px', height: '30px', background: '#db011c' }} />
                                                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>Final Requirements</h2>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                                                <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                                                    <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Factory Tour Requested?</p>
                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                        <button onClick={() => updateDetails('factoryTour', 'Yes')} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: formData.details.factoryTour === 'Yes' ? '#db011c' : 'white', color: formData.details.factoryTour === 'Yes' ? 'white' : '#475569', cursor: 'pointer', fontWeight: 700 }}>YES</button>
                                                        <button onClick={() => updateDetails('factoryTour', 'No')} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: formData.details.factoryTour === 'No' ? '#db011c' : 'white', color: formData.details.factoryTour === 'No' ? 'white' : '#475569', cursor: 'pointer', fontWeight: 700 }}>NO</button>
                                                    </div>
                                                </div>
                                                <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                                                    <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Meal Registration?</p>
                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                        <button onClick={() => updateDetails('mealRegistration', 'Yes')} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: formData.details.mealRegistration === 'Yes' ? '#db011c' : 'white', color: formData.details.mealRegistration === 'Yes' ? 'white' : '#475569', cursor: 'pointer', fontWeight: 700 }}>YES</button>
                                                        <button onClick={() => updateDetails('mealRegistration', 'No')} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: formData.details.mealRegistration === 'No' ? '#db011c' : 'white', color: formData.details.mealRegistration === 'No' ? 'white' : '#475569', cursor: 'pointer', fontWeight: 700 }}>NO</button>
                                                    </div>
                                                </div>
                                            </div>

                                            {formData.details.mealRegistration === 'Yes' && (
                                                <div style={{ marginBottom: '3rem', animation: 'fadeIn 0.3s' }}>
                                                    <label style={{ display: 'block', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Charged Cost Center *</label>
                                                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" style={{ maxWidth: '300px' }} value={formData.details.costCenter} onChange={e => updateDetails('costCenter', e.target.value)} placeholder="000-00-0000" />
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2rem 0', borderTop: '1px solid #e2e8f0' }}>
                                                <button onClick={prevStep} style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>← Previous Step</button>
                                                <button type="button" onClick={() => setShowReviewModal(true)} disabled={loading} style={{
                                                    padding: '1.2rem 4rem',
                                                    background: 'linear-gradient(135deg, #db011c 0%, #900112 100%)',
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    fontSize: '1.1rem',
                                                    fontWeight: 800,
                                                    boxShadow: '0 10px 30px rgba(219, 1, 28, 0.4)',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}>
                                                    {loading ? 'Processing...' : 'REVIEW REGISTRATION'}
                                                </button>
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full mt-4">
                        <Dashboard />
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes slideFade {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>

            {/* MANAGE VISITORS MODAL */}
            {showAllVisitorsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="font-extrabold text-[#0f172a] text-xl">Manage Visitors</h3>
                                <p className="text-sm text-gray-500 mt-1">Add, edit, or remove visitors for this request.</p>
                            </div>
                            <button onClick={() => setShowAllVisitorsModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full w-10 h-10 flex items-center justify-center transition-colors">&times;</button>
                        </div>
                        <div className="px-6 py-4 bg-gray-50/50 flex-1 overflow-y-auto">
                            <div className="flex justify-end mb-3">
                                {formData.visitors.length < 10 && (
                                    <button type="button" onClick={addVisitor} className="bg-[#db011c] text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#900112] transition-colors shadow-md shadow-red-500/20">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        Add New Visitor
                                    </button>
                                )}
                            </div>
                            
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                                <th className="px-4 py-3 w-10 text-center">#</th>
                                                <th className="px-4 py-3">Full Name *</th>
                                                <th className="px-4 py-3">Title / Position *</th>
                                                <th className="px-4 py-3">Company *</th>
                                                <th className="px-4 py-3 w-20 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm font-medium">
                                            {formData.visitors.map((visitor, idx) => (
                                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-2.5 text-center text-gray-400 font-bold">{idx + 1}</td>
                                                    <td className="px-4 py-2.5">
                                                        <input type="text" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" required value={visitor.name} onChange={e => updateVisitor(idx, 'name', e.target.value)} placeholder="Full name" />
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <input type="text" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" required value={visitor.title} onChange={e => updateVisitor(idx, 'title', e.target.value)} placeholder="Title" />
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <input type="text" className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" required value={visitor.company} onChange={e => updateVisitor(idx, 'company', e.target.value)} placeholder="Company" />
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        {formData.visitors.length > 1 && (
                                                            <button type="button" onClick={() => removeVisitor(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remove">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
                            <button onClick={() => setShowAllVisitorsModal(false)} className="bg-[#db011c] text-white font-bold px-8 py-2.5 rounded-xl hover:bg-[#900112] shadow-md transition-all">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REVIEW BEFORE SUBMIT MODAL */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 bg-white">
                            <h3 className="font-extrabold text-[#0f172a] text-2xl">Review Your Request</h3>
                            <p className="text-sm text-gray-500 mt-1">Please double-check your information before submitting.</p>
                        </div>
                        <div className="px-8 py-6 bg-gray-50 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                            
                            {/* Visitor Info */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Category & Location</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500 font-medium">Category</div>
                                        <div className="font-bold text-gray-900">{formData.visitorCategory}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 font-medium">Visiting Site</div>
                                        <div className="font-bold text-gray-900">{formData.visitingSite}</div>
                                    </div>
                                </div>
                            </div>

                            {formData.visitorCategory === 'Interviewee' ? (
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Interviewee Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Interviewee Name</div>
                                            <div className="font-bold text-gray-900">{formData.intervieweeName}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Job Title</div>
                                            <div className="font-bold text-gray-900">{formData.jobTitle}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Interview Department</div>
                                            <div className="font-bold text-gray-900">{formData.interviewDepartment}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Interviewer Name</div>
                                            <div className="font-bold text-gray-900">{formData.interviewerName}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Visitors ({formData.visitors.length})</h4>
                                    <div className="flex flex-col gap-3">
                                        {formData.visitors.map((v, i) => (
                                            <div key={i} className="flex flex-col">
                                                <div className="font-bold text-sm text-gray-900">{v.name || 'Unnamed'}</div>
                                                <div className="text-xs text-gray-500">{v.title} {v.title && v.company ? '@' : ''} {v.company}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Visit Details */}
                            {formData.visitorCategory === 'Interviewee' ? (
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Schedule & Area</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Start Date</div>
                                            <div className="font-bold text-gray-900">{formData.startDate || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Start Time</div>
                                            <div className="font-bold text-gray-900">{formData.startTime || 'N/A'}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-xs text-gray-500 font-medium">Interview Area</div>
                                            <div className="font-bold text-gray-900">{formData.interviewArea || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Visit Details</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">From Date</div>
                                            <div className="font-bold text-gray-900">{formData.startDate || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">To Date</div>
                                            <div className="font-bold text-gray-900">{formData.endDate || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="text-xs text-gray-500 font-medium">Purpose</div>
                                        <div className="font-bold text-gray-900">{formData.purposeOfVisit}</div>
                                        {formData.purposeDetail && <div className="text-sm text-gray-700 mt-1">{formData.purposeDetail}</div>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Factory Tour</div>
                                            <div className="font-bold text-gray-900">{formData.details.factoryTour}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Meal Registration</div>
                                            <div className="font-bold text-gray-900">{formData.details.mealRegistration}</div>
                                        </div>
                                        {formData.details.costCenter && (
                                            <div className="col-span-2">
                                                <div className="text-xs text-gray-500 font-medium">Cost Center</div>
                                                <div className="font-bold text-gray-900">{formData.details.costCenter}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Selected Areas */}
                            {formData.roomIds.length > 0 && (
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Selected Areas</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.roomIds.map(id => {
                                            const r = rooms.find((x:any) => x.id === id);
                                            return r ? (
                                                <span key={id} className="bg-red-50 text-red-700 font-bold px-3 py-1 rounded-lg text-xs border border-red-100">
                                                    {r.name}
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-between items-center">
                            <button onClick={() => setShowReviewModal(false)} className="text-gray-500 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
                                Edit Details
                            </button>
                            <button onClick={() => {
                                setShowReviewModal(false);
                                handleSubmit();
                            }} disabled={loading} className="bg-[#db011c] text-white font-bold px-8 py-2.5 rounded-xl hover:bg-[#b00116] shadow-md shadow-red-500/30 transition-all flex items-center gap-2">
                                {loading ? 'Processing...' : 'Confirm & Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
