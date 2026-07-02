'use client';

import { useState, useEffect } from 'react';

export default function VisitorAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/visitor_admin/analytics');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#db011c]"></div>
            </div>
        );
    }

    if (!data) return null;

    const { summary, weeklyData, monthlyData, categoryData, statusData } = data;

    // Determine max values for scaling the bars
    const getMaxValue = (arr: any[], key = 'value') => Math.max(...arr.map(d => d[key] || d.count || 0), 1);

    const maxCategory = getMaxValue(categoryData);
    const maxWeekly = getMaxValue(weeklyData, 'count');
    const maxMonthly = getMaxValue(monthlyData, 'count');
    const maxStatus = getMaxValue(statusData);

    const StatCard = ({ title, value, label }: { title?: string, value: string | number, label: string }) => (
        <div className="bg-white rounded border border-gray-200 border-t-4 border-t-[#db011c] p-4 flex flex-col shadow-sm">
            <h3 className="text-[32px] leading-tight font-black text-[#db011c] tracking-tight">{value}</h3>
            <p className="text-[11px] text-gray-500 font-bold uppercase mt-1">{label}</p>
        </div>
    );

    const HorizontalBar = ({ label, value, max }: { label: string, value: number, max: number }) => (
        <div className="flex items-center gap-4 mb-4">
            <div className="w-[100px] text-[11px] font-bold text-gray-700 shrink-0 uppercase tracking-wide truncate" title={label}>{label}</div>
            <div className="flex-1 bg-gray-200 h-[14px] rounded-sm overflow-hidden relative">
                <div 
                    className="bg-[#db011c] h-full rounded-sm transition-all duration-500" 
                    style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
                ></div>
            </div>
            <div className="w-[40px] text-xs font-bold text-gray-800 text-right shrink-0">{value}</div>
        </div>
    );

    const approvedCount = statusData.find((s: any) => s.name === 'COMPLETE' || s.name === 'APPROVED')?.value || 0;

    return (
        <div className="w-full pb-10 px-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard value={summary.totalRequests} label="Total Visitors" />
                <StatCard value={summary.currentWeekCount} label="This Week" />
                <StatCard value={`${summary.growth > 0 ? '+' : ''}${summary.growth}%`} label="Weekly Growth" />
                <StatCard value={approvedCount} label="Approved Cases" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="flex flex-col gap-6">
                    {/* Category Chart */}
                    <div className="bg-white rounded border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-[13px] font-black uppercase tracking-wider text-gray-900 mb-6">VISITS BY CATEGORY</h3>
                        <div className="mt-4">
                            {categoryData.length > 0 ? categoryData.map((d: any, i: number) => (
                                <HorizontalBar key={i} label={d.name} value={d.value} max={maxCategory} />
                            )) : <div className="text-[11px] text-gray-400 italic">No data</div>}
                        </div>
                    </div>

                    {/* Daily Registrations */}
                    <div className="bg-white rounded border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-[13px] font-black uppercase tracking-wider text-gray-900 mb-6">DAILY REGISTRATIONS (LAST 7 DAYS)</h3>
                        <div className="mt-4">
                            {weeklyData.length > 0 ? weeklyData.map((d: any, i: number) => (
                                <HorizontalBar key={i} label={d.date} value={d.count} max={maxWeekly} />
                            )) : <div className="text-[11px] text-gray-400 italic">No data</div>}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6">
                    {/* Status Chart */}
                    <div className="bg-white rounded border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-[13px] font-black uppercase tracking-wider text-gray-900 mb-6">STATUS DISTRIBUTION</h3>
                        <div className="mt-4">
                            {statusData.length > 0 ? statusData.map((d: any, i: number) => (
                                <HorizontalBar key={i} label={d.name} value={d.value} max={maxStatus} />
                            )) : <div className="text-[11px] text-gray-400 italic">No data</div>}
                        </div>
                    </div>

                    {/* Monthly Volume */}
                    <div className="bg-white rounded border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-[13px] font-black uppercase tracking-wider text-gray-900 mb-6">MONTHLY VOLUME (LAST 6 MONTHS)</h3>
                        <div className="mt-4">
                            {monthlyData.length > 0 ? monthlyData.map((d: any, i: number) => (
                                <HorizontalBar key={i} label={d.month} value={d.count} max={maxMonthly} />
                            )) : <div className="text-[11px] text-gray-400 italic">No data</div>}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Header Title Title that you wanted to see! */}
            <div className="mt-8">
               <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">VISITOR DATA, TRENDS AND REAL-TIME OVERVIEW</h2>
            </div>
        </div>
    );
}
