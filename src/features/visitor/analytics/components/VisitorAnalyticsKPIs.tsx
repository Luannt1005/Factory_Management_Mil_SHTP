import React from 'react';
import type { AnalyticsKPISummary } from '@/types/visitor-analytics.types';
import { MetricCard } from '@/components/dashboard';

interface VisitorAnalyticsKPIsProps {
    summary: AnalyticsKPISummary;
}

export default function VisitorAnalyticsKPIs({ summary }: VisitorAnalyticsKPIsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <MetricCard
                label="Visitors Today"
                value={summary.visitorsToday}
                growth={summary.visitorsTodayGrowth}
                growthSubtitle="vs yesterday"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
            />
            <MetricCard
                label="Currently Present"
                value={summary.currentlyPresent}
                growth={0}
                growthSubtitle="on campus"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
            />
            <MetricCard
                label="Total This Week"
                value={summary.totalThisWeek}
                growth={summary.weekGrowth}
                growthSubtitle="vs last week"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>}
            />
            <MetricCard
                label="Avg. Stay Time"
                value={summary.avgStayMinutes}
                unit="m"
                growth={summary.avgStayChange}
                growthSubtitle="vs last week"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            />
        </div>
    );
}
