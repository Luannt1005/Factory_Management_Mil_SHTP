'use client';

import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ContactsPage() {
    const contacts = [
        {
            category: 'Lobby & Reception',
            members: [
                { name: 'Front Desk Team', role: 'Visitor Check-in', phone: '(555) 012-3456', email: 'lobby@milwaukeetool.com', location: 'Main Lobby' }
            ]
        },
        {
            category: 'IT Support',
            members: [
                { name: 'Help Desk', role: 'Technical Issues', phone: '(555) 987-6543', email: 'it.support@milwaukeetool.com', location: 'Office Bldg A' }
            ]
        },
        {
            category: 'Security & Facilities',
            members: [
                { name: 'Security Control', role: 'Emergency & Access', phone: '(555) 111-2222', email: 'security@milwaukeetool.com', location: 'Gate 1' }
            ]
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 py-8 px-4">
            <div className="flex items-center gap-4">
                <Link href="/Introduction" className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-muted" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-title">Contact Persons</h1>
                    <p className="text-muted">Get in touch with the right team for assistance</p>
                </div>
            </div>

            <div className="space-y-10">
                {contacts.map((group) => (
                    <div key={group.category} className="space-y-6">
                        <h2 className="text-xl font-bold text-[#db011c] uppercase tracking-widest">{group.category}</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {group.members.map((member) => (
                                <div key={member.name} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="text-lg font-bold text-title mb-1">{member.name}</h3>
                                    <p className="text-sm text-muted mb-4">{member.role}</p>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-body">
                                            <PhoneIcon className="w-4 h-4 text-[#db011c]" />
                                            <span>{member.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-body">
                                            <EnvelopeIcon className="w-4 h-4 text-[#db011c]" />
                                            <span>{member.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-body">
                                            <MapPinIcon className="w-4 h-4 text-[#db011c]" />
                                            <span>{member.location}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <section className="bg-gray-50 dark:bg-white/5 border border-[var(--color-border)] rounded-3xl p-10 text-center">
                <h2 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h2>
                <p className="text-muted mb-8 max-w-xl mx-auto">
                    If you are unsure who to contact, please call our main facility line and we will direct your call to the appropriate department.
                </p>
                <div className="inline-flex items-center gap-3 bg-white dark:bg-white/10 px-8 py-4 rounded-full border border-[var(--color-border)] shadow-sm font-bold text-xl">
                    <PhoneIcon className="w-6 h-6 text-[#db011c]" />
                    (555) 000-0000
                </div>
            </section>
        </div>
    );
}
