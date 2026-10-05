/**
 * Shared Chart Theme & Design Tokens for Orgchart & Visitor Dashboards
 * Phase 17D - Chart UI Standardization
 */

export const CHART_COLORS = {
  // Brand / Primary
  primary: '#db011c',         // Milwaukee Red
  primaryHover: '#b90118',
  primaryMuted: '#fef2f2',

  // Secondary / Dark Neutral
  secondary: '#2b2b2b',       // Charcoal / Secondary Series
  secondaryHover: '#1f1f1f',
  secondaryMuted: '#f4f4f5',

  // Accent Categorical Series (Harmonious Palette)
  accentPurple: '#8b5cf6',    // Violet / Staff
  accentPurpleLight: '#c4b5fd',
  accentSky: '#0ea5e9',       // Sky Blue / IDL
  accentSkyLight: '#7dd3fc',
  accentBlue: '#3b82f6',      // Blue / DL / Dept
  accentBlueLight: '#93c5fd',
  accentIndigo: '#6366f1',    // Indigo
  accentIndigoLight: '#a5b4fc',
  
  // Status Colors
  success: '#10b981',         // Emerald
  successLight: '#d1fae5',
  warning: '#f59e0b',         // Amber
  warningLight: '#fef3c7',
  danger: '#ef4444',          // Red
  dangerLight: '#fee2e2',

  // Neutrals / Grid / Axes
  grid: '#f1f5f9',            // Slate 100
  axis: '#64748b',            // Slate 500
  axisLine: '#e2e8f0',        // Slate 200
  text: '#0f172a',            // Slate 900
  textMuted: '#64748b',       // Slate 500
  background: '#ffffff',
} as const;

/**
 * Standard CartesianGrid properties for Recharts
 */
export const chartGridProps = {
  strokeDasharray: '3 3',
  vertical: false,
  stroke: CHART_COLORS.grid,
} as const;

/**
 * Standard XAxis / YAxis visual styling for Recharts
 */
export const chartAxisProps = {
  tick: { fill: CHART_COLORS.axis, fontSize: 11, fontWeight: 500 },
  axisLine: { stroke: CHART_COLORS.axisLine },
  tickLine: false,
} as const;

/**
 * Standard inline tooltip container styling for Recharts Tooltip
 */
export const chartTooltipStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #f1f5f9',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
  fontSize: '12px',
  color: '#0f172a',
  padding: '8px 12px',
};
