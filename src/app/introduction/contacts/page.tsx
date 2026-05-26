'use client';

import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ContactsPage() {
    // Operations Support Team data
    const operationsShtp = [
        { name: 'Winnie Nguyen Phuong Thuy', role: 'MFG/SCM', email: 'phuongthuy.nguyen@ttigroup.com.vn', gradient: 'from-[#db011c]/80 to-[#ff4d64]/80' },
        { name: 'Prudence Le Nguyen Kim Anh', role: 'ENG(NPD/VE/PSE/TestLab)', email: 'nguyenkimanh.le@ttigroup.com.vn', gradient: 'from-blue-600/80 to-cyan-500/80' },
        { name: 'Phoebe Vong My Phung', role: 'ENG(EE/MT)', email: 'myphung.vong@ttigroup.com.vn', gradient: 'from-purple-600/80 to-pink-500/80' },
        { name: 'Shally Le Thi Xuan Mai', role: 'QM', email: 'thixuanmai.le@ttigroup.com.vn', gradient: 'from-emerald-600/80 to-teal-500/80' },
        { name: 'Le Yen Nhi', role: 'AME/Auto/Opex', email: 'yennhi.le@ttigroup.com.vn', gradient: 'from-amber-600/80 to-orange-500/80' },
        { name: 'Sabrina Nguyen Hoang Kieu Nhi', role: 'OPM', email: 'nhi.nguyen1@ttigroup.com.vn', gradient: 'from-indigo-600/80 to-blue-500/80' },
        { name: 'Ellie Doan Quynh Ninh', role: 'IE/FMU/MIF', email: 'quynhninh.doan@ttigroup.com.vn', gradient: 'from-rose-600/80 to-pink-500/80' }
    ];

    const operationsDdk = [
        { name: 'Cindy Tran Hue Uyen', role: 'DDK site Support', email: 'hueuyen.tran@ttigroup.com.vn', gradient: 'from-teal-600/80 to-emerald-500/80' }
    ];

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            // Take the first letter of first part and first letter of last part
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="w-full min-h-screen bg-[var(--color-bg-page)] text-gray-900 font-sans pb-32 px-4 md:px-8 space-y-12 overflow-y-auto">
            
            {/* 1. Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 md:p-12 shadow-sm mt-4">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-tr from-[#db011c] to-red-500 opacity-20 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
                
                <Link href="/introduction" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white mb-6 transition-colors group">
                    <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Introduction
                </Link>
                
                <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
                    Contact <span className="text-[#db011c]">Directory</span>
                </h1>
                <p className="text-white/60 text-xs md:text-sm mt-2 max-w-xl font-light">
                    Reach out to reception desks, EHS teams, and operations support leads across TTI Vietnam sites.
                </p>
            </div>

            {/* 2. Hotlines & Reception (SHTP Reception & EHS Team) */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Reception Card */}
                <div className="bg-white/40 backdrop-blur-md border border-gray-200/40 dark:bg-white/5 dark:border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <PhoneIcon className="w-6 h-6 text-[#db011c]" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <span className="text-[10px] text-[#db011c] font-black uppercase tracking-wider bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded">Front Office</span>
                            <h2 className="text-xl font-black text-gray-900 mt-2">SHTP Reception Desk</h2>
                            <p className="text-xs text-gray-500 mt-1 font-light">Assistance for visitors, access badging, and general inquiries at SHTP.</p>
                        </div>
                        <div className="space-y-2 border-t border-gray-200/50 pt-4">
                            <a href="tel:+8402873088869" className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-[#db011c] transition-colors">
                                <PhoneIcon className="w-4 h-4 text-[#db011c] flex-shrink-0" />
                                <span>(+84) 0287 3088 869 <span className="text-gray-400 font-normal text-xs">(Ext: 66797)</span></span>
                            </a>
                            <a href="mailto:MILVNSHTPReception@ttigroup.com.vn" className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-[#db011c] transition-colors">
                                <EnvelopeIcon className="w-4 h-4 text-[#db011c] flex-shrink-0" />
                                <span className="truncate">MILVNSHTPReception@ttigroup.com.vn</span>
                            </a>
                            <a href="https://teams.microsoft.com/l/chat/0/0?users=MILVNSHTPReception@ttigroup.com.vn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-[#464eb8] transition-colors group/teams">
                                <div className="w-4 h-4 rounded-sm bg-[#464eb8] flex items-center justify-center text-white text-[10px] font-black leading-none flex-shrink-0">
                                    T
                                </div>
                                <span className="group-hover/teams:underline">Chat on MS Teams</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* EHS Team Card */}
                <div className="bg-white/40 backdrop-blur-md border border-gray-200/40 dark:bg-white/5 dark:border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded">Safety & Environment</span>
                            <h2 className="text-xl font-black text-gray-900 mt-2">EHS Team</h2>
                            <p className="text-xs text-gray-500 mt-1 font-light">Environment, health, safety reporting, workplace hazard concerns, and compliance.</p>
                        </div>
                        <div className="space-y-2 border-t border-gray-200/50 pt-4">
                            <a href="tel:0961958951" className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors">
                                <PhoneIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span>0961 958 951</span>
                            </a>
                            <a href="mailto:TTIVNMILPTEHS@ttigroup.com.vn" className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors">
                                <EnvelopeIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">TTIVNMILPTEHS@ttigroup.com.vn</span>
                            </a>
                            <a href="https://teams.microsoft.com/l/chat/0/0?users=TTIVNMILPTEHS@ttigroup.com.vn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-[#464eb8] transition-colors group/teams">
                                <div className="w-4 h-4 rounded-sm bg-[#464eb8] flex items-center justify-center text-white text-[10px] font-black leading-none flex-shrink-0">
                                    T
                                </div>
                                <span className="group-hover/teams:underline">Chat on MS Teams</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Operations Support Team */}
            <div className="space-y-6">
                <div className="border-l-4 border-[#db011c] pl-4">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Operations Support Team</h2>
                    <p className="text-xs text-gray-500">Contact points for MFG, ENG, SCM, QM, and operations management by site.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* SHTP Site Column */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-white/10">
                            <span className="w-2 h-2 rounded-full bg-[#db011c]" />
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wider">SHTP Site</h3>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {operationsShtp.map((member) => (
                                <div key={member.name} className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-gray-200/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-sm transition-all duration-300 group">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${member.gradient} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                                        {getInitials(member.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] text-[#db011c] font-black uppercase tracking-wider block leading-none">{member.role}</span>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1.5 truncate group-hover:text-[#db011c] transition-colors">{member.name}</h4>
                                        
                                        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                            <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#db011c] transition-colors">
                                                <EnvelopeIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                                <span className="truncate text-xs">{member.email}</span>
                                            </a>
                                            <a href={`https://teams.microsoft.com/l/chat/0/0?users=${member.email}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#464eb8] transition-colors group/teams">
                                                <div className="w-3.5 h-3.5 rounded-sm bg-[#464eb8]/80 dark:bg-[#464eb8] flex items-center justify-center text-white text-[9px] font-black leading-none group-hover/teams:bg-[#464eb8] transition-colors flex-shrink-0">
                                                    T
                                                </div>
                                                <span className="group-hover/teams:underline">Chat on Teams</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DDK Site Column */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-white/10">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wider">DDK Site</h3>
                        </div>
                        <div>
                            {operationsDdk.map((member) => (
                                <div key={member.name} className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-gray-200/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-sm transition-all duration-300 group">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${member.gradient} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                                        {getInitials(member.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] text-amber-600 font-black uppercase tracking-wider block leading-none">{member.role}</span>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1.5 truncate group-hover:text-amber-600 transition-colors">{member.name}</h4>
                                        
                                        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                            <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#db011c] transition-colors">
                                                <EnvelopeIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                                <span className="truncate text-xs">{member.email}</span>
                                            </a>
                                            <a href={`https://teams.microsoft.com/l/chat/0/0?users=${member.email}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#464eb8] transition-colors group/teams">
                                                <div className="w-3.5 h-3.5 rounded-sm bg-[#464eb8]/80 dark:bg-[#464eb8] flex items-center justify-center text-white text-[9px] font-black leading-none group-hover/teams:bg-[#464eb8] transition-colors flex-shrink-0">
                                                    T
                                                </div>
                                                <span className="group-hover/teams:underline">Chat on Teams</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Footer Help Section */}
            <section className="bg-gray-900 text-white rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-sm">
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-[#db011c] to-red-600 opacity-10 blur-2xl rounded-full pointer-events-none -mb-16 -mr-16" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left space-y-2">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Need further assistance?</h2>
                        <p className="text-white/60 text-xs md:text-sm max-w-xl font-light">
                            If you are unsure which support lead to contact, please get in touch with our main SHTP Reception desk. We will route your inquiry to the correct department.
                        </p>
                    </div>
                    <a href="tel:+8402873088869" className="inline-flex items-center gap-3 bg-white text-gray-900 px-6 py-3.5 rounded-full hover:bg-gray-100 transition-all font-extrabold text-base shadow-md hover:scale-105 active:scale-100">
                        <PhoneIcon className="w-5 h-5 text-[#db011c]" />
                        Call SHTP Reception
                    </a>
                </div>
            </section>

        </div>
    );
}
