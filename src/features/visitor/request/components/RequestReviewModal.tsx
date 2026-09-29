'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import type { VisitorRequestFormData } from '@/types/visitor-request.types';
import type { FacilityRoom } from '@/types/rooms.types';

export interface RequestReviewModalProps {
    isOpen: boolean;
    mounted: boolean;
    formData: VisitorRequestFormData;
    rooms: FacilityRoom[];
    onClose: () => void;
    onConfirm: () => void;
}

export const RequestReviewModal: React.FC<RequestReviewModalProps> = ({
    isOpen,
    mounted,
    formData,
    rooms,
    onClose,
    onConfirm
}) => {
    if (!isOpen || !mounted) return null;

    const isExpatCategory = formData.visitorCategory === 'MIL/TTI Expat / SHTP Business trip';

    return createPortal(
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
                    <button onClick={onClose} className="px-6 py-2 rounded-lg border border-gray-300 font-bold text-gray-600 hover:bg-gray-50">Edit Information</button>
                    <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-[#db011c] text-white font-bold hover:bg-red-700 shadow-md">Confirm & Submit</button>
                </div>
            </div>
        </div>,
        document.body
    );
};
