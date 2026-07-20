import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getDbConnection } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Ensure user has admin rights
        if ((session.user as any).role !== 'admin' && (session.user as any).visitor_role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const requestId = resolvedParams.id;
        const body = await request.json();
        const { 
            start_date, end_date, visitor_category, visiting_site, 
            details, visitors, interviewee_name, job_title, interview_department
        } = body;

        const visitorPool = await getDbConnection();

        // Ensure objects are stringified for DB storage.
        const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
        const visitorsStr = typeof visitors === 'object' ? JSON.stringify(visitors) : visitors;

        const updateQuery = `
            UPDATE "VisitorRequest"
            SET 
                "startDate" = $1,
                "endDate" = $2,
                "visitorCategory" = $3,
                "visitingSite" = $4,
                "details" = $5,
                "visitors" = $6,
                "interviewee_name" = $7,
                "job_title" = $8,
                "interview_department" = $9,
                "updatedAt" = NOW()
            WHERE id = $10
            RETURNING *;
        `;

        const result = await visitorPool.query(updateQuery, [
            start_date ? new Date(start_date) : null,
            end_date ? new Date(end_date) : null,
            visitor_category,
            visiting_site,
            detailsStr,
            visitorsStr,
            interviewee_name || null,
            job_title || null,
            interview_department || null,
            requestId
        ]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result.rows[0] });

    } catch (error: any) {
        console.error('Error updating request:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
