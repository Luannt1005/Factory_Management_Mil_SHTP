import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const visitorPool = await getVisitorDbConnection();
        const { rows: categories } = await visitorPool.query(
            'SELECT id, name, site_location, bu, "createdAt", "updatedAt" FROM "RoomCategory" ORDER BY name ASC'
        );

        return NextResponse.json({ categories }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== 'admin' && (session.user as any).visitor_role !== 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { name, site_location, bu } = body;
        
        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query(
            'INSERT INTO "RoomCategory" (id, name, site_location, bu, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW()) RETURNING *',
            [name, site_location, bu]
        );

        return NextResponse.json({ message: 'Category created successfully', data: rows[0] }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== 'admin' && (session.user as any).visitor_role !== 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { id, name, site_location, bu } = body;
        
        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query(
            'UPDATE "RoomCategory" SET name=COALESCE($1, name), site_location=COALESCE($2, site_location), bu=COALESCE($3, bu), "updatedAt"=NOW() WHERE id=$4 RETURNING *',
            [name, site_location, bu, id]
        );

        return NextResponse.json({ message: 'Category updated successfully', data: rows[0] }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ((session.user as any).role !== 'admin' && (session.user as any).visitor_role !== 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const visitorPool = await getVisitorDbConnection();
        await visitorPool.query('DELETE FROM "RoomCategory" WHERE id = $1', [id]);

        return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
