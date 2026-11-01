import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { HeadcountDashboardFilter as EmployeeFilter } from '@/types/headcount.types';
import type { OrgNode } from '@/types/orgchart.types';
import { ChartCard, CHART_COLORS, chartTooltipStyle } from '@/components/dashboard';

interface DonutChartProps {
    className?: string;
    onFilterChange?: (filter: EmployeeFilter) => void;
    nodes: OrgNode[];  // Required prop
    loading?: boolean;
}

// Same palette as the visitor analytics (MIL red / Share Function charcoal)
const TYPE_COLORS: Record<string, string> = {
    Staff: CHART_COLORS.primary,
    IDL: CHART_COLORS.secondary,
    DL: CHART_COLORS.axis,
};

const DonutChart: React.FC<DonutChartProps> =({ className, onFilterChange, nodes, loading = false }) => {
    // Calculate counts by type
    const chartData = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];

        const counts = { Staff: 0, IDL: 0, DL: 0 };

        nodes.forEach((node) => {
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
    const renderCustomizedLabel = (props: PieLabelRenderProps) => {
        const { cx, cy, innerRadius, outerRadius, value, name } = props;
        const midAngle = props.midAngle ?? 0;
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
            subtitle="Staff, IDL and DL proportion of the headcount"
            loading={loading}
            empty={!chartData || chartData.length === 0}
            emptyMessage="No data available"
            contentClassName="flex-1 flex flex-col items-center justify-center"
        >
            <div className="relative w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            stroke="none"
                            paddingAngle={2}
                            dataKey="value"
                            animationDuration={600}
                            labelLine={false}
                            label={renderCustomizedLabel}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={TYPE_COLORS[entry.name] ?? CHART_COLORS.axis}
                                    style={{ outline: 'none', cursor: 'pointer' }}
                                    onClick={() => onFilterChange?.({ type: 'type', value: entry.name, label: `Type: ${entry.value}` })}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            isAnimationActive={false}
                            contentStyle={chartTooltipStyle}
                            itemStyle={{ color: CHART_COLORS.text }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">{total.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total</div>
                </div>
            </div>

            {/* Legend (click to filter) */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-2 w-full">
                {chartData.map((entry) => (
                    <button
                        key={entry.name}
                        type="button"
                        className="flex items-center gap-2 text-xs font-semibold text-slate-800 hover:opacity-70 transition-opacity cursor-pointer"
                        onClick={() => onFilterChange?.({ type: 'type', value: entry.name, label: `Type: ${entry.name}` })}
                    >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[entry.name] ?? CHART_COLORS.axis }}></span>
                        {entry.name} — <span className="font-bold text-slate-900">{entry.value}</span>
                        <span className="text-slate-400 font-medium">({entry.percentage}%)</span>
                    </button>
                ))}
            </div>
        </ChartCard>
    );
};

export default DonutChart;
