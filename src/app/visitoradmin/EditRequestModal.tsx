import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function EditRequestModal({ request, onClose, onSave }: { request: any, onClose: () => void, onSave: (updatedData: any) => void }) {
    const [formData, setFormData] = useState<any>({
        start_date: '',
        end_date: '',
        visitor_category: '',
        visiting_site: '',
        purpose: '',
        costCenter: '',
        factoryTour: 'No',
        visitors: [],
        interviewee_name: '',
        job_title: '',
        interview_department: ''
    });
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (request) {
            let parsedDetails: any = {};
            try { parsedDetails = JSON.parse(request.details || '{}'); } catch (e) {}
            let parsedVisitors = [];
            try { parsedVisitors = JSON.parse(request.visitors || '[]'); } catch (e) {}

            if (parsedVisitors.length === 0 && request.visitor_name) {
                parsedVisitors = [{ name: request.visitor_name, company: request.current_company || '', title: request.visitor_title || '' }];
            }

            setFormData({
                start_date: request.start_date ? new Date(request.start_date).toISOString().split('T')[0] : '',
                end_date: request.end_date ? new Date(request.end_date).toISOString().split('T')[0] : '',
                visitor_category: request.visitor_category || '',
                visiting_site: request.visiting_site || '',
                purpose: parsedDetails.purpose || '',
                costCenter: parsedDetails.costCenter || '',
                factoryTour: parsedDetails.factoryTour || 'No',
                visitors: parsedVisitors,
                interviewee_name: request.interviewee_name || '',
                job_title: request.job_title || '',
                interview_department: request.interview_department || ''
            });
        }
    }, [request]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const detailsObj = {
                purpose: formData.purpose,
                costCenter: formData.costCenter,
                factoryTour: formData.factoryTour
            };

            const payload = {
                start_date: formData.start_date,
                end_date: formData.end_date,
                visitor_category: formData.visitor_category,
                visiting_site: formData.visiting_site,
                details: detailsObj,
                visitors: formData.visitors,
                interviewee_name: formData.interviewee_name,
                job_title: formData.job_title,
                interview_department: formData.interview_department
            };

            const res = await fetch(`/api/requests/${request.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to update request');
            const data = await res.json();
            onSave(data.data);
        } catch (error) {
            console.error(error);
            alert('Error updating request');
        } finally {
            setLoading(false);
        }
    };

    const handleVisitorChange = (index: number, field: string, value: string) => {
        const newVisitors = [...formData.visitors];
        newVisitors[index] = { ...newVisitors[index], [field]: value };
        setFormData({ ...formData, visitors: newVisitors });
    };

    if (!request || !mounted) return null;

    const isInterview = request.record_type === 'interviewee';

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4 sm:p-8" onClick={onClose}>
            <div className="bg-white w-full max-w-5xl max-h-full overflow-y-auto rounded-2xl shadow-2xl relative text-[#0f172a] animate-in zoom-in-95 duration-200 border-t-[8px] border-t-blue-600 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 pb-4 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 tracking-tight">Edit Request ({request.request_code || 'N/A'})</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                    {/* General Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                            <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                            <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                        {!isInterview && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                    <select value={formData.visitor_category} onChange={e => setFormData({...formData, visitor_category: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="Vendor">Vendor</option>
                                        <option value="Contractor">Contractor</option>
                                        <option value="MIL/TTI Expat / SHTP Business trip">MIL/TTI Expat / SHTP Business trip</option>
                                        <option value="Interviewee">Interviewee</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Visiting Site</label>
                                    <input type="text" value={formData.visiting_site} onChange={e => setFormData({...formData, visiting_site: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Purpose</label>
                                    <input type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Factory Tour</label>
                                    <select value={formData.factoryTour} onChange={e => setFormData({...formData, factoryTour: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </>
                        )}
                        {isInterview && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Interviewee Name</label>
                                    <input type="text" value={formData.interviewee_name} onChange={e => setFormData({...formData, interviewee_name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job Title</label>
                                    <input type="text" value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                                    <input type="text" value={formData.interview_department} onChange={e => setFormData({...formData, interview_department: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Visitors List (if general request) */}
                    {!isInterview && formData.visitors && formData.visitors.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold border-b pb-2">Visitors</h3>
                            {formData.visitors.map((v: any, index: number) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Name</label>
                                        <input type="text" value={v.name || ''} onChange={e => handleVisitorChange(index, 'name', e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Company</label>
                                        <input type="text" value={v.company || ''} onChange={e => handleVisitorChange(index, 'company', e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Title</label>
                                        <input type="text" value={v.title || ''} onChange={e => handleVisitorChange(index, 'title', e.target.value)} className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
