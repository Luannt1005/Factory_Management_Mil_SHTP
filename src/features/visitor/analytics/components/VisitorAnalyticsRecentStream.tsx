import React from 'react';
import type { AnalyticsRecentActivityItem } from '@/types/visitor-analytics.types';

interface VisitorAnalyticsRecentStreamProps {
    recentActivity: AnalyticsRecentActivityItem[];
}

export default function VisitorAnalyticsRecentStream({ recentActivity }: VisitorAnalyticsRecentStreamProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">REGISTRATIONS</div>
            <h3 className="text-sm font-black text-[#db011c] uppercase flex items-center gap-2 mb-4">
                New Registrations <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#db011c] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#db011c]"></span></span>
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 relative">
                <style dangerouslySetInnerHTML={{__html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 20px; }
                `}} />
                {recentActivity.map((act, i) => (
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
    );
}
