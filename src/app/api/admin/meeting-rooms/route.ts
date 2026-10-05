export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { isAuthenticated, unauthorizedResponse, hasPageAccess } from '@/lib/auth-server';

export async function GET(request: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }

    try {
        const pool = await getVisitorDbConnection();
        const res = await pool.query('SELECT * FROM "MeetingRoom" ORDER BY "createdAt" DESC');
        return NextResponse.json({ meetingRooms: res.rows }, { status: 200 });
    } catch (error) {
        console.error('Error fetching meeting rooms:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    if (!(await hasPageAccess('/visitoradmin/rooms'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { floorName, roomName } = await request.json();

        if (!floorName || !roomName) {
            return NextResponse.json({ error: 'Floor Name and Room Name are required' }, { status: 400 });
        }

        const pool = await getVisitorDbConnection();
        const res = await pool.query(
            `INSERT INTO "MeetingRoom" ("floorName", "roomName") VALUES ($1, $2) RETURNING *`,
            [floorName, roomName]
        );

        return NextResponse.json(res.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating meeting room:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    if (!(await hasPageAccess('/visitoradmin/rooms'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id, floorName, roomName } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const pool = await getVisitorDbConnection();
        
        let query = 'UPDATE "MeetingRoom" SET ';
        const values: (string | number)[] = [];
        let index = 1;

        if (floorName !== undefined) {
            query += `"floorName" = $${index++}, `;
            values.push(floorName);
        }
        if (roomName !== undefined) {
            query += `"roomName" = $${index++}, `;
            values.push(roomName);
        }

        query += `"updatedAt" = CURRENT_TIMESTAMP WHERE id = $${index} RETURNING *`;
        values.push(id);

        const res = await pool.query(query, values);
        
        if (res.rowCount === 0) {
            return NextResponse.json({ error: 'Meeting Room not found' }, { status: 404 });
        }

        return NextResponse.json(res.rows[0], { status: 200 });
    } catch (error) {
        console.error('Error updating meeting room:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAuthenticated()) {
        return unauthorizedResponse();
    }
    if (!(await hasPageAccess('/visitoradmin/rooms'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const pool = await getVisitorDbConnection();
        const res = await pool.query(`DELETE FROM "MeetingRoom" WHERE id = $1 RETURNING *`, [id]);

        if (res.rowCount === 0) {
            return NextResponse.json({ error: 'Meeting Room not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Meeting Room deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting meeting room:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
