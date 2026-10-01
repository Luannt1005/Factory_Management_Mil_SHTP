'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { cleanNameInput, formatName } from '@/utils/string';
import type {
    VisitorDashboardRequestRecord,
    VisitorDashboardCandidateItem,
    VisitorDashboardParsedDetails,
    UpdateIntervieweeRequestPayload,
    MeetingRoom,
} from '@/types/visitor-dashboard.types';

export interface VisitorEditIntervieweeModalProps {
    request: VisitorDashboardRequestRecord | null;
    mounted: boolean;
    meetingRooms: MeetingRoom[];
    saving: boolean;
    onClose: () => void;
    onSubmit: (requestId: string, payload: UpdateIntervieweeRequestPayload) => Promise<void>;
}

const parseDetails = (details: unknown): VisitorDashboardParsedDetails => {
    if (!details) return {};
    if (typeof details === 'object') return details as VisitorDashboardParsedDetails;
    try {
        return JSON.parse(details as string) as VisitorDashboardParsedDetails;
    } catch {
        return {};
    }
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = (props: InputProps) => (
    <input
        {...props}
        style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            backgroundColor: '#f8fafc',
            color: '#1e293b',
            outline: 'none',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#db011c')}
        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
        onClick={(e) => {
            if (props.type === 'date' || props.type === 'time') {
                try {
                    if ('showPicker' in e.currentTarget) {
                        e.currentTarget.showPicker();
                    }
                } catch {
                    // Ignore showPicker failure
                }
            }
            if (props.onClick) props.onClick(e);
        }}
    />
);

const InputLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label
        style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '6px',
            marginTop: '8px',
        }}
    >
        {children}
        {required && <span style={{ color: '#db011c', marginLeft: '4px' }}>*</span>}
    </label>
);

