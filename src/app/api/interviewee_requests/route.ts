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

        const powerAutomateNotificationUrl = process.env.POWER_AUTOMATE_EMAIL_NOTIFICATION_URL;

        const body = await request.json();
        const {
            intervieweeName, jobTitle, interviewDepartment, interviewerName,
            startDate, startTime, interviewArea
        } = body;

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
            const lastSeqStr = lastId.split('_')[1]; // Fixed from [2] to [1]
            if (lastSeqStr) {
                sequence = parseInt(lastSeqStr) + 1;
            }
        }
        
        const newVisitorCode = `${datePrefix}_${String(sequence).padStart(2, '0')}`;

        const osName = session.user.name || (session.user as any).full_name || (session.user as any).username || session.user.email;

        const { rows: intervieweeRequests } = await visitorPool.query(
            `INSERT INTO "IntervieweeRequest" 
             ("visitorCode", "osName", "intervieweeName", "jobTitle", "interviewDepartment", "interviewerName", "startDate", "startTime", "interviewArea", status, "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'COMPLETE', NOW())
             RETURNING id`,
            [newVisitorCode, osName, intervieweeName, jobTitle, interviewDepartment, interviewerName, new Date(startDate), startTime, interviewArea]
        );

        await visitorPool.query('COMMIT');

        // Trigger email notification webhook if configured
        if (powerAutomateNotificationUrl) {
            try {
                const paResponse = await fetch(powerAutomateNotificationUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        record_type: 'new_interviewee_request_notification',
                        request_id: newVisitorCode, 
                        visitor_category: 'Interviewee',
                        submitter_name: osName,
                        submitter_email: formatEmail(session.user.email || (session.user as any).username),
                        start_date: startDate,
                        visitor_name: intervieweeName,
                        job_title: jobTitle,
                        interview_department: interviewDepartment
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

        return NextResponse.json({ message: 'Request created successfully', id: intervieweeRequests[0].id }, { status: 201 });

    } catch (error: any) {
        if (visitorPool) await visitorPool.query('ROLLBACK');
        console.error('Create interviewee request error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
