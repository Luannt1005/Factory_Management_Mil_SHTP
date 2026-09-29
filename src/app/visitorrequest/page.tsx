'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '../visitordashboard/page';
import { useSession } from 'next-auth/react';
import { visitorRequestApi } from '@/features/visitor/request/services/visitorRequestApi';
import type {
    VisitorRequestFormData,
    CreateVisitorRequestPayload,
    VisitorInfo,
    IntervieweeInfo,
} from '@/types/visitor-request.types';
import type {
    FacilityRoom,
    MeetingRoom,
    HostDepartment,
} from '@/types/rooms.types';
import {
    SectionHeader,
    CategorySelector,
    VisitorList,
    IntervieweeForm,
    IntervieweeSchedule,
    GeneralVisitDetails,
    HostDepartmentSelector,
    RoomSelector,
    FinalRequirements,
    RequestReviewModal,
} from '@/features/visitor/request/components';
import {
    formatName,
    capitalizeWords,
} from '@/features/visitor/request/utils/formatters';

const INITIAL_FORM_DATA: VisitorRequestFormData = {
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
};

export default function NewRequestPage() {
    const { data: session } = useSession();
    const appRoleNames = (session?.user as any)?.app_role_names || [];
    const isAdmin = (session?.user as any)?.role === 'admin';
    const isHrVisitor = appRoleNames.includes('Hr Visitor') || isAdmin;
    const isSecurity = appRoleNames.includes('Security') && !isAdmin && !isHrVisitor;
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [activeTab] = useState<'request' | 'dashboard'>('request');
    const [rooms, setRooms] = useState<FacilityRoom[]>([]);
    const [hostDepartments, setHostDepartments] = useState<HostDepartment[]>([]);
    const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
    const [step, setStep] = useState(1);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [formData, setFormData] = useState<VisitorRequestFormData>(INITIAL_FORM_DATA);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const data = await visitorRequestApi.getRooms();
                setRooms(data.rooms);
            } catch (err) {
                console.error("Failed to fetch rooms", err);
            }
        };
        const fetchMeetingRooms = async () => {
            try {
                const data = await visitorRequestApi.getMeetingRooms();
                setMeetingRooms(data.meetingRooms || []);
            } catch (error) {
                console.error('Failed to fetch meeting rooms:', error);
            }
        };

        const fetchHostDepartments = async () => {
            try {
                const data = await visitorRequestApi.getHostDepartments(false);
                setHostDepartments(data.hostDepartments);
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

    const isExpatCategory = formData.visitorCategory === 'MIL/TTI Expat / SHTP Business trip';
    const isVendorOrContractor = formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor' || formData.visitorCategory === 'Vendor/Contractor';

    // Safe local date parser to avoid UTC shift
    const parseLocalDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        const parts = dateStr.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return new Date(dateStr);
    };

    const formatDateISO = (d: Date) => {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    // Calculate max working days from a starting date (skipping Saturday & Sunday)
    // The start date itself counts as the 1st working day (if it falls on a weekday)
    const addWorkingDays = (startDate: Date, days: number) => {
        let date = new Date(startDate);
        let count = (date.getDay() !== 0 && date.getDay() !== 6) ? 1 : 0;
        while (count < days) {
            date.setDate(date.getDate() + 1);
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                count++;
            }
        }
        return date;
    };

    // Calculate date limits
    const today = new Date();
    const todayStr = formatDateISO(today);

    // Calculate max end date dynamically based on formData.startDate (or today if not selected yet)
    const baseStartDate = formData.startDate ? parseLocalDate(formData.startDate) : today;
    let maxEndDateStr: string | undefined = undefined;

    if (isVendorOrContractor) {
        const maxDate = addWorkingDays(baseStartDate, 7);
        maxEndDateStr = formatDateISO(maxDate);
    } else if (isExpatCategory) {
        const maxDate = new Date(baseStartDate);
        maxDate.setMonth(maxDate.getMonth() + 6);
        maxEndDateStr = formatDateISO(maxDate);
    }

    const handleStartDateChange = (newStartDate: string) => {
        let newEndDate = formData.endDate;
        if (newStartDate) {
            const baseDate = parseLocalDate(newStartDate);
            let limitStr: string | undefined = undefined;
            if (isVendorOrContractor) {
                limitStr = formatDateISO(addWorkingDays(baseDate, 7));
            } else if (isExpatCategory) {
                const maxDate = new Date(baseDate);
                maxDate.setMonth(maxDate.getMonth() + 6);
                limitStr = formatDateISO(maxDate);
            }

            if (newEndDate) {
                if (newEndDate < newStartDate) {
                    newEndDate = newStartDate;
                } else if (limitStr && newEndDate > limitStr) {
                    newEndDate = limitStr;
                }
            }
        }
        setFormData(prev => ({ ...prev, startDate: newStartDate, endDate: newEndDate }));
    };

    useEffect(() => {
        if (formData.endDate && maxEndDateStr && formData.endDate > maxEndDateStr) {
            setFormData(prev => ({ ...prev, endDate: maxEndDateStr }));
        } else if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
            setFormData(prev => ({ ...prev, endDate: formData.startDate }));
        }
    }, [formData.startDate, formData.endDate, maxEndDateStr]);

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
                    name: formatName(c.name),
                    title: capitalizeWords(c.jobTitle),
                    company: c.interviewDepartment ? capitalizeWords(c.interviewDepartment) : 'Candidate',
                    interviewDepartment: capitalizeWords(c.interviewDepartment),
                    interviewerName: formatName(c.interviewerName)
                }))
                : formData.visitors.map(v => ({
                    name: formatName(v.name),
                    title: capitalizeWords(v.title),
                    company: capitalizeWords(v.company)
                }));

            const payload: CreateVisitorRequestPayload = {
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

            await visitorRequestApi.createVisitorRequest(payload);

            alert('Registration successful!');
            setStep(1);
            setFormData(INITIAL_FORM_DATA);
            if (isInterviewee) {
                router.push('/visitordashboard?tab=interviewee');
            } else {
                router.push('/visitordashboard?tab=general');
            }
        } catch (err: any) {
            if (err?.message && err.message !== 'Failed to submit visitor request') {
                alert(`Lỗi: ${err.message}`);
            } else {
                alert('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Visitor Handlers
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

    const updateVisitor = (index: number, field: keyof VisitorInfo, value: string) => {
        setFormData(prev => {
            const newVisitors = [...prev.visitors];
            newVisitors[index] = { ...newVisitors[index], [field]: value };
            return { ...prev, visitors: newVisitors };
        });
    };

    const importVisitors = (imported: VisitorInfo[]) => {
        setFormData(prev => ({ ...prev, visitors: imported }));
    };

    // Interviewee Handlers
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

    const updateInterviewee = (index: number, field: keyof IntervieweeInfo, value: string) => {
        setFormData(prev => {
            const newInterviewees = [...prev.interviewees];
            newInterviewees[index] = { ...newInterviewees[index], [field]: value };
            return { ...prev, interviewees: newInterviewees };
        });
    };

    const importInterviewees = (imported: IntervieweeInfo[]) => {
        setFormData(prev => ({ ...prev, interviewees: imported }));
    };

    // Expat Handlers
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

    const toggleRoom = (id: string) => {
        setFormData(prev => ({
            ...prev,
            roomIds: prev.roomIds.includes(id)
                ? prev.roomIds.filter(rid => rid !== id)
                : [...prev.roomIds, id]
        }));
    };

    const updateDetails = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            details: { ...prev.details, [key]: value }
        }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Format names to Title Case before validation and review
        if (formData.visitorCategory === 'Interviewee') {
            const formatted = formData.interviewees.map(cand => ({
                ...cand,
                name: formatName(cand.name),
                interviewerName: formatName(cand.interviewerName),
                jobTitle: capitalizeWords(cand.jobTitle),
                interviewDepartment: capitalizeWords(cand.interviewDepartment)
            }));
            setFormData(prev => ({ ...prev, interviewees: formatted }));

            for (let i = 0; i < formatted.length; i++) {
                const cand = formatted[i];
                const name = (cand.name || '').trim();
                if (name.length < 2) {
                    alert(`Vui lòng nhập họ và tên ứng viên #${i + 1} hợp lệ (chỉ chứa chữ cái, tối thiểu 2 ký tự).`);
                    return;
                }
                if (cand.interviewerName && cand.interviewerName.trim().length < 2) {
                    alert(`Vui lòng nhập tên người phỏng vấn #${i + 1} hợp lệ (tối thiểu 2 ký tự).`);
                    return;
                }
            }
        } else {
            const formatted = formData.visitors.map(v => ({
                ...v,
                name: formatName(v.name),
                company: capitalizeWords(v.company),
                title: capitalizeWords(v.title)
            }));
            setFormData(prev => ({ ...prev, visitors: formatted }));

            for (let i = 0; i < formatted.length; i++) {
                const v = formatted[i];
                const name = (v.name || '').trim();
                if (name.length < 2) {
                    alert(`Vui lòng nhập họ và tên khách #${i + 1} hợp lệ (chỉ chứa chữ cái, tối thiểu 2 ký tự).`);
                    return;
                }
            }
        }
        setShowReviewModal(true);
    };

    return (
        <div className="w-full">
            <div className="w-full mx-auto">
                {activeTab === 'request' ? (
                    <>
                        <div style={{ marginBottom: '12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Select visitor category to begin registration
                        </div>
                        
                        {/* Category Selection Cards */}
                        <CategorySelector
                            selectedCategory={formData.visitorCategory}
                            isHrVisitor={isHrVisitor}
                            isSecurity={isSecurity}
                            onSelectCategory={(cat) => setFormData(prev => ({ ...prev, visitorCategory: cat }))}
                        />

                        {/* Form Container */}
                        {formData.visitorCategory && (
                            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                {/* Active Category Badge */}
                                <div style={{ display: 'inline-block', backgroundColor: '#db011c', color: 'white', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '4px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {(formData.visitorCategory === 'Vendor' || formData.visitorCategory === 'Contractor' || formData.visitorCategory === 'Vendor/Contractor')
                                        ? 'VENDOR / CONTRACTOR'
                                        : formData.visitorCategory === 'Interviewee'
                                            ? 'INTERVIEWEE'
                                            : 'MIL / TTI EXPAT'
                                    }
                                </div>

                                <form onSubmit={handleFormSubmit}>
                                    {/* VISITOR INFORMATION */}
                                    <SectionHeader title="Visitor Information" />
                                    <div style={{ fontSize: '13px', color: '#ef4444', fontStyle: 'italic', marginBottom: '20px', marginTop: '-12px', fontWeight: 500 }}>
                                        * Note: Please enter the name exactly as shown on the ID/Passport, including Vietnamese diacritics where applicable. We are not responsible for incorrect information.
                                    </div>

                                    {formData.visitorCategory === 'Interviewee' ? (
                                        <IntervieweeForm
                                            interviewees={formData.interviewees}
                                            onAddInterviewee={addInterviewee}
                                            onRemoveInterviewee={removeInterviewee}
                                            onUpdateInterviewee={updateInterviewee}
                                            onImportInterviewees={importInterviewees}
                                        />
                                    ) : (
                                        <VisitorList
                                            visitors={formData.visitors}
                                            onAddVisitor={addVisitor}
                                            onRemoveVisitor={removeVisitor}
                                            onUpdateVisitor={updateVisitor}
                                            onImportVisitors={importVisitors}
                                        />
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
                                                    onChange={() => setFormData({ ...formData, visitorCategory: 'Vendor' })}
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
                                                    onChange={() => setFormData({ ...formData, visitorCategory: 'Contractor' })}
                                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                />
                                                Contractor
                                            </label>
                                        </div>
                                    )}

                                    {/* VISIT DETAILS */}
                                    <SectionHeader title="Visit Details" />

                                    {formData.visitorCategory === 'Interviewee' ? (
                                        <IntervieweeSchedule
                                            startDate={formData.startDate}
                                            startTime={formData.startTime}
                                            interviewArea={formData.interviewArea || ''}
                                            todayStr={todayStr}
                                            meetingRooms={meetingRooms}
                                            onStartDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                                            onStartTimeChange={(time) => setFormData(prev => ({ ...prev, startTime: time }))}
                                            onInterviewAreaChange={(area) => setFormData(prev => ({ ...prev, interviewArea: area }))}
                                        />
                                    ) : (
                                        <GeneralVisitDetails
                                            visitingSite={formData.visitingSite}
                                            purposeOfVisit={formData.purposeOfVisit}
                                            startDate={formData.startDate}
                                            endDate={formData.endDate}
                                            purposeDetail={formData.purposeDetail}
                                            todayStr={todayStr}
                                            maxEndDateStr={maxEndDateStr}
                                            isVendorOrContractor={isVendorOrContractor}
                                            isExpatCategory={isExpatCategory}
                                            visitorCategory={formData.visitorCategory}
                                            onToggleSite={toggleSite}
                                            onPurposeChange={(purpose) => setFormData(prev => ({ ...prev, purposeOfVisit: purpose }))}
                                            onStartDateChange={handleStartDateChange}
                                            onEndDateChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                                            onPurposeDetailChange={(detail) => setFormData(prev => ({ ...prev, purposeDetail: detail }))}
                                        />
                                    )}

                                    {/* EXPAT SPECIFIC SECTIONS */}
                                    {isExpatCategory && (
                                        <>
                                            <HostDepartmentSelector
                                                hostDepartments={hostDepartments}
                                                bu={formData.bu || ''}
                                                functionalDept={formData.functionalDept || ''}
                                                department={formData.department || ''}
                                                onBuChange={(bu) => setFormData(prev => ({ ...prev, bu, functionalDept: '', department: '' }))}
                                                onFunctionalDeptChange={(dept) => setFormData(prev => ({ ...prev, functionalDept: dept, department: '' }))}
                                                onDepartmentChange={(dept) => setFormData(prev => ({ ...prev, department: dept }))}
                                            />

                                            <RoomSelector
                                                rooms={rooms}
                                                visitingSite={formData.visitingSite}
                                                selectedRoomIds={formData.roomIds}
                                                onToggleRoom={toggleRoom}
                                            />

                                            <FinalRequirements
                                                details={formData.details}
                                                onUpdateDetail={updateDetails}
                                            />
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
                    </>
                ) : (
                    <div style={{ marginTop: '16px' }}>
                        <Dashboard />
                    </div>
                )}
            </div>

            {/* REVIEW MODAL */}
            <RequestReviewModal
                isOpen={showReviewModal}
                mounted={mounted}
                formData={formData}
                rooms={rooms}
                onClose={() => setShowReviewModal(false)}
                onConfirm={() => {
                    setShowReviewModal(false);
                    handleSubmit();
                }}
            />
        </div>
    );
}
