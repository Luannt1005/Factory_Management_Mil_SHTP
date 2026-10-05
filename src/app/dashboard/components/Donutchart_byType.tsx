import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { EmployeeFilter } from '../page';
import type { OrgNode } from '@/types/orgchart.types';
import { ChartCard, CHART_COLORS, chartTooltipStyle } from '@/components/dashboard';

interface DonutChartProps {
    className?: string;
    onFilterChange?: (filter: EmployeeFilter) => void;
    nodes: OrgNode[];  // Required prop
    loading?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({ className, onFilterChange, nodes, loading = false }) => {
    // Calculate counts by type
    const chartData = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];

        const counts = { Staff: 0, IDL: 0, DL: 0 };

        nodes.forEach((node: any) => {
            const dlIdlStaff = (node['DL/IDL/Staff'] || '').toLowerCase();
            if (dlIdlStaff.includes('staff')) {
                counts.Staff++;
            } else if (dlIdlStaff.includes('idl')) {
                counts.IDL++;
            } else {
                counts.DL++;
            }
        });

        const total = counts.Staff + counts.IDL + counts.DL;

        return [
            { name: 'Staff', value: counts.Staff, percentage: total > 0 ? Math.round((counts.Staff / total) * 100) : 0 },
            { name: 'IDL', value: counts.IDL, percentage: total > 0 ? Math.round((counts.IDL / total) * 100) : 0 },
            { name: 'DL', value: counts.DL, percentage: total > 0 ? Math.round((counts.DL / total) * 100) : 0 }
        ].filter(item => item.value > 0);
    }, [nodes]);

    // Professional Label with Elbow Line
    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, value, name } = props;
        const RADIAN = Math.PI / 180;
        
        // Start point at donut edge
        const sx = cx + outerRadius * Math.cos(-midAngle * RADIAN);
        const sy = cy + outerRadius * Math.sin(-midAngle * RADIAN);
        
        // Middle point (elbow)
        const mx = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
        const my = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
        
        // End point (horizontal extension)
        const ex = mx + (Math.cos(-midAngle * RADIAN) >= 0 ? 1 : -1) * 20;
        const ey = my;
        
        const textAnchor = Math.cos(-midAngle * RADIAN) >= 0 ? 'start' : 'end';

        return (
            <g>
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={CHART_COLORS.axisLine} fill="none" strokeWidth={1} />
                <circle cx={ex} cy={ey} r={2} fill={CHART_COLORS.axis} stroke="none" />
                <text 
                    x={ex + (Math.cos(-midAngle * RADIAN) >= 0 ? 1 : -1) * 8}
                    y={ey}
                    textAnchor={textAnchor}
                    fill={CHART_COLORS.text}
                    dominantBaseline="central"
                    className="text-[12px] font-bold"
                >
                    {value}
                </text>
            </g>
        );
    };

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <ChartCard
            className={className}
            kicker="WORKFORCE COMPOSITION"
            title="Employee Type"
            loading={loading}
            empty={!chartData || chartData.length === 0}
            emptyMessage="No data available"
            contentClassName="flex-1 min-h-0 relative"
        >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            <linearGradient id="gradStaff" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_COLORS.accentPurple} stopOpacity={1} />
                                <stop offset="100%" stopColor={CHART_COLORS.accentPurpleLight} stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradIDL" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_COLORS.accentSky} stopOpacity={1} />
                                <stop offset="100%" stopColor={CHART_COLORS.accentSkyLight} stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradDL" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_COLORS.accentBlue} stopOpacity={1} />
                                <stop offset="100%" stopColor={CHART_COLORS.accentBlueLight} stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="55%"
                            outerRadius="75%"
                            paddingAngle={3}
                            dataKey="value"
                            animationDuration={600}
                            labelLine={false}
                            label={renderCustomizedLabel}
                        >
                            {chartData.map((entry, index) => {
                                let fillUrl = 'url(#gradDL)';
                                if (entry.name === 'Staff') fillUrl = 'url(#gradStaff)';
                                else if (entry.name === 'IDL') fillUrl = 'url(#gradIDL)';

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={fillUrl}
                                        style={{ outline: 'none', cursor: 'pointer' }}
                                        onClick={() => onFilterChange?.({ type: 'type', value: entry.name, label: `Type: ${entry.name}` })}
                                    />
                                );
                            })}
                        </Pie>
                        <Tooltip
                            isAnimationActive={false}
                            contentStyle={chartTooltipStyle}
                            itemStyle={{ color: CHART_COLORS.text }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            content={({ payload }) => (
                                <div className="flex justify-center gap-6 mt-4">
                                    {payload?.map((entry: any, index: number) => {
                                        const data = chartData.find(d => d.name === entry.value);
                                        let dotColor: string = CHART_COLORS.accentBlue;
                                        if (entry.value === 'Staff') dotColor = CHART_COLORS.accentPurple;
                                        if (entry.value === 'IDL') dotColor = CHART_COLORS.accentSky;

                                        return (
                                            <button
                                                key={`legend-${index}`}
                                                className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity"
                                                onClick={() => onFilterChange?.({ type: 'type', value: entry.value, label: `Type: ${entry.name}` })}
                                            >
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor }}></span>
                                                <span className="text-slate-800 font-bold">{entry.value}</span>
                                                <span className="text-slate-500 font-medium">({data?.value} - {data?.percentage}%)</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute top-[50%] left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                    <div className="text-3xl font-bold text-title tracking-tight">{total}</div>
                    <div className="text-[11px] text-muted font-bold uppercase tracking-[0.1em] mt-0.5">Total</div>
                </div>
        </ChartCard>
    );
};

export default DonutChart;
