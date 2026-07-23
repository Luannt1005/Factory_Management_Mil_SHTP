export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("auth");
        cookieStore.delete("next-auth.session-token");
        cookieStore.delete("__Secure-next-auth.session-token");

        return NextResponse.json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Failed to logout"
        }, { status: 500 });
    }
}
