import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const session = await decrypt(token);
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const visitorPool = await getVisitorDbConnection();

        // 1. Weekly Trends (Last 7 days)
        const weeklyQuery = `
            SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
            FROM "VisitorRequest"
            WHERE "createdAt" >= current_date - interval '7 days'
            GROUP BY DATE_TRUNC('day', "createdAt")
            ORDER BY date
        `;
        const { rows: weeklyRows } = await visitorPool.query(weeklyQuery);
        const weeklyData = weeklyRows.map(r => ({
            date: new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            count: parseInt(r.count)
        }));

        // 2. Monthly Trends (Last 6 months)
        const monthlyQuery = `
            SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
            FROM "VisitorRequest"
            WHERE "createdAt" >= current_date - interval '6 months'
            GROUP BY DATE_TRUNC('month', "createdAt")
            ORDER BY month
        `;
        const { rows: monthlyRows } = await visitorPool.query(monthlyQuery);
        const monthlyData = monthlyRows.map(r => ({
            month: new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            count: parseInt(r.count)
        }));

        // 3. Category Distribution
        const categoryQuery = `
            SELECT "visitorCategory" as category, COUNT(*) as count
            FROM "VisitorRequest"
            GROUP BY "visitorCategory"
        `;
        const { rows: categoryRows } = await visitorPool.query(categoryQuery);
        const categoryData = categoryRows.map(r => ({
            name: r.category,
            value: parseInt(r.count)
        }));

        // 4. Status Distribution
        const statusQuery = `
            SELECT status, COUNT(*) as count
            FROM "VisitorRequest"
            GROUP BY status
        `;
        const { rows: statusRows } = await visitorPool.query(statusQuery);
        const statusData = statusRows.map(r => ({
            name: r.status,
            value: parseInt(r.count)
        }));

        // 5. Total counts this week vs last week (simplified to just last 7 days vs previous 7 days)
        const currentWeekCount = weeklyRows.reduce((sum, r) => sum + parseInt(r.count), 0);
        
        const lastWeekQuery = `
            SELECT COUNT(*) as count
            FROM "VisitorRequest"
            WHERE "createdAt" >= current_date - interval '14 days' 
              AND "createdAt" < current_date - interval '7 days'
        `;
        const { rows: lastWeekRows } = await visitorPool.query(lastWeekQuery);
        const lastWeekCount = parseInt(lastWeekRows[0].count);

        const totalQuery = `SELECT COUNT(*) as sum FROM "VisitorRequest"`;
        const { rows: totalRows } = await visitorPool.query(totalQuery);
        
        const summary = {
            totalRequests: parseInt(totalRows[0].sum),
            currentWeekCount,
            lastWeekCount,
            growth: lastWeekCount === 0 ? 100 : Math.round(((currentWeekCount - lastWeekCount) / lastWeekCount) * 100)
        };

        return NextResponse.json({ 
            weeklyData,
            monthlyData,
            categoryData,
            statusData,
            summary
        }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
