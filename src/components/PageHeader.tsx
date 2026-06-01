"use client";

import { usePathname } from "next/navigation";

export default function PageHeader() {
    const pathname = usePathname();

    if (
        pathname === "/introduction/about_vn" ||
        pathname === "/introduction/about_shtp" ||
        pathname === "/introduction/contacts"
    ) {
        return null;
    }

    const pageTitles: Record<string, { title: string; subtitle?: string }> = {
        '/dashboard': {
            title: 'HR Dashboard',
            subtitle: 'Organization metrics overview'
        },
        '/introduction': {
            title: 'Welcome to TTI',
            subtitle: 'Overview and general information'
        },
        '/introduction/departments': {
            title: 'Departments',
            subtitle: 'Detailed information about our units'
        },
        '/introduction/contacts': {
            title: 'Contact Persons',
            subtitle: 'Key contacts across the organization'
        },
        '/visitorrequest': {
            title: 'Visitor Request',
            subtitle: 'Register and manage visitor appointments'
        },
        '/visitordashboard': {
            title: 'My Requests',
            subtitle: 'Track your visitor registration status'
        },
        '/orgchart': {
            title: 'Organization Charts',
            subtitle: 'Visual representation of hierarchy'
        },
        '/customize': {
            title: 'Chart Customization',
            subtitle: 'Edit and manage organization profiles'
        },
        '/sheetmanager': {
            title: 'Headcount Management',
            subtitle: 'Track and manage staff details'
        },
        '/headcount_open': {
            title: 'Headcount Open',
            subtitle: 'View and manage open positions'
        },
        '/import_hr_data': {
            title: 'Data Integration',
            subtitle: 'Upload and sync employee information'
        },
        '/admin': {
            title: 'Admin Console',
            subtitle: 'System configuration and user management'
        },
        '/visitoradmin': {
            title: 'Visitor Management Admin',
            subtitle: 'Overall management of visitor requests and factory access'
        },
        '/visitoradmin/checkinout': {
            title: 'Check-In / Check-Out Management',
            subtitle: 'Manage visitor security logs and check-in status'
        },
        '/profile': {
            title: 'Account Settings',
            subtitle: 'Manage your profile and preferences'
        }
    };

    // Find the best matching title (either exact or prefix)
    const findTitle = () => {
        if (pageTitles[pathname]) return pageTitles[pathname];
        
        // Try to find the longest matching prefix
        const paths = Object.keys(pageTitles).sort((a, b) => b.length - a.length);
        for (const path of paths) {
            if (pathname.startsWith(path)) return pageTitles[path];
        }
        return null;
    };

    const currentPage = findTitle();

    if (!currentPage) return null;

    return (
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-x-3 border-b border-gray-100 dark:border-white/5 pb-1.5">
            <h1 className="text-base md:text-lg font-black text-title tracking-tighter uppercase leading-none">
                {currentPage.title}
            </h1>
            {currentPage.subtitle && (
                <span className="text-[10px] text-[#db011c] font-black uppercase tracking-tight opacity-70 hidden md:inline py-0.5 px-2 bg-red-50 dark:bg-red-500/10 rounded">
                    {currentPage.subtitle}
                </span>
            )}
        </div>
    );
}
