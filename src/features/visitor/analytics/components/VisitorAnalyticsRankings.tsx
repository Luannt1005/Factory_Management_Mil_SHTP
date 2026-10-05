import React from 'react';
import type { 
    AnalyticsWeeklyDistributionItem, 
    AnalyticsCategoryItem, 
    AnalyticsDepartmentItem 
} from '@/types/visitor-analytics.types';
import { ChartCard, CHART_COLORS } from '@/components/dashboard';

interface VisitorAnalyticsRankingsProps {
    periodicData: AnalyticsWeeklyDistributionItem[];
    categoryData: AnalyticsCategoryItem[];
    departmentData: AnalyticsDepartmentItem[];
    children?: React.ReactNode;
}

const CATEGORY_BAR_COLORS = [
    CHART_COLORS.primary,
    CHART_COLORS.primaryHover,
    CHART_COLORS.secondary,
    CHART_COLORS.axis,
];

export default function VisitorAnalyticsRankings({
    periodicData,
    categoryData,
    departmentData,
    children,
}: VisitorAnalyticsRankingsProps) {
    const periodicMax = Math.max(...periodicData.map((p) => p.value)) || 10;
    const deptMax = Math.max(...departmentData.map((d) => d.total)) || 10;

    return (
        <>
            {/* ROW 3: Periodic Report */}
            <ChartCard
                kicker="PERIODIC REPORT"
                title="Activity by Timeframe"
                subtitle="Aggregated visitor volume by week, month, or year"
                className="mb-4"
            >
                <div className="flex items-end justify-between h-[180px] w-full px-4 pt-4 border-b border-slate-200 relative pb-6">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-medium text-slate-400">
                        <span>{periodicMax}</span>
                        <span>{Math.round(periodicMax / 2)}</span>
                        <span>0</span>
                    </div>
                    {/* Bars */}
                    {periodicData.map((d, i) => {
                        const height = (d.value / periodicMax) * 100;
                        return (
                            <div key={i} className="flex flex-col items-center flex-1">
                                <div
                                    className="w-8 rounded-t transition-all duration-300 hover:opacity-85"
                                    style={{
                                        height: `${height}%`,
                                        minHeight: height > 0 ? '4px' : '0',
                                        backgroundColor: CHART_COLORS.primary
                                    }}
                                ></div>
                                <div className="text-[11px] font-medium text-slate-500 mt-2 absolute -bottom-4">{d.label}</div>
                            </div>
                        );
                    })}
                </div>
            </ChartCard>

            {/* ROW 4: Category Distribution */}
            <ChartCard
                kicker="VISITOR CATEGORY REPORT"
                title="Visitor Breakdown by Purpose"
                subtitle="Vendor, Contractor, MIL-TTI Expat, and Interviewee distribution"
                className="mb-4"
            >

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    <div className="lg:col-span-2">
                        {categoryData.map((d, i) => (
                            <div key={i} className="flex items-center gap-4 mb-4">
                                <div className="w-[130px] text-xs font-semibold text-slate-700 text-right shrink-0 truncate">{d.name}</div>
                                <div className="flex-1 bg-slate-100 h-[14px] rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${d.percentage}%`, backgroundColor: CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length] }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {/* X-axis scale */}
                        <div className="flex justify-between text-[11px] font-medium text-slate-400 ml-[146px] mt-2 border-t border-slate-200 pt-1">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    
                    {/* Legend and Values */}
                    <div className="flex flex-col gap-3">
                        {categoryData.map((d, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length] }}></div>
                                    <span className="text-xs text-slate-700 font-medium">{d.name}</span>
                                </div>
                                <div className="text-xs">
                                    <span className="font-bold text-slate-900">{d.value}</span>
                                    <span className="text-slate-400 ml-1">({d.percentage}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ChartCard>

            {/* ROW 5: Department & Recent Activity Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartCard
                    kicker="DEPARTMENT REPORT"
                    title="Visits by Department"
                    subtitle="Distribution across MIL and Shared Function teams"
                    className="lg:col-span-2"
                >
                    {/* Stacked Bars */}
                    <div className="mb-8">
                        {departmentData.map((d, i) => {
                            const milWidth = (d.MIL / deptMax) * 100;
                            const sfWidth = (d.SF / deptMax) * 100;
                            return (
                                <div key={i} className="flex items-center gap-4 mb-3">
                                    <div className="w-[110px] text-xs font-semibold text-slate-700 text-right shrink-0 truncate">{d.name}</div>
                                    <div className="flex-1 flex h-[10px] rounded-full overflow-hidden bg-slate-100">
                                        <div className="h-full" style={{ width: `${milWidth}%`, backgroundColor: CHART_COLORS.primary }}></div>
                                        <div className="h-full" style={{ width: `${sfWidth}%`, backgroundColor: CHART_COLORS.secondary }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Data Table */}
                    <table className="w-full text-xs text-center border-t border-slate-200">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider">
                                <th className="text-left py-3 w-1/3">DEPARTMENT</th>
                                <th className="py-3">MIL</th>
                                <th className="py-3">SF</th>
                                <th className="py-3 font-bold text-slate-900">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departmentData.map((d, i) => (
                                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="text-left py-3 font-semibold text-slate-800">{d.name}</td>
                                    <td className="py-3 font-bold text-mwk">{d.MIL}</td>
                                    <td className="py-3 font-semibold text-slate-700">{d.SF}</td>
                                    <td className="py-3 font-bold text-slate-900">{d.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ChartCard>

                {children}
            </div>
        </>
    );
}
