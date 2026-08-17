"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/app/context/UserContext";
import { ArrowLeftOnRectangleIcon, UserCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || user?.full_name || "Visitor Manager";
  const userRole = (session?.user as any)?.role || user?.role || "Admin";
  const userImage = session?.user?.image;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
      localStorage.removeItem("user");
    } catch (e) {
      console.error(e);
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  if (["/login", "/signup"].includes(pathname)) {
    return null;
  }

  // Dynamic Title Logic based on pathname
  let pageTitle = "DASHBOARD";
  let badgeTitle = "WORKSPACE";

  if (pathname === "/") {
    pageTitle = "HOME";
    badgeTitle = "FACTORY MANAGEMENT";
  } else if (pathname.includes("/about_shtp")) {
    pageTitle = "ABOUT FACTORY";
    badgeTitle = "INTRODUCTION";
  } else if (pathname.includes("/about_vn")) {
    pageTitle = "ABOUT VIETNAM";
    badgeTitle = "INTRODUCTION";
  } else if (pathname.includes("/contacts")) {
    pageTitle = "CONTACT";
    badgeTitle = "INTRODUCTION";
  } else if (pathname.includes("/visitorrequest")) {
    pageTitle = "REGISTRATION";
    badgeTitle = "VISITOR MANAGEMENT";
  } else if (pathname.includes("/visitordashboard")) {
    pageTitle = "MY REQUESTS";
    badgeTitle = "VISITOR MANAGEMENT";
  } else if (pathname.includes("/checkinout")) {
    pageTitle = "CHECK IN / OUT";
    badgeTitle = "VISITOR CONTROL";
  } else if (pathname.includes("/rooms")) {
    pageTitle = "MANAGE ROOM";
    badgeTitle = "VISITOR CONTROL";
  } else if (pathname.includes("/visitoradmin")) {
    pageTitle = "ADMIN SETTINGS";
    badgeTitle = "VISITOR CONTROL";
  } else if (pathname.includes("/visitoranalytics")) {
    pageTitle = "ANALYTICS";
    badgeTitle = "VISITOR CONTROL";
  } else if (pathname.includes("/orgchart")) {
    pageTitle = "ORG CHART";
    badgeTitle = "ORGCHART";
  } else if (pathname.includes("/dashboard")) {
    pageTitle = "HEADCOUNT DASHBOARD";
    badgeTitle = "ORGCHART";
  }

  // Get user initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(userName);

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white shadow-sm border-b border-gray-200 h-14">
      <div className="flex flex-grow items-center justify-between px-6">
        
        {/* Left Side: Page Title & Badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black tracking-tighter uppercase text-[#212529] m-0 leading-none mt-0.5">
            {pageTitle}
          </h2>
          <span className="bg-[#db011c] text-white text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded shadow-sm">
            {badgeTitle}
          </span>
        </div>

        {/* Right Side: User Profile Dropdown */}
        <div className="flex items-center">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity bg-transparent border-none py-1"
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[13px] font-semibold text-[#1c223a]">
                  {userName}
                </span>
                <span className="text-[11px] font-medium text-[#7a869a] capitalize">
                  {userRole}
                </span>
              </div>
              
              {userImage ? (
                <img src={userImage} alt={userName} className="h-9 w-9 rounded-full object-cover border border-gray-200 shadow-sm" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-[#f0f2f5] text-[#344563] flex items-center justify-center text-[15px] font-bold border border-gray-100 shadow-sm">
                  {initials}
                </div>
              )}
              
              <ChevronDownIcon className="w-4 h-4 text-gray-500 stroke-2" />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-xl py-2">
                <ul className="flex flex-col border-b border-gray-100 pb-2 mb-2">
                  <li>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#db011c]"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      My Profile
                    </Link>
                  </li>
                </ul>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
