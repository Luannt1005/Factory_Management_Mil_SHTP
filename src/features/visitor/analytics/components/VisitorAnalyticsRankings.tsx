import React from 'react';
import type { 
    AnalyticsWeeklyDistributionItem, 
    AnalyticsCategoryItem, 
    AnalyticsDepartmentItem 
} from '@/types/visitor-analytics.types';

interface VisitorAnalyticsRankingsProps {
    periodicData: AnalyticsWeeklyDistributionItem[];
    categoryData: AnalyticsCategoryItem[];
    departmentData: AnalyticsDepartmentItem[];
    children?: React.ReactNode;
}

const CATEGORY_BAR_COLORS = ['#db011c', '#990114', '#2b2b2b', '#9ca3af'];

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
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PERIODIC REPORT</div>
                        <h3 className="text-sm font-black text-gray-900 uppercase">Report by week / month / year</h3>
                    </div>
                </div>
                <div className="flex items-end justify-between h-[180px] w-full px-4 pt-4 border-b border-gray-200 relative pb-6">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400">
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
                                    className="w-8 bg-[#db011c] rounded-t-sm" 
                                    style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                                ></div>
                                <div className="text-[10px] text-gray-400 mt-2 absolute -bottom-4">{d.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ROW 4: Category Distribution */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-4">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">VISITOR CATEGORY REPORT</div>
                <h3 className="text-sm font-black text-gray-900 uppercase mb-6">Vendor / Contractor / MIL-TTI Expat / Interviewee</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    <div className="lg:col-span-2">
                        {categoryData.map((d, i) => (
                            <div key={i} className="flex items-center gap-4 mb-4">
                                <div className="w-[120px] text-xs font-medium text-gray-800 text-right shrink-0 truncate">{d.name}</div>
                                <div className="flex-1 bg-gray-100 h-[14px] rounded-sm overflow-hidden relative">
                                    <div 
                                        className="h-full rounded-sm transition-all duration-500" 
                                        style={{ width: `${d.percentage}%`, backgroundColor: CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length] }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {/* X-axis scale roughly */}
                        <div className="flex justify-between text-[10px] text-gray-400 ml-[136px] mt-2 border-t border-gray-200 pt-1">
                            <span>0</span>
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
                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length] }}></div>
                                    <span className="text-xs text-gray-600 font-medium">{d.name}</span>
                                </div>
                                <div className="text-xs">
                                    <span className="font-black text-gray-900">{d.value}</span>
                                    <span className="text-gray-400 ml-1">({d.percentage}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ROW 5: Department & Recent Activity Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">DEPARTMENT REPORT</div>
                    <h3 className="text-sm font-black text-gray-900 uppercase mb-6">Visits by department (MIL / SF)</h3>
                    
                    {/* Stacked Bars */}
                    <div className="mb-8">
                        {departmentData.map((d, i) => {
                            const milWidth = (d.MIL / deptMax) * 100;
                            const sfWidth = (d.SF / deptMax) * 100;
                            return (
                                <div key={i} className="flex items-center gap-4 mb-3">
                                    <div className="w-[100px] text-xs font-bold text-gray-800 text-right shrink-0 truncate">{d.name}</div>
                                    <div className="flex-1 flex h-[10px]">
                                        <div className="bg-[#db011c] h-full" style={{ width: `${milWidth}%` }}></div>
                                        <div className="bg-[#2b2b2b] h-full" style={{ width: `${sfWidth}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Data Table */}
                    <table className="w-full text-xs text-center border-t border-gray-200">
                        <thead>
                            <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider">
                                <th className="text-left py-3 w-1/3">DEPARTMENT</th>
                                <th className="py-3">MIL</th>
                                <th className="py-3">SF</th>
                                <th className="py-3 font-black text-gray-900">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departmentData.map((d, i) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                    <td className="text-left py-3 font-bold text-gray-800">{d.name}</td>
                                    <td className="py-3 font-bold text-[#db011c]">{d.MIL}</td>
                                    <td className="py-3 font-bold text-gray-800">{d.SF}</td>
                                    <td className="py-3 font-black text-gray-900">{d.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {children}
            </div>
        </>
    );
}
