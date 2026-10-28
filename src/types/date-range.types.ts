/**
 * Date range filter value shared by list filters (Visitor Admin, Check In / Out).
 */

export type DateRangePreset =
    | 'today'
    | 'tomorrow'
    | 'yesterday'
    | 'thisWeek'
    | 'nextWeek'
    | 'lastWeek'
    | 'thisMonth'
    | 'nextMonth'
    | 'lastMonth'
    | 'thisYear';

export interface DateRangeValue {
    /** "YYYY-MM-DD" ('' = not set) */
    from: string;
    to: string;
    /** Preset that produced the range (shown as its name); undefined for a custom range */
    preset?: DateRangePreset;
}
