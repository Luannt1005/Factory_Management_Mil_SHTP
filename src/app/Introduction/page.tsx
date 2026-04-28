'use client';

import Link from 'next/link';
import { BuildingOfficeIcon, GlobeAsiaAustraliaIcon, PhoneIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function IntroductionPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-12 py-8">
            <header className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-title tracking-tight">
                    Welcome to <span className="text-[#db011c]">Milwaukee Introduction</span>
                </h1>
                <p className="text-lg text-muted max-w-2xl mx-auto italic">
                    Learn about our operations in SHTP, discover our presence in Vietnam, and find the right contact.
                </p>
            </header>

            <div className="grid md:grid-cols-3 gap-8 px-4">
                {/* About SHTP */}
                <Link href="/Introduction/about_shtp" className="group">
                    <div className="h-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-[#db011c]/10 hover:-translate-y-2 relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#db011c]/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                        
                        <div className="bg-[#db011c]/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shrink-0">
                            <BuildingOfficeIcon className="w-8 h-8 text-[#db011c]" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-title mb-4">About SHTP</h2>
                        <p className="text-muted leading-relaxed mb-6 flex-grow">
                            General information about the Saigon Hi-Tech Park facility and details of the visitor process.
                        </p>
                        
                        <div className="flex items-center text-[#db011c] font-bold gap-2 group-hover:gap-4 transition-all">
                            Learn more <ArrowRightIcon className="w-5 h-5" />
                        </div>
                    </div>
                </Link>

                {/* About VN */}
                <Link href="/Introduction/about_vn" className="group">
                    <div className="h-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-[#db011c]/10 hover:-translate-y-2 relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#db011c]/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                        
                        <div className="bg-[#db011c]/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shrink-0">
                            <GlobeAsiaAustraliaIcon className="w-8 h-8 text-[#db011c]" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-title mb-4">About Vietnam</h2>
                        <p className="text-muted leading-relaxed mb-6 flex-grow">
                            Discover Milwaukee Tool's history, footprint, and growth strategy within Vietnam.
                        </p>
                        
                        <div className="flex items-center text-[#db011c] font-bold gap-2 group-hover:gap-4 transition-all">
                            Explore Vietnam <ArrowRightIcon className="w-5 h-5" />
                        </div>
                    </div>
                </Link>

                {/* Contact */}
                <Link href="/Introduction/contacts" className="group">
                    <div className="h-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-[#db011c]/10 hover:-translate-y-2 relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#db011c]/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                        
                        <div className="bg-[#db011c]/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shrink-0">
                            <PhoneIcon className="w-8 h-8 text-[#db011c]" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-title mb-4">Contact</h2>
                        <p className="text-muted leading-relaxed mb-6 flex-grow">
                            Find the right person to contact for visitor inquiries, technical support, or facility management.
                        </p>
                        
                        <div className="flex items-center text-[#db011c] font-bold gap-2 group-hover:gap-4 transition-all">
                            View Contacts <ArrowRightIcon className="w-5 h-5" />
                        </div>
                    </div>
                </Link>
            </div>

            <section className="bg-gradient-to-br from-[#db011c] to-[#900112] rounded-3xl p-12 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10">
                    <BuildingOfficeIcon className="w-64 h-64" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl font-bold mb-4">Facility Overview</h2>
                    <p className="text-white/80 text-lg leading-relaxed mb-8">
                        Milwaukee Tool is a global leader in delivering innovative solutions to the professional construction trades. Our SHTP facility is a hub of excellence in manufacturing and technology.
                    </p>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-4xl font-black mb-1">5+</p>
                            <p className="text-white/60 text-sm uppercase tracking-widest">Core Divisions</p>
                        </div>
                        <div>
                            <p className="text-4xl font-black mb-1">24/7</p>
                            <p className="text-white/60 text-sm uppercase tracking-widest">Support Coverage</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
