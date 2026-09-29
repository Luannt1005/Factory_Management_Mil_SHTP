import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import type { AnalyticsTrendItem, AnalyticsBUDistributionItem } from '@/types/visitor-analytics.types';

interface VisitorAnalyticsChartsProps {
    trendData: AnalyticsTrendItem[];
    buDistribution: AnalyticsBUDistributionItem[];
}

const COLORS = ['#db011c', '#2b2b2b'];

export default function VisitorAnalyticsCharts({ trendData, buDistribution }: VisitorAnalyticsChartsProps) {
    const milVisits = buDistribution.find((b) => b.name === 'MIL')?.value || 0;
    const sfVisits = buDistribution.find((b) => b.name === 'Share Function')?.value || 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">VISITORS OVER TIME</div>
                        <h3 className="text-sm font-black text-gray-900 uppercase">Visitor Trends</h3>
                    </div>
                </div>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#db011c" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#db011c" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Area type="monotone" dataKey="value" stroke="#db011c" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col">
                <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">BU DISTRIBUTION</div>
                    <h3 className="text-sm font-black text-gray-900 uppercase">MIL & Share Function</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center relative -mt-4">
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={buDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={75}
                                stroke="none"
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {buDistribution.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-2 w-full">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                            <div className="w-2 h-2 bg-[#db011c]"></div> MIL — {milVisits} visits
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                            <div className="w-2 h-2 bg-[#2b2b2b]"></div> Share Function — {sfVisits} visits
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
