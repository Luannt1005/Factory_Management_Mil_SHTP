"use client";

import React from 'react';
import SHTPLandingPage from '@/components/SHTPLandingPage';

export default function AboutSHTP() {
    return (
        <div className="w-full h-full bg-white relative">
            {/* Floating PDF Export Button */}
            <button 
                onClick={() => window.print()}
                className="fixed bottom-8 right-8 z-[100] print:hidden bg-[#db011c] text-white p-4 rounded-full shadow-2xl hover:bg-red-800 transition-all flex items-center justify-center group"
                title="Export to PDF"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold pl-0 group-hover:pl-2">
                    Export PDF
                </span>
            </button>
            <SHTPLandingPage />
        </div>
    );
}
