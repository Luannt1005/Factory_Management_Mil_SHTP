'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import "@/styles/appheader.css";

function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // State for user menu and mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; full_name: string; role?: string; id?: string } | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user info from localStorage or session
    const storedUser = localStorage.getItem("user");

    // Public pages that don't require user data
    const publicPages = ["/login", "/signup"];
    const isPublicPage = publicPages.includes(pathname);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("User loaded from localStorage:", parsedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user data", e);
        localStorage.removeItem("user");
        // Redirect to login if stored data is invalid (but not from public pages)
        if (!isPublicPage) {
          router.push("/login");
        }
      }
    } else {
      // No user data found, redirect to login (but not from public pages)
      if (!isPublicPage) {
        router.push("/login");
      }
    }

    setIsLoading(false);
  }, [pathname, router]);

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  /**
   * Logout - Supabase version
   * No Firebase signOut needed, just clear local session
   */
  const handleLogout = async () => {
    try {
      // Delete auth cookie via API
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout API error:", e);
    }

    // Clear user data from local storage
    localStorage.removeItem("user");

    setUser(null);
    setIsUserMenuOpen(false);

    window.location.href = "/login";
  };

  return (
    <>
      {/* HEADER */}
      <header className="mwk-header">
        <div className="mwk-container">
          {/* Logo - Left */}
          <Link href="/" className="mwk-logo">
            <Image
              src="/milwaukee_logo.png"
              width={140}
              height={50}
              alt="Milwaukee logo"
            />
          </Link>

          {/* Navigation - Center */}
          <nav className="mwk-nav">
            <Link
              href="/orgchart"
              className={`mwk-nav-link ${pathname === "/orgchart" ? "active" : ""}`}
            >
              Sơ đồ Tổ chức
            </Link>
            <Link
              href="/import_hr_data"
              className={`mwk-nav-link ${pathname === "/import_hr_data" ? "active" : ""}`}
            >
              Import Data HR
            </Link>
            <Link
              href="/dashboard"
              className={`mwk-nav-link ${pathname === "/dashboard" ? "active" : ""}`}
            >
              Dashboard
            </Link>
            <Link
              href="/sheetmanager"
              className={`mwk-nav-link ${pathname === "/sheetmanager" ? "active" : ""}`}
            >
              Edit table HR
            </Link>

            <Link
              href="/customize"
              className={`mwk-nav-link ${pathname === "/customize" ? "active" : ""}`}
            >
              Orgchart tùy chỉnh
            </Link>

            <Link
              href="/view_account"
              className={`mwk-nav-link ${pathname === "/view_account" ? "active" : ""}`}
            >
              Quản lý tài khoản
            </Link>
          </nav>

          {/* User Profile - Right */}
          {!isLoading && user && (
            <div className="mwk-user-section" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="mwk-user-button"
                title={user.username || ""}
              >
                <div className="mwk-user-avatar">
                  {user.full_name && user.full_name.length > 0 ? user.full_name.charAt(0).toUpperCase() : user.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="mwk-user-info">
                  <div className="mwk-user-name truncate">{user.full_name || user.username || "User"}</div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              <div className={`mwk-user-dropdown ${isUserMenuOpen ? "show" : ""}`}>
                <div className="mwk-user-dropdown-header">
                  <div className="mwk-user-dropdown-avatar">
                    {user.full_name && user.full_name.length > 0 ? user.full_name.charAt(0).toUpperCase() : user.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="mwk-user-dropdown-info">
                    <div className="mwk-user-dropdown-name">{user.full_name || user.username || "User"}</div>
                    <div className="mwk-user-dropdown-email">@{user.username}</div>
                  </div>
                </div>
                <div className="mwk-user-dropdown-divider"></div>
                <button
                  onClick={handleLogout}
                  className="mwk-user-logout-btn"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

export default AppHeader;
