"use client";

import { usePathname } from "next/navigation";

export default function PageHeader() {
    const pathname = usePathname();

    const pageTitles: Record<string, { title: string; subtitle?: string }> = {
        '/Dashboard': {
            title: 'HR Dashboard',
            subtitle: 'Organization metrics overview'
        },
        '/Introduction': {
            title: 'Welcome to TTI',
            subtitle: 'Overview and general information'
        },
        '/Introduction/departments': {
            title: 'Departments',
            subtitle: 'Detailed information about our units'
        },
        '/Introduction/contacts': {
            title: 'Contact Persons',
            subtitle: 'Key contacts across the organization'
        },
        '/VisitorRequest': {
            title: 'Visitor Request',
            subtitle: 'Register and manage visitor appointments'
        },
        '/VisitorDashboard': {
            title: 'My Requests',
            subtitle: 'Track your visitor registration status'
        },
        '/Orgchart': {
            title: 'Organization Charts',
            subtitle: 'Visual representation of hierarchy'
        },
        '/Customize': {
            title: 'Chart Customization',
            subtitle: 'Edit and manage organization profiles'
        },
        '/SheetManager': {
            title: 'Headcount Management',
            subtitle: 'Track and manage staff details'
        },
        '/Headcount_open': {
            title: 'Headcount Open',
            subtitle: 'View and manage open positions'
        },
        '/Import_HR_Data': {
            title: 'Data Integration',
            subtitle: 'Upload and sync employee information'
        },
        '/Admin': {
            title: 'Admin Console',
            subtitle: 'System configuration and user management'
        },
        '/VisitorAdmin': {
            title: 'Visitor Management Admin',
            subtitle: 'Overall management of visitor requests and factory access'
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
