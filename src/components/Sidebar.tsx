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
    ChevronDownIcon,
    UserIcon,
    TicketIcon,
    ClipboardDocumentListIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    KeyIcon,
    ArrowLeftOnRectangleIcon,
    GlobeAsiaAustraliaIcon,
    IdentificationIcon
} from '@heroicons/react/24/outline';
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
    const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

    const { user, setUser } = useUser();
    const userRole = user?.role || null;

    interface NavItem {
        name: string;
        path: string;
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
        requiredRole?: string;
        children?: NavItem[];
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
            title: 'WORKSPACE',
            items: [
                { name: 'About SHTP', path: '/introduction/about_shtp', icon: BuildingOfficeIcon },
                { name: 'About VN', path: '/introduction/about_vn', icon: GlobeAsiaAustraliaIcon },
                { name: 'Contact', path: '/introduction/contacts', icon: PhoneIcon },
            ]
        });
    } else if (isVisitorApp) {
        navGroups.push({
            title: 'WORKSPACE',
            items: [
                { name: 'Registration', path: '/visitorrequest', icon: TicketIcon },
                { name: 'My Request', path: '/visitordashboard', icon: ClipboardDocumentListIcon },
                {
                    name: 'Visitor Control',
                    path: '#visitor_admin',
                    icon: Cog6ToothIcon,
                    children: [
                        { name: 'Check In/Out', path: '/visitoradmin/checkinout', icon: IdentificationIcon, requiredRole: 'admin' },
                        { name: 'Manage Room', path: '/visitoradmin/rooms', icon: KeyIcon, requiredRole: 'admin' },
                        { name: 'Visitor Analytics', path: '/visitoranalytics', icon: ChartBarSquareIcon, requiredRole: 'admin' },
                        { name: 'Admin Settings', path: '/visitoradmin', icon: Cog6ToothIcon, requiredRole: 'admin' },
                    ]
                },
            ]
        });
    } else {
        // Default to Orgchart
        navGroups.push(
            {
                title: 'WORKSPACE',
                items: [
                    { name: 'Org Chart', path: '/orgchart', icon: ShareIcon },
                    { name: 'Dashboard', path: '/dashboard', icon: ChartBarSquareIcon },
                    { name: 'Customize Chart', path: '/customize', icon: PencilSquareIcon },
                    {
                        name: 'Headcount',
                        path: '#headcount_management',
                        icon: TableCellsIcon,
                        children: [
                            { name: 'Manage Sheets', path: '/sheetmanager', icon: TableCellsIcon },
                            { name: 'Headcount Open', path: '/headcount_open', icon: UserGroupIcon },
                            { name: 'Import Images', path: '/import_hr_data', icon: CloudArrowUpIcon },
                        ]
                    }
                ]
            },
            {
                title: 'ADMIN',
                items: [
                    { name: 'Orgchart Admin', path: '/admin', icon: Cog6ToothIcon, requiredRole: 'admin' },
                ]
            }
        );
    }

    // Add Account section
    navGroups.push({
        title: 'ACCOUNT',
        items: [
            { name: 'My Profile', path: '/profile', icon: UserIcon },
            { name: 'Sign out', path: 'logout', icon: ArrowLeftOnRectangleIcon }
        ]
    });

    // Helper functions for checking active status
    const isItemActive = (item: NavItem) => {
        return pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path.split('?')[0]));
    };

    const isParentActive = (item: NavItem) => {
        if (pathname === item.path) return true;
        if (item.children) {
            return item.children.some(child => isItemActive(child));
        }
        return false;
    };

    const isParentExpanded = (item: NavItem) => {
        return expandedParents[item.name] !== false;
    };

    const toggleParent = (name: string) => {
        setExpandedParents(prev => ({
            ...prev,
            [name]: prev[name] === false ? true : false
        }));
    };

    // Prefetch data when hovering over nav items
    const handleMouseEnter = useCallback((path: string) => {
        const cleanPath = path.split('?')[0];
        const apiEndpoint = API_ENDPOINTS[cleanPath];
        if (apiEndpoint) {
            preload(apiEndpoint, swrFetcher);
        }
        router.prefetch(path);
    }, [router]);

    const handleLogout = () => {
        setUser(null);
        router.push('/login');
    };

    const checkRole = (itemPath: string, requiredRole?: string) => {
        if (userRole === 'admin') return true;
        
        const orgchartRole = user?.orgchart_role;
        const visitorRole = user?.visitor_role;

        // Handle visitor admin paths
        if (itemPath.startsWith('/visitoradmin') || itemPath.startsWith('/visitoranalytics')) {
            return visitorRole === 'admin';
        }

        // Handle orgchart admin paths
        if (itemPath === '/admin') {
            return orgchartRole === 'admin';
        }

        // Viewer logic for orgchart
        if (orgchartRole === 'viewer' && !itemPath.startsWith('/visitor')) {
            const allowedPaths = ['/orgchart', '/dashboard', '/customize', '/profile'];
            return allowedPaths.some(path => itemPath.startsWith(path));
        }

        // Default role check
        return !requiredRole;
    };

    // Flatten logic when collapsed so all sub-pages can be clicked directly
    const getRenderItems = (items: NavItem[]): NavItem[] => {
        if (!isCollapsed) return items;
        const flat: NavItem[] = [];
        items.forEach(item => {
            if (item.children) {
                flat.push(...item.children);
            } else {
                flat.push(item);
            }
        });
        return flat;
    };

    // Filter navigation groups by user roles
    const filteredNavGroups = navGroups.map(group => {
        const visibleItems = group.items.map(item => {
            if (item.children) {
                const visibleChildren = item.children.filter(child => checkRole(child.path, child.requiredRole));
                if (visibleChildren.length === 0) return null;
                return { ...item, children: visibleChildren };
            }
            return checkRole(item.path, item.requiredRole) ? item : null;
        }).filter((item): item is NavItem => item !== null);

        return { ...group, items: visibleItems };
    }).filter(group => group.items.length > 0);

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
                    className="absolute -right-3 top-8 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-1.5 text-white shadow-lg border border-white/20 transition-all z-50 cursor-pointer"
                >
                    {isCollapsed ? <ChevronRightIcon className="w-3 h-3" /> : <ChevronLeftIcon className="w-3 h-3" />}
                </button>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-8 px-3.5 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {filteredNavGroups.map((group, groupIndex) => {
                        const itemsToRender = getRenderItems(group.items);
                        if (itemsToRender.length === 0) return null;

                        return (
                            <div key={group.title} className={groupIndex > 0 ? 'pt-2' : ''}>
                                {!isCollapsed && (
                                    <h3 className="px-4 mb-2.5 text-[10px] font-bold text-white/40 uppercase tracking-widest block select-none">
                                        {group.title}
                                    </h3>
                                )}
                                <div className="space-y-1.5">
                                    {itemsToRender.map((item) => {
                                        // Case 1: Logout Item
                                        if (item.path === 'logout') {
                                            return (
                                                <button
                                                    key={item.path}
                                                    onClick={handleLogout}
                                                    className={`
                                                        w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden cursor-pointer
                                                        text-white/60 hover:bg-white/5 hover:text-white
                                                        ${isCollapsed ? 'justify-center' : ''}
                                                    `}
                                                    title={isCollapsed ? item.name : ''}
                                                >
                                                    <item.icon className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                                    {!isCollapsed && (
                                                        <span className="ml-3 text-[14px] tracking-wide">{item.name}</span>
                                                    )}
                                                </button>
                                            );
                                        }

                                        // Case 2: Expanded Group Parent Item
                                        if (!isCollapsed && item.children) {
                                            const isExpanded = isParentExpanded(item);
                                            const isActive = isParentActive(item);
                                            return (
                                                <div key={item.name} className="space-y-1">
                                                    <button
                                                        onClick={() => toggleParent(item.name)}
                                                        className={`
                                                            w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer
                                                            ${isActive
                                                                ? 'bg-white/10 text-white font-semibold shadow-inner'
                                                                : 'text-white/60 hover:bg-white/5 hover:text-white'}
                                                        `}
                                                    >
                                                        <div className="flex items-center">
                                                            <item.icon className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                                            <span className="ml-3 text-[14px] tracking-wide">{item.name}</span>
                                                        </div>
                                                        <ChevronDownIcon 
                                                            className={`w-4 h-4 text-white/40 group-hover:text-white transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                                        />
                                                    </button>
                                                    
                                                    {isExpanded && (
                                                        <div className="ml-6 pl-4 border-l border-white/10 space-y-1 mt-1">
                                                            {item.children.map((child) => {
                                                                const isChildActive = isItemActive(child);
                                                                return (
                                                                    <Link
                                                                        key={child.path}
                                                                        href={child.path}
                                                                        prefetch={true}
                                                                        onMouseEnter={() => handleMouseEnter(child.path)}
                                                                        className={`
                                                                            flex items-center px-4 py-2 rounded-lg transition-all duration-200 group relative
                                                                            ${isChildActive
                                                                                ? 'bg-white/10 text-white font-semibold'
                                                                                : 'text-white/60 hover:bg-white/5 hover:text-white'}
                                                                        `}
                                                                    >
                                                                        <child.icon className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                                                        <span className="ml-3 text-[13px] tracking-wide">{child.name}</span>
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // Case 3: Regular Item
                                        const isActive = isItemActive(item);
                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                prefetch={true}
                                                onMouseEnter={() => handleMouseEnter(item.path)}
                                                className={`
                                                    flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                                                    ${isActive
                                                        ? 'bg-white/10 text-white font-semibold shadow-inner'
                                                        : 'text-white/60 hover:bg-white/5 hover:text-white'}
                                                    ${isCollapsed ? 'justify-center' : ''}
                                                `}
                                                title={isCollapsed ? item.name : ''}
                                            >
                                                <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                                {!isCollapsed && (
                                                    <span className="ml-3 text-[14px] tracking-wide">{item.name}</span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
