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

        const { searchParams } = new URL(request.url);
        const showAll = searchParams.get('all') === 'true';

        const visitorPool = await getVisitorDbConnection();
        const query = showAll 
            ? 'SELECT r.id, r.category, r.name, r.description, r."approverEmail" as approver_email, r."isActive" as is_active, c.site_location FROM "RoomArea" r LEFT JOIN "RoomCategory" c ON r.category = c.name ORDER BY r.category ASC'
            : 'SELECT r.id, r.category, r.name, r.description, r."approverEmail" as approver_email, r."isActive" as is_active, c.site_location FROM "RoomArea" r LEFT JOIN "RoomCategory" c ON r.category = c.name WHERE r."isActive" = true ORDER BY r.category ASC';
            
        const { rows: rooms } = await visitorPool.query(query);

        return NextResponse.json({ rooms }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(await hasPageAccess('/visitoradmin/rooms'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { category, name, description, approver_email } = body;
        
        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query(
            'INSERT INTO "RoomArea" (id, category, name, description, "approverEmail", "isActive", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW()) RETURNING id, category, name, description, "approverEmail" as approver_email, "isActive" as is_active',
            [category, name, description, approver_email]
        );

        return NextResponse.json({ message: 'Room created successfully', data: rows[0] }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(await hasPageAccess('/visitoradmin/rooms'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { id, category, name, description, approver_email, is_active } = body;
        
        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query(
            'UPDATE "RoomArea" SET category=COALESCE($1, category), name=COALESCE($2, name), description=COALESCE($3, description), "approverEmail"=$4, "isActive"=COALESCE($5, "isActive"), "updatedAt"=NOW() WHERE id=$6 RETURNING id, category, name, description, "approverEmail" as approver_email, "isActive" as is_active',
            [category, name, description, approver_email, is_active, id]
        );

        return NextResponse.json({ message: 'Room updated successfully', data: rows[0] }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(await hasPageAccess('/visitoradmin/rooms'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
