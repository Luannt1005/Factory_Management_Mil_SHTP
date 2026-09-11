'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';
import RequestCheckInModal from './components/RequestCheckInModal';
import CameraScannerModal from './components/CameraScannerModal';

type ViewMode = 'group' | 'visitor';
type StatusFilter = 'ALL' | 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT';

const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

export default function CheckInOutManagement() {
    const router = useRouter();
    const { user } = useUser();
    const isSecurity = user?.app_role_names?.includes('Security') || false;
    const isReceptionist = user?.app_role_names?.includes('Receptionist') || false;
    
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters and View State
    const [filters, setFilters] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        category: '', 
        search: '',
        visitorName: '',
        site: ''
    });
    const [viewMode, setViewMode] = useState<ViewMode>('visitor');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;
    
    const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [cardNumbers, setCardNumbers] = useState<Record<string, string>>({});

    // QR Code Scanning & Modal States
    const [scanInput, setScanInput] = useState('');
    const [scanLoading, setScanLoading] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scannedRequest, setScannedRequest] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const scanInputRef = useRef<HTMLInputElement | null>(null);
    const barcodeBufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);
    const scanDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleCardNumberChange = (requestId: string, visitorIndex: number, value: string) => {
        setCardNumbers(prev => ({ ...prev, [`${requestId}-${visitorIndex}`]: value }));
    };

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.date) query.append('date', filters.date);
            if (filters.category) query.append('category', filters.category);
            if (filters.search) query.append('search', filters.search);
            if (filters.site) query.append('site', filters.site);
            query.append('limit', '500'); // Fetch enough for client-side pagination & filtering

            const res = await fetch(`/api/visitor_admin/checkinout/history?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.requests || []);
            } else if (res.status === 401 || res.status === 403) {
                router.push('/login?redirect=' + window.location.pathname);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, router]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Auto-focus scan input on mount
    useEffect(() => {
        scanInputRef.current?.focus();
    }, []);

    // Re-focus scan input after modal closes
    useEffect(() => {
        if (!isModalOpen && !showCameraScanner) {
            setTimeout(() => {
                scanInputRef.current?.focus();
            }, 100);
        }
    }, [isModalOpen, showCameraScanner]);

    // Reset pagination to page 1 on filter or view mode changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, statusFilter, viewMode]);

    const handleAction = async (requestId: string, v: any, action: 'CHECK_IN' | 'CHECK_OUT' | 'RESET' | 'UPDATE_CARD', requestCode?: string) => {
        setActionLoading(`${requestId}-${v.visitorIndex}`);
        try {
            const rawCardNumber = cardNumbers[`${requestId}-${v.visitorIndex}`];
            const cardNumber = rawCardNumber !== undefined ? rawCardNumber : (v.cardNumber ?? '');
            const res = await fetch('/api/visitor_admin/checkinout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action, 
                    requestId, 
                    requestCode: requestCode || v._requestInfo?.requestCode || v.requestCode || requestId,
                    visitorIndex: v.visitorIndex,
                    visitorName: v.visitorName,
                    visitorCode: v.visitorCode,
                    cardNumber
                })
            });
            if (res.ok) {
                const updatedStatus = action === 'CHECK_IN' ? 'CHECKED_IN' : action === 'CHECK_OUT' ? 'CHECKED_OUT' : 'PENDING';
                const nowIso = new Date().toISOString();

                // 1. Refresh list locally
                setHistory(prev => prev.map(req => {
                    if (req.requestId === requestId) {
                        return {
                            ...req,
                            visitors: req.visitors?.map((visitor: any) => {
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
                setScannedRequest((prev: any) => {
                    if (!prev || prev.requestId !== requestId) return prev;
                    return {
                        ...prev,
                        visitors: prev.visitors?.map((visitor: any) => {
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
            } else {
                console.error('Action failed:', await res.text());
                alert('Thao tác thất bại');
            }
        } catch (err) {
            console.error('Failed to perform check in/out:', err);
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
                setScanInput('');
                return;
            }

            // 2. Fetch directly from server by search (without date/category filter restrictions)
            const res = await fetch(`/api/visitor_admin/checkinout/history?search=${encodeURIComponent(cleanCode)}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                const found = (data.requests || []).find((r: any) => 
                    (r.requestId && r.requestId.toLowerCase() === cleanCode.toLowerCase()) || 
                    (r.requestCode && r.requestCode.toLowerCase() === cleanCode.toLowerCase())
                ) || data.requests?.[0];

                if (found) {
                    setScannedRequest(found);
                    setIsModalOpen(true);
                    setScanInput('');
                } else {
                    setScanError(`Không tìm thấy yêu cầu hợp lệ với mã "${cleanCode}". Vui lòng kiểm tra lại đơn đã được duyệt (Approved) chưa.`);
                }
            } else {
                setScanError('Lỗi tra cứu thông tin yêu cầu từ máy chủ.');
            }
        } catch (err) {
            console.error('Scan lookup error:', err);
            setScanError('Lỗi kết nối khi tra cứu yêu cầu.');
        } finally {
            setScanLoading(false);
        }
    };

    // Global KeyDown listener to capture Scanner Gun barcode directly
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isModalOpen || showCameraScanner) return;

            const now = Date.now();
            const timeDiff = now - lastKeyTimeRef.current;
            lastKeyTimeRef.current = now;

            const activeEl = document.activeElement;
            const isInsideOtherInput = activeEl && 
                (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && 
                activeEl !== scanInputRef.current;

            // Scanner guns end with Enter or Tab
            if (e.key === 'Enter' || e.key === 'Tab') {
                const bufferCode = barcodeBufferRef.current.trim();
                const inputVal = scanInputRef.current?.value.trim() || scanInput.trim();
                const candidate = bufferCode.length >= 4 ? bufferCode : (inputVal.length >= 4 ? inputVal : '');

                if (candidate) {
                    e.preventDefault();
                    e.stopPropagation();
                    barcodeBufferRef.current = '';
                    setScanInput('');
                    if (scanInputRef.current) scanInputRef.current.value = '';
                    handleLookupRequest(candidate);
                }
                return;
            }

            // If user is actively typing slowly in another filter input, don't intercept
            if (isInsideOtherInput && timeDiff > 60) {
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
    }, [isModalOpen, showCameraScanner, scanInput, history]);

    const handleScanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setScanInput(val);
        if (scanDebounceTimerRef.current) clearTimeout(scanDebounceTimerRef.current);

        // Auto-open modal if complete Request ID was scanned or entered (>= 7 chars)
        const clean = val.trim();
        if (clean.length >= 7 && (clean.startsWith('V') || clean.startsWith('v') || clean.includes('_'))) {
            scanDebounceTimerRef.current = setTimeout(() => {
                handleLookupRequest(clean);
            }, 180);
        }
    };

    const handleScanInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (scanDebounceTimerRef.current) clearTimeout(scanDebounceTimerRef.current);
            handleLookupRequest(scanInput);
        }
    };

    const formatDateTime = (timeString: string | null) => {
        if (!timeString) return '-';
        const d = new Date(timeString);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const formatDateShort = (dateString: string | null) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getCategoryBadgeClass = (category: string) => {
        const cat = category?.toUpperCase() || '';
        if (cat.includes('VENDOR') && cat.includes('CONTRACTOR')) return 'text-indigo-600 bg-indigo-50';
        if (cat.includes('VENDOR')) return 'text-blue-600 bg-blue-50';
        if (cat.includes('CONTRACTOR')) return 'text-cyan-600 bg-cyan-50';
        if (cat.includes('INTERVIEWEE')) return 'text-emerald-600 bg-emerald-50';
        if (cat.includes('EXPAT')) return 'text-purple-600 bg-purple-50';
        return 'text-gray-600 bg-gray-50';
    };

    const getStatusBadgeClass = (status: string) => {
        const s = status?.toUpperCase() || '';
        if (s === 'APPROVED' || s === 'COMPLETE') return 'text-green-600 bg-green-50';
        if (s === 'REJECTED') return 'text-red-600 bg-red-50';
        if (s === 'PENDING') return 'text-orange-600 bg-orange-50';
        return 'text-gray-600 bg-gray-50';
    };

    // Filter visitors based on statusFilter and visitorName
    const processedHistory = history.map(req => {
        const filteredVisitors = req.visitors?.filter((v: any) => {
            if (statusFilter !== 'ALL' && v.checkInOutStatus !== statusFilter) return false;
            if (filters.visitorName && filters.visitorName.trim()) {
                const nameMatch = removeAccents(v.visitorName || '').includes(removeAccents(filters.visitorName.trim()));
                if (!nameMatch) return false;
            }
            return true;
        }) || [];
        
        return {
            ...req,
            filteredVisitors
        };
    }).filter(req => {
        if (filters.visitorName && filters.visitorName.trim()) {
            return req.filteredVisitors.length > 0;
        }
        if (statusFilter !== 'ALL') {
            return req.filteredVisitors.length > 0;
        }
        return true;
    });

    // Flatten visitors for Visitor View
    const allVisitors = processedHistory.flatMap(req => 
        req.filteredVisitors.map((v: any) => ({
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

    // Summary stats
    const totalRequests = history.length;
    let totalVisitors = 0;
    let currentlyOnSite = 0;
    let completedCheckout = 0;

    history.forEach(req => {
        req.visitors?.forEach((v: any) => {
            totalVisitors++;
            if (v.checkInOutStatus === 'CHECKED_IN') currentlyOnSite++;
            if (v.checkInOutStatus === 'CHECKED_OUT') completedCheckout++;
        });
    });

    const renderActionButtons = (req: any, v: any) => (
        <div className="flex gap-1.5 items-center justify-center">
            <button
                disabled={actionLoading === `${req.requestId}-${v.visitorIndex}` || v.checkInOutStatus !== 'PENDING'}
                onClick={(e) => {
                    e.stopPropagation();
                    handleAction(req.requestId, v, 'CHECK_IN', req.requestCode);
                }}
                className={`whitespace-nowrap text-[9px] font-bold uppercase px-2 py-1.5 rounded shadow-sm transition-colors ${
                    v.checkInOutStatus !== 'PENDING'
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#db011c] hover:bg-[#b00116] text-white'
                }`}
            >
                Check In
            </button>
            
            <button
                disabled={actionLoading === `${req.requestId}-${v.visitorIndex}` || v.checkInOutStatus !== 'CHECKED_IN'}
                onClick={(e) => {
                    e.stopPropagation();
                    handleAction(req.requestId, v, 'CHECK_OUT', req.requestCode);
                }}
                className={`whitespace-nowrap text-[9px] font-bold uppercase px-2 py-1.5 rounded shadow-sm transition-colors ${
                    v.checkInOutStatus !== 'CHECKED_IN'
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
            >
                Check Out
            </button>
            
            {/* Reset/Refresh button */}
            {!isSecurity && !isReceptionist && (
                <div className={`ml-0.5 ${v.checkInOutStatus === 'CHECKED_IN' || v.checkInOutStatus === 'CHECKED_OUT' ? 'visible' : 'invisible'}`}>
                    <button
                        disabled={actionLoading === `${req.requestId}-${v.visitorIndex}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Reset check-in/out status for ${v.visitorName}?`)) {
                                handleAction(req.requestId, v, 'RESET', req.requestCode);
                            }
                        }}
                        title="Reset Status"
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full pb-10 px-6 mx-auto pt-6">

            {/* Quick QR Code Scanner / ID Lookup Banner */}
            <div className="bg-gradient-to-r from-red-700 via-[#db011c] to-rose-700 p-4 rounded-xl shadow-md text-white mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-black tracking-tight">QR Code Check-In / Check-Out</h2>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/90 text-white border border-emerald-300/60 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    Sẵn sàng quét tự động
                                </span>
                            </div>
                            <p className="text-xs text-white/90 mt-0.5">
                                Cầm súng quét mã QR của khách — Modal thông tin sẽ <strong>tự động mở ngay lập tức</strong> mà không cần nhấp chuột.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <input
                                ref={scanInputRef}
                                type="text"
                                value={scanInput}
                                onChange={handleScanInputChange}
                                onKeyDown={handleScanInputKeyDown}
                                placeholder="Súng quét bắn tự động hoặc nhập ID..."
                                className="w-full pl-9 pr-24 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white shadow-inner"
                            />
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            {scanLoading ? (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-600 font-bold flex items-center gap-1 bg-white px-2 py-1">
                                    <span className="animate-spin">⏳</span> Đang tìm...
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleLookupRequest(scanInput)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#1a1a1a] hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs"
                                >
                                    Mở Đơn
                                </button>
                            )}
                        </div>

                        {/* Camera Scan Button */}
                        <button
                            onClick={() => setShowCameraScanner(true)}
                            title="Mở Camera quét mã QR"
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-sm text-white text-xs font-bold rounded-lg border border-white/30 transition-all whitespace-nowrap shadow-xs"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Quét Camera</span>
                        </button>
                    </div>
                </div>

                {scanError && (
                    <div className="mt-3 px-3.5 py-2 bg-red-950/70 border border-red-300/40 rounded-lg text-xs font-medium text-white flex items-center justify-between animate-in fade-in duration-200">
                        <span>⚠️ {scanError}</span>
                        <button onClick={() => setScanError(null)} className="text-white/80 hover:text-white font-bold ml-3 text-sm">✕</button>
                    </div>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Advanced Filters */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-[repeat(7,1fr)_auto] gap-4 items-end">
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Search Req</label>
                            <input 
                                type="text" 
                                placeholder="ID, Submitter..." 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Visitor Name</label>
                            <input 
                                type="text" 
                                placeholder="Name..." 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                                value={filters.visitorName}
                                onChange={(e) => setFilters({ ...filters, visitorName: e.target.value })}
                            />
                        </div>
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                            <div className="flex w-full">
                                <input 
                                    type="date" 
                                    className="w-full min-w-0 px-2 py-2 bg-white border border-gray-300 rounded-l text-sm focus:outline-none focus:border-[#db011c]"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                />
                                <button 
                                    onClick={() => setFilters({ ...filters, date: new Date().toISOString().split('T')[0] })}
                                    className={`px-2.5 text-xs font-bold uppercase rounded-r transition-colors border border-l-0 ${filters.date === new Date().toISOString().split('T')[0] ? 'bg-[#db011c] text-white border-[#db011c]' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300'}`}
                                >
                                    Today
                                </button>
                            </div>
                        </div>
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                            <select 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            >
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Expected Arrival</option>
                                <option value="CHECKED_IN">Checked In</option>
                                <option value="CHECKED_OUT">Checked Out</option>
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                            <select 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            >
                                <option value="">All Categories</option>
                                <option value="Vendor">Vendor</option>
                                <option value="Contractor">Contractor</option>
                                <option value="MIL/TTI Expat / SHTP Business trip">MIL / TTI EXPAT</option>
                                <option value="Interviewee">Interviewee</option>
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Site</label>
                            <select 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-[#db011c]"
                                value={filters.site}
                                onChange={(e) => setFilters({ ...filters, site: e.target.value })}
                            >
                                <option value="">All Sites</option>
                                <option value="SHTP">SHTP</option>
                                <option value="DDK">DDK</option>
                                <option value="SHTP/DDK">SHTP / DDK</option>
                            </select>
                        </div>
                        
                        {/* View Modes Toggle */}
                        <div className="w-full">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">View</label>
                            <div className="flex w-full bg-gray-200 p-1 rounded justify-between h-[38px]">
                                <button
                                    onClick={() => setViewMode('group')}
                                    className={`flex-1 px-1 py-1 text-[10px] font-bold uppercase rounded transition-colors ${viewMode === 'group' ? 'bg-white shadow-sm text-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Group
                                </button>
                                <button
                                    onClick={() => setViewMode('visitor')}
                                    className={`flex-1 px-1 py-1 text-[10px] font-bold uppercase rounded transition-colors ${viewMode === 'visitor' ? 'bg-white shadow-sm text-[#db011c]' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Visitor
                                </button>
                            </div>
                        </div>

                        {/* Showing Count placed with natural auto width */}
                        <div className="w-auto whitespace-nowrap pb-2.5 text-[11px] font-medium text-gray-500">
                            {viewMode === 'group' ? (
                                <>Showing <span className="text-gray-900 font-bold">{paginatedGroups.length}</span> of <span className="text-gray-900 font-bold">{processedHistory.length}</span> requests</>
                            ) : (
                                <>Showing <span className="text-gray-900 font-bold">{paginatedVisitors.length}</span> of <span className="text-gray-900 font-bold">{allVisitors.length}</span> visitors</>
                            )}
                        </div>
                    </div>
                </div>

                {/* List Container */}
                <div className="p-0">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Loading...</div>
                    ) : viewMode === 'group' && processedHistory.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No requests found matching the filters.</div>
                    ) : viewMode === 'visitor' && allVisitors.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No visitors found matching the filters.</div>
                    ) : (
                        <div className="flex flex-col">
                            
                            {viewMode === 'visitor' && (
                                <div className="hidden md:grid grid-cols-[100px_1.1fr_115px_1.2fr_1fr_1.1fr_85px_110px_95px_115px_115px_150px] gap-3 items-center bg-[#1a1a1a] text-white px-6 py-3 font-bold text-[9px] uppercase tracking-wider mb-2">
                                    <div>REQUEST</div>
                                    <div>SUBMITTER</div>
                                    <div>VISITOR CODE</div>
                                    <div>FULL NAME</div>
                                    <div>TITLE</div>
                                    <div>COMPANY</div>
                                    <div className="text-center">CATEGORY</div>
                                    <div>DATE</div>
                                    <div className="text-center">CARD NUMBER</div>
                                    <div className="text-center">TIME IN</div>
                                    <div className="text-center">TIME OUT</div>
                                    <div className="text-center">ACTION</div>
                                </div>
                            )}

                            {/* Group View Headers */}
                            {viewMode === 'group' && (
                                <div className="hidden md:grid grid-cols-12 gap-4 bg-[#1a1a1a] text-white px-6 py-3 font-bold text-xs uppercase tracking-wider items-center">
                                    <div className="col-span-2">REQUEST CODE</div>
                                    <div className="col-span-2">SUBMITTER</div>
                                    <div className="col-span-3">VISITOR(S)</div>
                                    <div className="col-span-2">CATEGORY</div>
                                    <div className="col-span-2">DATE</div>
                                    <div className="col-span-1">SITE</div>
                                </div>
                            )}

                            {/* Visitor View Rows */}
                            {viewMode === 'visitor' && paginatedVisitors.map((v: any, idx: number) => {
                                const req = v._requestInfo;
                                return (
                                    <div key={`${req.requestId}-${v.visitorIndex}`} className={`px-6 py-3 grid grid-cols-[100px_1.1fr_115px_1.2fr_1fr_1.1fr_85px_110px_95px_115px_115px_150px] gap-3 items-center border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScannedRequest(req);
                                                setIsModalOpen(true);
                                            }}
                                            className="text-[11px] font-bold text-gray-900 hover:text-[#db011c] cursor-pointer truncate underline-offset-2 hover:underline flex items-center gap-1" 
                                            title={`Mở Modal Check-In cho đơn ${req.requestCode || req.requestId}`}
                                        >
                                            <span>{req.requestCode || req.requestId}</span>
                                            <span className="text-[9px] text-[#db011c]">↗</span>
                                        </div>
                                        <div className="text-[11px] font-bold text-gray-700 truncate" title={req.submitterName || '-'}>{req.submitterName || '-'}</div>
                                        <div className="text-xs font-black text-[#db011c] truncate" title={v.visitorCode}>{v.visitorCode}</div>
                                        <div className="text-xs font-bold text-gray-900 truncate" title={v.visitorName}>{v.visitorName}</div>
                                        <div className="text-[10px] text-gray-500 truncate" title={v.visitorTitle || '-'}>{v.visitorTitle || '-'}</div>
                                        <div className="text-[11px] font-medium text-gray-600 truncate" title={v.visitorCompany || req.visitingSite}>{v.visitorCompany || req.visitingSite}</div>
                                        <div className="text-[10px] text-center">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${getCategoryBadgeClass(req.visitorCategory)}`}>
                                                {req.visitorCategory?.replace(/MIL\/TTI Expat \/ SHTP Business trip/i, 'MIL EXPAT')}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-medium text-gray-600 truncate">{formatDateShort(req.startDate)} - {formatDateShort(req.endDate)}</div>
                                        
                                        <div className="w-full">
                                            <input 
                                                type="text" 
                                                placeholder="Card No." 
                                                className="w-full text-[11px] px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-[#db011c]" 
                                                value={cardNumbers[`${req.requestId}-${v.visitorIndex}`] ?? v.cardNumber ?? ''}
                                                onChange={(e) => handleCardNumberChange(req.requestId, v.visitorIndex, e.target.value)}
                                                onBlur={(e) => {
                                                    if (cardNumbers[`${req.requestId}-${v.visitorIndex}`] !== undefined) {
                                                        handleAction(req.requestId, v, 'UPDATE_CARD', req.requestCode);
                                                    }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className={`text-[10px] font-bold text-center ${v.checkInTime ? 'text-green-600' : 'text-gray-400'}`}>{formatDateTime(v.checkInTime)}</div>
                                        <div className={`text-[10px] font-bold text-center ${v.checkOutTime ? 'text-gray-600' : 'text-gray-400'}`}>{formatDateTime(v.checkOutTime)}</div>
                                        
                                        <div className="flex justify-center items-center min-w-0">
                                            {renderActionButtons(req, v)}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Group View Rows */}
                            {viewMode === 'group' && paginatedGroups.map((req, idx) => (
                                <div key={req.requestId} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fff5f5]/30'}`}>
                                    {/* Request Row */}
                                    <div 
                                        className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setExpandedRequest(expandedRequest === req.requestId ? null : req.requestId)}
                                    >
                                        <div className="col-span-2 font-bold text-sm text-gray-900 truncate flex items-center gap-2" title={req.requestCode || req.requestId}>
                                            <span 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setScannedRequest(req);
                                                    setIsModalOpen(true);
                                                }}
                                                className="hover:text-[#db011c] hover:underline cursor-pointer"
                                            >
                                                {req.requestCode || req.requestId}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setScannedRequest(req);
                                                    setIsModalOpen(true);
                                                }}
                                                className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-[#db011c] hover:bg-[#b00116] rounded shadow-2xs"
                                                title="Mở Modal Check In/Out"
                                            >
                                                Modal
                                            </button>
                                        </div>
                                        <div className="col-span-2 text-xs font-bold text-gray-700 truncate" title={req.submitterName || '-'}>
                                            {req.submitterName || '-'}
                                        </div>
                                        <div className="col-span-3 text-sm text-gray-900 font-semibold truncate" title={req.visitors?.[0]?.visitorName || req.submitterName}>
                                            {req.visitors?.[0]?.visitorName || '-'} {req.filteredVisitors && req.filteredVisitors.length > 0 && <span className="text-[11px] text-gray-500 font-bold ml-2">({req.filteredVisitors.length} {req.visitorCategory === 'Interviewee' ? 'Candidate(s)' : 'Visitor(s)'})</span>}
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${getCategoryBadgeClass(req.visitorCategory)}`}>
                                                {req.visitorCategory?.replace(/MIL\/TTI Expat \/ SHTP Business trip/i, 'MIL EXPAT')}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-sm text-gray-700 font-medium">
                                            {formatDateShort(req.startDate)} - {formatDateShort(req.endDate)}
                                        </div>
                                        <div className="col-span-1 flex justify-between items-center text-sm text-gray-700">
                                            <span className="truncate" title={req.visitingSite}>{req.visitingSite}</span>
                                            <div className="text-gray-400 ml-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedRequest === req.requestId ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Visitors */}
                                    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expandedRequest === req.requestId ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                            <div className="overflow-hidden">
                                                <div className="px-6 py-4 bg-[#f8fafc] border-t border-gray-100 shadow-inner overflow-x-auto">
                                                    <div className="flex flex-col gap-0">
                                                        {req.filteredVisitors && req.filteredVisitors.length > 0 ? (
                                                            <>
                                                                {/* Header for expanded visitors */}
                                                                <div className="grid grid-cols-[115px_1.2fr_1.1fr_1fr_1.1fr_110px_90px_115px_115px_150px] gap-3 items-center pb-2 border-b border-gray-300 mb-2">
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">VISITOR CODE</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">FULL NAME</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">SUBMITTER</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">TITLE</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">COMPANY</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">DATE</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">CARD NUMBER</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">TIME IN</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">TIME OUT</div>
                                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">ACTION</div>
                                                                </div>

                                                                {req.filteredVisitors.map((v: any, vIdx: number) => (
                                                                    <div key={vIdx} className={`py-3 grid grid-cols-[115px_1.2fr_1.1fr_1fr_1.1fr_110px_90px_115px_115px_150px] gap-3 items-center ${vIdx !== req.filteredVisitors.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}>
                                                                        <div className="text-xs font-black text-[#db011c] truncate" title={v.visitorCode}>{v.visitorCode}</div>
                                                                        <div className="text-xs font-bold text-gray-900 truncate" title={v.visitorName}>{v.visitorName}</div>
                                                                        <div className="text-[11px] font-bold text-gray-700 truncate" title={req.submitterName || '-'}>{req.submitterName || '-'}</div>
                                                                        <div className="text-[11px] text-gray-600 truncate" title={v.visitorTitle || '-'}>{v.visitorTitle || '-'}</div>
                                                                        <div className="text-[11px] font-medium text-gray-600 truncate" title={v.visitorCompany || req.visitingSite}>{v.visitorCompany || req.visitingSite}</div>
                                                                        <div className="text-[10px] font-medium text-gray-600 truncate text-center">{formatDateShort(req.startDate)} - {formatDateShort(req.endDate)}</div>
                                                                        <div className="w-full">
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="Card No." 
                                                                                className="w-full text-[11px] px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-[#db011c]" 
                                                                                value={cardNumbers[`${req.requestId}-${v.visitorIndex}`] ?? v.cardNumber ?? ''}
                                                                                onChange={(e) => handleCardNumberChange(req.requestId, v.visitorIndex, e.target.value)}
                                                                                onBlur={(e) => {
                                                                                    if (cardNumbers[`${req.requestId}-${v.visitorIndex}`] !== undefined) {
                                                                                        handleAction(req.requestId, v, 'UPDATE_CARD', req.requestCode);
                                                                                    }
                                                                                }}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                        </div>
                                                                        <div className={`text-[10px] font-bold text-center ${v.checkInTime ? 'text-green-600' : 'text-gray-400'}`}>{formatDateTime(v.checkInTime)}</div>
                                                                        <div className={`text-[10px] font-bold text-center ${v.checkOutTime ? 'text-gray-600' : 'text-gray-400'}`}>{formatDateTime(v.checkOutTime)}</div>
                                                                        
                                                                        <div className="flex justify-center items-center min-w-0">
                                                                            {renderActionButtons(req, v)}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </>
                                                        ) : (
                                                            <div className="text-sm text-gray-500 py-2">No visitors data available.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                </div>
                            ))}
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

            {/* Camera QR Scanner Modal */}
            <CameraScannerModal
                isOpen={showCameraScanner}
                onClose={() => setShowCameraScanner(false)}
                onScan={(code) => handleLookupRequest(code)}
            />
        </div>
    );
}
