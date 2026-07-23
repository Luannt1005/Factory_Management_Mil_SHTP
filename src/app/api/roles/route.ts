export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth-server";

export async function GET() {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    try {
        const pool = await getDbConnection();
        const result = await pool.query("SELECT id, name, app_module, description, permissions, created_at, updated_at FROM app_roles ORDER BY app_module ASC, name ASC");

        return NextResponse.json({
            success: true,
            data: result.rows
        });
    } catch (error: any) {
        console.error("API Fetch Roles Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to fetch roles"
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    try {
        const body = await req.json();
        const { name, app_module, description, permissions } = body;

        if (!name || !app_module) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const pool = await getDbConnection();
        const result = await pool.query(
            "INSERT INTO app_roles (name, app_module, description, permissions) VALUES ($1, $2, $3, $4::jsonb) RETURNING *",
            [name, app_module, description || '', JSON.stringify(permissions || [])]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            message: "Role created successfully"
        });
    } catch (error: any) {
        console.error("API POST Role Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to create role"
        }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    try {
        const body = await req.json();
        const { id, name, app_module, description, permissions } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Role ID is required" }, { status: 400 });
        }

        const pool = await getDbConnection();
        const result = await pool.query(
            "UPDATE app_roles SET name = $1, app_module = $2, description = $3, permissions = $4::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
            [name, app_module, description || '', JSON.stringify(permissions || []), id]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            message: "Role updated successfully"
        });
    } catch (error: any) {
        console.error("API PUT Role Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to update role"
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Role ID is required" }, { status: 400 });
        }

        const pool = await getDbConnection();
        await pool.query("DELETE FROM app_roles WHERE id = $1", [id]);

        return NextResponse.json({
            success: true,
            message: "Role deleted successfully"
        });
    } catch (error: any) {
        console.error("API DELETE Role Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to delete role"
        }, { status: 500 });
    }
}
