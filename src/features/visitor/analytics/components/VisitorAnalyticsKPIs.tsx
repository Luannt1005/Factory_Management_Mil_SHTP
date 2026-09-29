import React from 'react';
import type { AnalyticsKPISummary } from '@/types/visitor-analytics.types';

interface VisitorAnalyticsKPIsProps {
    summary: AnalyticsKPISummary;
}

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: number | string;
    growth?: number;
    unit?: string;
    subtitle: string;
}

const formatGrowth = (value?: number) => {
    if (value && value > 0) return <span className="text-[#db011c] font-bold text-xs flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>{value}%</span>;
    if (value && value < 0) return <span className="text-gray-500 font-bold text-xs flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>{Math.abs(value)}%</span>;
    return <span className="text-gray-400 font-bold text-xs">0%</span>;
};

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, growth, unit, subtitle }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col relative overflow-hidden h-[120px] justify-between transition-shadow hover:shadow-md">
        <div className="flex justify-between items-start">
            <div className="text-[10px] text-gray-400 font-bold uppercase"></div>
            <div className="text-[#db011c]">{icon}</div>
        </div>
        <div>
            <div className="flex items-baseline gap-1">
                <h3 className="text-4xl font-black text-gray-900 tracking-tight">{value}</h3>
                {unit && <span className="text-lg font-bold text-gray-900">{unit}</span>}
            </div>
            <p className="text-xs text-gray-600 font-medium">{title}</p>
        </div>
        <div className="flex items-center gap-1 mt-2">
            {formatGrowth(growth)}
            <span className="text-[10px] text-gray-400">{subtitle}</span>
        </div>
    </div>
);

export default function VisitorAnalyticsKPIs({ summary }: VisitorAnalyticsKPIsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard 
                title="Visitors Today" 
                value={summary.visitorsToday} 
                growth={summary.visitorsTodayGrowth} 
                subtitle="vs yesterday"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
            />
            <StatCard 
                title="Currently Present" 
                value={summary.currentlyPresent} 
                growth={0} 
                subtitle="on campus"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
            />
            <StatCard 
                title="Total This Week" 
                value={summary.totalThisWeek} 
                growth={summary.weekGrowth} 
                subtitle="vs last week"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>}
            />
            <StatCard 
                title="Avg. Stay Time" 
                value={summary.avgStayMinutes} 
                unit="m"
                growth={summary.avgStayChange} 
                subtitle="vs last week"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            />
        </div>
    );
}
