import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { visitorAdminApi } from '@/features/visitor/admin/services/visitorAdminApi';
import type {
    VisitorAdminRequestRecord,
    UpdateVisitorRequestEditPayload,
    EditModalVisitorItem,
} from '@/types/visitor-admin.types';

export interface VisitorEditModalProps {
    request: VisitorAdminRequestRecord | null;
    onClose: () => void;
    onSave: (updatedData: VisitorAdminRequestRecord) => void;
}

interface VisitorEditFormData {
    start_date: string;
    end_date: string;
    visitor_category: string;
    visiting_site: string;
    purpose: string;
    costCenter: string;
    factoryTour: string;
    visitors: EditModalVisitorItem[];
    interviewee_name: string;
    job_title: string;
    interview_department: string;
}

export default function VisitorEditModal({
    request,
    onClose,
    onSave,
}: VisitorEditModalProps) {
    const [formData, setFormData] = useState<VisitorEditFormData>({
        start_date: '',
        end_date: '',
        visitor_category: 'Vendor',
        visiting_site: 'SHTP',
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

    const formatToLocalDateInput = (dateVal: unknown) => {
        if (!dateVal || typeof dateVal !== 'string') return '';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        setMounted(true);
        if (request) {
            let parsedDetails: Record<string, any> = {};
            try {
                parsedDetails = typeof request.details === 'string' ? JSON.parse(request.details || '{}') : (request.details || {});
            } catch (e) {}

            let parsedVisitors: EditModalVisitorItem[] = [];
            try {
                parsedVisitors = typeof request.visitors === 'string' ? JSON.parse(request.visitors || '[]') : (request.visitors || []);
            } catch (e) {}

            if (parsedVisitors.length === 0 && request.visitor_name) {
                parsedVisitors = [{
                    name: request.visitor_name,
                    company: request.current_company || '',
                    title: request.visitor_title || ''
                }];
            }

            const isInterviewee = request.visitor_category === 'Interviewee' || request.record_type === 'interviewee';

            setFormData({
                start_date: formatToLocalDateInput(request.start_date),
                end_date: formatToLocalDateInput(request.end_date || request.start_date),
                visitor_category: request.visitor_category || (isInterviewee ? 'Interviewee' : 'Vendor'),
                visiting_site: request.visiting_site || 'SHTP',
                purpose: parsedDetails.purpose || request.purpose_of_visit || '',
                costCenter: parsedDetails.costCenter || '',
                factoryTour: parsedDetails.factoryTour || 'No',
                visitors: parsedVisitors,
                interviewee_name: request.interviewee_name || request.visitor_name || parsedVisitors[0]?.name || '',
                job_title: request.job_title || request.visitor_title || parsedVisitors[0]?.title || '',
                interview_department: request.interview_department || request.current_company || parsedVisitors[0]?.interviewDepartment || parsedVisitors[0]?.company || ''
            });
        }
    }, [request]);

    const cleanNameInput = (str: string) => {
        if (!str) return '';
        return str.replace(/[0-9;:"!@#$%^&*()+={}\[\]<>?/\\|~`_=]/g, '');
    };

    const formatName = (str: string) => {
        if (!str) return '';
        const nfc = str.normalize('NFC');
        const clean = nfc.replace(/[^\p{L}\p{M}\s'-]/gu, '');
        return clean.replace(/([\p{L}\p{M}]+)/gu, (match) => {
            return match.charAt(0).toLocaleUpperCase('vi-VN') + match.slice(1).toLocaleLowerCase('vi-VN');
        }).trim().replace(/\s+/g, ' ');
    };

    const handleVisitorChange = (index: number, field: keyof EditModalVisitorItem, value: string) => {
        const newVisitors = [...formData.visitors];
        const val = field === 'name' ? cleanNameInput(value) : value;
        newVisitors[index] = { ...newVisitors[index], [field]: val };
        setFormData({ ...formData, visitors: newVisitors });
    };

    const handleVisitorBlur = (index: number, field: keyof EditModalVisitorItem) => {
        const newVisitors = [...formData.visitors];
        const val = newVisitors[index]?.[field];
        if (typeof val === 'string' && val.trim()) {
            newVisitors[index] = { ...newVisitors[index], [field]: field === 'name' ? formatName(val) : val.trim() };
            setFormData({ ...formData, visitors: newVisitors });
        }
    };

    const handleAddVisitor = () => {
        setFormData({
            ...formData,
            visitors: [...formData.visitors, { name: '', company: '', title: '' }]
        });
    };

    const handleRemoveVisitor = (index: number) => {
        if (formData.visitors.length <= 1) {
            alert('Yêu cầu phải có ít nhất 1 khách đến thăm.');
            return;
        }
        const newVisitors = formData.visitors.filter((_, i) => i !== index);
        setFormData({ ...formData, visitors: newVisitors });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!request) return;
        setLoading(true);
        try {
            const isInterview = formData.visitor_category === 'Interviewee' || request.visitor_category === 'Interviewee' || request.record_type === 'interviewee';

            const detailsObj: Record<string, unknown> = {
                purpose: formData.purpose,
                costCenter: formData.costCenter,
                factoryTour: formData.factoryTour
            };

            const formattedVisitors: EditModalVisitorItem[] = (formData.visitors || []).map((v) => ({
                ...v,
                name: formatName(v.name || ''),
                company: (v.company || '').trim(),
                title: (v.title || '').trim()
            }));

            const payload: UpdateVisitorRequestEditPayload = {
                start_date: formData.start_date,
                end_date: formData.end_date || formData.start_date,
                visitor_category: formData.visitor_category,
                visiting_site: formData.visiting_site,
                details: detailsObj,
                visitors: formattedVisitors
            };

            if (isInterview) {
                payload.interviewee_name = formatName(formData.interviewee_name || '');
                payload.job_title = formData.job_title;
                payload.interview_department = formData.interview_department;
            }

            const targetId = request.id || request.requestId || '';
            const data = await visitorAdminApi.updateRequestDetails(targetId, payload);

            alert('Cập nhật thông tin yêu cầu thành công!');
            onSave(data.data);
        } catch (error: unknown) {
            console.error('Update error:', error);
            const msg = error instanceof Error ? error.message : 'Lỗi hệ thống';
            alert(`Lỗi khi cập nhật yêu cầu: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    if (!request || !mounted) return null;

    const isInterview = formData.visitor_category === 'Interviewee' || request.visitor_category === 'Interviewee' || request.record_type === 'interviewee';
    const displayCode = request.request_code || request.id || 'N/A';

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4 sm:p-8" onClick={onClose}>
            <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative text-[#0f172a] animate-in zoom-in-95 duration-200 border-t-[6px] border-t-[#db011c] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Edit Request #{displayCode}</h2>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-[#db011c] border border-red-100">
                                {formData.visitor_category}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Cập nhật thông tin chi tiết đơn đăng ký khách</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                    {/* General Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/60 p-4 rounded-xl border border-gray-200/80">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Start Date (Ngày bắt đầu)</label>
                            <input 
                                type="date" 
                                value={formData.start_date} 
                                onChange={e => setFormData({...formData, start_date: e.target.value})} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">End Date (Ngày kết thúc)</label>
                            <input 
                                type="date" 
                                value={formData.end_date} 
                                onChange={e => setFormData({...formData, end_date: e.target.value})} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white" 
                                required 
                            />
                        </div>
                        <Select
                            label="Visiting Site (Địa điểm)"
                            value={formData.visiting_site}
                            onChange={(val) => setFormData({ ...formData, visiting_site: val })}
                            options={[
                                { value: "SHTP", label: "SHTP" },
                                { value: "DDK", label: "DDK" },
                                { value: "SHTP / DDK", label: "SHTP / DDK" },
                            ]}
                        />

                        {!isInterview && (
                            <>
                                <Select
                                    label="Category (Phân loại)"
                                    value={formData.visitor_category}
                                    onChange={(val) => setFormData({ ...formData, visitor_category: val })}
                                    options={[
                                        { value: "Vendor", label: "Vendor" },
                                        { value: "Contractor", label: "Contractor" },
                                        { value: "MIL/TTI Expat / SHTP Business trip", label: "MIL/TTI Expat / SHTP Business trip" },
                                        { value: "Customer", label: "Customer" },
                                    ]}
                                />
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Purpose (Mục đích)</label>
                                    <input 
                                        type="text" 
                                        value={formData.purpose} 
                                        onChange={e => setFormData({...formData, purpose: e.target.value})} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white" 
                                    />
                                </div>
                                <Select
                                    label="Factory Tour"
                                    value={formData.factoryTour}
                                    onChange={(val) => setFormData({ ...formData, factoryTour: val })}
                                    options={[
                                        { value: "No", label: "No" },
                                        { value: "Yes", label: "Yes" },
                                    ]}
                                />
                            </>
                        )}

                        {isInterview && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Interviewee Name (Ứng viên)</label>
                                    <input 
                                        type="text" 
                                        value={formData.interviewee_name} 
                                        onChange={e => setFormData({...formData, interviewee_name: cleanNameInput(e.target.value)})} 
                                        onBlur={e => setFormData({...formData, interviewee_name: formatName(e.target.value)})} 
                                        style={{ textTransform: 'capitalize' }} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Job Title (Vị trí)</label>
                                    <input 
                                        type="text" 
                                        value={formData.job_title} 
                                        onChange={e => setFormData({...formData, job_title: e.target.value})} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Department (Phòng ban phỏng vấn)</label>
                                    <input 
                                        type="text" 
                                        value={formData.interview_department} 
                                        onChange={e => setFormData({...formData, interview_department: e.target.value})} 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white" 
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Visitors List (if general request) */}
                    {!isInterview && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <span>Danh sách khách ({formData.visitors?.length || 0})</span>
                                </h3>
                                <button 
                                    type="button" 
                                    onClick={handleAddVisitor}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    <span>Thêm khách</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                                {formData.visitors && formData.visitors.map((v, index) => (
                                    <div key={index} className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                        <div className="md:col-span-4">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Name (Họ tên khách) *</label>
                                            <input 
                                                type="text" 
                                                value={v.name || ''} 
                                                onChange={e => handleVisitorChange(index, 'name', e.target.value)} 
                                                onBlur={() => handleVisitorBlur(index, 'name')} 
                                                style={{ textTransform: 'capitalize' }} 
                                                className="w-full border border-gray-300 rounded-md p-1.5 text-xs font-semibold focus:ring-1 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white" 
                                                required 
                                            />
                                        </div>
                                        <div className="md:col-span-4">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Company (Công ty)</label>
                                            <input 
                                                type="text" 
                                                value={v.company || ''} 
                                                onChange={e => handleVisitorChange(index, 'company', e.target.value)} 
                                                onBlur={() => handleVisitorBlur(index, 'company')} 
                                                className="w-full border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white" 
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Title (Chức vụ)</label>
                                            <input 
                                                type="text" 
                                                value={v.title || ''} 
                                                onChange={e => handleVisitorChange(index, 'title', e.target.value)} 
                                                onBlur={() => handleVisitorBlur(index, 'title')} 
                                                className="w-full border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-[#db011c] focus:border-[#db011c] outline-none bg-white" 
                                            />
                                        </div>
                                        <div className="md:col-span-1 flex justify-end items-end pt-3">
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveVisitor(index)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa khách này"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel (Hủy)
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            loading={loading}
                        >
                            Save Changes (Lưu thay đổi)
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
