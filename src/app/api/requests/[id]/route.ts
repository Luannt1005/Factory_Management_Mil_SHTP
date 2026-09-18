export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { hasPageAccess } from '@/lib/auth-server';
import { getVisitorDbConnection } from '@/lib/visitor-db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Ensure user has admin rights
        if (!(await hasPageAccess('/visitoradmin'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const requestId = resolvedParams.id;
        if (!requestId) {
            return NextResponse.json({ error: 'Missing request ID' }, { status: 400 });
        }

        const body = await request.json();
        const { 
            start_date, end_date, visitor_category, visiting_site, 
            details, visitors, interviewee_name, job_title, interview_department
        } = body;

        const visitorPool = await getVisitorDbConnection();

        // 1. Fetch existing record from VisitorRequest in Visitor_database
        const { rows: existingRows } = await visitorPool.query(
            'SELECT * FROM "VisitorRequest" WHERE id = $1',
            [requestId]
        );

        if (existingRows.length === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const existing = existingRows[0];

        // 2. Merge details object safely
        let mergedDetails: any = {};
        try {
            if (existing.details) {
                mergedDetails = typeof existing.details === 'string' ? JSON.parse(existing.details) : existing.details;
            }
        } catch (e) {}

        if (typeof details === 'object' && details !== null) {
            mergedDetails = { ...mergedDetails, ...details };
        }
        const detailsStr = JSON.stringify(mergedDetails);

        // 3. Process visitors array and primary visitor fields
        let finalVisitors: any[] = Array.isArray(visitors) ? [...visitors] : [];
        if (finalVisitors.length === 0) {
            try {
                finalVisitors = typeof existing.visitors === 'string' ? JSON.parse(existing.visitors) : (existing.visitors || []);
            } catch (e) {
                finalVisitors = [];
            }
        }

        const effectiveCategory = visitor_category || existing.visitorCategory;

        if (effectiveCategory === 'Interviewee') {
            if (interviewee_name || job_title || interview_department) {
                if (finalVisitors.length > 0) {
                    finalVisitors[0] = {
                        ...finalVisitors[0],
                        name: interviewee_name || finalVisitors[0].name || '',
                        title: job_title || finalVisitors[0].title || '',
                        company: interview_department || finalVisitors[0].company || '',
                        interviewDepartment: interview_department || finalVisitors[0].interviewDepartment || finalVisitors[0].company || ''
                    };
                } else {
                    finalVisitors = [{
                        name: interviewee_name || '',
                        title: job_title || '',
                        company: interview_department || '',
                        interviewDepartment: interview_department || ''
                    }];
                }
            }
        }

        const visitorsStr = JSON.stringify(finalVisitors);

        // Primary visitor for top-level columns
        const primaryVisitor = finalVisitors.length > 0 ? finalVisitors[0] : null;
        const visitorName = (primaryVisitor?.name || existing.visitorName || '').trim();
        const visitorTitle = (primaryVisitor?.title || existing.visitorTitle || '').trim();
        const currentCompany = (primaryVisitor?.company || primaryVisitor?.interviewDepartment || existing.currentCompany || '').trim();
        const purposeOfVisit = mergedDetails.purpose || existing.purposeOfVisit || 'Visit';

        // Safe dates
        const cleanStartDate = start_date ? new Date(start_date) : existing.startDate;
        const cleanEndDate = end_date ? new Date(end_date) : (start_date ? new Date(start_date) : existing.endDate);

        const updateQuery = `
            UPDATE "VisitorRequest"
            SET 
                "startDate" = $1,
                "endDate" = $2,
                "visitorCategory" = $3,
                "visitingSite" = $4,
                "purposeOfVisit" = $5,
                "details" = $6,
                "visitors" = $7,
                "visitorName" = $8,
                "visitorTitle" = $9,
                "currentCompany" = $10,
                "editCount" = COALESCE("editCount", 0) + 1,
                "updatedAt" = NOW()
            WHERE id = $11
            RETURNING *;
        `;

        const result = await visitorPool.query(updateQuery, [
            cleanStartDate,
            cleanEndDate,
            effectiveCategory,
            visiting_site || existing.visitingSite,
            purposeOfVisit,
            detailsStr,
            visitorsStr,
            visitorName,
            visitorTitle,
            currentCompany,
            requestId
        ]);

        return NextResponse.json({ success: true, data: result.rows[0] });

    } catch (error: any) {
        console.error('Error updating request:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
