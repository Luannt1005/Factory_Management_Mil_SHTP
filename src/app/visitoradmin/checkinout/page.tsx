'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import CheckInOutFilters from '@/features/visitor/checkinout/components/CheckInOutFilters';
import VisitorViewTable from '@/features/visitor/checkinout/components/VisitorViewTable';
import GroupViewTable from '@/features/visitor/checkinout/components/GroupViewTable';
import RequestCheckInModal from '@/features/visitor/checkinout/components/RequestCheckInModal';
import { removeAccents } from '@/utils/string';
import { formatDateShort, formatDateTime } from '@/utils/date';
import { getCategoryBadgeClass } from '@/utils/badge';
import type {
    CheckInOutAction,
    CheckInOutFilterState,
    CheckInOutProcessedVisitor,
    CheckInOutRequestRecord,
    CheckInOutViewMode,
    CheckInOutVisitorRecord,
    VisitorCheckInOutStatus,
} from '@/types/checkinout.types';
import {
    CheckInOutApiError,
    getCheckInOutHistory,
    lookupCheckInOutRequest,
    performCheckInOutAction,
} from '@/features/visitor/checkinout/services/checkinoutApi';

export default function CheckInOutManagement() {
    const router = useRouter();
    const { user } = useUser();
    const isSecurity = user?.app_role_names?.includes('Security') || false;
    const isReceptionist = user?.app_role_names?.includes('Receptionist') || false;

    const [history, setHistory] = useState<CheckInOutRequestRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters and View State
    const [filters, setFilters] = useState<CheckInOutFilterState>({
        date: new Date().toISOString().split('T')[0],
        search: '',
        visitorName: ''
    });
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [sites, setSites] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<CheckInOutViewMode>('visitor');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [cardNumbers, setCardNumbers] = useState<Record<string, string>>({});

    // Scanner Gun & Modal States (Runs silently in background)
    const [scanLoading, setScanLoading] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scannedRequest, setScannedRequest] = useState<CheckInOutRequestRecord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const barcodeBufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);

    const handleCardNumberChange = (requestId: string, visitorIndex: number, value: string) => {
        setCardNumbers(prev => ({ ...prev, [`${requestId}-${visitorIndex}`]: value }));
    };

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCheckInOutHistory({
                date: filters.date,
                limit: 500,
            });
            setHistory(data.requests || []);
        } catch (err: unknown) {
            if (err instanceof CheckInOutApiError && (err.status === 401 || err.status === 403)) {
                router.push('/login?redirect=' + window.location.pathname);
                return;
            }
            console.error('Failed to fetch history:', err);
        } finally {
            setLoading(false);
        }
    }, [filters.date, router]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Reset pagination to page 1 on filter or view mode changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, statusFilters, categories, sites, viewMode]);

    const handleAction = async (requestId: string, v: CheckInOutVisitorRecord, action: CheckInOutAction, requestCode?: string) => {
        setActionLoading(`${requestId}-${v.visitorIndex}`);
        try {
            const rawCardNumber = cardNumbers[`${requestId}-${v.visitorIndex}`];
            const cardNumber = rawCardNumber !== undefined ? rawCardNumber : (v.cardNumber ?? '');
            await performCheckInOutAction({
                action,
                requestId,
                requestCode: requestCode || (v as CheckInOutProcessedVisitor)._requestInfo?.requestCode || v.requestCode || requestId,
                visitorIndex: v.visitorIndex,
                visitorName: v.visitorName,
                visitorCode: v.visitorCode || `${requestId}V${v.visitorIndex + 1}`,
                cardNumber
            });

            const updatedStatus: VisitorCheckInOutStatus = action === 'CHECK_IN' ? 'CHECKED_IN' : action === 'CHECK_OUT' ? 'CHECKED_OUT' : 'PENDING';
            const nowIso = new Date().toISOString();

            // 1. Refresh list locally
            setHistory(prev => prev.map(req => {
                if (req.requestId === requestId) {
                    return {
                        ...req,
                        visitors: req.visitors?.map(visitor => {
                            if (visitor.visitorIndex === v.visitorIndex) {
                                if (action === 'RESET') {
                                    return { ...visitor, checkInOutStatus: 'PENDING', checkInTime: null, checkOutTime: null };
                                }
                                if (action === 'UPDATE_CARD') {
                                    return { ...visitor, cardNumber };
                                }
                                return {
                                    ...visitor,
                                    cardNumber,
                                    checkInOutStatus: updatedStatus,
                                    [action === 'CHECK_IN' ? 'checkInTime' : 'checkOutTime']: nowIso
                                };
                            }
                            return visitor;
                        })
                    };
                }
                return req;
            }));

            // 2. Also refresh currently opened scannedRequest in Modal
            setScannedRequest(prev => {
                if (!prev || prev.requestId !== requestId) return prev;
                return {
                    ...prev,
                    visitors: prev.visitors?.map(visitor => {
                        if (visitor.visitorIndex === v.visitorIndex) {
                            if (action === 'RESET') {
                                return { ...visitor, checkInOutStatus: 'PENDING', checkInTime: null, checkOutTime: null };
                            }
                            if (action === 'UPDATE_CARD') {
                                return { ...visitor, cardNumber };
                            }
                            return {
                                ...visitor,
                                cardNumber,
                                checkInOutStatus: updatedStatus,
                                [action === 'CHECK_IN' ? 'checkInTime' : 'checkOutTime']: nowIso
                            };
                        }
                        return visitor;
                    })
                };
            });
        } catch (err: unknown) {
            console.error('Failed to perform check in/out:', err);
            alert('Thao tác thất bại');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLookupRequest = async (rawCode: string) => {
        if (!rawCode || !rawCode.trim()) return;
        let cleanCode = rawCode.trim();
        // If it's a URL or contains slashes, extract the last segment
        if (cleanCode.includes('/')) {
            const segments = cleanCode.split('/').filter(Boolean);
            cleanCode = segments[segments.length - 1];
        }
        if (cleanCode.startsWith('#')) {
            cleanCode = cleanCode.substring(1);
        }

        setScanLoading(true);
        setScanError(null);

        try {
            // 1. First check if it is already loaded in current history
            const existing = history.find(r =>
                (r.requestId && r.requestId.toLowerCase() === cleanCode.toLowerCase()) ||
                (r.requestCode && r.requestCode.toLowerCase() === cleanCode.toLowerCase())
            );

            if (existing) {
                setScannedRequest(existing);
                setIsModalOpen(true);
                return;
            }

            // 2. Fetch directly from server by search (without date/category filter restrictions)
            try {
                const data = await lookupCheckInOutRequest(cleanCode, 10);
                const found = (data.requests || []).find(r =>
                    (r.requestId && r.requestId.toLowerCase() === cleanCode.toLowerCase()) ||
                    (r.requestCode && r.requestCode.toLowerCase() === cleanCode.toLowerCase())
                ) || data.requests?.[0];

                if (found) {
                    setScannedRequest(found);
                    setIsModalOpen(true);
                } else {
                    setScanError(`Không tìm thấy yêu cầu hợp lệ với mã "${cleanCode}". Vui lòng kiểm tra lại đơn đã được duyệt (Approved) chưa.`);
                }
            } catch (apiErr: unknown) {
                if (apiErr instanceof CheckInOutApiError) {
                    setScanError('Lỗi tra cứu thông tin yêu cầu từ máy chủ.');
                } else {
                    throw apiErr;
                }
            }
        } catch (err) {
            console.error('Scan lookup error:', err);
            setScanError('Lỗi kết nối khi tra cứu yêu cầu.');
        } finally {
            setScanLoading(false);
        }
    };

    // Global KeyDown listener to capture Scanner Gun barcode directly anywhere on page
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isModalOpen) return;

            const now = Date.now();
            const timeDiff = now - lastKeyTimeRef.current;
            lastKeyTimeRef.current = now;

            const activeEl = document.activeElement;
            const isInsideInput = activeEl &&
                (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

            // Scanner guns end with Enter or Tab
            if (e.key === 'Enter' || e.key === 'Tab') {
                const bufferCode = barcodeBufferRef.current.trim();
                let candidate = bufferCode.length >= 4 ? bufferCode : '';

                // If cursor was in a filter input when scanned or typed:
                if (!candidate && isInsideInput && (activeEl as HTMLInputElement).value) {
                    const val = (activeEl as HTMLInputElement).value.trim();
                    if (val.length >= 4 && (val.startsWith('V') || val.startsWith('v') || val.includes('_'))) {
                        candidate = val;
                    }
                }

                if (candidate) {
                    e.preventDefault();
                    e.stopPropagation();
                    barcodeBufferRef.current = '';
                    handleLookupRequest(candidate);
                }
                return;
            }

            // If user is typing slowly in a text input (e.g. search filter), don't buffer as scanner gun
            if (isInsideInput && timeDiff > 80) {
                barcodeBufferRef.current = '';
                return;
            }

            // Buffer single printable characters
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (timeDiff > 150) {
                    barcodeBufferRef.current = '';
                }
                barcodeBufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown, true);
        };
    }, [isModalOpen, history]);

    // Filter visitors based on statusFilters, categories, sites, visitorName, and search
    const processedHistory = history.map(req => {
        const filteredVisitors = req.visitors?.filter((v: CheckInOutVisitorRecord) => {
            if (statusFilters.length > 0 && !statusFilters.includes(v.checkInOutStatus)) return false;
            if (filters.visitorName && filters.visitorName.trim()) {
                const nameMatch = removeAccents(v.visitorName || '').includes(removeAccents(filters.visitorName.trim()));
                if (!nameMatch) return false;
            }
            if (filters.search && filters.search.trim()) {
                const s = removeAccents(filters.search.trim());
                const matchReq = removeAccents(req.requestCode || req.requestId || '').includes(s) ||
                                 removeAccents(req.submitterName || '').includes(s);
                const matchVisitor = removeAccents(v.visitorName || '').includes(s) ||
                                     removeAccents(v.visitorCode || '').includes(s) ||
                                     removeAccents(v.cardNumber || '').includes(s);
                if (!matchReq && !matchVisitor) return false;
            }
            return true;
        }) || [];

        return {
            ...req,
            filteredVisitors
        };
    }).filter(req => {
        if (categories.length > 0 && !categories.includes(req.visitorCategory || '')) {
            return false;
        }
        if (sites.length > 0) {
            const reqSite = req.visitingSite || '';
            const matchSite = sites.some(s => {
                if (s === 'SHTP' || s === 'DDK') {
                    return reqSite.includes(s) || reqSite === 'SHTP/DDK' || reqSite === 'Both';
                }
                if (s === 'SHTP/DDK') {
                    return reqSite === 'SHTP/DDK' || reqSite === 'Both' || (reqSite.includes('SHTP') && reqSite.includes('DDK'));
                }
                return reqSite === s;
            });
            if (!matchSite) return false;
        }
        if (filters.visitorName && filters.visitorName.trim()) {
            return req.filteredVisitors.length > 0;
        }
        if (filters.search && filters.search.trim()) {
            return req.filteredVisitors.length > 0;
        }
        if (statusFilters.length > 0) {
            return req.filteredVisitors.length > 0;
        }
        return true;
    });

    // Flatten visitors for Visitor View
    const allVisitors: CheckInOutProcessedVisitor[] = processedHistory.flatMap(req =>
        req.filteredVisitors.map((v: CheckInOutVisitorRecord) => ({
            ...v,
            _requestInfo: req
        }))
    );

    const totalPages = viewMode === 'group'
        ? Math.ceil(processedHistory.length / ITEMS_PER_PAGE) || 1
        : Math.ceil(allVisitors.length / ITEMS_PER_PAGE) || 1;

    const paginatedGroups = processedHistory.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const paginatedVisitors = allVisitors.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleOpenModal = (request: CheckInOutRequestRecord) => {
        setScannedRequest(request);
        setIsModalOpen(true);
    };

    const handleClearAllFilters = () => {
        setFilters(prev => ({ ...prev, search: '', visitorName: '' }));
        setStatusFilters([]);
        setCategories([]);
        setSites([]);
    };

    return (
        <div className="w-full pb-10 mx-auto [scrollbar-gutter:stable]">

            {/* Floating Scanner status notifications */}
            {scanLoading && (
                <div className="fixed top-5 right-5 z-50 px-4 py-2.5 bg-black/80 backdrop-blur-sm text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="animate-spin">⏳</span> Đang tra cứu mã đơn...
                </div>
            )}
            {scanError && (
                <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-red-600 text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in duration-200">
                    <span>⚠️ {scanError}</span>
                    <button onClick={() => setScanError(null)} className="text-white/80 hover:text-white font-black text-sm">✕</button>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Advanced Filters */}
                <CheckInOutFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onSearchKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const clean = filters.search.trim();
                            if (clean.length >= 4) {
                                handleLookupRequest(clean);
                            }
                        }
                    }}
                    statusFilters={statusFilters}
                    onStatusFiltersChange={setStatusFilters}
                    categories={categories}
                    onCategoriesChange={setCategories}
                    sites={sites}
                    onSitesChange={setSites}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    showingCount={viewMode === 'group' ? paginatedGroups.length : paginatedVisitors.length}
                    totalCount={viewMode === 'group' ? processedHistory.length : allVisitors.length}
                    onClearAllFilters={handleClearAllFilters}
                />

                {/* List Container */}
                <div className="p-0 relative min-h-[500px]">
                    {loading && history.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3 min-h-[450px]">
                            <div className="w-8 h-8 border-2 border-gray-300 border-t-[#db011c] rounded-full animate-spin"></div>
                            <span className="text-xs font-semibold">Đang tải dữ liệu check-in...</span>
                        </div>
                    ) : (viewMode === 'group' && processedHistory.length === 0) || (viewMode === 'visitor' && allVisitors.length === 0) ? (
                        <div className="p-16 text-center text-gray-500 min-h-[400px] flex items-center justify-center">
                            {viewMode === 'group' ? 'No requests found matching the filters.' : 'No visitors found matching the filters.'}
                        </div>
                    ) : (
                        <div className={`relative transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            {loading && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[0.5px] z-20 flex items-center justify-center min-h-[300px]">
                                    <div className="px-4 py-2 bg-black/80 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xl">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Đang cập nhật...</span>
                                    </div>
                                </div>
                            )}

                            {/* Visitor View Table */}
                            {viewMode === 'visitor' && (
                                <VisitorViewTable
                                    visitors={paginatedVisitors}
                                    cardNumbers={cardNumbers}
                                    onCardNumberChange={handleCardNumberChange}
                                    onAction={handleAction}
                                    actionLoading={actionLoading}
                                    isSecurity={isSecurity}
                                    isReceptionist={isReceptionist}
                                    onOpenModal={handleOpenModal}
                                />
                            )}

                            {/* Group View Table */}
                            {viewMode === 'group' && (
                                <GroupViewTable
                                    groups={paginatedGroups}
                                    expandedRequest={expandedRequest}
                                    onToggleExpand={(reqId) => setExpandedRequest(expandedRequest === reqId ? null : reqId)}
                                    cardNumbers={cardNumbers}
                                    onCardNumberChange={handleCardNumberChange}
                                    onAction={handleAction}
                                    actionLoading={actionLoading}
                                    isSecurity={isSecurity}
                                    isReceptionist={isReceptionist}
                                    onOpenModal={handleOpenModal}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-200 rounded-b-lg">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            Previous
                        </button>

                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
                                .map((p, idx, arr) => {
                                    const prev = arr[idx - 1];
                                    return (
                                        <div key={p} className="flex items-center gap-1.5">
                                            {prev && p - prev > 1 && <span className="px-1 text-gray-400 font-bold">...</span>}
                                            <button
                                                onClick={() => setCurrentPage(p)}
                                                className={`w-8 h-8 text-xs font-black rounded-lg transition-all flex items-center justify-center ${
                                                    currentPage === p
                                                        ? 'bg-[#db011c] text-white shadow-md'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </div>
                                    );
                                })
                            }
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Request Check-In Modal */}
            <RequestCheckInModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setScannedRequest(null);
                }}
                request={scannedRequest}
                cardNumbers={cardNumbers}
                onCardNumberChange={handleCardNumberChange}
                onAction={handleAction}
                actionLoading={actionLoading}
                isSecurity={isSecurity}
                isReceptionist={isReceptionist}
                formatDateTime={formatDateTime}
                formatDateShort={formatDateShort}
                getCategoryBadgeClass={getCategoryBadgeClass}
            />
        </div>
    );
}
