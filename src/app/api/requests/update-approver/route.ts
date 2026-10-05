export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';

export async function POST(request: Request) {
    let visitorPool;
    try {
        const body = await request.json();
        const { approval_id, approver_email, run_id, power_automate_run_id, request_id, requestId } = body;
        const effectiveRunId = power_automate_run_id || run_id;
        const effectiveRequestId = request_id || requestId;

        if (!approval_id && !effectiveRequestId && !approver_email && !effectiveRunId) {
            return NextResponse.json({
                error: 'Missing required fields (approval_id, approver_email, request_id, or power_automate_run_id)'
            }, { status: 400 });
        }

        visitorPool = await getVisitorDbConnection();

        let updatedApprover = false;
        let updatedRunId = false;

        // 1. Update approver email if approval_id and approver_email provided
        if (approval_id && approver_email) {
            const { rowCount } = await visitorPool.query(
                'UPDATE "RequestApproval" SET "approverEmail" = $1, "updatedAt" = NOW() WHERE id = $2',
                [approver_email, approval_id]
            );
            if (rowCount && rowCount > 0) {
                updatedApprover = true;
            }
        }

        // 2. Update power_automate_run_id if provided
        if (effectiveRunId) {
            if (effectiveRequestId) {
                const { rowCount } = await visitorPool.query(
                    'UPDATE "VisitorRequest" SET power_automate_run_id = $1, "updatedAt" = NOW() WHERE id = $2',
                    [effectiveRunId, effectiveRequestId]
                );
                if (rowCount && rowCount > 0) {
                    updatedRunId = true;
                }
            } else if (approval_id) {
                const { rowCount } = await visitorPool.query(
                    `UPDATE "VisitorRequest"
                     SET power_automate_run_id = $1, "updatedAt" = NOW()
                     WHERE id = (SELECT "requestId" FROM "RequestApproval" WHERE id = $2)`,
                    [effectiveRunId, approval_id]
                );
                if (rowCount && rowCount > 0) {
                    updatedRunId = true;
                }
            }
        }

        if (!updatedApprover && !updatedRunId) {
            return NextResponse.json({
                error: 'No matching records updated. Check approval_id or request_id.'
            }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Updated successfully',
            updated_approver: updatedApprover,
            updated_run_id: updatedRunId
        }, { status: 200 });

    } catch (error) {
        console.error('Update approver / run id error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
