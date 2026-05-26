"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DataImport from "@/components/DataImport";
import SheetManagerTable from "@/components/SheetManagerTable";

// Icons
import {
    UsersIcon,
    CloudArrowUpIcon,
    TableCellsIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon
} from "@heroicons/react/24/outline";

function AdminDashboardContent() {
    type MainTab = 'import' | 'approvals';
    type ApprovalSubTab = 'allData' | 'reviewChanges';

    const [activeTab, setActiveTab] = useState<MainTab>('import');
    const [approvalSubTab, setApprovalSubTab] = useState<ApprovalSubTab>('allData');
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check query params for active tab
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'import' || tab === 'approvals') {
            setActiveTab(tab as MainTab);
        }
    }, [searchParams]);

    // specific check for admin role
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        try {
            const user = JSON.parse(storedUser);
            if (user.role !== 'admin' && user.orgchart_role !== 'admin') {
                router.push('/');
            } else {
                setIsAuthorized(true);
            }
        } catch (e) {
            router.push('/login');
        }
    }, [router]);



    // Fetch pending count for Review Changes badge
    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                // Use page=1 to ensure we go into paginated path that applies filters
                const res = await fetch('/api/sheet?page=1&limit=1&lineManagerStatus=pending');
                const data = await res.json();
                if (data.success) {
                    // Use total from paginated response which reflects the filtered count
                    setPendingCount(data.total || 0);
                }
            } catch (err) {
                console.error('Failed to fetch pending count:', err);
            }
        };

        fetchPendingCount();

        // Refresh pending count every 30 seconds
        const interval = setInterval(fetchPendingCount, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-transparent font-sans text-[var(--color-text-body)] flex flex-col">
            {/* Header / Tabs */}
            <header className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)] px-6 shrink-0 rounded-md shadow-md mx-6 mt-4">
                <div className="flex items-center justify-between h-12">
                    <div className="flex items-center gap-6">
                        <nav className="flex space-x-1">
                            <button
                                onClick={() => setActiveTab('import')}
                                className={`
                                    inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${activeTab === 'import'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-title)] hover:bg-[var(--color-bg-page)]'}
                                `}
                            >
                                <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                                Import
                            </button>
                            <button
                                onClick={() => setActiveTab('approvals')}
                                className={`
                                    inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${activeTab === 'approvals'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-title)] hover:bg-[var(--color-bg-page)]'}
                                `}
                            >
                                <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2" />
                                Approvals
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-hidden">
                <div className="h-full bg-[var(--color-bg-card)] rounded-xl shadow-sm border border-[var(--color-border-light)] overflow-hidden flex flex-col">


                    {activeTab === 'import' && (
                        <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DataImport mode="excel" />
                        </div>
                    )}

                    {activeTab === 'approvals' && (
                        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Sub-tabs for Approvals */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-page)] border-b border-[var(--color-border-light)] shrink-0">
                                <button
                                    onClick={() => setApprovalSubTab('allData')}
                                    className={`
                                        inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all
                                        ${approvalSubTab === 'allData'
                                            ? 'bg-[var(--color-bg-card)] text-emerald-700 shadow-sm border border-[var(--color-border-light)] dark:text-emerald-400'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-title)] hover:bg-[var(--color-bg-card)]/50'}
                                    `}
                                >
                                    <TableCellsIcon className="w-4 h-4 mr-2" />
                                    All Data
                                </button>
                                <button
                                    onClick={() => setApprovalSubTab('reviewChanges')}
                                    className={`
                                        inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all
                                        ${approvalSubTab === 'reviewChanges'
                                            ? 'bg-[var(--color-bg-card)] text-amber-700 shadow-sm border border-[var(--color-border-light)] dark:text-amber-400'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-title)] hover:bg-[var(--color-bg-card)]/50'}
                                    `}
                                >
                                    <ClockIcon className="w-4 h-4 mr-2" />
                                    Review Changes
                                    {pendingCount > 0 && (
                                        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Sub-tab content */}
                            <div className="flex-1 overflow-hidden">
                                {approvalSubTab === 'allData' && (
                                    <SheetManagerTable
                                        initialShowApprovalOnly={false}
                                        enableApproval={false}

                                        enableDeleteAll={true}
                                        enableAddEntry={true}
                                    />
                                )}
                                {approvalSubTab === 'reviewChanges' && (
                                    <SheetManagerTable
                                        initialShowApprovalOnly={true}
                                        enableApproval={true}

                                        enableDeleteAll={false}
                                        enableAddEntry={false}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        }>
            <AdminDashboardContent />
        </Suspense>
    );
}
