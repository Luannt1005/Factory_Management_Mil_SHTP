import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Tooltip, CartesianGrid } from 'recharts';
import type { OrgNode } from '@/types/orgchart.types';
import { ChartCard, CHART_COLORS, chartGridProps, chartTooltipStyle } from '@/components/dashboard';

interface BUOrg3ChartProps {
    className?: string;
    nodes: OrgNode[];  // Required prop
    loading?: boolean;
}

const BUOrg3Chart: React.FC<BUOrg3ChartProps> = ({ className, nodes, loading = false }) => {
    // Data is now passed from parent - no more independent fetching
    const error = null; // Error handling moved to parent

    // Process data: group by BU Org 3
    const chartData = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];

        const groupedData: Record<string, number> = {};

        nodes.forEach((node) => {
            // Use 'BU Org 3' from Supabase API, fallback to 'Dept' if not available
            const buOrg3 = node['BU Org 3'] || node['BU Org 3 '] || node['Dept'] || node['dept'] || 'Unknown';
            if (!groupedData[buOrg3]) groupedData[buOrg3] = 0;
            groupedData[buOrg3]++;
        });

        // Return all departments
        return Object.entries(groupedData)
            .map(([name, count]) => ({
                // Truncate less aggressively: 25 chars
                name: name.length > 25 ? name.slice(0, 25) + '...' : name,
                fullName: name,
                count
            }))
            .filter(item => item.fullName !== 'Unknown' && item.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [nodes]);

    return (
        <ChartCard
            className={className}
            kicker="DEPARTMENT ALLOCATION"
            title="Departments (BU Org 3)"
            action={
                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                    {chartData.length} depts
                </span>
            }
            loading={loading}
            empty={!chartData || chartData.length === 0}
            emptyMessage="No department data"
        >
            <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 25, right: 10, left: 10, bottom: 60 }}
                    >
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_COLORS.accentBlue} stopOpacity={1} />
                                <stop offset="100%" stopColor={CHART_COLORS.accentIndigo} stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid {...chartGridProps} />
                        <YAxis hide domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15) + 2]} />
                        <XAxis
                            dataKey="name"
                            angle={-35}
                            textAnchor="end"
                            height={60}
                            interval={0}
                            tick={{
                                fill: CHART_COLORS.axis,
                                fontSize: 11,
                                fontWeight: 600
                            }}
                            axisLine={{ stroke: CHART_COLORS.axisLine }}
                            tickLine={false}
                        />
                        <Tooltip
                            isAnimationActive={false}
                            contentStyle={chartTooltipStyle}
                            itemStyle={{ color: CHART_COLORS.text }}
                            formatter={(value) => [value ?? 0, 'Employees']}
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                            labelStyle={{ color: CHART_COLORS.textMuted, fontWeight: 600, marginBottom: '4px' }}
                        />
                        <Bar
                            dataKey="count"
                            fill="url(#barGradient)"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        >
                            <LabelList
                                dataKey="count"
                                position="top"
                                offset={10}
                                style={{ fill: CHART_COLORS.text, fontWeight: 700, fontSize: 11 }}
                                formatter={(val) => (Number(val) > 0 ? val : '')}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
        </ChartCard>
    );
};

export default BUOrg3Chart;
