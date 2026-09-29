'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import {
    visitorDashboardApi,
    VisitorDashboardApiError,
} from '@/features/visitor/dashboard/services/visitorDashboardApi';
import { VisitorDashboardTabs } from '@/features/visitor/dashboard/components/VisitorDashboardTabs';
import { VisitorDashboardFilters } from '@/features/visitor/dashboard/components/VisitorDashboardFilters';
import { VisitorDashboardTable } from '@/features/visitor/dashboard/components/VisitorDashboardTable';
import { VisitorDetailModal } from '@/features/visitor/dashboard/components/VisitorDetailModal';
import { VisitorEditIntervieweeModal } from '@/features/visitor/dashboard/components/VisitorEditIntervieweeModal';

import type {
    VisitorDashboardRequestRecord,
    VisitorDashboardPagination,
    VisitorDashboardTab,
    UpdateIntervieweeRequestPayload,
    MeetingRoom,
} from '@/types/visitor-dashboard.types';

function DashboardContent() {
    const { data: session } = useSession();
    const appRoleNames = (session?.user as any)?.app_role_names || [];
    const isAdmin = (session?.user as any)?.role === 'admin';
    const isHrVisitor = appRoleNames.includes('Hr Visitor') || isAdmin;
    const isSecurity = appRoleNames.includes('Security') && !isAdmin && !isHrVisitor;
    const canAccessInterviewee = isHrVisitor || isSecurity;

    const [requests, setRequests] = useState<VisitorDashboardRequestRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<VisitorDashboardPagination>({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
    });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<VisitorDashboardRequestRecord | null>(null);
    const [editingInterviewee, setEditingInterviewee] = useState<VisitorDashboardRequestRecord | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<VisitorDashboardTab>('general');
    const [mounted, setMounted] = useState(false);
    const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);

    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    useEffect(() => {
        const fetchMeetingRooms = async () => {
            try {
                const data = await visitorDashboardApi.getMeetingRooms();
                setMeetingRooms(data.meetingRooms || []);
            } catch (error) {
                console.error('Failed to fetch meeting rooms:', error);
            }
        };
        fetchMeetingRooms();
    }, []);

    // Set initial activeTab based on searchParams and user roles
    useEffect(() => {
        setMounted(true);
        if (isSecurity) {
            setActiveTab('interviewee');
        } else if (tabParam === 'interviewee' && canAccessInterviewee) {
            setActiveTab('interviewee');
        } else if (tabParam === 'general') {
            setActiveTab('general');
        }
    }, [tabParam, isSecurity, canAccessInterviewee]);

    useEffect(() => {
        if (session) {
            fetchMyRequests(pagination.page);
        }
    }, [pagination.page, startDate, endDate, activeTab, session]);

    const resetPage = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchMyRequests = async (
        page: number,
        tabOverride?: VisitorDashboardTab,
        isSilent = false
    ) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        if (!isSilent) {
            setLoading(true);
        }
        try {
            const currentTab = tabOverride || activeTab;
            const data = await visitorDashboardApi.getMyRequests(
                {
                    tab: currentTab,
                    page,
                    limit: pagination.limit,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    search: searchTerm || undefined,
                },
                signal
            );

            if (!signal.aborted) {
                setRequests(data.requests);
                setPagination(data.pagination);
                // Update selectedRequest if currently viewed in modal
                setSelectedRequest((currentSelected) => {
                    if (!currentSelected) return null;
                    const updated = data.requests.find((r) => r.id === currentSelected.id);
                    return updated || currentSelected;
                });
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;
            if (err instanceof VisitorDashboardApiError && err.status === 401 && !signal.aborted) {
                router.push('/login?redirect=' + window.location.pathname);
                return;
            }
            console.error(err);
        } finally {
            if (!signal.aborted && !isSilent) {
                setLoading(false);
            }
        }
    };

    // Auto-poll in background ONLY while waiting for Power Automate to assign Manager email
    useEffect(() => {
        if (!session) return;

        // Only run if there is at least one request still waiting for manager routing
        const hasUnassignedManager = requests.some((r) =>
            r.request_approvals?.some(
                (a) =>
                    a.approver_email === 'Pending Manager Assignment' || a.approver_email === null
            )
        );

        if (!hasUnassignedManager) return;

        let pollCount = 0;
        const maxPolls = 6; // Safety limit: max 6 times (18 seconds) then stops completely

        const intervalId = setInterval(() => {
            pollCount++;
            if (pollCount >= maxPolls) {
                clearInterval(intervalId);
            }
            fetchMyRequests(pagination.page, activeTab, true);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [requests, session, pagination.page, activeTab]);

    const handleUpdateInterviewee = async (
        requestId: string,
        payload: UpdateIntervieweeRequestPayload
    ) => {
        setSaving(true);
        try {
            await visitorDashboardApi.updateIntervieweeRequest(requestId, payload);
            alert('Request updated successfully!');
            setEditingInterviewee(null);
            fetchMyRequests(pagination.page);
        } catch (e: unknown) {
            if (e instanceof VisitorDashboardApiError) {
                alert(`Error: ${e.message}`);
            } else {
                alert('Internal server error');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <VisitorDashboardTabs
                activeTab={activeTab}
                isSecurity={isSecurity}
                canAccessInterviewee={canAccessInterviewee}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    resetPage();
                }}
            />

            <VisitorDashboardFilters
                startDate={startDate}
                endDate={endDate}
                searchTerm={searchTerm}
                loadedCount={requests.length}
                totalCount={pagination.total}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onSearchTermChange={setSearchTerm}
                onSearch={() => {
                    resetPage();
                    fetchMyRequests(1);
                }}
                onClear={() => {
                    setStartDate('');
                    setEndDate('');
                    setSearchTerm('');
                    resetPage();
                    fetchMyRequests(1);
                }}
            />

            <VisitorDashboardTable
                requests={requests}
                activeTab={activeTab}
                loading={loading}
                pagination={pagination}
                submitterEmail={session?.user?.email || (session?.user as any)?.username}
                onPageChange={(page) => fetchMyRequests(page)}
                onView={(request) => setSelectedRequest(request)}
                onEdit={(request) => setEditingInterviewee(request)}
            />

            <VisitorDetailModal
                request={selectedRequest}
                activeTab={activeTab}
                mounted={mounted}
                submitterEmail={session?.user?.email || (session?.user as any)?.username}
                onClose={() => setSelectedRequest(null)}
                onEdit={(request) => {
                    setEditingInterviewee(request);
                    setSelectedRequest(null);
                }}
            />

            <VisitorEditIntervieweeModal
                request={editingInterviewee}
                mounted={mounted}
                meetingRooms={meetingRooms}
                saving={saving}
                onClose={() => setEditingInterviewee(null)}
                onSubmit={handleUpdateInterviewee}
            />
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
