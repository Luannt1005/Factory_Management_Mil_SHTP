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
        const url = new URL(request.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const bu = url.searchParams.get('bu');
        const status = url.searchParams.get('status');

        let whereConditions = ["1=1"];
        if (startDate) whereConditions.push(`"startDate" >= '${startDate}'`);
        if (endDate) whereConditions.push(`"startDate" <= '${endDate}'`);
        if (status && status !== 'all') whereConditions.push(`status = '${status}'`);
        if (bu && bu !== 'all') whereConditions.push(`bu = '${bu}'`);
        
        const whereClause = whereConditions.join(" AND ");

        // Common CTE
        const cte = `
            WITH BaseReqs AS (
                SELECT 
                    vr.id::text as id, 
                    vr."startDate", 
                    vr."endDate",
                    vr.status, 
                    vr."createdAt", 
                    COALESCE(vr."visitorCategory", 'Other') as category,
                    vr."visitorName" as name,
                    CASE WHEN u.name LIKE '%VN.MIL%' OR u.name NOT LIKE '%(%)%' THEN 'MIL' ELSE 'SF' END as bu,
                    COALESCE(u.department, 'Others') as department,
                    'Visitor' as type
                FROM "VisitorRequest" vr
                LEFT JOIN "User" u ON u.id = vr."submitterId"
                
                UNION ALL
                
                SELECT 
                    ir.id::text as id, 
                    ir."startDate", 
                    ir."endDate",
                    ir.status, 
                    ir."createdAt", 
                    'Interviewee' as category,
                    ir."intervieweeName" as name,
                    CASE WHEN u.name LIKE '%VN.MIL%' OR u.name NOT LIKE '%(%)%' THEN 'MIL' ELSE 'SF' END as bu,
                    COALESCE(u.department, 'Others') as department,
                    'Interviewee' as type
                FROM "IntervieweeRequest" ir
                LEFT JOIN "User" u ON u.name = ir."osName"
            )
        `;

        // 1. STAT CARDS
        // Visitors Today (Scheduled for today, filtered)
        const todayRes = await visitorPool.query(`${cte} SELECT COUNT(*) as count FROM BaseReqs WHERE DATE("startDate") = CURRENT_DATE AND ${whereClause}`);
        const yesterdayRes = await visitorPool.query(`${cte} SELECT COUNT(*) as count FROM BaseReqs WHERE DATE("startDate") = CURRENT_DATE - 1 AND ${whereClause}`);
        
        const visitorsToday = parseInt(todayRes.rows[0]?.count || 0);
        const visitorsYesterday = parseInt(yesterdayRes.rows[0]?.count || 0);
        const visitorsTodayGrowth = visitorsYesterday === 0 ? 100 : Math.round(((visitorsToday - visitorsYesterday) / visitorsYesterday) * 100);

        // Currently Present
        // Note: For 'currently present', the date filters might not apply the same way, but we will apply the BU and status filters if applicable.
        // Actually, we'll apply all filters to the base request, then join.
        const presentRes = await visitorPool.query(`
            ${cte}
            SELECT COUNT(*) as count 
            FROM "VisitorCheckInOut" c
            INNER JOIN BaseReqs req ON c."requestId" = req.id
            WHERE c.status = 'CHECKED_IN' AND ${whereClause}
        `);
        const currentlyPresent = parseInt(presentRes.rows[0]?.count || 0);

        // Total This Week
        const thisWeekRes = await visitorPool.query(`${cte} SELECT COUNT(*) as count FROM BaseReqs WHERE "startDate" >= date_trunc('week', CURRENT_DATE) AND ${whereClause}`);
        const lastWeekRes = await visitorPool.query(`${cte} SELECT COUNT(*) as count FROM BaseReqs WHERE "startDate" >= date_trunc('week', CURRENT_DATE - interval '1 week') AND "startDate" < date_trunc('week', CURRENT_DATE) AND ${whereClause}`);
        const totalThisWeek = parseInt(thisWeekRes.rows[0]?.count || 0);
        const totalLastWeek = parseInt(lastWeekRes.rows[0]?.count || 0);
        const weekGrowth = totalLastWeek === 0 ? 100 : Math.round(((totalThisWeek - totalLastWeek) / totalLastWeek) * 100);

        // Average Stay Duration this week
        const avgStayRes = await visitorPool.query(`${cte} SELECT AVG(EXTRACT(EPOCH FROM ("endDate" - "startDate"))/60) as avg_minutes FROM BaseReqs WHERE "endDate" IS NOT NULL AND "startDate" >= date_trunc('week', CURRENT_DATE) AND ${whereClause}`);
        const lastWeekAvgRes = await visitorPool.query(`${cte} SELECT AVG(EXTRACT(EPOCH FROM ("endDate" - "startDate"))/60) as avg_minutes FROM BaseReqs WHERE "endDate" IS NOT NULL AND "startDate" >= date_trunc('week', CURRENT_DATE - interval '1 week') AND "startDate" < date_trunc('week', CURRENT_DATE) AND ${whereClause}`);
        const avgStayMinutes = Math.round(parseFloat(avgStayRes.rows[0]?.avg_minutes || 0));
        const avgStayLastWeek = Math.round(parseFloat(lastWeekAvgRes.rows[0]?.avg_minutes || 0));
        const avgStayChange = avgStayMinutes - avgStayLastWeek;

        const summary = {
            visitorsToday, visitorsTodayGrowth,
            currentlyPresent,
            totalThisWeek, weekGrowth,
            avgStayMinutes, avgStayChange
        };

        // 2. TREND DATA
        const trendRes = await visitorPool.query(`${cte} 
            SELECT 'Tuần ' || ROW_NUMBER() OVER(ORDER BY date_trunc('week', "startDate")) as label, COUNT(*) as value
            FROM BaseReqs 
            WHERE "startDate" >= CURRENT_DATE - interval '7 weeks' AND ${whereClause}
            GROUP BY date_trunc('week', "startDate")
            ORDER BY date_trunc('week', "startDate")
        `);
        const trendData = trendRes.rows;

        // 3. PERIODIC DATA
        const periodicRes = await visitorPool.query(`${cte}
            SELECT 'T' || EXTRACT(ISODOW FROM "startDate") + 1 as label, COUNT(*) as value
            FROM BaseReqs 
            WHERE "startDate" >= date_trunc('week', CURRENT_DATE) AND ${whereClause}
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
        const categoryRes = await visitorPool.query(`${cte}
            SELECT category, COUNT(*) as count 
            FROM BaseReqs WHERE ${whereClause}
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
        const deptRes = await visitorPool.query(`${cte}
            SELECT department, bu, COUNT(*) as count
            FROM BaseReqs WHERE ${whereClause}
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
        const buDistribution = [ { name: 'MIL', value: totalMIL }, { name: 'Share Function', value: totalSF } ];

        // 6. RECENT ACTIVITY
        const recentRes = await visitorPool.query(`${cte}
            SELECT name, status, "createdAt" as time, category, type
            FROM BaseReqs WHERE ${whereClause}
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
