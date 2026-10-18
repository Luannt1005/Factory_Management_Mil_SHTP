export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { HikCentralError, isHikCentralConfigured, listAccessLevels, listOrgs } from '@/lib/hikcentral/client';
import type { AccessOptionsResponse } from '@/types/visitor-access.types';
import { authorizeAccessDoor } from '../_shared';

/**
 * GET /api/visitor_admin/access/options
 * Live departments and access levels from HikCentral (also serves as the connection test).
 */
export async function GET() {
    const auth = await authorizeAccessDoor();
    if ('error' in auth) return auth.error;

    const response: AccessOptionsResponse = { configured: isHikCentralConfigured(), orgs: [], accessLevels: [], errors: {} };
    if (!response.configured) {
        response.errors.orgs = 'HikCentral is not configured (HIKCENTRAL_* in .env.local)';
        return NextResponse.json(response, { status: 200 });
    }

    const describe = (err: unknown, part: string) => {
        if (err instanceof HikCentralError) return err.message;
        console.error(`[access-door] options ${part} error:`, err);
        return 'Unexpected error, see the server log';
    };

    const [orgs, levels] = await Promise.allSettled([listOrgs(), listAccessLevels()]);
    if (orgs.status === 'fulfilled') response.orgs = orgs.value;
    else response.errors.orgs = describe(orgs.reason, 'orgs');
    if (levels.status === 'fulfilled') response.accessLevels = levels.value;
    else response.errors.accessLevels = describe(levels.reason, 'levels');

    return NextResponse.json(response, { status: 200 });
}
