'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@/app/context/UserContext';
import { usePathname, useRouter } from 'next/navigation';
import {
    ShareIcon,
    UserGroupIcon,
    ChartBarSquareIcon,
    CloudArrowUpIcon,
    TableCellsIcon,
    PencilSquareIcon,
    Cog6ToothIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    UserIcon,
    TicketIcon,
    ClipboardDocumentListIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    KeyIcon,
    ArrowLeftOnRectangleIcon,
    GlobeAsiaAustraliaIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { preload } from 'swr';
import { swrFetcher } from '@/lib/api-client';

// API endpoints for prefetching
const API_ENDPOINTS: { [key: string]: string } = {
    '/dashboard': '/api/sheet',
    '/sheetmanager': '/api/sheet',
};

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { user, setUser } = useUser();
    const userRole = user?.role || null;

    interface NavItem {
        name: string;
        path: string;
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
        requiredRole?: string;
    }

    interface NavGroup {
        title: string;
        items: NavItem[];
    }

    // Determine the active section
    const isIntroduction = pathname.startsWith('/introduction');
    const isVisitorApp = pathname.startsWith('/visitorrequest') || pathname.startsWith('/visitordashboard') || pathname.startsWith('/visitoradmin') || pathname.startsWith('/visitoranalytics');
    const isOrgchart = pathname.startsWith('/orgchart') || pathname.startsWith('/dashboard') || pathname.startsWith('/customize') || pathname.startsWith('/sheetmanager') || pathname.startsWith('/headcount_open') || pathname.startsWith('/import_hr_data') || pathname.startsWith('/admin') || pathname.startsWith('/viewdata_org');

    const navGroups: NavGroup[] = [];

    if (isIntroduction) {
        navGroups.push({
            title: 'Introduction',
            items: [
                { name: 'About SHTP', path: '/introduction/about_shtp', icon: BuildingOfficeIcon },
                { name: 'About VN', path: '/introduction/about_vn', icon: GlobeAsiaAustraliaIcon },
                { name: 'Contact', path: '/introduction/contacts', icon: PhoneIcon },
            ]
        });
    } else if (isVisitorApp) {
        navGroups.push({
            title: 'Visitor Management',
            items: [
                { name: 'Registration', path: '/visitorrequest', icon: TicketIcon },
                { name: 'My Request', path: '/visitordashboard', icon: ClipboardDocumentListIcon },
                { name: 'Visitor Admin', path: '/visitoradmin', icon: Cog6ToothIcon, requiredRole: 'admin' }, // Visitor Admin handled in visibleItems filter
                { name: 'Manage Room', path: '/visitoradmin/rooms', icon: KeyIcon, requiredRole: 'admin' },
                { name: 'Visitor Dashboard', path: '/visitoranalytics', icon: ChartBarSquareIcon, requiredRole: 'admin' },
            ]
        });
    } else {
        // Default to Orgchart if none match, or if specifically in Orgchart
        navGroups.push(
            {
                title: 'Chart',
                items: [
                    { name: 'Org Chart', path: '/orgchart', icon: ShareIcon },
                    { name: 'Dashboard', path: '/dashboard', icon: ChartBarSquareIcon },
                    { name: 'Customize Chart', path: '/customize', icon: PencilSquareIcon },
                ]
            },
            {
                title: 'Management',
                items: [
                    { name: 'Headcount Management', path: '/sheetmanager', icon: TableCellsIcon },
                    { name: 'Headcount Open', path: '/headcount_open', icon: UserGroupIcon },
                    { name: 'Import Images', path: '/import_hr_data', icon: CloudArrowUpIcon },
                ]
            },
            {
                title: 'Admin',
                items: [
                    { name: 'Orgchart Admin', path: '/admin', icon: Cog6ToothIcon, requiredRole: 'admin' },
                ]
            }
        );
    }



    // Prefetch data when hovering over nav items
    const handleMouseEnter = useCallback((path: string) => {
        // Strip query params for API endpoints map lookup if needed,
        // but currently our map keys are simple paths.
        const cleanPath = path.split('?')[0];
        const apiEndpoint = API_ENDPOINTS[cleanPath];
        if (apiEndpoint) {
            preload(apiEndpoint, swrFetcher);
        }
        // Also prefetch the route
        router.prefetch(path);
    }, [router]);

    const handleLogout = () => {
        setUser(null);
        router.push('/login');
    };

    // Hide sidebar on auth pages, landing page, profile page, and system admin page
    if (['/', '/login', '/signup', '/profile', '/systemadmin'].includes(pathname)) {
        return null;
    }

    return (
        <>
        <div
            className={`
                relative flex flex-col h-full bg-gradient-to-b from-[#86010f] to-[#500000] text-white transition-all duration-300 ease-in-out shadow-2xl z-30 shrink-0
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}
        >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-1.5 text-white shadow-lg border border-white/20 transition-all z-50"
                >
                    {isCollapsed ? <ChevronRightIcon className="w-3 h-3" /> : <ChevronLeftIcon className="w-3 h-3" />}
                </button>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {navGroups.map((group, groupIndex) => {
                        // Filter items based on role
                        const visibleItems = group.items.filter(item => {
                            if (userRole === 'admin') return true;
                            
                            // Specific app roles
                            const orgchartRole = user?.orgchart_role;
                            const visitorRole = user?.visitor_role;

                            // Handle visitor admin paths
                            if (item.path.startsWith('/visitoradmin') || item.path.startsWith('/visitoranalytics')) {
                                return visitorRole === 'admin';
                            }

                            // Handle orgchart admin paths
                            if (item.path === '/admin') {
                                return orgchartRole === 'admin';
                            }

                            // Viewer logic for orgchart
                            if (orgchartRole === 'viewer' && !item.path.startsWith('/visitor')) {
                                const allowedPaths = ['/orgchart', '/dashboard', '/customize', '/profile'];
                                return allowedPaths.some(path => item.path.startsWith(path));
                            }

                            // Default (user) role or no specific requiredRole
                            return !item.requiredRole;
                        });

                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.title}>
                                {!isCollapsed && (
                                    <h3 className="px-4 mb-2 text-xs font-bold text-white/40 uppercase tracking-wider">
                                        {group.title}
                                    </h3>
                                )}
                                <div className="space-y-1.5">
                                    {visibleItems.map((item) => {
                                        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path.split('?')[0]));
                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                prefetch={true}
                                                onMouseEnter={() => handleMouseEnter(item.path)}
                                                className={`
                                flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                                ${isActive
                                                        ? 'bg-white/15 text-white shadow-inner font-semibold'
                                                        : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-[#000000]/20'}
                                ${isCollapsed ? 'justify-center' : ''}
                                `}
                                                title={isCollapsed ? item.name : ''}
                                            >
                                                {/* Active Indicator Line */}
                                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>}

                                                <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]' : 'group-hover:scale-110'}`} />
                                                {!isCollapsed && (
                                                    <span className={`ml-3 text-[14px] tracking-wide ${isActive ? 'text-white' : ''}`}>{item.name}</span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Actions (Logout) */}
                <div className="p-4 border-t border-white/10 shrink-0 bg-[#500000] z-10">
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                            text-white/70 hover:bg-red-500/20 hover:text-white hover:shadow-lg border border-transparent hover:border-red-500/30
                            ${isCollapsed ? 'justify-center p-3' : ''}
                        `}
                        title="Log out"
                    >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
                        {!isCollapsed && (
                            <span className="ml-3 text-[14px] font-medium tracking-wide">Log out</span>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}

