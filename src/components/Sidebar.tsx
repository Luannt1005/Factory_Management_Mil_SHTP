"use client";

import { useState, useCallback, Fragment } from "react";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";
import { useNavigation } from "@/app/context/NavigationContext";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { preload } from "swr";
import { swrFetcher } from "@/lib/api-client";

// API endpoints for prefetching
const API_ENDPOINTS: { [key: string]: string } = {
  "/dashboard": "/api/sheet",
  "/sheetmanager": "/api/sheet",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const { user } = useUser();
  const { isMobileNavOpen, closeMobileNav } = useNavigation();
  const userRole = user?.role || null;

  interface NavItem {
    name: string;
    path: string;
    requiredRole?: string;
    children?: NavItem[];
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  // Unified Navigation Groups
  const navGroups: NavGroup[] = [
    {
      title: "INTRODUCTION",
      items: [
        { name: "About Factory", path: "/introduction/about_shtp" },
        { name: "About Vietnam", path: "/introduction/about_vn" },
        { name: "Contact", path: "/introduction/contacts" },
      ],
    },
    {
      title: "VISITOR MANAGEMENT",
      items: [
        { name: "Registration", path: "/visitorrequest" },
        { name: "My Requests", path: "/visitordashboard" },
      ],
    },
    {
      title: "VISITOR CONTROL",
      items: [
        { name: "Check In / Out", path: "/visitoradmin/checkinout", requiredRole: "admin" },
        { name: "Manage Room", path: "/visitoradmin/rooms", requiredRole: "admin" },
        { name: "Admin Settings", path: "/visitoradmin", requiredRole: "admin" },
        { name: "Dashboard", path: "/visitoranalytics", requiredRole: "admin" },
      ],
    },
    {
      title: "ORGCHART",
      items: [
        { name: "Org Chart", path: "/orgchart" },
        { name: "Headcount Dashboard", path: "/dashboard" },
        { name: "Customize Chart", path: "/customize" },
        {
          name: "Management",
          path: "#management",
          children: [
            { name: "Manage Sheets", path: "/sheetmanager" },
            { name: "Headcount Open", path: "/headcount_open" },
            { name: "Import Images", path: "/import_hr_data" },
            { name: "Orgchart Admin", path: "/admin", requiredRole: "admin" },
          ],
        },
      ],
    },
  ];

  // Helper functions
  const isItemActive = (item: NavItem) => {
    const itemBase = item.path.split("?")[0];
    if (pathname === itemBase) return true;
    if (itemBase === "/" || itemBase.startsWith("#")) return false;
    
    // Exact match for admin root
    if (itemBase === "/visitoradmin") {
      return pathname === itemBase;
    }

    return pathname.startsWith(itemBase + "/");
  };

  const isParentActive = (item: NavItem) => {
    if (pathname === item.path) return true;
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  const toggleParent = (name: string) => {
    setExpandedGroup((prev) => (prev === name ? null : name));
  };

  const handleMouseEnter = useCallback(
    (path: string) => {
      const cleanPath = path.split("?")[0];
      const apiEndpoint = API_ENDPOINTS[cleanPath];
      if (apiEndpoint) {
        preload(apiEndpoint, swrFetcher);
      }
      router.prefetch(path);
    },
    [router]
  );

  const ALL_DISTINCT_PAGES = [
    '/visitoradmin/rooms',
    '/visitoradmin/checkinout',
    '/visitoradmin',
    '/visitoranalytics',
    '/systemadmin',
    '/dashboard',
    '/orgchart',
    '/headcount_open',
    '/import_hr_data',
    '/sheetmanager',
    '/visitordashboard',
    '/visitorrequest'
  ];

  const checkRole = (itemPath: string, requiredRole?: string) => {
    // Global admin always has access to everything
    if (userRole === "admin") return true;

    // Unrestricted paths
    if (itemPath.startsWith('/introduction') || itemPath.startsWith('/profile')) return true;

    const allowedPages = (user as any)?.allowedPages || [];

    // Map legacy permission strings to actual paths
    const legacyMap: Record<string, string[]> = {
      'manage:visitors': ['/visitoradmin'],
      'view:visitors': ['/visitordashboard', '/visitorrequest']
    };

    const expandedAllowedPages = new Set<string>();
    allowedPages.forEach((p: string) => {
      expandedAllowedPages.add(p);
      if (legacyMap[p]) {
        legacyMap[p].forEach(mappedPath => expandedAllowedPages.add(mappedPath));
      }
    });

    if (expandedAllowedPages.has(itemPath)) return true;
    if (ALL_DISTINCT_PAGES.includes(itemPath)) return false;

    const matchingDistinctPage = ALL_DISTINCT_PAGES
      .filter(dp => itemPath === dp || itemPath.startsWith(dp + '/'))
      .sort((a, b) => b.length - a.length)[0];

    if (matchingDistinctPage) {
      return expandedAllowedPages.has(matchingDistinctPage);
    }

    return Array.from(expandedAllowedPages).some((p: any) => itemPath.startsWith(p + '/'));
  };

  const getRenderItems = (items: NavItem[]): NavItem[] => {
    const flat: NavItem[] = [];
    items.forEach((item) => {
      if (item.children) {
        flat.push(...item.children);
      } else {
        flat.push(item);
      }
    });
    return flat;
  };

  const filteredNavGroups = navGroups
    .map((group) => {
      const visibleItems = group.items
        .map((item) => {
          if (item.children) {
            const visibleChildren = item.children.filter((child) => checkRole(child.path, child.requiredRole));
            if (visibleChildren.length === 0) return null;
            return { ...item, children: visibleChildren };
          }
          return checkRole(item.path, item.requiredRole) ? item : null;
        })
        .filter((item): item is NavItem => item !== null);

      return { ...group, items: visibleItems };
    })
    .filter((group) => group.items.length > 0);

  if (["/login", "/signup"].includes(pathname)) {
    return null;
  }

  const renderNavLinks = (onItemClick?: () => void) => {
    return (
      <nav className="flex-1 overflow-y-auto py-0 px-0 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {filteredNavGroups.map((group) => {
          const itemsToRender = getRenderItems(group.items);
          if (itemsToRender.length === 0) return null;

          const isGroupExpanded = expandedGroup === group.title;

          return (
            <div key={group.title} className="w-full border-b border-white/20 flex flex-col">
              <button
                type="button"
                onClick={() => toggleParent(group.title)}
                className="w-full flex items-center justify-start px-4 py-8 cursor-pointer hover:bg-white/10 transition-colors text-left relative"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest leading-snug">{group.title}</span>
                <ChevronDownIcon
                  className={`absolute right-2 w-3.5 h-3.5 text-white shrink-0 transition-transform duration-300 ${
                    isGroupExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isGroupExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden flex flex-col w-full bg-black">
                  <div className="pb-2">
                    {itemsToRender.map((item) => {
                      const isActive = isItemActive(item);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          prefetch={true}
                          onClick={() => {
                            if (onItemClick) onItemClick();
                          }}
                          onMouseEnter={() => handleMouseEnter(item.path)}
                          className={`w-full flex flex-col items-start justify-center px-6 py-2 transition-colors text-left ${
                            isActive ? "bg-white/20 font-bold" : "hover:bg-white/10 font-semibold"
                          }`}
                        >
                          <span className="text-[11px] tracking-wide">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside
        aria-label="Desktop Navigation Sidebar"
        className="relative hidden md:flex flex-col h-full bg-black text-white shadow-[4px_0_10px_rgba(0,0,0,0.15)] z-30 shrink-0 w-[160px]"
      >
        {/* Top Red Header Block */}
        <Link
          href="/"
          className="w-full bg-[#db011c] text-white flex flex-col items-center justify-center shrink-0 border-b border-white/20 h-14 hover:bg-[#b80017] transition-colors group"
        >
          <img
            src="/Milwaukee-logo-red.png"
            alt="Milwaukee Logo"
            className="h-8 w-auto object-contain brightness-0 invert"
          />
          <span className="text-[10px] transform scale-[0.7] origin-top font-black tracking-widest text-white/90 uppercase mt-0.5 opacity-90 group-hover:opacity-100 transition-opacity whitespace-nowrap text-center leading-none">
            Factory Management
          </span>
        </Link>

        {/* Navigation */}
        {renderNavLinks()}
      </aside>

      {/* Mobile Drawer (visible on < md when isMobileNavOpen is true) */}
      <Transition appear show={isMobileNavOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={closeMobileNav}>
          {/* Backdrop overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-50">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in duration-200 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-[220px] max-w-[80vw] flex-col h-full bg-black text-white shadow-2xl">
                {/* Header with Brand and Close Button */}
                <div className="flex items-center justify-between bg-[#db011c] text-white px-4 h-14 border-b border-white/20 shrink-0">
                  <Link
                    href="/"
                    onClick={closeMobileNav}
                    className="flex flex-col items-start justify-center group"
                  >
                    <img
                      src="/Milwaukee-logo-red.png"
                      alt="Milwaukee Logo"
                      className="h-7 w-auto object-contain brightness-0 invert"
                    />
                    <span className="text-[9px] font-black tracking-widest text-white/90 uppercase mt-0.5 whitespace-nowrap">
                      Factory Management
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={closeMobileNav}
                    aria-label="Close navigation"
                    className="p-1.5 -mr-1 rounded-lg text-white/80 hover:text-white hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-white transition-colors cursor-pointer"
                  >
                    <XMarkIcon className="w-5 h-5 stroke-2" />
                  </button>
                </div>

                {/* Navigation content with mobile close handler */}
                {renderNavLinks(closeMobileNav)}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
