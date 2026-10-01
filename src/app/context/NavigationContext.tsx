'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
    isMobileNavOpen: boolean;
    openMobileNav: () => void;
    closeMobileNav: () => void;
    toggleMobileNav: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const pathname = usePathname();

    const openMobileNav = () => setIsMobileNavOpen(true);
    const closeMobileNav = () => setIsMobileNavOpen(false);
    const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);

    // Automatically close mobile nav on route change
    useEffect(() => {
        setIsMobileNavOpen(false);
    }, [pathname]);

    return (
        <NavigationContext.Provider
            value={{ isMobileNavOpen, openMobileNav, closeMobileNav, toggleMobileNav }}
        >
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
