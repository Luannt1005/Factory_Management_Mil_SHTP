'use client';

import { useState, useEffect } from 'react';
import { visitorAnalyticsApi } from '@/features/visitor/analytics/services/visitorAnalyticsApi';
import type { GetVisitorAnalyticsResponse, VisitorAnalyticsPeriodFilter } from '@/types/visitor-analytics.types';
import VisitorAnalyticsKPIs from '@/features/visitor/analytics/components/VisitorAnalyticsKPIs';
import VisitorAnalyticsFilters from '@/features/visitor/analytics/components/VisitorAnalyticsFilters';
import VisitorAnalyticsCharts from '@/features/visitor/analytics/components/VisitorAnalyticsCharts';
import VisitorAnalyticsRankings from '@/features/visitor/analytics/components/VisitorAnalyticsRankings';
import VisitorAnalyticsRecentStream from '@/features/visitor/analytics/components/VisitorAnalyticsRecentStream';
import CheckInOutLogsTable from '@/features/visitor/analytics/components/CheckInOutLogsTable';

export default function VisitorAnalytics() {
    const [activeTab, setActiveTab] = useState<'analytics' | 'checkinout_logs'>('analytics');
    const [data, setData] = useState<GetVisitorAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [periodFilter, setPeriodFilter] = useState<VisitorAnalyticsPeriodFilter>('all');
    const [buFilter, setBuFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                let startDate = '';
                let endDate = '';
                const now = new Date();
                
                if (periodFilter === 'today') {
                    startDate = now.toISOString().split('T')[0];
                    endDate = startDate;
                } else if (periodFilter === 'week') {
                    const first = now.getDate() - now.getDay() + 1;
                    const start = new Date(now.setDate(first));
                    startDate = start.toISOString().split('T')[0];
                } else if (periodFilter === 'month') {
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    startDate = start.toISOString().split('T')[0];
                } else if (periodFilter === 'year') {
                    const start = new Date(now.getFullYear(), 0, 1);
                    startDate = start.toISOString().split('T')[0];
                }

                const json = await visitorAnalyticsApi.getAnalytics({
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    bu: buFilter,
                    status: statusFilter,
                    category: categoryFilter,
                });
                setData(json);
            } catch (err) {
                console.error('Failed to load analytics', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
        
        // Refresh every minute for the live feed
        const interval = setInterval(fetchAnalytics, 60000);
        return () => clearInterval(interval);
    }, [periodFilter, buFilter, statusFilter, categoryFilter]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#db011c]"></div>
            </div>
        );
    }

    if (!data) return null;

    const { summary, trendData, periodicData, categoryData, departmentData, buDistribution, recentActivity } = data;

    return (
        <div className="w-full pb-10 px-4 sm:px-6 bg-transparent min-h-screen pt-4 font-sans">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 mb-5 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                        activeTab === 'analytics'
                            ? 'border-[#db011c] text-[#db011c]'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Overview Analytics
                </button>
                <button
                    onClick={() => setActiveTab('checkinout_logs')}
                    className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                        activeTab === 'checkinout_logs'
                            ? 'border-[#db011c] text-[#db011c]'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check-in/Out History Logs
                    <span className="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-[#db011c]">
                        Audit Logs
                    </span>
                </button>
            </div>

            {activeTab === 'checkinout_logs' ? (
                <CheckInOutLogsTable />
            ) : (
                <>
                    {/* Filters Row */}
                    <VisitorAnalyticsFilters
                        periodFilter={periodFilter}
                        onPeriodChange={setPeriodFilter}
                        buFilter={buFilter}
                        onBuChange={setBuFilter}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        categoryFilter={categoryFilter}
                        onCategoryChange={setCategoryFilter}
                    />

                    {/* ROW 1: Stat Cards */}
                    <VisitorAnalyticsKPIs summary={summary} />

                    {/* ROW 2: Trends and Donut */}
                    <VisitorAnalyticsCharts
                        trendData={trendData}
                        buDistribution={buDistribution}
                    />

                    {/* ROW 3, 4, 5: Periodic, Category, Department & Recent Stream */}
                    <VisitorAnalyticsRankings
                        periodicData={periodicData}
                        categoryData={categoryData}
                        departmentData={departmentData}
                    >
                        <VisitorAnalyticsRecentStream recentActivity={recentActivity} />
                    </VisitorAnalyticsRankings>
                </>
            )}
        </div>
    );
}
