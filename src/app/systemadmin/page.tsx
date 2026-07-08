"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import UserManagement from "./components/UserManagement";
import RoleManagement from "./components/RoleManagement";
import { UsersIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

function SystemAdminContent() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
    const router = useRouter();

    // specific check for admin role
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        try {
            const user = JSON.parse(storedUser);
            // Global app admin required to manage users
            if (user.role !== 'admin') {
                router.push('/');
            } else {
                setIsAuthorized(true);
            }
        } catch (e) {
            router.push('/login');
        }
    }, [router]);

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 shrink-0 shadow-sm">
                <div className="flex items-end justify-between pt-6">
                    <div className="flex items-center gap-6 pb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <UsersIcon className="w-6 h-6 text-[#b52427]" />
                            System Administration
                        </h2>
                    </div>
                    
                    <div className="flex gap-6 border-b-2 border-transparent">
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${activeTab === "users" ? "border-[#b52427] text-[#b52427]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            User Accounts
                        </button>
                        <button
                            onClick={() => setActiveTab("roles")}
                            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "roles" ? "border-[#b52427] text-[#b52427]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            Roles & Permissions
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-hidden">
                <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="h-full animate-in fade-in duration-300">
                        {activeTab === "users" ? <UserManagement /> : <RoleManagement />}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function SystemAdminPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#b52427] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SystemAdminContent />
        </Suspense>
    );
}
