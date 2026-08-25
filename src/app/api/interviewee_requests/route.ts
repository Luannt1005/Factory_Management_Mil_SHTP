export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

const formatEmail = (email: string | null | undefined) => { if (!email || typeof email !== 'string') return 'unknown@ttigroup.com.vn'; return email.includes('@') ? email : `@ttigroup.com.vn`; };

export async function POST(request: Request) {
    let visitorPool;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const powerAutomateNotificationUrl = process.env.POWER_AUTOMATE_FOR_LEAVE_URL;

        const body = await request.json();
        const {
            interviewees, intervieweeName, jobTitle, interviewDepartment, interviewerName,
            startDate, startTime, interviewArea
        } = body;

        // Build list of candidates
        let candidateList: Array<{ name: string; jobTitle: string; interviewDepartment?: string; interviewerName?: string }> = [];
        if (Array.isArray(interviewees) && interviewees.length > 0) {
            candidateList = interviewees.filter((c: any) => c.name && typeof c.name === 'string' && c.name.trim() !== '');
        }
        if (candidateList.length === 0 && intervieweeName && typeof intervieweeName === 'string' && intervieweeName.trim() !== '') {
            candidateList = [{ 
                name: intervieweeName, 
                jobTitle: jobTitle || '',
                interviewDepartment: interviewDepartment || '',
                interviewerName: interviewerName || ''
            }];
        }

        if (candidateList.length === 0) {
            return NextResponse.json({ error: 'At least one candidate name is required' }, { status: 400 });
        }

        visitorPool = await getVisitorDbConnection();

        await visitorPool.query('BEGIN');

        // Generate Custom ID with Prefix for Interviewee
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const datePrefix = `VI${dd}${mm}${yy}`;

        // Find the last sequence for today
        const { rows: lastReq } = await visitorPool.query(
            `SELECT "visitorCode" FROM "IntervieweeRequest" WHERE "visitorCode" LIKE $1 ORDER BY "visitorCode" DESC LIMIT 1`,
            [`${datePrefix}_%`]
        );

        let sequence = 1;
        if (lastReq.length > 0) {
            const lastId = lastReq[0].visitorCode;
            const lastSeqStr = lastId.split('_')[1];
            if (lastSeqStr) {
                sequence = parseInt(lastSeqStr, 10) + 1;
            }
        }

        const osName = session.user.name || (session.user as any).full_name || (session.user as any).username || session.user.email;
        const createdIds: string[] = [];
        const createdCodes: string[] = [];

        for (const candidate of candidateList) {
            const newVisitorCode = `${datePrefix}_${String(sequence).padStart(2, '0')}`;
            sequence++;

            const candDept = (candidate.interviewDepartment || interviewDepartment || '').trim();
            const candInterviewer = (candidate.interviewerName || interviewerName || '').trim();

            const { rows: inserted } = await visitorPool.query(
                `INSERT INTO "IntervieweeRequest" 
                 ("visitorCode", "osName", "intervieweeName", "jobTitle", "interviewDepartment", "interviewerName", "startDate", "startTime", "interviewArea", status, "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'COMPLETE', NOW())
                 RETURNING id, "visitorCode"`,
                [newVisitorCode, osName, candidate.name.trim(), (candidate.jobTitle || '').trim(), candDept, candInterviewer, new Date(startDate), startTime, interviewArea]
            );

            if (inserted.length > 0) {
                createdIds.push(inserted[0].id);
                createdCodes.push(inserted[0].visitorCode);
            }
        }

        await visitorPool.query('COMMIT');

        // Trigger email notification webhook if configured
        if (powerAutomateNotificationUrl) {
            try {
                const namesList = candidateList.map(c => c.name.trim()).join(', ');
                const titlesList = candidateList.map(c => `${c.name.trim()} (${c.jobTitle ? c.jobTitle.trim() : 'Candidate'} - ${c.interviewDepartment || interviewDepartment || 'Interview'})`).join('; ');
                const paResponse = await fetch(powerAutomateNotificationUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requestDetails: {
                            id: createdCodes.join(', '),
                            visitor_name: namesList,
                            visitorTitle: titlesList,
                            currentCompany: "", // Not applicable for interviewee
                            startDate: startDate,
                            endDate: startDate,
                            purposeOfVisit: "Interview",
                            submitterName: osName,
                            submitterEmail: formatEmail(session.user.email || (session.user as any).username),
                            visitorCategory: 'Interviewee',
                            interviewerName: candidateList[0]?.interviewerName || interviewerName || '',
                            startTime: startTime,
                            interviewArea: interviewArea,
                            interviewDepartment: candidateList[0]?.interviewDepartment || interviewDepartment || ''
                        },
                        rooms: [] // No approvals needed for interviewee
                    })
                });
                if (!paResponse.ok) {
                    console.error('Power Automate Email Hook Failed:', paResponse.status, await paResponse.text());
                } else {
                    console.log('Email notification sent successfully to Power Automate.');
                }
            } catch (e) {
                console.error('Failed to trigger notification webhook:', e);
            }
        }

        return NextResponse.json({ 
            message: 'Requests created successfully', 
            id: createdIds[0],
            ids: createdIds,
            codes: createdCodes,
            count: createdIds.length
        }, { status: 201 });

    } catch (error: any) {
        if (visitorPool) await visitorPool.query('ROLLBACK');
        console.error('Create interviewee request error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
