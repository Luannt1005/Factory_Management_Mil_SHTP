'use client';
 
import { PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
 
export default function ContactsPage() {
    // Operations Support Team data
    const operationsShtp = [
        { name: 'Winnie Nguyen Phuong Thuy', role: 'MFG/SCM', email: 'phuongthuy.nguyen@ttigroup.com.vn' },
        { name: 'Prudence Le Nguyen Kim Anh', role: 'ENG(NPD/VE/PSE/TestLab)', email: 'nguyenkimanh.le@ttigroup.com.vn' },
        { name: 'Phoebe Vong My Phung', role: 'ENG(EE/MT)', email: 'myphung.vong@ttigroup.com.vn' },
        { name: 'Shally Le Thi Xuan Mai', role: 'QM', email: 'thixuanmai.le@ttigroup.com.vn' },
        { name: 'Le Yen Nhi', role: 'AME/Auto/Opex', email: 'yennhi.le@ttigroup.com.vn' },
        { name: 'Sabrina Nguyen Hoang Kieu Nhi', role: 'OPM', email: 'nhi.nguyen1@ttigroup.com.vn' },
        { name: 'Ellie Doan Quynh Ninh', role: 'IE/FMU/MIF', email: 'quynhninh.doan@ttigroup.com.vn' }
    ];
 
    const operationsDdk = [
        { name: 'Cindy Tran Hue Uyen', role: 'DDK site Support', email: 'hueuyen.tran@ttigroup.com.vn' }
    ];
 
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };
 
    return (
        <div className="w-full min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-body)] font-sans pb-32 px-4 md:px-8 space-y-12">
            
            {/* 1. Header Banner */}
            <div className="border-b border-[var(--color-border)] pb-8 mt-6">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-title)] uppercase">
                    Contact <span className="text-[#db011c]">Directory</span>
                </h1>
                <p className="text-[var(--color-text-muted)] text-sm md:text-base mt-2 max-w-2xl font-light">
                    Reach out to reception desks, EHS teams, and operations support leads across TTI Vietnam sites.
                </p>
            </div>
 
            {/* 2. Hotlines & Reception (SHTP Reception & EHS Team) */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Reception Card */}
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-page)] flex items-center justify-center flex-shrink-0 group-hover:bg-[#db011c]/10 transition-colors">
                        <PhoneIcon className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[#db011c] transition-colors" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <span className="text-[10px] text-[#db011c] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded">Front Office</span>
                            <h2 className="text-xl font-bold text-[var(--color-text-title)] mt-2">SHTP Reception Desk</h2>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1 font-light">Assistance for visitors, access badging, and general inquiries at SHTP.</p>
                        </div>
                        <div className="space-y-2 border-t border-[var(--color-border-light)] pt-4">
                            <a href="tel:+8402873088869" className="flex items-center gap-3 text-sm text-[var(--color-text-body)] hover:text-[#db011c] transition-colors">
                                <PhoneIcon className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0" />
                                <span className="font-medium">(+84) 0287 3088 869 <span className="text-[var(--color-text-light)] font-normal text-xs">(Ext: 66797)</span></span>
                            </a>
                            <a href="mailto:MILVNSHTPReception@ttigroup.com.vn" className="flex items-center gap-3 text-sm text-[var(--color-text-body)] hover:text-[#db011c] transition-colors">
                                <EnvelopeIcon className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0" />
                                <span className="truncate font-medium">MILVNSHTPReception@ttigroup.com.vn</span>
                            </a>
                            <a href="https://teams.microsoft.com/l/chat/0/0?users=MILVNSHTPReception@ttigroup.com.vn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-[var(--color-text-body)] hover:text-[#464eb8] transition-colors group/teams">
                                <div className="w-4 h-4 rounded bg-[#464eb8] flex items-center justify-center text-white text-[10px] font-bold leading-none flex-shrink-0">
                                    T
                                </div>
                                <span className="group-hover/teams:underline font-medium">Chat on MS Teams</span>
                            </a>
                        </div>
                    </div>
                </div>
 
                {/* EHS Team Card */}
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-page)] flex items-center justify-center flex-shrink-0 group-hover:bg-[#db011c]/10 transition-colors">
                        <svg className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[#db011c] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <span className="text-[10px] text-[#db011c] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded">Safety & Environment</span>
                            <h2 className="text-xl font-bold text-[var(--color-text-title)] mt-2">EHS Team</h2>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1 font-light">Environment, health, safety reporting, workplace hazard concerns, and compliance.</p>
                        </div>
                        <div className="space-y-2 border-t border-[var(--color-border-light)] pt-4">
                            <a href="tel:0961958951" className="flex items-center gap-3 text-sm text-[var(--color-text-body)] hover:text-[#db011c] transition-colors">
                                <PhoneIcon className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0" />
                                <span className="font-medium">0961 958 951</span>
                            </a>
                            <a href="mailto:TTIVNMILPTEHS@ttigroup.com.vn" className="flex items-center gap-3 text-sm text-[var(--color-text-body)] hover:text-[#db011c] transition-colors">
                                <EnvelopeIcon className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0" />
                                <span className="truncate font-medium">TTIVNMILPTEHS@ttigroup.com.vn</span>
                            </a>
                            <a href="https://teams.microsoft.com/l/chat/0/0?users=TTIVNMILPTEHS@ttigroup.com.vn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-[var(--color-text-body)] hover:text-[#464eb8] transition-colors group/teams">
                                <div className="w-4 h-4 rounded bg-[#464eb8] flex items-center justify-center text-white text-[10px] font-bold leading-none flex-shrink-0">
                                    T
                                </div>
                                <span className="group-hover/teams:underline font-medium">Chat on MS Teams</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
 
            {/* 3. Operations Support Team */}
            <div className="space-y-6">
                <div className="border-l-4 border-[#db011c] pl-4">
                    <h2 className="text-2xl font-bold text-[var(--color-text-title)] uppercase tracking-tight">Operations Support Team</h2>
                    <p className="text-xs text-[var(--color-text-muted)]">Contact points for MFG, ENG, SCM, QM, and operations management by site.</p>
                </div>
 
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* SHTP Site Column */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                            <span className="w-2 h-2 rounded-full bg-[#db011c]" />
                            <h3 className="font-bold text-[var(--color-text-body)] text-xs uppercase tracking-wider">SHTP Site</h3>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {operationsShtp.map((member) => (
                                <div key={member.name} className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:bg-[var(--color-bg-page)] transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/20 text-[#db011c] dark:text-[#ff4d64] flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm">
                                        {getInitials(member.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] text-[#db011c] font-bold uppercase tracking-wider block leading-none">{member.role}</span>
                                        <h4 className="text-sm font-bold text-[var(--color-text-title)] mt-1.5 truncate group-hover:text-[#db011c] transition-colors">{member.name}</h4>
                                        
                                        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-[var(--color-border-light)]">
                                            <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-[var(--color-text-body)] hover:text-[#db011c] transition-colors">
                                                <EnvelopeIcon className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-text-light)]" />
                                                <span className="truncate text-xs font-medium">{member.email}</span>
                                            </a>
                                            <a href={`https://teams.microsoft.com/l/chat/0/0?users=${member.email}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[var(--color-text-body)] hover:text-[#464eb8] transition-colors group/teams">
                                                <div className="w-3.5 h-3.5 rounded bg-[#464eb8] flex items-center justify-center text-white text-[9px] font-bold leading-none flex-shrink-0">
                                                    T
                                                </div>
                                                <span className="group-hover/teams:underline font-medium">Chat on Teams</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
 
                    {/* DDK Site Column */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <h3 className="font-bold text-[var(--color-text-body)] text-xs uppercase tracking-wider">DDK Site</h3>
                        </div>
                        <div>
                            {operationsDdk.map((member) => (
                                <div key={member.name} className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:bg-[var(--color-bg-page)] transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm">
                                        {getInitials(member.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider block leading-none">{member.role}</span>
                                        <h4 className="text-sm font-bold text-[var(--color-text-title)] mt-1.5 truncate group-hover:text-amber-600 transition-colors">{member.name}</h4>
                                        
                                        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-[var(--color-border-light)]">
                                            <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-[var(--color-text-body)] hover:text-amber-600 transition-colors">
                                                <EnvelopeIcon className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-text-light)]" />
                                                <span className="truncate text-xs font-medium">{member.email}</span>
                                            </a>
                                            <a href={`https://teams.microsoft.com/l/chat/0/0?users=${member.email}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[var(--color-text-body)] hover:text-[#464eb8] transition-colors group/teams">
                                                <div className="w-3.5 h-3.5 rounded bg-[#464eb8] flex items-center justify-center text-white text-[9px] font-bold leading-none flex-shrink-0">
                                                    T
                                                </div>
                                                <span className="group-hover/teams:underline font-medium">Chat on Teams</span>
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
            <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 md:p-10 relative overflow-hidden shadow-sm">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left space-y-2">
                        <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-[var(--color-text-title)]">Need further assistance?</h2>
                        <p className="text-[var(--color-text-muted)] text-xs md:text-sm max-w-xl font-light">
                            If you are unsure which support lead to contact, please get in touch with our main SHTP Reception desk. We will route your inquiry to the correct department.
                        </p>
                    </div>
                    <a href="tel:+8402873088869" className="inline-flex items-center gap-3 bg-[var(--color-bg-page)] border border-[var(--color-border)] text-[var(--color-text-title)] px-6 py-3 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all font-bold text-sm shadow-md hover:scale-105 active:scale-100 shrink-0">
                        <PhoneIcon className="w-4 h-4 text-[#db011c]" />
                        Call SHTP Reception
                    </a>
                </div>
            </section>
 
        </div>
    );
}
