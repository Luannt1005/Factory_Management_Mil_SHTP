export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';

export async function POST(request: Request) {
    let visitorPool;
    try {
        const body = await request.json();
        const { approval_id, approver_email } = body;

        if (!approval_id || !approver_email) {
            return NextResponse.json({ error: 'Missing approval_id or approver_email' }, { status: 400 });
        }

        visitorPool = await getVisitorDbConnection();
        
        // Update the approver email for the specific approval record
        const { rowCount } = await visitorPool.query(
            'UPDATE "RequestApproval" SET "approverEmail" = $1 WHERE id = $2',
            [approver_email, approval_id]
        );

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Approval record not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Approver email updated successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Update approver error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
