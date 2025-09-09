import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { useTheme } from "./ui/Theme";
import { CountryFlag } from "./CountryFlag";
import FmtVal from "./FmtVal";
import { Info, BarChart2, Zap, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toEnDigits } from './enDigits';
import { S, TEST } from "./utils"; // Import safe utilities

export default function CalendarRow({ event, onInfoClick, onChartClick, onAlertClick, onGetResult, isNext, impactLevel, loadingResult, hasAlert }) {
  const { language, t } = useTheme();

  // Safely format values, preventing crashes if data is missing
  const formatValue = (value, unit, comparison) => {
    const sValue = S(value);
    if (!sValue || sValue === '-') return '—';
    // ✅ FIX: Use TEST() on a safe string to prevent .match() on undefined
    const isPercent = TEST(S(unit), /%/);
    const isHintedPercent = ['yoy', 'mom', 'qoq'].includes(S(comparison).toLowerCase());
    
    if (isPercent || isHintedPercent) {
      return `${toEnDigits(sValue)}%`;
    }
    return toEnDigits(sValue);
  };

  const actualValue = formatValue(event.actual_raw, event.unit, event.comparison);
  const forecastValue = formatValue(event.forecast_raw, event.unit, event.comparison);
  const previousValue = formatValue(event.previous_raw, event.unit, event.comparison);

  const getTrendClass = (trend) => {
    if (trend === 'better') return 'text-green-600 dark:text-green-500';
    if (trend === 'worse') return 'text-red-600 dark:text-red-500';
    return 'text-primary';
  };

  return (
    <TableRow className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20 ${isNext ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
      {/* Time */}
      <TableCell className="w-[80px] text-sm tabular-nums text-primary">
        {event.time_tentative ? (
          <div className="flex items-center gap-1.5 text-muted">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs">{t?.tentative || (language === 'ar' ? 'مؤقت' : 'TBD')}</span>
          </div>
        ) : (
          toEnDigits(format(event.event_ts_utc, 'HH:mm'))
        )}
      </TableCell>

      {/* Country & Currency */}
      <TableCell className="w-[120px]">
        <div className="flex items-center gap-2">
          <CountryFlag countryCode={event.country} />
          <span className="font-medium text-primary">{event.country}</span>
          <span className="text-muted text-xs">({event.currency})</span>
        </div>
      </TableCell>
      
      {/* Event Title */}
      <TableCell>
        <span className="font-semibold text-primary">{language === 'ar' ? event.title_ar : event.title_en}</span>
        <div className={`w-16 h-1.5 rounded-full mt-1 ${impactLevel.color}`} />
      </TableCell>

      {/* Actual */}
      <TableCell className={`w-[100px] text-center font-bold tabular-nums ${getTrendClass(event.trend)}`}>
        <FmtVal value={actualValue} />
      </TableCell>

      {/* Forecast */}
      <TableCell className="w-[100px] text-center tabular-nums text-muted">
        <FmtVal value={forecastValue} />
      </TableCell>

      {/* Previous */}
      <TableCell className="w-[100px] text-center tabular-nums text-muted">
        <FmtVal value={previousValue} />
      </TableCell>

      {/* Actions */}
      <TableCell className="w-[180px]">
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => onGetResult(event)} disabled={loadingResult} className="neumorphic-button p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-wait" title={t?.getResult || 'Get Result'}>
            {loadingResult ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" /> : <Info className="w-4 h-4" />}
          </button>
          <button onClick={() => onChartClick(event)} className="neumorphic-button p-2.5 rounded-lg" title={t?.viewChart || 'View Chart'}>
            <BarChart2 className="w-4 h-4" />
          </button>
          <button onClick={() => onAlertClick(event)} className={`neumorphic-button p-2.5 rounded-lg ${hasAlert ? 'text-green-500' : ''}`} title={t?.setAlert || 'Set Alert'}>
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}