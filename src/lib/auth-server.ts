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
