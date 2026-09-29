'use client';

import React from 'react';
import type { VisitorDashboardTab } from '@/types/visitor-dashboard.types';

export interface VisitorDashboardTabsProps {
    activeTab: VisitorDashboardTab;
    isSecurity: boolean;
    canAccessInterviewee: boolean;
    onTabChange: (tab: VisitorDashboardTab) => void;
}

export function VisitorDashboardTabs({
    activeTab,
    isSecurity,
    canAccessInterviewee,
    onTabChange,
}: VisitorDashboardTabsProps) {
    return (
        <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200 shadow-sm w-fit">
            {!isSecurity && (
                <button
                    onClick={() => onTabChange('general')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'general'
                            ? 'bg-white text-[#db011c] shadow-sm ring-1 ring-gray-200/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                    }`}
                >
                    General Visitors
                </button>
            )}
            <button
                onClick={() => {
                    if (!canAccessInterviewee) {
                        alert('You need Hr Visitor or Security role to view Interviewee requests.');
                        return;
                    }
                    onTabChange('interviewee');
                }}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'interviewee'
                        ? 'bg-white text-[#db011c] shadow-sm ring-1 ring-gray-200/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                } ${!canAccessInterviewee ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-500' : ''}`}
            >
                Interviewee
            </button>
        </div>
    );
}
