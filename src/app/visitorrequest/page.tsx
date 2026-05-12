'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NewRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<any[]>([]);
    const [step, setStep] = useState(1);
    
    const [formData, setFormData] = useState({
        visitorName: '',
        visitorTitle: '',
        currentCompany: '',
        startDate: '',
        endDate: '',
        purposeOfVisit: 'Business / Meeting',
        visitorCategory: 'Vendor',
        visitingSite: 'SHTP',
        purposeDetail: '',
        details: {
            factoryTour: 'No',
            mealRegistration: 'No',
            costCenter: ''
        },
        roomIds: [] as string[]
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

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert('Registration successful!');
                router.push('/visitordashboard');
                router.refresh();
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

    const nextStep = () => setStep(s => s + 1);
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

    const groupedRooms = rooms.reduce((acc: any, room: any) => {
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

    const StepIndicator = () => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '3rem', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
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
                    {i < 3 && <div style={{ width: '60px', height: '3px', background: step > i ? '#db011c' : '#e2e8f0', margin: '0 8px', borderRadius: '3px', transition: 'background 0.4s' }} />}
                </div>
            ))}
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '2rem 1rem' }}>
            <div className="container mx-auto" style={{ maxWidth: '1000px' }}>
                

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
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '2.5rem' }}>
                        <h1 style={{ color: 'white', fontSize: '2.8rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>VISITOR REGISTRATION</h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem' }}>Milwaukee Tool SHTP Facility Access</p>
                    </div>
                </div>

                <div className="bg-white" style={{ padding: '4rem 3rem 3rem', borderRadius: '24px', position: 'relative', zIndex: 0, border: '1px solid #e2e8f0' }}>
                    <StepIndicator />

                    <div style={{ animation: 'slideFade 0.5s ease-out' }}>
                        {step === 1 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ width: '4px', height: '30px', background: '#db011c' }} />
                                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>Basic Information</h2>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2" style={{ maxWidth: '400px' }}>
                                        <label style={{ color: '#475569', fontWeight: 700 }}>Visitor Category *</label>
                                        <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" value={formData.visitorCategory} onChange={e => setFormData({ ...formData, visitorCategory: e.target.value })}>
                                            <option>Vendor</option>
                                            <option>MIL/TTI Expat / SHTP Business trip</option>
                                            <option>Contractor</option>
                                            <option>Interviewee</option>
                                        </select>
                                    </div>
                                    
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ width: '4px', height: '30px', background: '#db011c' }} />
                                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>Visit Details & Schedule</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ color: '#475569', fontWeight: 700 }}>Visitor Name *</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" required value={formData.visitorName} onChange={e => setFormData({ ...formData, visitorName: e.target.value })} placeholder="Enter full name" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ color: '#475569', fontWeight: 700 }}>Title / Position *</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" required value={formData.visitorTitle} onChange={e => setFormData({ ...formData, visitorTitle: e.target.value })} placeholder="e.g. Sales Manager" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ color: '#475569', fontWeight: 700 }}>Current Company *</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 xl focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors" required value={formData.currentCompany} onChange={e => setFormData({ ...formData, currentCompany: e.target.value })} placeholder="Your company name" />
                                    </div>
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

                                {isExpatCategory && (
                                    <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' }}>Select Rooms for Access</h3>
                                        {Object.entries(groupedRooms).map(([cat, items]: any) => (
                                            <div key={cat} style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.8rem' }}>{cat}</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                                                    {items.map((r: any) => (
                                                        <div key={r.id} onClick={() => toggleRoom(r.id)} style={{
                                                            borderRadius: '12px',
                                                            overflow: 'hidden',
                                                            cursor: 'pointer',
                                                            background: 'white',
                                                            border: formData.roomIds.includes(r.id) ? '2px solid #db011c' : '1px solid #e2e8f0',
                                                            boxShadow: formData.roomIds.includes(r.id) ? '0 10px 20px rgba(219, 1, 28, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                                            transition: 'all 0.2s ease',
                                                            transform: formData.roomIds.includes(r.id) ? 'translateY(-2px)' : 'none',
                                                            display: 'flex',
                                                            flexDirection: 'column'
                                                        }}>
                                                            <div style={{ height: '60px', position: 'relative', overflow: 'hidden' }}>
                                                                <img 
                                                                    src={r.image_url || '/visitor_header.png'} 
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: formData.roomIds.includes(r.id) ? 1 : 0.8 }} 
                                                                    alt={r.name} 
                                                                />
                                                                {formData.roomIds.includes(r.id) && (
                                                                    <div style={{ position: 'absolute', top: '5px', right: '5px', background: '#db011c', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</div>
                                                                )}
                                                            </div>
                                                            <div style={{ padding: '0.8rem', flex: 1 }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', lineHeight: '1.2', marginBottom: '0.2rem' }}>{r.name}</div>
                                                                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Approver: {r.approver_email?.split('@')[0] || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
                                    <button onClick={prevStep} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>Back</button>
                                    <button onClick={nextStep} style={{ background: '#1e293b', color: 'white', padding: '0.8rem 2.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Next Step →</button>
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
                                    <button onClick={handleSubmit} disabled={loading} style={{ 
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
                                        {loading ? 'Processing...' : 'SUBMIT REGISTRATION'}
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideFade {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