export function VisitorEditIntervieweeModal({
    request,
    mounted,
    meetingRooms,
    saving,
    onClose,
    onSubmit,
}: VisitorEditIntervieweeModalProps) {
    const [editFormData, setEditFormData] = useState<Partial<UpdateIntervieweeRequestPayload>>({});

    useEffect(() => {
        if (request) {
            let initialVisitors: VisitorDashboardCandidateItem[] = [];
            try {
                initialVisitors = request.visitors ? JSON.parse(request.visitors) : [];
            } catch {
                initialVisitors = [];
            }
            if (!initialVisitors || initialVisitors.length === 0) {
                initialVisitors = [
                    {
                        name: request.visitor_name || request.interviewee_name || '',
                        title: request.visitor_title || request.job_title || '',
                        company: request.current_company || '',
                        interviewDepartment:
                            request.interview_department || request.current_company || '',
                        interviewerName: request.interviewer_name || '',
                    },
                ];
            }
            const dt = parseDetails(request.details);
            setEditFormData({
                visitors: initialVisitors,
                startDate: request.start_date
                    ? new Date(request.start_date).toISOString().split('T')[0]
                    : '',
                startTime: dt.startTime || request.start_time || '',
                interviewArea: request.purpose_detail || dt.interviewArea || request.interview_area || '',
                mealRegistration: dt.mealRegistration || 'No',
                factoryTour: dt.factoryTour || 'No',
                visitingSite: request.visiting_site || 'SHTP',
            });
        }
    }, [request]);

    if (!request || !mounted) return null;

    const editCount = request.edit_count || request.editCount || 0;
    const candidates = editFormData.visitors || [];

    const handleSave = async () => {
        if (candidates.length === 0) {
            alert('Please add at least one candidate.');
            return;
        }
        if (candidates.length > 20) {
            alert('Maximum 20 candidates allowed.');
            return;
        }
        for (let i = 0; i < candidates.length; i++) {
            const v = candidates[i];
            if (!v.name || !v.name.trim()) {
                alert(`Please enter Candidate #${i + 1} Name.`);
                return;
            }
        }
        if (!editFormData.startDate) {
            alert('Please select Schedule Date.');
            return;
        }
        if (!editFormData.startTime) {
            alert('Please select Schedule Time.');
            return;
        }
        if (!editFormData.interviewArea) {
            alert('Please select Interview Area.');
            return;
        }

        const formattedVisitors: VisitorDashboardCandidateItem[] = candidates.map((v) => ({
            name: formatName(v.name || ''),
            title: (v.title || '').trim(),
            company: (v.company || v.interviewDepartment || '').trim(),
            interviewDepartment: (v.interviewDepartment || '').trim(),
            interviewerName: formatName(v.interviewerName || ''),
        }));

        const payload: UpdateIntervieweeRequestPayload = {
            visitors: formattedVisitors,
            startDate: editFormData.startDate,
            startTime: editFormData.startTime,
            interviewArea: editFormData.interviewArea,
            mealRegistration: editFormData.mealRegistration || 'No',
            factoryTour: editFormData.factoryTour || 'No',
            visitingSite: editFormData.visitingSite || 'SHTP',
        };

        await onSubmit(request.id, payload);
    };

    const roomsByFloor = meetingRooms.reduce((acc, room) => {
        if (!acc[room.floorName]) acc[room.floorName] = [];
        acc[room.floorName].push(room);
        return acc;
    }, {} as Record<string, MeetingRoom[]>);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative z-10 max-h-[90vh] flex flex-col overflow-hidden border-t-[6px] border-[#db011c]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">
                            Edit Interviewee Request
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">
                            Request #{request.id?.split('-')[0]?.toUpperCase()} • Edit count:{' '}
                            <span className="font-bold text-blue-600">{editCount}/3</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                    {/* Candidates Table */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                <span>Candidate List</span>
                                <span className="bg-red-50 text-[#db011c] border border-red-200 px-2 py-0.5 rounded-full text-[11px] font-black">
                                    {candidates.length}
                                </span>
                            </h3>
                            {candidates.length < 20 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = [...candidates];
                                        updated.push({
                                            name: '',
                                            title: '',
                                            company: '',
                                            interviewDepartment: '',
                                            interviewerName: '',
                                        });
                                        setEditFormData({ ...editFormData, visitors: updated });
                                    }}
                                    className="px-3 py-1.5 bg-white border border-[#db011c] text-[#db011c] hover:bg-red-50 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span className="text-[#db011c] font-black text-sm">+</span> Add Candidate
                                </button>
                            ) : (
                                <span className="text-xs text-[#db011c] font-bold">
                                    Max 20 Candidates Reached
                                </span>
                            )}
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-gray-100/80 text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                                        <th className="py-2.5 px-3 min-w-[160px]">
                                            Full Name <span className="text-red-500">*</span>
                                        </th>
                                        <th className="py-2.5 px-3 min-w-[140px]">
                                            Job Title <span className="text-red-500">*</span>
                                        </th>
                                        <th className="py-2.5 px-3 min-w-[140px]">
                                            Department <span className="text-red-500">*</span>
                                        </th>
                                        <th className="py-2.5 px-3 min-w-[140px]">
                                            Interviewer <span className="text-red-500">*</span>
                                        </th>
                                        <th className="py-2.5 px-3 w-16 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {candidates.map((cand, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-2 px-3 text-center font-bold text-gray-400">
                                                {idx + 1}
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Candidate Name"
                                                    value={cand.name || ''}
                                                    onChange={(e) => {
                                                        const updated = [...candidates];
                                                        updated[idx].name = cleanNameInput(e.target.value);
                                                        setEditFormData({ ...editFormData, visitors: updated });
                                                    }}
                                                    onBlur={() => {
                                                        const updated = [...candidates];
                                                        updated[idx].name = formatName(updated[idx].name || '');
                                                        setEditFormData({ ...editFormData, visitors: updated });
                                                    }}
                                                    style={{ textTransform: 'capitalize' }}
                                                    className="w-full px-2.5 py-1.5 text-xs bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#db011c] focus:ring-1 focus:ring-red-200 rounded-md outline-none transition-all font-medium text-[#0f172a]"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="e.g. Software Engineer"
                                                    value={cand.title || ''}
                                                    onChange={(e) => {
                                                        const updated = [...candidates];
                                                        updated[idx].title = e.target.value;
                                                        setEditFormData({ ...editFormData, visitors: updated });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 text-xs bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#db011c] focus:ring-1 focus:ring-red-200 rounded-md outline-none transition-all font-medium text-[#0f172a]"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="e.g. IT Department"
                                                    value={cand.interviewDepartment || cand.company || ''}
                                                    onChange={(e) => {
                                                        const updated = [...candidates];
                                                        updated[idx].interviewDepartment = e.target.value;
                                                        updated[idx].company = e.target.value;
                                                        setEditFormData({ ...editFormData, visitors: updated });
                                                    }}
                                                    className="w-full px-2.5 py-1.5 text-xs bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#db011c] focus:ring-1 focus:ring-red-200 rounded-md outline-none transition-all font-medium text-[#0f172a]"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="e.g. Tran Thi B"
                                                    value={cand.interviewerName || ''}
                                                    onChange={(e) => {
                                                        const updated = [...candidates];
                                                        updated[idx].interviewerName = cleanNameInput(e.target.value);
                                                        setEditFormData({ ...editFormData, visitors: updated });
                                                    }}
                                                    onBlur={() => {
                                                        const updated = [...candidates];
                                                        updated[idx].interviewerName = formatName(
                                                            updated[idx].interviewerName || ''
                                                        );
                                                        setEditFormData({ ...editFormData, visitors: updated });
                                                    }}
                                                    style={{ textTransform: 'capitalize' }}
                                                    className="w-full px-2.5 py-1.5 text-xs bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#db011c] focus:ring-1 focus:ring-red-200 rounded-md outline-none transition-all font-medium text-[#0f172a]"
                                                />
                                            </td>
                                            <td className="py-1.5 px-3 text-center">
                                                {candidates.length > 1 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = candidates.filter(
                                                                (_, i) => i !== idx
                                                            );
                                                            setEditFormData({
                                                                ...editFormData,
                                                                visitors: updated,
                                                            });
                                                        }}
                                                        className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition-colors"
                                                        title="Remove candidate"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4 mx-auto"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Schedule & Area Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <InputLabel required>Schedule Date</InputLabel>
                            <Input
                                required
                                type="date"
                                value={editFormData.startDate || ''}
                                onChange={(e) =>
                                    setEditFormData({ ...editFormData, startDate: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <InputLabel required>Schedule Time</InputLabel>
                            <Input
                                required
                                type="time"
                                value={editFormData.startTime || ''}
                                onChange={(e) =>
                                    setEditFormData({ ...editFormData, startTime: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <InputLabel>Meal Registration</InputLabel>
                            <select
                                className="w-full h-[40px] px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                                value={editFormData.mealRegistration || 'No'}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        mealRegistration: e.target.value,
                                    })
                                }
                            >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        <div>
                            <InputLabel>Factory Tour</InputLabel>
                            <select
                                className="w-full h-[40px] px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                                value={editFormData.factoryTour || 'No'}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        factoryTour: e.target.value,
                                    })
                                }
                            >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        <div className="md:col-span-4">
                            <InputLabel required>Interview Area (Meeting Room)</InputLabel>
                            <select
                                required
                                className="w-full h-[40px] px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                                value={editFormData.interviewArea || ''}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        interviewArea: e.target.value,
                                    })
                                }
                            >
                                <option value="" disabled>
                                    Select Meeting Room
                                </option>
                                {Object.entries(roomsByFloor).map(([floor, rooms]) => (
                                    <optgroup key={floor} label={floor}>
                                        {rooms.map((room) => (
                                            <option
                                                key={room.id}
                                                value={`${room.floorName} - ${room.roomName}`}
                                            >
                                                {room.roomName}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        loading={saving}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
