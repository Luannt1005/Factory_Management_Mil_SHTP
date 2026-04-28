'use client';

import { useState, useEffect } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area, YAxis, LabelList
} from 'recharts';
import { ArrowTrendingUpIcon, UsersIcon, CheckBadgeIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
    'APPROVED': '#10b981',
    'COMPLETE': '#10b981',
    'IN PROCESS': '#f59e0b',
    'REJECTED': '#ef4444',
};

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
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!data) return null;

    const { summary, weeklyData, monthlyData, categoryData, statusData } = data;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase">Visitor Dashboard</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:border-blue-200 group">
                    <div className="p-4 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                        <UsersIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Visitors</p>
                        <h3 className="text-3xl font-black text-gray-900">{summary.totalRequests}</h3>
                    </div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:border-emerald-200 group">
                    <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                        <ChartBarIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">This Week</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-gray-900">{summary.currentWeekCount}</h3>
                            <span className="text-xs font-bold text-gray-400">/ {summary.lastWeekCount} prev</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:border-amber-200 group">
                    <div className="p-4 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                        <ArrowTrendingUpIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Weekly Growth</p>
                        <h3 className={`text-3xl font-black ${summary.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {summary.growth > 0 ? '+' : ''}{summary.growth}%
                        </h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:border-purple-200 group">
                    <div className="p-4 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                        <CheckBadgeIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Approved Cases</p>
                        <h3 className="text-3xl font-black text-gray-900">
                            {statusData.find((s: any) => s.name === 'COMPLETE' || s.name === 'APPROVED')?.value || 0}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
                
                {/* Weekly Trends */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-6 bg-[#db011c] rounded-full"></div>
                        <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Daily Registrations (7 Days)</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#db011c" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#db011c" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#db011c" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, fill: '#db011c', stroke: 'white', strokeWidth: 2 }}>
                                    <LabelList dataKey="count" position="top" style={{ fontSize: '11px', fontWeight: 'bold', fill: '#1e293b' }} offset={10} />
                                </Area>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Trends */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Monthly Volume</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                                    <LabelList dataKey="count" position="top" style={{ fontSize: '11px', fontWeight: 'bold', fill: '#1e293b' }} offset={10} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                        <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Visitor Categories</h3>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {categoryData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} 
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={40} 
                                    iconType="circle" 
                                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '20px' }} 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Status Breakdown</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={statusData} margin={{ top: 10, right: 40, left: 10, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} width={90} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }} 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} 
                                />
                                <Bar dataKey="value" barSize={24} radius={[0, 6, 6, 0]}>
                                    <LabelList dataKey="value" position="right" style={{ fontSize: '11px', fontWeight: 'bold', fill: '#475569' }} offset={10} />
                                    {statusData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>

    );
}
