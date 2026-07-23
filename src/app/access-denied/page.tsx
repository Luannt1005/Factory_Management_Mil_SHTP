"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function AccessDeniedContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const name = searchParams.get('name') || '';
    const username = searchParams.get('username') || '';

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded shadow-lg overflow-hidden w-full max-w-2xl mt-8 mb-8">
                {/* Header */}
                <div className="bg-[#cc2229] text-white p-8 flex flex-col items-center justify-center relative border-b-8 border-white">
                    <div className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5">
                        <span className="text-[10px]">🌐</span> Tiếng Việt
                    </div>
                    
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mt-2">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                            <span className="text-[#cc2229] text-3xl font-bold font-serif -mt-1">!</span>
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
                    <p className="text-white/90 text-sm font-medium">You do not have permission to access this system</p>
                    
                    {/* Triangle pointer */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-[#cc2229]"></div>
                </div>

                <div className="p-8 pt-10">
                    {/* Warning Box */}
                    <div className="bg-[#fceded] border-l-4 border-[#cc2229] p-5 mb-8">
                        <h3 className="text-[#cc2229] font-bold flex items-center gap-2 mb-3 text-[15px]">
                            <span className="text-[#cc2229] font-serif font-black text-lg">⚠️</span> Authentication Successful, Authorization Failed
                        </h3>
                        <p className="text-gray-700 text-sm mb-4">
                            Your Microsoft account has been authenticated successfully, but you are not registered as an authorized user in our system.
                        </p>
                        <p className="text-gray-700 text-sm mb-2">This could be because:</p>
                        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1.5 ml-1">
                            <li>Your account has not been added to the system</li>
                            <li>Your account has been deactivated</li>
                            <li>You do not have the necessary permissions</li>
                        </ul>
                    </div>

                    {/* User Info Fields */}
                    <div className="space-y-4 mb-8">
                        <div className="flex bg-gray-50 border border-gray-200 rounded overflow-hidden">
                            <div className="w-36 bg-gray-100 text-gray-500 text-[11px] font-bold px-4 py-3 flex items-center border-r border-gray-200 uppercase tracking-wider">
                                USERNAME:
                            </div>
                            <div className="flex-1 px-4 py-3 text-sm text-gray-700 font-medium">
                                {username}
                            </div>
                        </div>
                        <div className="flex bg-gray-50 border border-gray-200 rounded overflow-hidden">
                            <div className="w-36 bg-gray-100 text-gray-500 text-[11px] font-bold px-4 py-3 flex items-center border-r border-gray-200 uppercase tracking-wider">
                                EMAIL:
                            </div>
                            <div className="flex-1 px-4 py-3 text-sm text-gray-700 font-medium">
                                {email}
                            </div>
                        </div>
                        <div className="flex bg-gray-50 border border-gray-200 rounded overflow-hidden">
                            <div className="w-36 bg-gray-100 text-gray-500 text-[11px] font-bold px-4 py-3 flex items-center border-r border-gray-200 uppercase tracking-wider">
                                DISPLAY NAME:
                            </div>
                            <div className="flex-1 px-4 py-3 text-sm text-gray-700 font-medium">
                                {name}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <Link href="/login" className="bg-[#2d68c4] hover:bg-[#225199] text-white font-bold py-3 px-4 rounded text-center transition-colors text-sm flex items-center justify-center gap-2">
                            <span>🏠</span> Back to Login
                        </Link>
                        <a href="mailto:IdmcAuto.Svc@ttigroup.com.vn?subject=Access Request to TTI OrgChart System" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold py-3 px-4 rounded text-center transition-colors text-sm flex items-center justify-center gap-2">
                            <span>✉️</span> Contact IT Support
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 p-6 text-center">
                    <p className="text-sm text-gray-500 font-medium">Need Help?</p>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Please contact Helpdesk (VN-IT) at <a href="mailto:vnit.helpdesk@ttigroup.com.vn" className="font-bold hover:underline">vnit.helpdesk@ttigroup.com.vn</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AccessDeniedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>}>
            <AccessDeniedContent />
        </Suspense>
    );
}
