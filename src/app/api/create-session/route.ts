export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const user = body?.user;

        if (!user || typeof user !== "object" || !user.username) {
            return NextResponse.json({
                success: false,
                message: "Invalid user data"
            }, { status: 400 });
        }

        // Tạo JWT session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const session = await encrypt({ user, expires });

        // Set HttpOnly cookie
        const cookieStore = await cookies();
        cookieStore.set("auth", session, {
            expires,
            httpOnly: true,
            secure: false, // Set to false to allow HTTP on-premise access
            path: "/",
            sameSite: "lax",
        });

        return NextResponse.json({
            success: true,
            message: "Session created"
        });

    } catch (error) {
        console.error("Create session error:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to create session"
        }, { status: 500 });
    }
}
