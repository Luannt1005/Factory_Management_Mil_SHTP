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

        const { id } = await context.params;
        if (!id) {
            return NextResponse.json({ error: 'Missing request ID' }, { status: 400 });
        }

        const body = await request.json();
        const {
            visitors, intervieweeName, jobTitle, interviewDepartment, interviewerName,
            startDate, startTime, interviewArea, mealRegistration, factoryTour, visitingSite
        } = body;

        visitorPool = await getVisitorDbConnection();

        // 1. Check in VisitorRequest table (New format)
        const { rows: vrRows } = await visitorPool.query(
            `SELECT id, "editCount", details, visitors, "visitorCategory" FROM "VisitorRequest" WHERE id = $1`,
            [id]
        );

        if (vrRows.length > 0) {
            const vr = vrRows[0];
            const currentEditCount = vr.editCount || 0;

            if (currentEditCount >= 3) {
                return NextResponse.json({ error: 'Maximum edit limit (3 times) reached' }, { status: 400 });
            }

            // Build visitors array
            let finalVisitors = visitors;
            if (!finalVisitors || !Array.isArray(finalVisitors) || finalVisitors.length === 0) {
                if (intervieweeName) {
                    finalVisitors = [{
                        name: intervieweeName,
                        title: jobTitle || '',
                        company: interviewDepartment || '',
                        interviewDepartment: interviewDepartment || '',
                        interviewerName: interviewerName || ''
                    }];
                } else {
                    try {
                        finalVisitors = JSON.parse(vr.visitors || '[]');
                    } catch (e) {
                        finalVisitors = [];
                    }
                }
            }

            const primaryVisitor = finalVisitors.length > 0 ? finalVisitors[0] : { name: '', title: '', company: '' };
            const visitorName = primaryVisitor.name || '';
            const visitorTitle = primaryVisitor.title || '';
            const currentCompany = primaryVisitor.interviewDepartment || primaryVisitor.company || '';

            // Parse existing details
            let existingDetails: any = {};
            try {
                existingDetails = JSON.parse(vr.details || '{}');
            } catch (e) {}

            const updatedDetails = {
                ...existingDetails,
                startTime: startTime || existingDetails.startTime || '',
                interviewArea: interviewArea || existingDetails.interviewArea || '',
                mealRegistration: mealRegistration !== undefined ? mealRegistration : (existingDetails.mealRegistration || 'No'),
                factoryTour: factoryTour !== undefined ? factoryTour : (existingDetails.factoryTour || 'No')
            };

            await visitorPool.query('BEGIN');

            await visitorPool.query(
                `UPDATE "VisitorRequest"
                 SET "visitorName" = $1,
                     "visitorTitle" = $2,
                     "currentCompany" = $3,
                     "startDate" = $4,
                     "endDate" = $4,
                     "purposeDetail" = $5,
                     details = $6,
                     visitors = $7,
                     "visitingSite" = COALESCE($8, "visitingSite"),
                     "editCount" = "editCount" + 1,
                     "updatedAt" = NOW()
                 WHERE id = $9`,
                [
                    visitorName,
                    visitorTitle,
                    currentCompany,
                    new Date(startDate),
                    interviewArea || '',
                    JSON.stringify(updatedDetails),
                    JSON.stringify(finalVisitors),
                    visitingSite || 'SHTP',
                    id
                ]
            );

            await visitorPool.query('COMMIT');

            return NextResponse.json({ message: 'Request updated successfully', editCount: currentEditCount + 1 }, { status: 200 });
        }

        // 2. Legacy fallback: Check in IntervieweeRequest table
        const { rows: irRows } = await visitorPool.query(
            `SELECT "editCount" FROM "IntervieweeRequest" WHERE id = $1`,
            [id]
        );

        if (irRows.length === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const legacyEditCount = irRows[0].editCount || 0;
        if (legacyEditCount >= 3) {
            return NextResponse.json({ error: 'Maximum edit limit (3 times) reached' }, { status: 400 });
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

        return NextResponse.json({ message: 'Request updated successfully', editCount: legacyEditCount + 1 }, { status: 200 });

    } catch (error: any) {
        if (visitorPool) await visitorPool.query('ROLLBACK');
        console.error('Update interviewee request error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
