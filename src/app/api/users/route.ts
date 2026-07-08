import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth-server";

/**
 * GET /api/users
 * Fetch all users ordered by full_name
 */
export async function GET() {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    try {
        const pool = await getDbConnection();
        const result = await pool.query("SELECT id, username, full_name, role, orgchart_role, visitor_role, created_at, employee_id, email, last_login, sso_provider, status, department, job_title FROM users ORDER BY full_name ASC");

        return NextResponse.json({
            success: true,
            data: result.rows
        });
    } catch (error: any) {
        console.error("API Fetch Users Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to fetch users"
        }, { status: 500 });
    }
}

/**
 * POST /api/users
 * Create a new user account
 */
export async function POST(req: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    try {
        const body = await req.json();
        const { username, full_name, password, role, orgchart_role, visitor_role, employee_id, email, status, department, job_title } = body;

        if (!username || !full_name || !password) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const pool = await getDbConnection();

        // Check if username exists
        const checkResult = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
        if (checkResult.rows.length > 0) {
            return NextResponse.json({ success: false, message: "Username already exists" }, { status: 400 });
        }

        const result = await pool.query(
            "INSERT INTO users (username, full_name, password, role, orgchart_role, visitor_role, employee_id, email, status, department, job_title) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
            [username, full_name, password, role || 'user', orgchart_role || 'user', visitor_role || 'user', employee_id || null, email || null, status || 'Active', department || null, job_title || null]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            message: "User created successfully"
        });
    } catch (error: any) {
        console.error("API POST User Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to create user"
        }, { status: 500 });
    }
}

/**
 * PUT /api/users
 * Update an existing user account
 */
export async function PUT(req: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    try {
        const body = await req.json();
        const { id, full_name, role, orgchart_role, visitor_role, password, employee_id, email, status, department, job_title } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
        }

        const pool = await getDbConnection();

        let query = "UPDATE users SET full_name = $1, role = $2, orgchart_role = $3, visitor_role = $4, employee_id = $5, email = $6, status = $7, department = $8, job_title = $9";
        const values: any[] = [full_name, role, orgchart_role, visitor_role, employee_id || null, email || null, status || 'Active', department || null, job_title || null];

        if (password && password.trim() !== "") {
            query += ", password = $10 WHERE id = $11";
            values.push(password, id);
        } else {
            query += " WHERE id = $10";
            values.push(id);
        }

        await pool.query(query, values);

        return NextResponse.json({
            success: true,
            message: "User updated successfully"
        });
    } catch (error: any) {
        console.error("API PUT User Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to update user"
        }, { status: 500 });
    }
}

/**
 * DELETE /api/users
 * Delete a user account
 */
export async function DELETE(req: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
        }

        const pool = await getDbConnection();
        await pool.query("DELETE FROM users WHERE id = $1", [id]);

        return NextResponse.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error: any) {
        console.error("API DELETE User Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to delete user"
        }, { status: 500 });
    }
}
