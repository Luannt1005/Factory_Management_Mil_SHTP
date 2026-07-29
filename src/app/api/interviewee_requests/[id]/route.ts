export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    let visitorPool;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Await the params object before accessing id
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: 'Missing request ID' }, { status: 400 });
        }

        const body = await request.json();
        const {
            intervieweeName, jobTitle, interviewDepartment, interviewerName,
            startDate, startTime, interviewArea
        } = body;

        visitorPool = await getVisitorDbConnection();

        // Check if request exists and get current editCount
        const { rows } = await visitorPool.query(
            `SELECT "editCount" FROM "IntervieweeRequest" WHERE id = $1`,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const currentEditCount = rows[0].editCount || 0;

        if (currentEditCount >= 3) {
            return NextResponse.json({ error: 'Maximum edit limit (3) reached' }, { status: 400 });
        }

        await visitorPool.query('BEGIN');

        await visitorPool.query(
            `UPDATE "IntervieweeRequest" 
             SET "intervieweeName" = $1, "jobTitle" = $2, "interviewDepartment" = $3, 
                 "interviewerName" = $4, "startDate" = $5, "startTime" = $6, "interviewArea" = $7, 
                 "editCount" = "editCount" + 1, "updatedAt" = NOW()
             WHERE id = $8`,
            [intervieweeName, jobTitle, interviewDepartment, interviewerName, new Date(startDate), startTime, interviewArea, id]
        );

        await visitorPool.query('COMMIT');

        return NextResponse.json({ message: 'Request updated successfully' }, { status: 200 });

    } catch (error: any) {
        if (visitorPool) await visitorPool.query('ROLLBACK');
        console.error('Update interviewee request error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
