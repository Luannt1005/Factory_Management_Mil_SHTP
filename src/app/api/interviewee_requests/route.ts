import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(request: Request) {
    let visitorPool;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const {
            intervieweeName, jobTitle, interviewDepartment, interviewerName,
            startDate, startTime, interviewArea
        } = body;

        visitorPool = await getVisitorDbConnection();

        await visitorPool.query('BEGIN');

        // Generate Custom ID: V_DDMMYY_N
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const datePrefix = `V_${dd}${mm}${yy}`;

        // Find the last sequence for today
        const { rows: lastReq } = await visitorPool.query(
            `SELECT "visitorCode" FROM "IntervieweeRequest" WHERE "visitorCode" LIKE $1 ORDER BY "visitorCode" DESC LIMIT 1`,
            [`${datePrefix}_%`]
        );

        let sequence = 1;
        if (lastReq.length > 0) {
            const lastId = lastReq[0].visitorCode;
            const lastSeqStr = lastId.split('_')[2];
            if (lastSeqStr) {
                sequence = parseInt(lastSeqStr) + 1;
            }
        }
        
        const newVisitorCode = `${datePrefix}_${String(sequence).padStart(2, '0')}`;

        const osName = (session.user as any).full_name || (session.user as any).username || session.user.email;

        const { rows: intervieweeRequests } = await visitorPool.query(
            `INSERT INTO "IntervieweeRequest" 
             ("visitorCode", "osName", "intervieweeName", "jobTitle", "interviewDepartment", "interviewerName", "startDate", "startTime", "interviewArea", status, "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'IN PROCESS', NOW())
             RETURNING id`,
            [newVisitorCode, osName, intervieweeName, jobTitle, interviewDepartment, interviewerName, new Date(startDate), startTime, interviewArea]
        );

        await visitorPool.query('COMMIT');
        return NextResponse.json({ message: 'Request created successfully', id: intervieweeRequests[0].id }, { status: 201 });

    } catch (error: any) {
        if (visitorPool) await visitorPool.query('ROLLBACK');
        console.error('Create interviewee request error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
