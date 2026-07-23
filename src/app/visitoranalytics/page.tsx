'use client';

import { useState, useEffect } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

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
        
        // Refresh every minute for the live feed
        const interval = setInterval(fetchAnalytics, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#db011c]"></div>
            </div>
        );
    }

    if (!data) return null;

    const { summary, trendData, periodicData, categoryData, departmentData, buDistribution, recentActivity } = data;

    const formatGrowth = (value: number) => {
        if (value > 0) return <span className="text-[#db011c] font-bold text-xs flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>{value}%</span>;
        if (value < 0) return <span className="text-gray-500 font-bold text-xs flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>{Math.abs(value)}%</span>;
        return <span className="text-gray-400 font-bold text-xs">0%</span>;
    };

    const StatCard = ({ id, icon, title, value, growth, unit, subtitle }: any) => (
        <div className="bg-white rounded border border-gray-200 p-4 shadow-sm flex flex-col relative overflow-hidden h-[120px] justify-between">
            <div className="flex justify-between items-start">
                <div className="text-[10px] text-gray-400 font-bold uppercase">{id}</div>
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

    const COLORS = ['#db011c', '#2b2b2b'];

    return (
        <div className="w-full pb-10 px-6 bg-[#f4f6f9] min-h-screen pt-6 font-sans">
            
            {/* ROW 1: Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard 
                    id="STAT-01" 
                    title="Khách hôm nay" 
                    value={summary.visitorsToday} 
                    growth={summary.visitorsTodayGrowth} 
                    subtitle="so với hôm qua"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
                />
                <StatCard 
                    id="STAT-02" 
                    title="Đang có mặt" 
                    value={summary.currentlyPresent} 
                    growth={0} 
                    subtitle="trong khuôn viên"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                />
                <StatCard 
                    id="STAT-03" 
                    title="Tổng lượt tuần này" 
                    value={summary.totalThisWeek} 
                    growth={summary.weekGrowth} 
                    subtitle="so với tuần trước"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>}
                />
                <StatCard 
                    id="STAT-04" 
                    title="Thời gian lưu trú TB" 
                    value={summary.avgStayMinutes} 
                    unit="p"
                    growth={summary.avgStayChange} 
                    subtitle="so với tuần trước"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                />
            </div>

            {/* ROW 2: Trends and Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="lg:col-span-2 bg-white rounded border border-gray-200 p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">LƯỢT KHÁCH THEO THỜI GIAN</div>
                            <h3 className="text-sm font-black text-gray-900 uppercase">Xu hướng lượt khách</h3>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded">
                            <button className="px-3 py-1 text-xs font-bold text-gray-500 rounded">Ngày</button>
                            <button className="px-3 py-1 text-xs font-bold text-white bg-[#db011c] rounded shadow-sm">Tuần</button>
                            <button className="px-3 py-1 text-xs font-bold text-gray-500 rounded">Tháng</button>
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

                <div className="bg-white rounded border border-gray-200 p-5 shadow-sm flex flex-col">
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PHÂN BỔ THEO BU</div>
                        <h3 className="text-sm font-black text-gray-900 uppercase">MIL & SF</h3>
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
                                    {buDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex items-center justify-center gap-6 mt-2 w-full">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                <div className="w-2 h-2 bg-[#db011c]"></div> MIL — {buDistribution.find((b:any)=>b.name==='MIL')?.value || 0} lượt
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                <div className="w-2 h-2 bg-[#2b2b2b]"></div> SF — {buDistribution.find((b:any)=>b.name==='SF')?.value || 0} lượt
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 3: Periodic Report */}
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm mb-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">BÁO CÁO ĐỊNH KỲ</div>
                        <h3 className="text-sm font-black text-gray-900 uppercase">Báo cáo theo tuần / tháng / năm</h3>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded">
                        <button className="px-3 py-1 text-xs font-bold text-gray-500 rounded">Theo tuần</button>
                        <button className="px-3 py-1 text-xs font-bold text-white bg-[#db011c] rounded shadow-sm">Theo tháng</button>
                        <button className="px-3 py-1 text-xs font-bold text-gray-500 rounded">Theo năm</button>
                    </div>
                </div>
                <div className="flex items-end justify-between h-[180px] w-full px-4 pt-4 border-b border-gray-200 relative pb-6">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400">
                        <span>{Math.max(...periodicData.map((d:any)=>d.value)) || 10}</span>
                        <span>{Math.round((Math.max(...periodicData.map((d:any)=>d.value)) || 10) / 2)}</span>
                        <span>0</span>
                    </div>
                    {/* Bars */}
                    {periodicData.map((d: any, i: number) => {
                        const max = Math.max(...periodicData.map((p:any)=>p.value)) || 10;
                        const height = (d.value / max) * 100;
                        return (
                            <div key={i} className="flex flex-col items-center flex-1">
                                <div className="w-8 bg-[#db011c] rounded-t-sm" style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}></div>
                                <div className="text-[10px] text-gray-400 mt-2 absolute -bottom-4">{d.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ROW 4: Category Distribution */}
            <div className="bg-white rounded border border-gray-200 p-5 shadow-sm mb-4">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">BÁO CÁO THEO LOẠI KHÁCH</div>
                <h3 className="text-sm font-black text-gray-900 uppercase mb-6">Vendor / Contractor / MIL-TTI Expat / Interviewee</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    <div className="lg:col-span-2">
                        {categoryData.map((d: any, i: number) => {
                            const barColors = ['#db011c', '#990114', '#2b2b2b', '#9ca3af'];
                            return (
                                <div key={i} className="flex items-center gap-4 mb-4">
                                    <div className="w-[120px] text-xs font-medium text-gray-800 text-right shrink-0 truncate">{d.name}</div>
                                    <div className="flex-1 bg-gray-100 h-[14px] rounded-sm overflow-hidden relative">
                                        <div 
                                            className="h-full rounded-sm transition-all duration-500" 
                                            style={{ width: `${d.percentage}%`, backgroundColor: barColors[i % barColors.length] }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
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
                        {categoryData.map((d: any, i: number) => {
                            const barColors = ['#db011c', '#990114', '#2b2b2b', '#9ca3af'];
                            return (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: barColors[i % barColors.length] }}></div>
                                        <span className="text-xs text-gray-600 font-medium">{d.name}</span>
                                    </div>
                                    <div className="text-xs">
                                        <span className="font-black text-gray-900">{d.value}</span>
                                        <span className="text-gray-400 ml-1">({d.percentage}%)</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ROW 5: Department & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded border border-gray-200 p-5 shadow-sm">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">BÁO CÁO THEO BỘ PHẬN</div>
                    <h3 className="text-sm font-black text-gray-900 uppercase mb-6">Lượt khách theo bộ phận (MIL / SF)</h3>
                    
                    {/* Stacked Bars */}
                    <div className="mb-8">
                        {departmentData.map((d: any, i: number) => {
                            const max = Math.max(...departmentData.map((d:any) => d.total)) || 10;
                            const milWidth = (d.MIL / max) * 100;
                            const sfWidth = (d.SF / max) * 100;
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
                                <th className="text-left py-3 w-1/3">BỘ PHẬN</th>
                                <th className="py-3">MIL</th>
                                <th className="py-3">SF</th>
                                <th className="py-3 font-black text-gray-900">TỔNG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departmentData.map((d: any, i: number) => (
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

                <div className="bg-white rounded border border-gray-200 p-5 shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ĐƠN ĐĂNG KÝ</div>
                    <h3 className="text-sm font-black text-[#db011c] uppercase flex items-center gap-2 mb-4">
                        Đơn mới đăng ký <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#db011c] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#db011c]"></span></span>
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 relative">
                        {/* Custom scrollbar styling in global css or here */}
                        <style dangerouslySetInnerHTML={{__html: `
                            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 20px; }
                        `}} />
                        {recentActivity.map((act: any, i: number) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-start gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${act.status === 'CHECKED_IN' ? 'bg-[#db011c]' : 'bg-gray-400'}`}></div>
                                    <div>
                                        <div className="text-xs font-black text-gray-900">{act.name}</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{act.details}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-2">
                                    {act.status === 'APPROVED' || act.status === 'COMPLETE'
                                        ? <span className="bg-green-50 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{act.status}</span>
                                        : act.status === 'PENDING' || act.status === 'IN PROCESS' 
                                        ? <span className="bg-yellow-50 text-yellow-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{act.status}</span>
                                        : <span className="bg-red-50 text-[#db011c] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{act.status}</span>
                                    }
                                    <span className="text-[10px] font-medium text-gray-400 w-8 text-right">{act.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
