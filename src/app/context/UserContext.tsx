"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from "next-auth/react";

interface User {
    id: string | number;
    username: string;
    full_name: string;
    role: string;
    orgchart_role: string;
    visitor_role: string;
    image?: string;
}

interface UserContextProps {
    user: User | null;
    setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);

    // Sync with NextAuth session
    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const nextUser: User = {
                id: (session.user as any).id || "",
                username: (session.user as any).username || session.user.email || "",
                full_name: session.user.name || "",
                role: (session.user as any).role || "user",
                orgchart_role: (session.user as any).orgchart_role || "user",
                visitor_role: (session.user as any).visitor_role || "user",
                image: session.user.image || undefined,
            };
            setUser(nextUser);
            localStorage.setItem('user', JSON.stringify(nextUser));
        } else if (status === "unauthenticated") {
            // Only clear if we were previously logged in or if we want strict sync
            // For now, let's just clear it to be safe
            // setUser(null);
            // localStorage.removeItem('user');
        }
    }, [session, status]);

    // Initialize from localStorage on mount (for speed before session loads)
    useEffect(() => {
        if (typeof window !== 'undefined' && !user) {
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) {
                    console.error('Failed to parse stored user', e);
                    localStorage.removeItem('user');
                }
            }
        }
    }, []);


    // Better approach:
    // 1. Load from LS on mount.
    // 2. Provide a wrapper for setUser that also updates LS.

    const updateUser = (newUser: User | null) => {
        setUser(newUser);
        if (typeof window !== 'undefined') {
            if (newUser) {
                localStorage.setItem('user', JSON.stringify(newUser));
            } else {
                localStorage.removeItem('user');
            }
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser: updateUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextProps => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
