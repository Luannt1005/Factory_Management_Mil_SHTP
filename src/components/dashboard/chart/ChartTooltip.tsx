'use client';

import React from 'react';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
    unit?: string;
  }>;
  label?: string | number;
  formatter?: (value: unknown, name: string) => React.ReactNode;
  labelFormatter?: (label: unknown) => React.ReactNode;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-md px-3 py-2 text-xs min-w-[120px]">
      {formattedLabel && (
        <div className="font-semibold text-slate-800 pb-1 mb-1 border-b border-slate-100">
          {formattedLabel}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const formattedValue = formatter
            ? formatter(entry.value, entry.name || '')
            : entry.value;

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || '#db011c' }}
                />
                <span className="text-slate-600 truncate">{entry.name || entry.dataKey}</span>
              </div>
              <span className="font-semibold text-slate-900 shrink-0">
                {formattedValue}
                {entry.unit ? ` ${entry.unit}` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
