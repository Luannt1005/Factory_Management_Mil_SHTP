import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";

/**
 * Checks if the request is authenticated by verifying NextAuth session.
 * @returns {Promise<boolean>} True if authenticated, false otherwise.
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await getServerSession(authOptions);
    return !!session;
}

/**
 * Returns a standardized 401 Unauthorized response.
 */
export function unauthorizedResponse() {
    return NextResponse.json(
        {
            success: false,
            error: 'Unauthorized: Invalid or missing session',
            status: 401
        },
        { status: 401 }
    );
}

/**
 * Helper to get current username from session
 */
export async function getCurrentUser(): Promise<string | null> {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user && (session.user as any).username) {
            return (session.user as any).username;
        }
        if (session?.user?.email) {
            return session.user.email;
        }
        return null;
    } catch (e) {
        return null;
    }
}

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

/**
 * Checks if the user has access to a specific page path.
 */
export async function hasPageAccess(pagePath: string): Promise<boolean> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return false;
    
    const user = session.user as any;
    if (user.role === 'admin') return true;
    
    if (user.allowedPages && Array.isArray(user.allowedPages)) {
        // Map legacy permission strings to actual paths
        const legacyMap: Record<string, string[]> = {
            'manage:visitors': ['/visitoradmin'],
            'view:visitors': ['/visitordashboard', '/visitorrequest']
        };

        const expandedAllowedPages = new Set<string>();
        user.allowedPages.forEach((p: string) => {
            expandedAllowedPages.add(p);
            if (legacyMap[p]) {
                legacyMap[p].forEach(mappedPath => expandedAllowedPages.add(mappedPath));
            }
        });

        if (expandedAllowedPages.has(pagePath)) return true;
        if (ALL_DISTINCT_PAGES.includes(pagePath)) return false;

        const matchingDistinctPage = ALL_DISTINCT_PAGES
            .filter(dp => pagePath === dp || pagePath.startsWith(dp + '/'))
            .sort((a, b) => b.length - a.length)[0];

        if (matchingDistinctPage) {
            return expandedAllowedPages.has(matchingDistinctPage);
        }

        return Array.from(expandedAllowedPages).some((p: any) => pagePath.startsWith(p + '/'));
    }
    
    return false;
}

