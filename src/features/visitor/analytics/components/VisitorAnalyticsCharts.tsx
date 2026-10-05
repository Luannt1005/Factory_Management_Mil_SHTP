import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import type { AnalyticsTrendItem, AnalyticsBUDistributionItem } from '@/types/visitor-analytics.types';
import { ChartCard, CHART_COLORS, chartGridProps, chartAxisProps, chartTooltipStyle } from '@/components/dashboard';

interface VisitorAnalyticsChartsProps {
    trendData: AnalyticsTrendItem[];
    buDistribution: AnalyticsBUDistributionItem[];
}

const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary];

export default function VisitorAnalyticsCharts({ trendData, buDistribution }: VisitorAnalyticsChartsProps) {
    const milVisits = buDistribution.find((b) => b.name === 'MIL')?.value || 0;
    const sfVisits = buDistribution.find((b) => b.name === 'Share Function')?.value || 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <ChartCard
                className="lg:col-span-2"
                kicker="VISITORS OVER TIME"
                title="Visitor Trends"
                subtitle="Daily visitor activity trend over the period"
            >
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid {...chartGridProps} />
                            <XAxis
                                dataKey="label"
                                {...chartAxisProps}
                                dy={6}
                            />
                            <YAxis
                                {...chartAxisProps}
                            />
                            <Tooltip
                                isAnimationActive={false}
                                contentStyle={chartTooltipStyle}
                                itemStyle={{ color: CHART_COLORS.text }}
                                formatter={(value) => [value, 'Visitors']}
                                labelStyle={{ color: CHART_COLORS.textMuted, fontWeight: 600, marginBottom: '4px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={CHART_COLORS.primary}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            <ChartCard
                kicker="BU DISTRIBUTION"
                title="MIL & Share Function"
                subtitle="Visitor proportion by business unit"
                contentClassName="flex-1 flex flex-col items-center justify-center relative -mt-2"
            >
                <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                        <Pie
                            data={buDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            stroke="none"
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {buDistribution.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            isAnimationActive={false}
                            contentStyle={chartTooltipStyle}
                            itemStyle={{ color: CHART_COLORS.text }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-6 mt-2 w-full">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }}></div>
                        MIL — <span className="font-bold text-slate-900">{milVisits}</span> visits
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.secondary }}></div>
                        Share Function — <span className="font-bold text-slate-900">{sfVisits}</span> visits
                    </div>
                </div>
            </ChartCard>
        </div>
    );
}
