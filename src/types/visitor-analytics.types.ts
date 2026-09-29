/**
 * Visitor Analytics Domain & API Types
 * Orgchart_TTI_onprem
 */

import type { VisitorLogEntry } from './visitor.types';

export type { VisitorLogEntry };

export type VisitorAnalyticsPeriodFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export interface GetVisitorAnalyticsParams {
    startDate?: string;
    endDate?: string;
    bu?: string;
    status?: string;
    category?: string;
}

export interface VisitorAnalyticsSummary {
    visitorsToday: number;
    visitorsTodayGrowth: number;
    currentlyPresent: number;
    totalThisWeek: number;
    weekGrowth: number;
    avgStayMinutes: number;
    avgStayChange: number;
}

export interface VisitorAnalyticsTrendItem {
    label: string;
    value: number;
}

export interface VisitorAnalyticsPeriodicItem {
    label: string;
    value: number;
}

export interface VisitorAnalyticsCategoryItem {
    name: string;
    value: number;
    percentage: number;
}

export interface VisitorAnalyticsDepartmentItem {
    name: string;
    MIL: number;
    SF: number;
    total: number;
}

export interface VisitorAnalyticsBUItem {
    name: string;
    value: number;
}

export interface VisitorAnalyticsRecentActivityItem {
    name: string;
    details: string;
    status: string;
    time: string;
}

export interface GetVisitorAnalyticsResponse {
    summary: VisitorAnalyticsSummary;
    trendData: VisitorAnalyticsTrendItem[];
    periodicData: VisitorAnalyticsPeriodicItem[];
    categoryData: VisitorAnalyticsCategoryItem[];
    departmentData: VisitorAnalyticsDepartmentItem[];
    buDistribution: VisitorAnalyticsBUItem[];
    recentActivity: VisitorAnalyticsRecentActivityItem[];
}

// Aliases for convenience
export type AnalyticsKPISummary = VisitorAnalyticsSummary;
export type AnalyticsTrendItem = VisitorAnalyticsTrendItem;
export type AnalyticsBUDistributionItem = VisitorAnalyticsBUItem;
export type AnalyticsWeeklyDistributionItem = VisitorAnalyticsPeriodicItem;
export type AnalyticsCategoryItem = VisitorAnalyticsCategoryItem;
export type AnalyticsDepartmentItem = VisitorAnalyticsDepartmentItem;
export type AnalyticsRecentActivityItem = VisitorAnalyticsRecentActivityItem;

export interface GetCheckInOutLogsParams {
    search?: string;
    action?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    page?: number;
    limit?: number;
    export?: boolean;
}

export interface CheckInOutLogsOperatorItem {
    username: string;
    name: string;
    count: number;
}

export interface CheckInOutLogsPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface GetCheckInOutLogsResponse {
    logs: VisitorLogEntry[];
    pagination: CheckInOutLogsPagination;
    operators: CheckInOutLogsOperatorItem[];
}
