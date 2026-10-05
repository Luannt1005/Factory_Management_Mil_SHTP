import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Tooltip, CartesianGrid } from 'recharts';
import type { HeadcountDashboardFilter as EmployeeFilter } from '@/types/headcount.types';
import type { OrgNode } from '@/types/orgchart.types';
import { ChartCard, CHART_COLORS, chartGridProps, chartAxisProps, chartTooltipStyle } from '@/components/dashboard';

interface SeniorityChartProps {
    className?: string;
    onFilterChange?: (filter: EmployeeFilter) => void;
    nodes: OrgNode[];  // Required prop
    loading?: boolean;
}

// Shorter tenure bucket labels
const TENURE_BUCKETS = [
    { key: '< 3M', label: '< 3 months', min: 0, max: 3 },
    { key: '3-6M', label: '3-6 months', min: 3, max: 6 },
    { key: '6-12M', label: '6-12 months', min: 6, max: 12 },
    { key: '1-3Y', label: '1-3 years', min: 12, max: 36 },
    { key: '3-5Y', label: '3-5 years', min: 36, max: 60 },
    { key: '> 5Y', label: '> 5 years', min: 60, max: Infinity }
];

// Colors mapped to shared Chart Theme
const COLORS = {
    Staff: CHART_COLORS.accentPurple,  // Violet / Staff
    IDL: CHART_COLORS.accentSky        // Sky Blue / IDL
};

const SeniorityChart: React.FC<SeniorityChartProps> = ({ className, onFilterChange, nodes, loading = false }) => {
    // ... (lines 30-100 skipped for brevity, keeping same)
    // Data is now passed from parent - no more independent fetching
    const error = null; // Error handling moved to parent

    // Helper function to calculate months from joining date
    const calculateMonthsFromDate = (joiningDate: string | number): number => {
        if (!joiningDate) return 0;
        // ... (implementation of calculateMonthsFromDate)
        let startDate: Date;
        if (typeof joiningDate === "number" || /^\d+$/.test(String(joiningDate))) {
            const excelEpoch = new Date(1899, 11, 30);
            startDate = new Date(excelEpoch.getTime() + Number(joiningDate) * 86400000);
        } else if (String(joiningDate).includes("/")) {
            const [day, month, year] = String(joiningDate).split("/").map(Number);
            startDate = new Date(year, month - 1, day);
        } else {
            startDate = new Date(joiningDate);
        }
        if (isNaN(startDate.getTime())) return 0;
        const now = new Date();
        let years = now.getFullYear() - startDate.getFullYear();
        let months = now.getMonth() - startDate.getMonth();
        if (now.getDate() < startDate.getDate()) months--;
        if (months < 0) { years--; months += 12; }
        return years * 12 + months;
    };

    // Process data
    const chartData = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];
        const buckets = TENURE_BUCKETS.map(bucket => ({
            name: bucket.key,
            fullName: bucket.label,
            Staff: 0,
            IDL: 0,
            total: 0,
            min: bucket.min,
            max: bucket.max
        }));
        nodes.forEach((node) => {
            const joiningDate = node['Joining\r\n Date'] || node['Joining Date'] || '';
            if (!joiningDate) return;
            const dlIdlStaff = (node['DL/IDL/Staff'] || '').toLowerCase();
            const totalMonths = calculateMonthsFromDate(joiningDate);
            for (let i = 0; i < TENURE_BUCKETS.length; i++) {
                const bucket = TENURE_BUCKETS[i];
                if (totalMonths >= bucket.min && totalMonths < bucket.max) {
                    if (dlIdlStaff.includes('staff')) {
                        buckets[i].Staff++;
                    } else if (dlIdlStaff.includes('idl')) {
                        buckets[i].IDL++;
                    }
                    buckets[i].total = buckets[i].Staff + buckets[i].IDL;
                    break;
                }
            }
        });
        return buckets;
    }, [nodes]);

    const totalEmployees = chartData.reduce((sum, item) => sum + item.Staff + item.IDL, 0);

    // Compact legend
    const renderLegend = () => (
        <div className="flex justify-center gap-4 mb-2">
            <button
                className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
                onClick={() => onFilterChange?.({ type: 'staff', value: 'Staff', label: 'Type: Staff' })}
            >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.Staff }}></span>
                <span className="text-body font-medium">Staff</span>
            </button>
            <button
                className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
                onClick={() => onFilterChange?.({ type: 'idl', value: 'IDL', label: 'Type: IDL' })}
            >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.IDL }}></span>
                <span className="text-body font-medium">IDL</span>
            </button>
        </div>
    );

    return (
        <ChartCard
            className={className}
            kicker="TENURE DISTRIBUTION"
            title="Headcount by Tenure"
            action={renderLegend()}
            loading={loading}
            error={error}
        >
            <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 12, right: 10, left: 10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="staffGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_COLORS.accentPurple} stopOpacity={1} />
                                <stop offset="100%" stopColor={CHART_COLORS.accentPurpleLight} stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="idlGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_COLORS.accentSky} stopOpacity={1} />
                                <stop offset="100%" stopColor={CHART_COLORS.accentSkyLight} stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis
                            dataKey="name"
                            {...chartAxisProps}
                        />
                        <Tooltip
                            isAnimationActive={false}
                            contentStyle={chartTooltipStyle}
                            itemStyle={{ color: CHART_COLORS.text }}
                            formatter={(value, name) => [value, name]}
                            labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
                            labelStyle={{ color: CHART_COLORS.textMuted, fontWeight: 600, marginBottom: '4px' }}
                        />
                        <Bar
                            dataKey="Staff"
                            stackId="a"
                            fill="url(#staffGradient)"
                            radius={[0, 0, 0, 0]}
                            barSize={32}
                        >
                            <LabelList
                                dataKey="Staff"
                                position="inside"
                                style={{ fill: '#FFFFFF', fontWeight: 700, fontSize: 11 }}
                                formatter={(value) => (Number(value) > 0 ? value : '')}
                            />
                        </Bar>
                        <Bar
                            dataKey="IDL"
                            stackId="a"
                            fill="url(#idlGradient)"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        >
                            <LabelList
                                dataKey="IDL"
                                position="top"
                                offset={8}
                                style={{ fill: CHART_COLORS.text, fontWeight: 700, fontSize: 11 }}
                                formatter={(value) => (Number(value) > 0 ? value : '')}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
        </ChartCard>
    );
};

export default SeniorityChart;
