export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { hasPageAccess } from '@/lib/auth-server';
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const visitorPool = await getVisitorDbConnection();
        const { rows: rooms } = await visitorPool.query(
            'SELECT r.id, r.category, r.name, r."approverEmail" as approver_email, r."isActive" as is_active, c.site_location FROM "RoomArea" r LEFT JOIN "RoomCategory" c ON r.category = c.name WHERE r."isActive" = true ORDER BY r.category ASC'
        );

        return NextResponse.json({ rooms }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(await hasPageAccess('/visitoradmin'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { category, name, approver_email } = body;
        
        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query(
            'INSERT INTO "RoomArea" (id, category, name, "approverEmail", "isActive", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, true, NOW()) RETURNING id, category, name, "approverEmail" as approver_email, "isActive" as is_active',
            [category, name, approver_email]
        );

        return NextResponse.json({ message: 'Room created successfully', data: rows[0] }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(await hasPageAccess('/visitoradmin'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { id, category, name, approver_email, is_active } = body;
        
        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query(
            'UPDATE "RoomArea" SET category=COALESCE($1, category), name=COALESCE($2, name), "approverEmail"=$3, "isActive"=COALESCE($4, "isActive"), "updatedAt"=NOW() WHERE id=$5 RETURNING id, category, name, "approverEmail" as approver_email, "isActive" as is_active',
            [category, name, approver_email, is_active, id]
        );

        return NextResponse.json({ message: 'Room updated successfully', data: rows[0] }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(await hasPageAccess('/visitoradmin'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const visitorPool = await getVisitorDbConnection();
        await visitorPool.query('DELETE FROM "RoomArea" WHERE id = $1', [id]);

        return NextResponse.json({ message: 'Room deleted successfully' }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
