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
            ? 'SELECT id, bu, functional_dept, functional_host_name, functional_host_email, department, department_host_name, department_host_email, is_active FROM "HostDepartment" ORDER BY functional_dept ASC, department ASC'
            : 'SELECT id, bu, functional_dept, functional_host_name, functional_host_email, department, department_host_name, department_host_email, is_active FROM "HostDepartment" WHERE is_active = true ORDER BY functional_dept ASC, department ASC';
            
        const { rows: hostDepartments } = await visitorPool.query(query);

        return NextResponse.json({ hostDepartments }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(await hasPageAccess('/visitoradmin/rooms'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { bu, functional_dept, functional_host_name, functional_host_email, department, department_host_name, department_host_email } = body;
        
        const visitorPool = await getVisitorDbConnection();
        const { rows } = await visitorPool.query(
            `INSERT INTO "HostDepartment" (
                id, bu, functional_dept, functional_host_name, functional_host_email, department, department_host_name, department_host_email, is_active, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
            ) RETURNING *`,
            [bu || null, functional_dept, functional_host_name, functional_host_email || null, department, department_host_name, department_host_email || null]
        );

        return NextResponse.json({ message: 'Host Department created successfully', data: rows[0] }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(await hasPageAccess('/visitoradmin/rooms'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { id, bu, functional_dept, functional_host_name, functional_host_email, department, department_host_name, department_host_email, is_active } = body;
        
        const visitorPool = await getVisitorDbConnection();
        await visitorPool.query(
            `UPDATE "HostDepartment" 
             SET bu = $1, functional_dept = $2, functional_host_name = $3, functional_host_email = $4, 
                 department = $5, department_host_name = $6, department_host_email = $7, 
                 is_active = $8, updated_at = NOW() 
             WHERE id = $9`,
            [bu || null, functional_dept, functional_host_name, functional_host_email || null, department, department_host_name, department_host_email || null, is_active, id]
        );

        return NextResponse.json({ message: 'Host Department updated successfully' }, { status: 200 });
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

        if (!id) return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });

        const visitorPool = await getVisitorDbConnection();
        await visitorPool.query('DELETE FROM "HostDepartment" WHERE id = $1', [id]);

        return NextResponse.json({ message: 'Host Department deleted successfully' }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
