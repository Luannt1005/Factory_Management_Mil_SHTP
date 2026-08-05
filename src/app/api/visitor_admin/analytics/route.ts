export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getVisitorDbConnection } from '@/lib/visitor-db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { hasPageAccess } from '@/lib/auth-server';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await hasPageAccess('/visitoradmin'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const visitorPool = await getVisitorDbConnection();

        // 1. STAT CARDS
        // Visitors Today (Scheduled for today)
        const todayRes = await visitorPool.query(`
            SELECT COUNT(*) as count FROM (
                SELECT id FROM "VisitorRequest" WHERE DATE("startDate") = CURRENT_DATE
                UNION ALL
                SELECT id::text FROM "IntervieweeRequest" WHERE DATE("startDate") = CURRENT_DATE
            ) t
        `);
        const yesterdayRes = await visitorPool.query(`
            SELECT COUNT(*) as count FROM (
                SELECT id FROM "VisitorRequest" WHERE DATE("startDate") = CURRENT_DATE - 1
                UNION ALL
                SELECT id::text FROM "IntervieweeRequest" WHERE DATE("startDate") = CURRENT_DATE - 1
            ) t
        `);
        const visitorsToday = parseInt(todayRes.rows[0]?.count || 0);
        const visitorsYesterday = parseInt(yesterdayRes.rows[0]?.count || 0);
        const visitorsTodayGrowth = visitorsYesterday === 0 ? 100 : Math.round(((visitorsToday - visitorsYesterday) / visitorsYesterday) * 100);

        // Currently Present (Keep relying on CheckInOut for accuracy, but ensure request exists)
        const presentRes = await visitorPool.query(`
            SELECT COUNT(*) as count 
            FROM "VisitorCheckInOut" c
            LEFT JOIN "VisitorRequest" vr ON c."requestId" = vr.id
            LEFT JOIN "IntervieweeRequest" ir ON c."requestId" = ir.id::text
            WHERE c.status = 'CHECKED_IN' AND (vr.id IS NOT NULL OR ir.id IS NOT NULL)
        `);
        const currentlyPresent = parseInt(presentRes.rows[0]?.count || 0);

        // Total This Week (Scheduled for this week)
        const thisWeekRes = await visitorPool.query(`
            SELECT COUNT(*) as count FROM (
                SELECT id FROM "VisitorRequest" WHERE "startDate" >= date_trunc('week', CURRENT_DATE)
                UNION ALL
                SELECT id::text FROM "IntervieweeRequest" WHERE "startDate" >= date_trunc('week', CURRENT_DATE)
            ) t
        `);
        const lastWeekRes = await visitorPool.query(`
            SELECT COUNT(*) as count FROM (
                SELECT id FROM "VisitorRequest" WHERE "startDate" >= date_trunc('week', CURRENT_DATE - interval '1 week') AND "startDate" < date_trunc('week', CURRENT_DATE)
                UNION ALL
                SELECT id::text FROM "IntervieweeRequest" WHERE "startDate" >= date_trunc('week', CURRENT_DATE - interval '1 week') AND "startDate" < date_trunc('week', CURRENT_DATE)
            ) t
        `);
        const totalThisWeek = parseInt(thisWeekRes.rows[0]?.count || 0);
        const totalLastWeek = parseInt(lastWeekRes.rows[0]?.count || 0);
        const weekGrowth = totalLastWeek === 0 ? 100 : Math.round(((totalThisWeek - totalLastWeek) / totalLastWeek) * 100);

        // Average Stay Duration this week (Planned duration)
        const avgStayRes = await visitorPool.query(`
            SELECT AVG(EXTRACT(EPOCH FROM ("endDate" - "startDate"))/60) as avg_minutes
            FROM "VisitorRequest"
            WHERE "endDate" IS NOT NULL AND "startDate" >= date_trunc('week', CURRENT_DATE)
        `);
        const lastWeekAvgRes = await visitorPool.query(`
            SELECT AVG(EXTRACT(EPOCH FROM ("endDate" - "startDate"))/60) as avg_minutes
            FROM "VisitorRequest"
            WHERE "endDate" IS NOT NULL AND "startDate" >= date_trunc('week', CURRENT_DATE - interval '1 week') AND "startDate" < date_trunc('week', CURRENT_DATE)
        `);
        const avgStayMinutes = Math.round(parseFloat(avgStayRes.rows[0]?.avg_minutes || 0));
        const avgStayLastWeek = Math.round(parseFloat(lastWeekAvgRes.rows[0]?.avg_minutes || 0));
        const avgStayChange = avgStayMinutes - avgStayLastWeek;

        const summary = {
            visitorsToday,
            visitorsTodayGrowth,
            currentlyPresent,
            totalThisWeek,
            weekGrowth,
            avgStayMinutes,
            avgStayChange
        };

        // 2. TREND DATA
        const trendRes = await visitorPool.query(`
            SELECT 'Tuần ' || ROW_NUMBER() OVER(ORDER BY date_trunc('week', "startDate")) as label, COUNT(*) as value
            FROM (
                SELECT "startDate" FROM "VisitorRequest" WHERE "startDate" >= CURRENT_DATE - interval '7 weeks'
                UNION ALL
                SELECT "startDate" FROM "IntervieweeRequest" WHERE "startDate" >= CURRENT_DATE - interval '7 weeks'
            ) t
            GROUP BY date_trunc('week', "startDate")
            ORDER BY date_trunc('week', "startDate")
        `);
        const trendData = trendRes.rows;

        // 3. PERIODIC DATA
        const periodicRes = await visitorPool.query(`
            SELECT 'T' || EXTRACT(ISODOW FROM "startDate") + 1 as label, COUNT(*) as value
            FROM (
                SELECT "startDate" FROM "VisitorRequest" WHERE "startDate" >= date_trunc('week', CURRENT_DATE)
                UNION ALL
                SELECT "startDate" FROM "IntervieweeRequest" WHERE "startDate" >= date_trunc('week', CURRENT_DATE)
            ) t
            GROUP BY EXTRACT(ISODOW FROM "startDate")
            ORDER BY EXTRACT(ISODOW FROM "startDate")
        `);
        
        const periodicData = [];
        for (let i = 2; i <= 8; i++) {
            const label = i === 8 ? 'CN' : 'T' + i;
            const match = periodicRes.rows.find(r => r.label === 'T' + i);
            periodicData.push({ label, value: match ? parseInt(match.value) : 0 });
        }

        // 4. CATEGORY DISTRIBUTION
        const categoryRes = await visitorPool.query(`
            SELECT category, COUNT(*) as count FROM (
                SELECT COALESCE("visitorCategory", 'Other') as category FROM "VisitorRequest"
                UNION ALL
                SELECT 'Interviewee' as category FROM "IntervieweeRequest"
            ) t
            GROUP BY category
        `);
        let categoryData = categoryRes.rows.map(r => ({
            name: r.category,
            value: parseInt(r.count)
        })).filter(c => c.name !== 'Other');

        const nameMap: Record<string, string> = {
            'MIL/TTI Expat / SHTP Business trip': 'MIL-TTI Expat',
            'Vendor': 'Vendor',
            'Contractor': 'Contractor',
            'Interviewee': 'Interviewee'
        };
        categoryData = categoryData.map(c => ({ ...c, name: nameMap[c.name] || c.name }));

        const totalCategories = categoryData.reduce((sum, item) => sum + item.value, 0);
        categoryData = categoryData.map(c => ({
            ...c, percentage: totalCategories > 0 ? Math.round((c.value / totalCategories) * 100) : 0
        }));

        // 5. DEPARTMENT & BU DISTRIBUTION
        const deptRes = await visitorPool.query(`
            SELECT 
                COALESCE(u.department, 'Others') as department,
                CASE 
                    WHEN u.name LIKE '%VN.MIL%' OR u.name NOT LIKE '%(%)%' THEN 'MIL'
                    ELSE 'SF'
                END as bu,
                COUNT(*) as count
            FROM (
                SELECT id, "submitterId", null as "osName" FROM "VisitorRequest"
                UNION ALL
                SELECT id::text as id, null as "submitterId", "osName" FROM "IntervieweeRequest"
            ) req
            LEFT JOIN "User" u ON u.id = req."submitterId" OR u.name = req."osName"
            GROUP BY 1, 2
        `);

        const deptMap: Record<string, any> = {};
        deptRes.rows.forEach(r => {
            const dept = r.department || 'Others';
            if (!deptMap[dept]) deptMap[dept] = { name: dept, MIL: 0, SF: 0, total: 0 };
            const count = parseInt(r.count) || 0;
            if (r.bu === 'MIL') deptMap[dept].MIL += count;
            else deptMap[dept].SF += count;
            deptMap[dept].total += count;
        });

        const departmentData = Object.values(deptMap).sort((a: any, b: any) => b.total - a.total).slice(0, 7);

        let totalMIL = 0, totalSF = 0;
        Object.values(deptMap).forEach((d: any) => { totalMIL += d.MIL; totalSF += d.SF; });
        const buDistribution = [ { name: 'MIL', value: totalMIL }, { name: 'SF', value: totalSF } ];

        // 6. RECENT ACTIVITY
        const recentRes = await visitorPool.query(`
            SELECT 
                "visitorName" as name,
                status,
                "createdAt" as time,
                COALESCE("visitorCategory", 'Other') as category,
                'Visitor' as type
            FROM "VisitorRequest"
            UNION ALL
            SELECT 
                "intervieweeName" as name,
                status,
                "createdAt" as time,
                'Interviewee' as category,
                'Interviewee' as type
            FROM "IntervieweeRequest"
            ORDER BY time DESC
            LIMIT 20
        `);

        const uniqueRecent = recentRes.rows.map(row => ({
            name: row.name,
            details: `Đơn đăng ký mới - ${nameMap[row.category] || row.category}`,
            status: row.status,
            time: new Date(row.time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        }));

        return NextResponse.json({ 
            summary, trendData, periodicData, categoryData, departmentData, buDistribution, recentActivity: uniqueRecent
        }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
