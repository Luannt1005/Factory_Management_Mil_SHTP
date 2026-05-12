"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import UserManagement from "./components/UserManagement";
import { UsersIcon } from "@heroicons/react/24/outline";

function SystemAdminContent() {
    const [isAuthorized, setIsAuthorized] = useState(false);
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
        <div className="min-h-screen bg-transparent font-sans text-[var(--color-text-body)] flex flex-col">
            <header className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)] px-6 shrink-0 rounded-md shadow-md mx-6 mt-4">
                <div className="flex items-center justify-between h-12">
                    <div className="flex items-center gap-6">
                        <h2 className="text-lg font-bold text-[var(--color-text-title)] flex items-center gap-2">
                            <UsersIcon className="w-5 h-5" />
                            Global App Admin - User Management
                        </h2>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-hidden">
                <div className="h-full bg-[var(--color-bg-card)] rounded-xl shadow-sm border border-[var(--color-border-light)] overflow-hidden flex flex-col">
                    <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <UserManagement />
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
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        }>
            <SystemAdminContent />
        </Suspense>
    );
}
