
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTheme } from './ui/Theme';
import { generateAIAnalysis } from '@/api/functions';
import { InvokeLLM } from "@/api/integrations";
import { toEnDigits } from './enDigits';
import { useAuth } from './useAuth';
import { useLocalization } from './useLocalization';
import AIAnalysisModal from './AIAnalysisModal';
import { countries as countryList } from './countries';
import { User } from '@/api/entities';
import { debounce } from 'lodash';
import { getEconomicCalendar } from "@/api/functions";
import { Notification } from "@/api/entities";
import { Alert } from "@/api/entities";
import { inferImpact } from './impact-classifier';
import { getUserTimezone } from '@/api/functions';
import { saveUserTimezone } from '@/api/functions';
import { triggerEcoAgent } from "@/api/functions"; // Changed from fetchOfficialResult
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { translateEventTitle } from '@/api/functions';
import { useToast } from "@/components/ui/use-toast";
import {
  RefreshCw, Loader2, Search, Filter, XIcon, Sparkles, Bell, AlertCircle, Check, TrendingUp, TrendingDown, Minus, BarChart2, BarChart, CheckCircle2, Zap, Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountryFlag } from "@/components/CountryFlag";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDown, ChevronUp } from "lucide-react";

// Date-fns imports
import { addDays, startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { Calendar } from "@/components/ui/calendar"; // Assuming this is shadcn/ui Calendar

// Safe string operations helpers and object access utilities
const S = (val) => String(val || '').trim();
const MATCH = (str, regex) => S(str).match(regex);
const TEST = (str, regex) => regex.test(S(str));

const safeJSON = (str, fallback = {}) => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null ? parsed : fallback;
  } catch (e) {
    console.warn("safeJSON parse error:", e?.message || e, "Input:", str);
    return fallback;
  }
};

const safeGet = (obj, path, defaultValue = null) => {
  if (obj === null || typeof obj !== 'object') return defaultValue;
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (typeof current !== 'object' || current === null || !Object.prototype.hasOwnProperty.call(current, part)) {
      return defaultValue;
    }
    current = current[part];
  }
  return current;
};


const TT = {
  ar: { table: { event: "الحدث الاقتصادي", country: "الدولة", time: "التاريخ والوقت", impact: "التأثير", actual: "الفعلي", estimate: "التقدير", forecast: "المتوقع", previous: "السابق", comparison: "المقارنة", actions: "الإجراءات" } },
  en: { table: { event: "Event", country: "Country", time: "Date & Time", impact: "Impact", actual: "Actual", estimate: "Estimate", forecast: "Forecast", previous: "Previous", comparison: "Comparison", actions: "Actions" } },
};
const tzSafe = (tz) => (typeof tz === "string" && tz.trim() ? tz : "UTC");

const DEBOUNCE_DELAY = 800;
const CACHE_TTL = 15 * 60 * 1000;

// Helper function to extract UTC timestamp from event.
// Assumes event.event_ts_utc is the primary source.
function getEventTsUtc(event) {
  if (typeof event?.event_ts_utc === 'number' && Number.isFinite(event.event_ts_utc)) {
    return event.event_ts_utc;
  }
  // Fallback: If event_ts_utc is not a valid number, attempt to use date/time string.
  // This is a very basic fallback and might need more robust timezone handling if used in production.
  if (event?.date) {
    try {
      const dateTimeString = event.time ? `${event.date}T${event.time}:00Z` : `${event.date}T00:00:00Z`;
      const dateObj = new Date(dateTimeString);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.getTime();
      }
    } catch (e) {
      console.warn("Failed to parse date/time for getEventTsUtc fallback:", event, e);
    }
  }
  return null; // Return null if unable to determine a valid timestamp
}

// Helper to format event time using the component's formatTimestampInTz
function formatEventTime(event, tz, lang) {
  const ts = getEventTsUtc(event);
  const isTentative = event?.time_tentative || !event?.time;
  return formatTimestampInTz(ts, tz, lang, isTentative);
}

// Helper to pick the most relevant forecast value
function pickForecast(event) {
  return event?.forecast || event?.forecast_long || null;
}

// Helper for button class styling based on active state
function btnClass(isActive) {
  const base = "relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform-gpu overflow-hidden";
  const activeClasses = "neumorphic-pressed text-primary bg-gradient-to-br from-violet-400 to-violet-600 text-white shadow-xl";
  const inactiveClasses = "neumorphic-button text-secondary hover:text-primary";
  return isActive ? `${base} ${activeClasses}` : `${base} ${inactiveClasses}`;
}
// --- End of functions that were originally in ./utils.js ---


// Helper for numbers (missing definition, inferred from usage in formatDisplayValue)
function formatNumber(value, options = {}) {
  if (value === null || value === undefined || value === '') return '—';
  const s = toEnDigits(String(value));
  const num = Number(s.replace(/,/g, '').replace(/\s+/g, ''));
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('en-US', options).format(num);
}

// Locale-aware value formatter → percent (extracted from the malformed import)
function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '—';
  const s = toEnDigits(String(value));
  const num = Number(s.replace(/,/g, '').replace(/\s+/g, '').replace('%', ''));
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 2,
    numberingSystem: 'latn'
  }).format(num / 100);
}

// Locale-aware value formatter with comparison hint → percent
function formatDisplayValue(raw, { comparison }) {
  if (raw === null || raw === undefined || String(raw || '').trim() === '' || raw === '-') return '—';
  const s = String(raw || '').trim();

  // ✅ FIX: Corrected undefined variable 'v' to 's'.
  if (s.includes('%')) return formatPercent(s);

  const isPctHint = ['yoy', 'mom', 'qoq', 'qqq'].includes(String(comparison || '').toLowerCase());
  const numCoerced = Number(toEnDigits(s).replace(/,/g, '').replace(/\s+/g, ''));
  if (!Number.isFinite(numCoerced)) return toEnDigits(numCoerced); // Changed to use numCoerced
  return isPctHint ? formatPercent(numCoerced) : formatNumber(numCoerced, { maximumFractionDigits: 2, useGrouping: true });
}

const safeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const safeIncludes = (str, searchStr) => {
  return safeString(str).toLowerCase().includes(safeString(searchStr).toLowerCase());
};

// FmtVal helper function for formatting values with units (K, M, B, T, %, currency)
// This function must incorporate the `formatDisplayValue` logic but add scaling for K,M,B.
function FmtVal({ v, u, event }) { // Added 'event' to props to access comparison if needed (though s.includes('%') covers direct cases)
  if (v === null || v === undefined || safeString(v).trim() === '') return '—';

  const s = safeString(v).trim();

  // If the value string itself contains a percentage sign, format it as a percent.
  if (s.includes('%')) {
    return formatPercent(v);
  }

  // Parse the number, removing potential suffixes like K, M, B, T for internal calculation.
  const cleanStr = s.replace(/,/g, '').replace(/\s+/g, '').replace(/[KMGTB]/gi, '');
  const num = Number(toEnDigits(cleanStr));

  let scaledNum = num;
  let suffix = '';

  // Apply K, M, B, T scaling if no explicit unit (like currency) is provided via `u`,
  // and the number is large. This prevents double scaling or conflicting units.
  if (Number.isFinite(scaledNum) && !u) { // Only scale if 'u' is empty (not a currency or custom unit)
    if (Math.abs(scaledNum) >= 1e12) { // Trillion
      scaledNum /= 1e12;
      suffix = 'T';
    } else if (Math.abs(scaledNum) >= 1e9) { // Billion
      scaledNum /= 1e9;
      suffix = 'B';
    } else if (Math.abs(scaledNum) >= 1e6) { // Million
      scaledNum /= 1e6;
      suffix = 'M';
    } else if (Math.abs(scaledNum) >= 1e3) { // Thousand
      scaledNum /= 1e3;
      suffix = 'K';
    }
  }

  // Format the numerical part using formatNumber (adds grouping, max 2 decimals).
  // If a suffix is added (K, M, B, T), use no grouping for the number part.
  const formattedNumber = Number.isFinite(scaledNum) ? formatNumber(scaledNum, {
    maximumFractionDigits: suffix ? 2 : 2, // 2 decimals for scaled, 2 for non-scaled
    useGrouping: suffix === '' && u === '', // Grouping only if no suffix and no explicit unit (like currency)
  }) : s;

  // Determine if 'u' is a currency symbol to decide prefix/suffix.
  const currencySymbols = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'AUD': '$', 'CAD': '$', 'CHF': 'Fr', 'CNY': '¥', 'KRW': '₩', 'SGD': '$', 'HKD': '$', 'RUB': '₽', 'ZAR': 'R', 'BRL': 'R$', 'MXN': '$', 'SAR': '﷼', 'AED': 'د.إ', 'KWD': 'د.ك', 'QAR': 'ر.ق', 'BHD': '.د.ب', 'OMR': 'ر.ع.', 'EGP': 'ج.م', 'PHP': '₱', 'IDR': 'Rp', 'MYR': 'RM', 'THB': '฿', 'VND': '₫', 'PKR': '₨', 'BDT': '৳', 'TRY': '₺', 'ILS': '₪',
  };

  const displayUnit = u || '';
  const isCurrencySymbol = displayUnit && Object.values(currencySymbols).includes(displayUnit);


  if (isCurrencySymbol) {
    return `${displayUnit}${formattedNumber}${suffix}`; // Currency symbol as prefix
  } else {
    return `${formattedNumber}${suffix}${displayUnit}`; // Other units as suffix
  }
}

// ========= Timezone handling & formatting (robust, global-safe) =========

// Normalize UI timezone string to a valid IANA tz for Intl.DateTimeFormat
function normalizeTZ(tz) {
  // Prefer user's local zone if tz is missing/invalid
  const local = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
    catch { return 'UTC'; }
  })();

  if (!tz || typeof tz !== 'string') return local;
  const s = tz.trim();

  // "Auto (Asia/Dubai)" -> "Asia/Dubai"
  const m = MATCH(s, /^auto\b.*\(([^)]+)\)/i);
  if (m && m[1]) return m[1];

  // "Auto" or "Local"
  if (/^(auto|local)$/i.test(s)) return local;

  // "UTC+4", "GMT-3", "UTC+05", "GMT+9"
  const off = MATCH(s, /^(?:UTC|GMT)\s*([+-]\d{1,2})(?::?(\d{2}))?$/i);
  if (off) {
    // Intl Etc/GMT signs are reversed: UTC+4 => Etc/GMT-4
    const sign = off[1][0];                 // '+' or '-'
    const hours = Math.abs(parseInt(off[1], 10)) || 0;
    return `Etc/GMT${sign === '+' ? '-' : '+'}${hours}`;
  }

  // Assume it's already a valid IANA name (e.g., "Asia/Dubai", "America/New_York")
  return s;
}

// Coerce ISO / epoch(ms) / epoch(sec) / Date -> Date (UTC source)
function toUtcDate(input) {
  if (input == null) return null;

  if (typeof input === 'number') {
    // If it's seconds, convert to ms
    const ms = input < 1e12 ? input * 1000 : input;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === 'string') {
    // numeric string? treat as number; otherwise parse ISO
    const n = Number(input);
    if (Number.isFinite(n)) return toUtcDate(n);
    const ms = Date.parse(input);
    return Number.isNaN(ms) ? null : new Date(ms);
  }

  if (input instanceof Date) return new Date(input.getTime());

  return null;
}

// Format any UTC timestamp/ISO into "DD Mon YYYY, HH:mm" in the chosen tz.
// Note: `isTentative` intentionally ignored (we do not show tentative labels).
function formatTimestampInTz(ts, tz, lang) {
  const d = toUtcDate(ts);
  if (!d) return '—';

  const effectiveTz = normalizeTZ(tz);
  const locale = lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB';

  const dateOpts = { timeZone: effectiveTz, year: 'numeric', month: 'short', day: '2-digit' };
  const timeOpts = { timeZone: effectiveTz, hour: '2-digit', minute: '2-digit', hour12: false };

  try {
    const dateStr = new Intl.DateTimeFormat(locale, dateOpts).format(d);
    const timeStr = new Intl.DateTimeFormat(locale, timeOpts).format(d);
    return `${dateStr}, ${timeStr}`;
  } catch (e) {
    console.error('Failed to format timestamp:', { ts, tz, lang, effectiveTz }, e);
    return 'Invalid Date';
  }
}

// Helper functions to get date and time separately
function getEnDate(ts, tz, lang) {
  const d = toUtcDate(ts);
  if (!d) return '—';

  const effectiveTz = normalizeTZ(tz);
  const locale = lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB';

  const dateOpts = { timeZone: effectiveTz, year: 'numeric', month: 'short', day: '2-digit' };

  try {
    return new Intl.DateTimeFormat(locale, dateOpts).format(d);
  } catch (e) {
    console.error('Failed to format date:', { ts, tz, lang, effectiveTz }, e);
    return 'Invalid Date';
  }
}

function getEnTime(ts, tz, lang) {
  const d = toUtcDate(ts);
  if (!d) return '—';

  const effectiveTz = normalizeTZ(tz);
  const locale = lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB';

  const timeOpts = { timeZone: effectiveTz, hour: '2-digit', minute: '2-digit', hour12: false };

  try {
    return new Intl.DateTimeFormat(locale, timeOpts).format(d);
  } catch (e) {
    console.error('Failed to format time:', { ts, tz, lang, effectiveTz }, e);
    return 'Invalid Time';
  }
}

// Your existing text normalizer (unchanged)
const normalize = (s) =>
  String(s || '')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED]/g, '')
    .toLowerCase()
    .trim();


// Impact handlers using the new classifier
// --- DEFINITIVE FIX: This is now the single source of truth for impact ---
function normalizeImpactBucket(row) {
  // --- DEFINITIVE FIX: Add guardrails for invalid row object ---
  if (!row) {
    return null;
  }
  const { bucket } = inferImpact(row?.title_en || '');
  return bucket || null; // Return null if not classified
}

function impactLabel(bucket, lang) {
  if (!bucket) return lang === 'ar' ? 'غير محدد' : 'Unspecified'; // Handle null case
  const key = String(bucket).toLowerCase();
  if (lang === 'ar') {
    if (key === 'high') return 'عالي';
    if (key === 'medium') return 'متوسط';
    return 'منخفض';
  }
  if (key === 'high') return 'High';
  if (key === 'medium') return 'Medium';
  return 'Low';
}

// Helper function to parse numbers, removing common financial suffixes
const parseNum = (val) => {
  if (val === null || val === undefined || val === "—") return null;
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
};

// Helper function to compare actual vs forecast, handling strings with non-numeric chars
function compareValues(actual, forecast) {
  if (actual === null || actual === undefined || forecast === null || forecast === undefined) {
    return 'neutral';
  }
  const actualNum = parseNum(actual);
  const forecastNum = parseNum(forecast);

  if (actualNum === null || forecastNum === null) {
    return 'neutral';
  }

  if (actualNum > forecastNum) return 'positive';
  if (actualNum < forecastNum) return 'negative';
  return 'neutral';
};

// Keep this getTrend. The other one is a duplicate and should be removed.
const getTrend = (actual, forecast, event) => {
  // --- DEFINITIVE FIX: Re-applying the 100% crash-proof version ---
  try {
    // 1. Ensure `event` and `event.comparison` are valid before proceeding.
    if (event && event.comparison && typeof event.comparison === 'string' && event.comparison.trim()) {

      // 2. Safely perform the match. This will no longer crash.
      const matchResult = MATCH(event.comparison, /mom|qoq/i);

      if (matchResult) {
        const isGood = (v) => v > 0;
        const isBad = (v) => v < 0;
        const actualNum = parseNum(actual);
        if (actualNum === null) return 'neutral';
        if (isGood(actualNum)) return 'positive';
        if (isBad(actualNum)) return 'negative';
        return 'neutral';
      }
    }

    // 3. If the special comparison logic doesn't apply, fall back to the safe value comparison.
    return compareValues(actual, forecast);

  } catch (error) {
    // 4. In case of any unexpected error, log it for debugging but DO NOT CRASH.
    console.error("A critical error was caught in getTrend. The app will not crash.", {
      error: error.message,
      eventData: event
    });
    return compareValues(actual, forecast);
  }
};


const getImpactBadge = (impact) => {
  const base = "px-2 py-1 rounded-full text-xs font-semibold";
  if (impact === 'High') {
    return `${base} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300`;
  }
  if (impact === 'Medium') {
    return `${base} bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300`;
  }
  if (impact === 'Low') {
    return `${base} bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300`;
  }
  // --- DEFINITIVE FIX: Default for null or unspecified impact ---
  return `${base} bg-gray-100 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400`;
};

const getImpactLabelSafe = (impact, t) => {
  if (impact === 'High') return t.high;
  if (impact === 'Medium') return t.medium;
  if (impact === 'Low') return t.low;
  return t.unspecified || 'Unspecified'; // Provide a fallback translation
};


// --- DEFINITIVE FIX: Use specified allowlists for filters ---
const COUNTRY_FILTER_LIST = ['US', 'GB', 'CA', 'JP', 'CN', 'CH', 'NZ', 'AU', 'EU', 'TR'];
const CURRENCY_FILTER_LIST = ['USD', 'GBP', 'CAD', 'JPY', 'CNY', 'CHF', 'NZD', 'AUD', 'EUR', 'TRY'];

// Impact levels for filtering
const IMPACT_LEVELS = ['High', 'Medium', 'Low'];

// Localization labels
const LABELS = {
  ar: {
    title: "التقويم الاقتصادي",
    subtitle: "الأحداث الاقتصادية الرئيسية والمؤشرات المالية",
    calendarTitle: "التقويم الاقتصادي", // Updated from "التقويم"
    loadingEvents: 'جاري تحميل الأحداث...', // New
    searchPlaceholder: 'البحث في الأحداث...', // New (top-level)
    updateNow: 'تحديث الآن', // New
    updating: 'جاري التحديث...', // New
    showMore: 'عرض المزيد', // New
    showLess: 'عرض أقل', // New
    analyze: 'تحليل', // New
    analyzing: 'جاري التحليل...', // New
    presets: {
      today: "اليوم",
      tomorrow: "غداً",
      thisWeek: "هذا الأسبوع",
      nextWeek: "الأسبوع القادم",
      thisMonth: "هذا الشهر",
      nextMonth: "الشهر القادم",
      dateRange: "نطاق مخصص"
    },
    columns: {
      economicEvent: "الحدث الاقتصادي",
      country: "الدولة",
      datetime: "التاريخ والوقت",
      impact: "التأثير",
      actual: "الفعلي",
      estimate: "التقدير",
      forecast: "المتوقع", // Updated from "التوقع"
      previous: "السابق",
      comparison: "المقارنة",
      period: "الفترة",
      actions: "الإجراءات",
      currency: "العملة"
    },
    actions: {
      filters: "فلاتر",
      apply: "تطبيق",
      applyFilters: "تطبيق الفلاتر",
      reset: "إعادة تعيين",
      aiAnalysis: "تحليل ذكي",
      result: "النتيجة",
      loadMore: "تحميل المزيد",
      bulkResults: "جلب 20 نتيجة",
      refresh: "تحديث",
      alert: "تنبيه",
      clearFilters: "مسح الفلاتر"
    },
    impact: { high: "عالي", medium: "متوسط", low: "منخفض", unspecified: "غير محدد" },
    counters: { total: "إجمالي", filtered: "مُرشّح", showing: "معروض" },
    tooltips: { notDue: "لم يحن الوقت بعد", officialResult: "نتيجة رسمية" },
    toasts: {
      fetching: "جاري التحصيل",
      ok: "تم جلب النتيجة",
      noData: "لا توجد نتيجة رسمية",
      failed: "تعذر جلب النتيجة",
      bulkStart: (d, t) => `جلب ${toEnDigits(d)}/${toEnDigits(t)}...`,
      bulkDone: (d, t) => `اكتمل الجلب (${toEnDigits(d)}/${toEnDigits(t)})`,
      noneReady: "لا توجد أحداث جاهزة للجلب.",
      highImpactNow: (count) => `أحداث عالية التأثير خلال الساعة القادمة: ${toEnDigits(count)}`,
      alertUpdated: "تم تحديث التنبيه",
      alertUpdateFailed: "خطأ في تحديث التنبيه", // ✅ ADDED
    },
    filterLabels: {
      searchPlaceholder: "البحث في الأحداث...",
      countries: "الدول",
      timezone: "المنطقة الزمنية",
      comparison: "المقارنة",
      noComparison: "بدون مقارنة",
      monthOverMonth: "شهر لشهر",
      quarterOverQuarter: "ربع لربع",
      yearOverYear: "سنة لسنة",
      // Removed fromDate and toDate as they are no longer used with the new Calendar component
      cancel: 'إلغاء',
      allCurrencies: 'جميع العملات',
      importance: 'الأهمية'
    },
    misc: {
      noEventsFound: 'لا توجد أحداث',
      noEventsSubtitle: 'لا توجد أحداث اقتصادية في الفترة المحددة',
      mute: 'كتم التنبيه',
      unmute: 'إلغاء كتم',
      tentativeTime: 'وقت تقديري',
      officialResult: 'نتيجة رسمية',
      today: 'اليوم',
      tomorrow: 'غداً'
    },
    autoTimezone: 'تلقائي',
    popularTimezones: 'المناطق الزمنية الشائعة',
    timezoneDefaultSaved: 'تم حفظ المنطقة الزمنية الافتراضية.',
    admin: {
      fetchOfficialBulk: "جلب 20 نتيجة رسمية",
      fetchOfficial: "جلب النتيجة الرسمية",
      fetching: "جاري الجلب...",
      fetchNote: "يجلب النتائج الرسمية لأول 20 حدثًا قيد الانتظار.",
      fetchSuccess: "تم جلب النتيجة بنجاح!",
      fetchError: "فشل جلب النتيجة.",
      checkSource: "التحقق من المصدر",
      fetchingResult: "الوكيل يبحث عن نتيجة لـ",
      resultFound: "تم العثور على النتيجة وحفظها لـ",
      agentSearchFailed: "فشل بحث الوكيل. يرجى المحاولة مرة أخرى.",
      agentSearchError: "حدث خطأ حرج أثناء تشغيل الوكيل.",
      getOfficialResult: "جلب النتيجة الرسمية",
      adminAccessRequired: "يتطلب الوصول الإداري لجلب النتائج.", // ✅ ADDED
      agentSystemOffline: "نظام الوكيل غير متاح حاليًا. يرجى الاتصال بالدعم.", // ✅ ADDED
    },
    errorFetch: "فشل جلب البيانات",
    controls: { // NEW
      filterByDate: "تصفية حسب التاريخ"
    },
    dateFilters: { // NEW
      today: "اليوم",
      tomorrow: "غداً",
      thisWeek: "هذا الأسبوع",
      custom: "مخصص",
    },
  },
  en: {
    title: "Economic Calendar",
    subtitle: "Key economic events and financial indicators",
    calendarTitle: "Calendar", // New label
    presets: {
      today: "Today",
      tomorrow: "Tomorrow",
      thisWeek: "This Week",
      nextWeek: "Next Week",
      thisMonth: "This Month",
      nextMonth: "Next Month",
      dateRange: "Custom Range"
    },
    columns: {
      economicEvent: "Economic Event",
      country: "Country",
      datetime: "Date & Time",
      impact: "Impact",
      actual: "Actual",
      estimate: "Estimate", // Added
      forecast: "Forecast",
      previous: "Previous",
      comparison: "Comparison",
      period: "Period",
      actions: "Actions",
      currency: "Currency"
    },
    actions: {
      filters: "Filters",
      apply: "Apply",
      applyFilters: "Apply Filters", // New label
      reset: "Reset",
      aiAnalysis: "AI Analysis",
      result: "Result",
      loadMore: "Load More",
      bulkResults: "Fetch 20 Results",
      refresh: "Refresh",
      alert: "Alert",
      clearFilters: "Clear Filters"
    },
    impact: { high: "High", medium: "Medium", low: "Low", unspecified: "Unspecified" },
    counters: { total: "Total", filtered: "Filtered", showing: "Showing" },
    tooltips: { notDue: "Not due yet", officialResult: "Official result" },
    toasts: {
      fetching: "Fetching",
      ok: "Result fetched",
      noData: "No official result",
      failed: "Failed to fetch result",
      bulkStart: (d, t) => `Fetching ${d}/${t}...`,
      bulkDone: (d, t) => `Completed (${d}/${t})`,
      noneReady: "No events ready",
      highImpactNow: (count) => `High-impact events within the next hour: ${count}`,
      alertUpdated: "Alert updated",
      alertUpdateFailed: "Failed to update alert", // ✅ ADDED
    },
    filterLabels: {
      searchPlaceholder: "Search events...",
      countries: "Countries",
      timezone: "Timezone",
      comparison: "Comparison",
      noComparison: "No comparison",
      monthOverMonth: "Month Over Month",
      quarterOverQuarter: "Quarter Over Quarter", // Corrected the key
    },
    misc: {
      noEventsFound: 'No Events Found',
      noEventsSubtitle: 'No economic events found for the selected period',
      mute: 'Mute alert',
      unmute: 'Unmute',
      tentativeTime: 'Tentative Time',
      officialResult: 'Official result',
      today: 'Today',
      tomorrow: 'Tomorrow'
    },
    autoTimezone: 'Auto',
    popularTimezones: 'Popular Timezones',
    timezoneDefaultSaved: "Default timezone saved.", // Fixed: Changed to double quotes to avoid JSX syntax error with apostrophe
    admin: { // New admin labels
      fetchOfficialBulk: "Fetch 20 Official Results",
      fetchOfficial: "Fetch Official Result",
      fetching: "Fetching...",
      fetchNote: "Fetches official results for the first 20 pending events.",
      fetchSuccess: "Successfully fetched result!",
      fetchError: "Failed to fetch result.",
      checkSource: "Check Source",
      fetchingResult: "Agent searching for result for",
      resultFound: "Result found and saved for",
      agentSearchFailed: "Agent search failed. Please try again.",
      agentSearchError: "A critical error occurred while triggering the agent.",
      getOfficialResult: "Get Official Result",
      adminAccessRequired: "Admin access required to fetch results.", // ✅ ADDED
      agentSystemOffline: "The Agent API is currently unavailable. Please contact support.", // ✅ ADDED
    },
    errorFetch: "Failed to fetch data", // Added for consistency with outline
    controls: { // NEW
      filterByDate: "Filter by Date"
    },
    dateFilters: { // NEW
      today: "Today",
      tomorrow: "Tomorrow",
      thisWeek: "This Week",
      custom: "Custom",
    },
  }
};


// --- DEFINITIVE FIX: Use specified allowlists for filters ---
// This new hook encapsulates all translation logic, making it robust and efficient.
const useEventTitleCache = (rows, language) => {
  const [translationCache, setTranslationCache] = useState(() => {
    try { return JSON.parse(localStorage.getItem('title_tr_cache') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    if (language !== 'ar') return;
    if (!rows || rows.length === 0) return;

    const titlesToCheck = Array.from(new Set(
      rows.map(ev => ev.title_en || ev.title || ev.event_name).filter(Boolean)
    ));
    const missing = titlesToCheck.filter(t => !translationCache[t]);
    if (missing.length === 0) return;

    (async () => {
      try {
        const { data: res } = await translateEventTitle({ titles: missing, locale: 'ar' });
        if (res && res.success && res.translations) {
          const updates = {};
          for (const original of Object.keys(res.translations)) {
            const tr = res.translations[original];
            if (tr) updates[original] = tr;
          }
          if (Object.keys(updates).length) {
            setTranslationCache(prev => {
              const merged = { ...prev, ...updates };
              try { localStorage.setItem('title_tr_cache', JSON.stringify(merged)); } catch { }
              return merged;
            });
          }
        }
      } catch (e) {
        console.warn("translateEventTitle batch fetch failed:", e?.message || e);
      }
    })();
  }, [rows, language, translationCache]);

  const getCachedTitle = useCallback((titleEn) => translationCache[titleEn], [translationCache]);

  return {
    get: getCachedTitle,
  };
};

// Helper function to sanitize AI actual values (moved outside component)
const sanitizeAIActual = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  // Remove common financial suffixes and spaces, then attempt to parse
  const cleanedValue = value.replace(/[%MKB\$€£¥T G]/gi, '').trim();
  // Use a regex to find numbers which might include commas or decimal points
  const match = cleanedValue.match(/(-?\d[\d,.]*)/);
  if (match) {
    return match[1]; // Return just the numeric part
  }
  return value.slice(0, 10); // Fallback, but the regex should handle most cases
};

// The AIAnalysisModal component definition has been removed from this file,
// as it is now expected to be imported from './AIAnalysisModal' as per the outline.
// parse "107,55", "0.2%", etc. -> number | null
const toNum = (v) => {
  const s = String(v ?? "").trim().replace(/[%\s,]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// Removed duplicate getTrend function here. The correct one is higher up.

const CalendarRow = ({
  event,
  language,
  onEventAlert,
  onQuickAnalysis, // Now specifically for AI Analysis Modal
  isAdminUser,
  onEventUpdate, // This prop is still present but not used by the official result fetch in the new flow
  L,
  getEventTitle,
  timezone,
  onFetchOfficial, // Now specifically for triggering the economic agent
  isLoadingOfficial, // New prop
  resultMessage // Added to display per-row messages
}) => {
  // const { toast } = useToast(); // No longer needed for official result fetch, but might be needed by other logic if added.

  // The loading state is now managed by the parent via isLoadingOfficial map
  const hasActualValueInParent = (event.actual !== null && event.actual !== undefined && String(event.actual).trim() !== '—' && String(event.actual).trim() !== '');
  const isResultExpected = event.previous_raw != null || event.forecast_raw != null; // Use _raw fields for check
  const isAISourced = event.source && /ai web search/i.test(event.source);

  const displayUnit = event.unit; // Use event.unit directly from processedEvents

  // Determine the key for loading state
  const eventLoadingKey = event.id || `${event.country}|${event.title_en || event.title}|${String(event.event_iso_utc || '').split('T')[0]}`;


  return (
    <tr className="neumorphic-card text-primary mb-2 last:mb-0 transition-all duration-150 hover:-translate-y-[1px] hover:bg-white/40 dark:hover:bg-white/5 active:scale-[0.995]">
      {/* Event Name */}
      <td className="py-4 px-3 text-left w-[360px]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="font-semibold text-primary text-base leading-tight truncate max-w-[26ch] text-left hover:underline"
                  title={getEventTitle(event)}
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {getEventTitle(event)}
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="max-w-[80vw] sm:max-w-[560px] text-sm leading-6 neumorphic-inset p-4 rounded-xl"
                dir={language === "ar" ? "rtl" : "ltr"}
              >
                {getEventTitle(event)}
              </PopoverContent>
            </Popover>
          </div>

          {/* tiny currency chip on the right (old look) */}
          {event.currency ? (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] leading-4 bg-muted/40 dark:bg-muted/20">
              {event.currency}
            </span>
          ) : null}
        </div>
      </td>
      {/* Country */}
      <td className="py-4 px-3 text-center w-[96px]">
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md neumorphic-inset">
          <CountryFlag code={event.country} className="w-5 h-4 rounded-[3px]" />
          <span className="text-xs">{event.country}</span>
        </div>
      </td>
      {/* Date & Time */}
      <td className="py-4 px-3 text-center w-[140px]">
        <div className="text-sm text-center">
          <div className="font-medium" lang="en" dir="ltr">
            {getEnDate(event.time_utc, normalizeTZ(timezone), language)}
          </div>
          <div className="text-xs text-secondary" lang="en" dir="ltr">
            {getEnTime(event.time_utc, normalizeTZ(timezone), language)}
          </div>
        </div>
      </td>
      {/* Impact */}
      <td className="py-4 px-3 text-center w-[100px]">
        <span className={getImpactBadge(event.impact)}>
          {impactLabel(event.impact, language)}
        </span>
      </td>

      {/* Removed Trend Icon column based on outline */}
      {/* Actual */}
      <td className="py-4 px-3 text-center w-28 tabular-nums" lang="en" dir="ltr">
        <span className={event.trend === 'positive' ? 'text-green-600 dark:text-green-400 font-bold' : event.trend === 'negative' ? 'text-red-600 dark:text-red-500 font-bold' : ''}>
          {isAISourced && <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 inline-block mr-1 align-middle" title={`Sourced by AI: ${event.source}`}></span>}
          <FmtVal v={event.actual} u={displayUnit} event={event} /> {/* Use event.actual directly */}
        </span>
        {event.verified && (
          <CheckCircle2 className="w-3 h-3 inline-block ml-1 text-green-500" title={L.tooltips.officialResult} />
        )}
      </td>

      {/* Estimate */}
      <td className="py-4 px-3 text-center w-28 tabular-nums text-secondary" lang="en" dir="ltr">
        <FmtVal v={event.estimate} u={displayUnit} event={event} />
      </td>

      {/* Forecast */}
      <td className="py-4 px-3 text-center w-28 tabular-nums text-secondary" lang="en" dir="ltr">
        <FmtVal v={pickForecast(event)} u={displayUnit} event={event} />
      </td>

      {/* Previous */}
      <td className="py-4 px-3 text-center w-28 tabular-nums text-secondary" lang="en" dir="ltr">
        <FmtVal v={event.previous} u={displayUnit} event={event} />
      </td>

      {/* Comparison */}
      <td className="py-4 px-3 text-center w-28 tabular-nums text-secondary" lang="en" dir="ltr">
        {event.comparison || '—'}
      </td>

      {/* Actions */}
      <td className="py-4 px-3 text-center w-36">
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => onEventAlert(event)}
            className="neumorphic-button px-2.5 py-1.5 rounded-lg text-xs flex items-center"
            title={L.actions.alert}
          >
            <Bell className="w-3.5 h-3.5 text-blue-500" />
          </Button>
          <Button
            onClick={() => onQuickAnalysis(event)} // This is now handleAIAnalysis
            className="neumorphic-button px-2.5 py-1.5 rounded-lg text-xs flex items-center"
            title={L.actions.aiAnalysis}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          </Button>
          {isAdminUser && isResultExpected && !hasActualValueInParent && (
            <Button
              onClick={() => onFetchOfficial(event)} // This is now handleTriggerResultAgent
              disabled={isLoadingOfficial[eventLoadingKey] || event.is_non_numeric || hasActualValueInParent}
              className="neumorphic-button px-2.5 py-1.5 rounded-lg text-xs flex items-center group"
              title={L.admin.getOfficialResult}
            >
              {isLoadingOfficial[eventLoadingKey] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};


export default function EconomicCalendar({ onNotificationAdd }) {
  const { isRTL, language, sonnerToast } = useLocalization();
  const L = LABELS[language] || LABELS.en;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    countries: [],
    importance: [],
    currencies: [],
    comparison: 'all',
  });
  const [timezone, setTimezone] = useState(() => {
    try {
      return localStorage.getItem('liirat-timezone') || 'UTC';
    } catch {
      console.warn("Could not read timezone from localStorage, defaulting to UTC.");
      return 'UTC';
    }
  });
  const [customDateRange, setCustomDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });
  const [dateFilter, setDateFilter] = useState("today"); // 'today', 'tomorrow', 'thisWeek', 'custom'
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [stats, setStats] = useState({ total: 0, filtered: 0, showing: 0 });
  const abortControllerRef = useRef(null);

  const { user } = useAuth();

  const [showQuickAnalysis, setShowQuickAnalysis] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stagedFilters, setStagedFilters] = useState(filters);

  const { toast } = useToast();

  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loadingOfficialResult, setLoadingOfficialResult] = useState({});
  // NEW STATE for per-event messages
  const [resultMessages, setResultMessages] = useState({});

  // ✅ FIX: Add state to track officially fetched results
  const [officialResults, setOfficialResults] = useState(new Map());

  useEffect(() => {
    if (user) {
      setIsAdminUser(user.role === 'admin' || user.role === 'owner');
    } else {
      setIsAdminUser(false);
    }
  }, [user]);

  // Use the new, robust title caching hook.
  const eventTitleCache = useEventTitleCache(events, language);

  // Non-blocking notifications
  const notify = useCallback((type, message) => {
    if (typeof onNotificationAdd === 'function') {
      onNotificationAdd({ id: Date.now(), type, message, timestamp: new Date().toISOString() });
    } else if (window?.Core?.UI?.toast) {
      window.Core.UI.toast({ variant: type, title: message });
    } else {
      const fn = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
      console[fn](`[${type}] ${message}`);
    }
  }, [onNotificationAdd]);

  // Fix: User email field inconsistency fix (function definition, not called by existing alert logic)
  // This function is placed here to ensure it has access to `user` and `notify` from the component's scope.
  const createAlert = async (eventData) => {
    if (!user || !user.email) {
      window.dispatchEvent(new CustomEvent('show-login-modal'));
      return;
    }

    try {
      const alertPayload = {
        user_id: user.id,
        user_email: user.email, // ✅ FIX: Use user.email correctly
        event_id: eventData.id || `${eventData.country}_${eventData.title_en}_${eventData.event_ts_utc}`,
        alertType: eventData.alertType || 'onRelease',
        leadTimeMinutes: eventData.leadTimeMinutes || 0,
        metadata: {
          event_title: eventData.title_en || eventData.title,
          event_time: eventData.event_ts_utc || eventData.date,
          country: eventData.country
        },
        isActive: true
      };

      await Alert.create(alertPayload);

      notify('success', language === 'ar' ? 'تم إنشاء التنبيه بنجاح' : 'Alert created successfully');
      window.dispatchEvent(new CustomEvent('alerts-updated'));
    } catch (error) {
      console.error('Failed to create alert:', error);
      notify('error', language === 'ar' ? 'فشل في إنشاء التنبيه' : 'Failed to create alert');
    }
  };

  // Use cache-first accessor
  const getEventTitle = React.useCallback((event) => {
    if (!event) return '';
    const enTitle = event.title_en || event.title || event.event_name || '';
    if (language === 'ar') {
      return eventTitleCache.get(enTitle) || enTitle; // Use eventTitleCache.get
    }
    return enTitle;
  }, [language, eventTitleCache]); // Dependencies updated

  // Initialize staged filters when dialog opens
  const openFilters = useCallback(() => {
    setStagedFilters(filters);
    setFiltersOpen(true);
  }, [filters]);

  const applyFilters = useCallback(() => {
    setFilters(stagedFilters);
    setFiltersOpen(false);
  }, [stagedFilters]);

  // New function to handle filter changes within the staged filters
  const handleFilterChange = (filterType, value) => {
    setStagedFilters(prev => {
      // For multi-select filters like countries, importance, currencies
      if (filterType === 'countries' || filterType === 'importance' || filterType === 'currencies') {
        const currentValues = prev[filterType] || []; // Ensure it's an array
        if (currentValues.includes(value)) {
          // Remove if already selected
          return { ...prev, [filterType]: currentValues.filter(item => item !== value) };
        } else {
          // Add if not selected
          return { ...prev, [filterType]: [...currentValues, value] };
        }
      }
      // For single-select filters like comparison
      return { ...prev, [filterType]: value };
    });
  };

  // Original AI analysis function, renamed to handleAIAnalysis
  const handleAIAnalysis = React.useCallback(async (event) => {
    if (!event) return;

    setSelectedEvent(event);
    setAnalysisText(null); // Clear previous analysis
    setAnalysisLoading(true);
    setShowQuickAnalysis(true); // Open the modal immediately

    try {
      console.log('🤖 Generating AI analysis for event:', event.title_en || event.title);

      // Use the generateAIAnalysis function with the macro economics prompt
      const { data } = await generateAIAnalysis({
        eventData: {
          title_en: event.title_en || event.title,
          title_ar: event.title_ar,
          country: event.country,
          currency: event.currency,
          eventTime: event.event_ts_utc || event.event_iso_utc, // Use consistent time source
          actual: event.actual,
          forecast: event.forecast || event.estimate,
          previous: event.previous,
          importance: event.impact,
          unit: event.unit,
          comparison: event.comparison,
          period: event.period,
          revisions: event.revisions,
          headlines: event.headlines
        },
        language: language,
        userTimezone: timezone
      });

      if (data?.success && data?.analysis) {
        setAnalysisText(data.analysis);
      } else {
        const fallback = language === 'ar' ?
          'لم يتمكن من إنشاء التحليل في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقاً.' :
          'Could not generate analysis at this time. Please try again later.';
        setAnalysisText(fallback);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMsg = language === 'ar' ?
        'حدث خطأ أثناء إنشاء التحليل. يرجى المحاولة مرة أخرى.' :
        'An error occurred while generating the analysis. Please try again.';
      setAnalysisText(errorMsg);
    } finally {
      setAnalysisLoading(false);
    }
  }, [language, timezone, setSelectedEvent, setAnalysisText, setAnalysisLoading, setShowQuickAnalysis]); // Ensure all state setters are in dependencies

  // Regenerate analysis calls the renamed function
  const handleRegenerateAnalysis = React.useCallback(async () => {
    if (selectedEvent) {
      await handleAIAnalysis(selectedEvent);
    }
  }, [selectedEvent, handleAIAnalysis]);


  const handleTriggerResultAgent = useCallback(async (event) => {
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      sonnerToast.warning(L.admin.adminAccessRequired || 'Admin access required to fetch results.');
      return;
    }

    const eventId = event.id || `${event.country}|${event.title_en || event.title}|${String(event.event_iso_utc || '').split('T')[0]}`;

    setLoadingOfficialResult(prev => ({ ...prev, [eventId]: true }));
    setResultMessages(prev => ({ ...prev, [eventId]: null }));

    try {
      console.log(`[ECO_TRIGGER] Triggering eco agent for: ${event.title_en || event.title}`);

      // ✅ FIX: Call the proper eco agent trigger function
      const { data } = await triggerEcoAgent({ event });

      if (data?.success) {
        sonnerToast.success(data.message || 'Economic agent dispatched successfully');
        setResultMessages(prev => ({ ...prev, [eventId]: data.message || 'Agent dispatched' }));
        setTimeout(() => {
          setRefreshNonce(prev => prev + 1);
        }, 5000); // Give agent time to work
      } else {
        const errorMsg = data?.error || 'Failed to dispatch agent';
        setResultMessages(prev => ({ ...prev, [eventId]: errorMsg }));
        sonnerToast.error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error triggering eco agent:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to dispatch agent';
      setResultMessages(prev => ({ ...prev, [eventId]: errorMessage }));
      sonnerToast.error(errorMessage);
    } finally {
        setTimeout(() => {
            setLoadingOfficialResult(prev => {
                const newState = { ...prev };
                delete newState[eventId];
                return newState;
            });
        }, 8000); // Longer timeout for agent processing
    }
  }, [user, sonnerToast, setRefreshNonce, setLoadingOfficialResult, setResultMessages, L]);

  // Debounced search query for performance
  const debouncedSearch = useMemo(() => debounce((q) => {
    setSearchQuery(q);
  }, DEBOUNCE_DELAY), []);

  // ✅ FIX: Rewrote date range calculation to use pure UTC dates without the missing package.
  const getUtcDateRangeForFilter = useCallback(() => {
    const now = new Date();
    // Get the start of the current UTC day
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    let fromDate, toDate;

    switch (dateFilter) {
      case "tomorrow":
        const tomorrowUtc = addDays(todayUtc, 1);
        fromDate = toDate = tomorrowUtc;
        break;
      case "thisWeek":
        // Note: date-fns startOfWeek/endOfWeek are locale-dependent. We will calculate manually for UTC.
        const dayOfWeek = todayUtc.getUTCDay(); // 0 for Sunday, 1 for Monday, etc.
        const startDay = dayOfWeek === 0 ? -6 : 1; // Start on Monday (if today is Sun(0), go back 6 days. If today is Mon(1), go back 0 days (1-1))
        const weekStartUtc = addDays(todayUtc, startDay - dayOfWeek);
        const weekEndUtc = addDays(weekStartUtc, 6); // Monday + 6 days = Sunday
        fromDate = weekStartUtc;
        toDate = weekEndUtc;
        break;
      case "custom":
        // For custom range, we use the selected dates directly.
        // We must ensure they are treated as UTC dates for the API call.
        if (customDateRange.from && customDateRange.to) {
          const from = customDateRange.from;
          const to = customDateRange.to;
          return {
            from: format(from, "yyyy-MM-dd"),
            to: format(to, "yyyy-MM-dd"),
          };
        }
        // Fallback to today if range is invalid
        fromDate = toDate = todayUtc;
        break;
      case "today":
      default:
        fromDate = toDate = todayUtc;
        break;
    }

    // Format the final UTC dates for the API payload.
    return {
      from: format(fromDate, "yyyy-MM-dd"),
      to: format(toDate, "yyyy-MM-dd"),
    };
  }, [dateFilter, customDateRange]);


  // ✅ FIX: Load persisted results on component mount
  useEffect(() => {
    const loadPersistedResults = () => {
      const results = new Map();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('official_result_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.timestamp && (Date.now() - data.timestamp < 24 * 60 * 60 * 1000)) { // 24 hours
              // Reconstruct the event identifier used as the Map key
              // The localStorage key structure is `official_result_COUNTRY_TITLE_EN_ISO_DATE`
              // The `eventIdentifier` used for localStorage is `event.id || `${event.country}|${event.title_en || event.title}|${String(event.event_iso_utc || '').split('T')[0]}`;`
              // When storing, we replace `|` with `_`. So reverse this for the key used in the Map.
              const parts = key.replace('official_result_', '');
              const eventIdentifier = parts.replace(/_/g, '|');
              results.set(eventIdentifier, data);
            } else {
              localStorage.removeItem(key); // Remove expired or invalid entry
            }
          } catch (e) {
            console.warn("Failed to parse persisted official result from localStorage:", key, e);
            localStorage.removeItem(key); // Clean up bad data
          }
        }
      }
      setOfficialResults(results);
    };

    loadPersistedResults();
  }, []); // Empty dependency array means this runs once on mount


  // Helper to process event data, ensuring consistency and derived properties
  // ✅ FIX: Enhanced processEventData to preserve official results
  const processEventData = useCallback((eventsToProcess) => {
    return (eventsToProcess || [])
      .map(event => {
        if (!event) return null;

        // Determine a stable key for the event
        const eventIdentifier = event.id || `${event.country}|${event.title_en || event.title}|${String(event.event_iso_utc || '').split('T')[0]}`;
        const officialResult = officialResults.get(eventIdentifier);

        // Prioritize official result from state if available
        const actualFromSource = safeGet(event, 'actual_raw', event.actual);
        const actual = (officialResult?.actual !== undefined && officialResult?.actual !== null) ? officialResult.actual : actualFromSource;
        const unit = officialResult?.unit || event.unit;
        const source = officialResult?.source || event.source;
        const verified = officialResult?.verified || event.verified; // Keep original verified if not overridden by official source
        const hasOfficialData = Boolean(officialResult || event._has_official_data || event.has_official_data);


        // ✅ SAFE: Use safe helpers for all string operations
        const actualVal = S(actual); // Ensure it's a safe string
        const forecastVal = S(safeGet(event, 'forecast_raw', pickForecast(event)));
        const previousVal = S(safeGet(event, 'previous_raw', event.previous));
        const estimateVal = S(safeGet(event, 'estimate_raw', event.estimate));

        // ✅ SAFE: Handle event_day_utc with safe string operations
        if (!event.event_day_utc && event.event_ts_utc) {
          const date = new Date(event.event_ts_utc);
          if (!isNaN(date.getTime())) {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            event.event_day_utc = `${year}-${month}-${day}`;
          }
        } else if (event.event_day_utc && typeof event.event_day_utc !== 'string') {
          const date = new Date(event.event_ts_utc);
          if (!isNaN(date.getTime())) {
            event.event_day_utc = new Intl.DateTimeFormat('en-CA', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              timeZone: 'UTC'
            }).format(date);
          }
        }

        // Calculate derived properties once
        const trend = getTrend(actualVal, forecastVal, event);
        const impact = normalizeImpactBucket(event);

        // ✅ SAFE: Handle official data flags
        const cacheExpires = S(event._cache_expires || event.cache_expires || '');

        return {
          ...event, // Keep original
          actual: actualVal, // Ensure these are set for consistency
          forecast: forecastVal,
          previous: previousVal,
          estimate: estimateVal,
          unit: unit, // Use derived unit
          // Add raw versions explicitly if they were not there (e.g., if backend only sent 'actual')
          actual_raw: actualVal,
          forecast_raw: forecastVal,
          previous_raw: previousVal,
          estimate_raw: estimateVal, // ✅ FIXED: Use estimateVal instead of undefined estimate_raw
          time_utc: event.event_ts_utc, // Ensure consistent access
          trend, // Store derived trend
          impact, // Store derived impact bucket

          // Official data indicators (preserved from cache merge)
          has_official_data: hasOfficialData,
          verified: verified,
          source: source,
          cache_expires: cacheExpires,
          official_source: source, // Use derived source
          _cache_id: event._cache_id, // Ensure _cache_id is passed through
          _persisted_result: Boolean(officialResult) // Flag to show it's persisted
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.time_utc ?? 0) - (b.time_utc ?? 0)); // Sort by timestamp
  }, [officialResults]); // ✅ Add officialResults as dependency

  // Main data fetching logic
  const fetchCalendarData = useCallback(async (options = {}) => {
    const force = options?.force === true || refreshNonce > 0;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentController = new AbortController();
    abortControllerRef.current = currentController;

    // ✅ FIX: Use the new helper to get the correct UTC date range
    const { from, to } = getUtcDateRangeForFilter();

    if (!from || !to) {
      setError(L.toasts.failed + ': ' + (language === 'ar' ? 'يرجى تحديد نطاق تاريخ صالح.' : 'Please select a valid date range.'));
      setLoading(false);
      setEvents([]);
      setStats({ total: 0, filtered: 0, showing: 0 });
      return;
    }

    setLoading(true);
    setError(null);
    setEvents([]);
    setStats({ total: 0, filtered: 0, showing: 0 });

    try {
      const payload = {
        from: from,
        to: to,
        lang: language === "ar" ? "ar" : "en",
        countries: filters.countries.length > 0 ? filters.countries : COUNTRY_FILTER_LIST,
      };

      if (force) {
        payload.force = true;
      }
      if (filters.comparison !== 'all') {
        payload.comparison = filters.comparison;
      }

      console.log("Fetching calendar with UTC payload:", payload);

      const { data, error } = await getEconomicCalendar(payload, { signal: currentController.signal });

      if (currentController.signal.aborted) {
        return;
      }

      // Handle rate limiting specifically before processing success/error
      if (error && error.status === 429) {
        console.warn('⚠️ Rate limited, showing cached data if available');
        setError(language === 'ar'
          ? 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.'
          : 'Rate limit exceeded. Please try again in a minute.');
        setEvents([]); // Clear events on rate limit if rate limited
        return; // Exit early
      }

      if (data && data.success) {
        const processedFetchedEvents = processEventData(data.events);

        setEvents(processedFetchedEvents);
        setError(null);

        // Enhanced notification about official data
        const officialCount = processedFetchedEvents.filter(e => e.has_official_data).length;
        if (officialCount > 0) {
          const message = language === 'ar'
            ? `✅ تم تحميل ${toEnDigits(officialCount)} أحداث مع نتائج رسمية مؤكدة`
            : `✅ ${officialCount} events loaded with confirmed official results`;

          notify('success', message);
          console.log(`📊 Calendar loaded with ${officialCount} official results from cache`);
        }

        if (data.warnings && data.warnings.length > 0) {
          console.warn("API warnings:", data.warnings);
        }
      } else {
        setError(data?.error || L.errorFetch);
        setEvents([]);
        setStats({ total: 0, filtered: 0, showing: 0 });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
      } else { // Check for rate limiting error specifically in catch
        if (err.response?.status === 429 || err.message?.includes('429')) {
          setError(language === 'ar' ? 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.' : 'Rate limit exceeded. Please try again in a minute.');
          setEvents([]); // Clear events
        } else {
          console.error("Fetch error:", err);
          setError(err.message || L.errorFetch);
          setEvents([]);
          setStats({ total: 0, filtered: 0, showing: 0 });
        }
      }
    } finally {
      if (!currentController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [
    filters,
    language,
    refreshNonce,
    getUtcDateRangeForFilter, // ✅ Add new dependency
    processEventData,
    notify,
    L
  ]);


  // Function to update a single event in the `events` state (kept for other potential uses)
  const handleEventUpdate = useCallback((eventId, updatedEvent) => {
    setEvents(currentEvents =>
      currentEvents.map(event => (event.id === eventId ? updatedEvent : event))
    );
  }, []);

  // handleGetOfficialResult function removed - now superseded by handleTriggerResultAgent

  // Grouping, filtering, and sorting logic moved to useMemo
  const {
    filteredEvents,
    groupedEvents,
    sortedDays,
    totalEventCount,
    hasMore,
  } = useMemo(() => {
    if (!events || events.length === 0) {
      return { filteredEvents: [], groupedEvents: {}, sortedDays: [], totalEventCount: 0, hasMore: false };
    }

    const lowerCaseSearchQuery = searchQuery.toLowerCase();

    const filtered = events.filter(e => { // Corrected from `list.filter` to `events.filter`
      // SEARCH (force strings to avoid regex on undefined)
      const title = (e.title_en || '').toString();
      const currency = (e.currency || '').toString();
      let matchesSearch = true;
      if (searchQuery) {
        try {
          const rx = new RegExp(searchQuery, 'i');
          matchesSearch = !!(TEST(title, rx) || TEST(currency, rx));
        } catch {
          matchesSearch = false;
        }
      }

      // COUNTRIES / IMPACT / CURRENCIES / COMPARISON
      const matchesCountries = filters.countries.length === 0 || filters.countries.includes(e.country);
      const matchesImportance = filters.importance.length === 0 || filters.importance.map(i => i.toLowerCase()).includes((e.impact || '').toLowerCase());
      const matchesCurrencies = filters.currencies.length === 0 || filters.currencies.includes(e.currency);
      const matchesComparison = (filters.comparison === 'all') || (e.comparison === filters.comparison);

      return matchesSearch && matchesCountries && matchesImportance && matchesCurrencies && matchesComparison;
    });

    // GROUP (will work now because event_day_utc is set)
    const grouped = filtered.reduce((acc, ev) => {
      const day = ev.event_day_utc;
      if (!day) return acc;
      (acc[day] ||= []).push(ev);
      return acc;
    }, {});

    const sorted = Object.keys(grouped).sort();

    return {
      filteredEvents: filtered,
      groupedEvents: grouped,
      sortedDays: sorted,
      totalEventCount: filtered.length,
      hasMore: filtered.length > displayCount,
    };
  }, [events, searchQuery, filters, displayCount]); // Removed getEventTitle from dependencies

  // Debounced loading with longer delay to reduce API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCalendarData({ force: refreshNonce > 0 }); // Pass options for forced refresh
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [fetchCalendarData, refreshNonce]); // Dependencies should trigger re-fetch


  const handleBulkOfficialResultFetch = useCallback(async () => {
    if (!isAdminUser || bulkLoading) return;
    setBulkLoading(true);

    const pendingEvents = filteredEvents
      .filter(event => {
        const isResultExpected = event.previous_raw != null || event.forecast_raw != null;
        const isPending = !event.actual || event.actual === '' || event.actual === '—' || event.actual === 'N/A';
        return isResultExpected && isPending;
      })
      .slice(0, 20);

    if (pendingEvents.length === 0) {
      sonnerToast.info(L.toasts.noneReady);
      setBulkLoading(false);
      return;
    }

    const toastId = sonnerToast.loading(L.toasts.bulkStart(0, pendingEvents.length));
    let fetchedCount = 0;
    let failedCount = 0;

    const concurrencyLimit = 5;
    const promises = [];

    for (const event of pendingEvents) {
      const promise = (async () => {
        try {
          const { triggerEcoAgent } = await import('@/api/functions'); // Changed from fetchOfficialResult
          const { data: response } = await triggerEcoAgent({ event }); // Changed from fetchOfficialResult
          
          if (response && response.success) {
            fetchedCount++;
            // The direct fetch will update the backend, so we don't need local persistence here.
            // The refreshNonce will trigger a re-fetch that picks up the changes.
            return { success: true };
          } else {
            failedCount++;
            console.warn(`Bulk dispatch failed for ${event.title_en}:`, response?.error || 'No success response from triggerEcoAgent');
            return { success: false };
          }
        } catch (error) {
          failedCount++;
          console.error(`Error triggering agent for ${event.title_en} in bulk:`, error);
          return { success: false };
        }
      })();
      promises.push(promise);
    }

    await Promise.all(promises);

    sonnerToast.success(L.toasts.bulkDone(fetchedCount, pendingEvents.length), { id: toastId });
    setBulkLoading(false);
    // After bulk fetch, trigger a full calendar data refresh to ensure processEventData picks up new officialResults.
    setRefreshNonce(prev => prev + 1); // Trigger a refresh to get the updated data from backend

  }, [isAdminUser, bulkLoading, filteredEvents, L, sonnerToast, setRefreshNonce]);

  // Handle date filter selection (simplified, removed custom dialog logic)
  const handleDateFilter = useCallback((filterType) => {
    setDateFilter(filterType);
  }, []);

  // Function to parse user date input (DD-MM-YYYY or MM/DD/YYYY to YYYY-MM-DD)
  // This function is no longer strictly needed with shadcn Calendar but kept for robustness if similar parsing is done elsewhere.
  const parseUserDateInput = useCallback((input) => {
    if (!input) return null;

    const cleaned = S(input).trim();
    if (!cleaned) return null;

    // ✅ SAFE: Use MATCH instead of .match()
    const dashMatch = MATCH(cleaned, /^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dashMatch) {
      const [, day, month, year] = dashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const slashMatch = MATCH(cleaned, /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, month, day, year] = slashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // ✅ SAFE: Use TEST instead of direct regex test
    if (TEST(cleaned, /^\d{4}-\d{2}-\d{2}$/)) {
      return cleaned;
    }

    return null;
  }, []);

  // Update stats whenever processedEvents or displayCount changes
  useEffect(() => {
    setStats({
      total: events.length,
      filtered: filteredEvents.length,
      showing: Math.min(displayCount, filteredEvents.length)
    });
  }, [events.length, filteredEvents.length, displayCount]);

  // Fetch user's default timezone on mount (This remains a separate useEffect)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getUserTimezone();
        if (data && data.success && data.timezone) {
          setTimezone(data.timezone);
        }
      } catch (e) {
        console.warn("Could not fetch user's default timezone.", e);
      }
    })();
  }, []);

  const handleSetDefaultTimezone = async () => {
    try {
      const timezoneToSave = normalizeTZ(timezone);
      await saveUserTimezone({ timezone: timezoneToSave });
      notify('success', L.timezoneDefaultSaved);
    }
    catch (e) {
      console.error("Failed to save default timezone", e);
      notify('error', language === 'ar' ? 'فشل في حفظ المنطقة الزمنية الافتراضية.' : 'Failed to save default timezone.');
    }
  };


  // Timezone options
  const timezoneOptions = useMemo(() => {
    const popular = [
      'UTC',
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Asia/Dubai',
      'Asia/Riyadh',
      'Asia/Kuwait',
      'Africa/Cairo',
      'Europe/Paris',
      'Europe/Berlin',
      'Australia/Sydney',
      'America/Los_Angeles',
    ];

    const allTimezones = Intl.supportedValuesOf('timeZone').sort();

    const options = [
      { value: 'local', label: L.autoTimezone + ' (' + Intl.DateTimeFormat().resolvedOptions().timeZone + ')' },
      { value: 'popular', label: L.popularTimezones, disabled: true },
      ...popular.filter(tz => allTimezones.includes(tz)).map(tz => ({ value: tz, label: tz })),
      { value: 'all', label: '--- All Timezones ---', disabled: true },
      ...allTimezones.map(tz => ({ value: tz, label: tz })),
    ];

    return options;
  }, [L]);

  // Filter options for countries
  const countryOptions = useMemo(() => {
    return COUNTRY_FILTER_LIST.map(countryCode => ({
      value: countryCode,
      label: countryCode, // Simple label
      flag: countryCode
    }));
  }, []);

  // Filter options for importance - support multiple selections
  const importanceOptions = useMemo(() => {
    return IMPACT_LEVELS.map(level => ({
      value: level.toLowerCase(),
      label: L.impact[level.toLowerCase()]
    }));
  }, [L]);

  // Filter options for comparison
  const comparisonOptions = useMemo(() => [
    { value: 'all', label: L.filterLabels.noComparison },
    { value: 'mom', label: L.filterLabels.monthOverMonth },
    { value: 'qoq', label: L.filterLabels.quarterOverQuarter },
    { value: 'yoy', label: L.filterLabels.yearOverYear },
  ], [L]);

  // Filter options for currency
  const currencyOptions = useMemo(() => {
    return CURRENCY_FILTER_LIST.map(currencyCode => ({
      value: currencyCode,
      label: currencyCode,
    }));
  }, []);

  // FIX: Wrap handleRefresh in useCallback to stabilize its identity for other hooks.
  const handleRefresh = useCallback(() => {
    setRefreshNonce(n => n + 1);
  }, []);

  const handleEventAlert = useCallback(async (event) => {
    if (!user?.id) {
      window.dispatchEvent(new CustomEvent('show-login-modal'));
      return;
    }

    try {
      // Import toggleEventAlert inside useCallback to avoid circular dependency and for lazy loading
      const { toggleEventAlert } = await import('@/api/functions'); 
      await toggleEventAlert({
        event_id: event.id,
        payload: {
          event_ts_utc: event.event_ts_utc,
          country: event.country,
          title_en: event.title_en,
        },
      });
      toast({
        title: L.toasts.alertUpdated,
        variant: 'success',
      });
      window.dispatchEvent(new Event('alerts-updated'));
    } catch (error) {
      console.error('Alert toggle error:', error);
      toast({
        title: L.toasts.alertUpdateFailed, // ✅ FIX: Use new toast key
        variant: 'destructive',
      });
    }
  }, [user, toast, L]); // ✅ FIX: Removed 'language' dependency

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({ countries: [], importance: [], currencies: [], comparison: 'all' });
    setDateFilter('today');
    setCustomDateRange({ from: new Date(), to: new Date() }); // Reset custom range
    handleRefresh();
  }, [handleRefresh]);

  const formatDateHeader = useCallback((day) => {
    const date = new Date(`${day}T00:00:00Z`); // Use 00:00:00Z to ensure it's the start of the UTC day
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Compare with UTC start of today
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    if (date.getTime() === today.getTime()) return L.misc.today; // Use L.misc
    if (date.getTime() === tomorrow.getTime()) return L.misc.tomorrow; // Use L.misc

    return new Intl.DateTimeFormat(language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  }, [L, language]);

  let displayedEventCount = 0; // Initialize a counter for rendering events up to displayCount

  // Render logic
  return (
    <div id="economic-calendar" className="px-4 py-8 bg-light-bg dark:bg-dark-bg" dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{`
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>
      <div className="max-w-7xl mx-auto fade-in">
        <div className="neumorphic-inset p-4 md:p-6 mb-8 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">{L.calendarTitle}</h2>
              <p className="text-secondary">
                {dateFilter === 'custom' && customDateRange?.from && customDateRange?.to
                  ? `${format(customDateRange.from, 'MMM dd, yyyy')} - ${format(customDateRange.to, 'MMM dd, yyyy')}`
                  : L.dateFilters[dateFilter]
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openFilters}
                    className="neumorphic-button px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <Filter className="w-5 h-5" />
                    <span className="hidden sm:inline">{L.actions.filters}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg w-[95vw] neumorphic p-0 rounded-2xl max-h-[85vh] flex flex-col">
                  <DialogHeader className="p-6 pb-4 flex-shrink-0">
                    <DialogTitle className="text-primary text-xl font-bold">{L.actions.filters}</DialogTitle>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto px-6 space-y-6 min-h-0">
                    <div className="flex flex-col gap-2">
                      <label className="text-primary font-medium">{L.filterLabels.countries}</label>
                      <div className="flex flex-wrap gap-2">
                        {countryOptions.map(country => {
                          const selected = stagedFilters.countries.includes(country.value);
                          return (
                            <Button
                              key={country.value}
                              onClick={() => handleFilterChange('countries', country.value)}
                              aria-pressed={selected}
                              className={btnClass(selected) + " flex items-center gap-2"}
                              title={country.label}
                            >
                              <CountryFlag code={country.flag} className="w-4 h-3" />
                              <span className="text-xs">{country.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-primary font-medium">{L.filterLabels.importance}</label>
                      <div className="flex flex-wrap gap-2">
                        {importanceOptions.map(item => {
                          const selected = stagedFilters.importance.includes(item.value);
                          return (
                            <Button
                              key={item.value}
                              onClick={() => handleFilterChange('importance', item.value)}
                              aria-pressed={selected}
                              className={btnClass(selected)}
                            >
                              {item.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-primary font-medium">{L.filterLabels.comparison}</label>
                      <div className="flex flex-wrap gap-2">
                        {comparisonOptions.map(comp => {
                          const selected = stagedFilters.comparison === comp.value;
                          return (
                            <Button
                              key={comp.value}
                              onClick={() => handleFilterChange('comparison', comp.value)}
                              aria-pressed={selected}
                              className={btnClass(selected)}
                            >
                              <span className="relative z-10">{comp.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-primary font-medium">{L.columns.currency}</label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleFilterChange('currencies', [])}
                          aria-pressed={stagedFilters.currencies.length === 0}
                          className={btnClass(stagedFilters.currencies.length === 0)}
                        >
                          <span className="relative z-10">{L.filterLabels.allCurrencies}</span>
                        </Button>
                        {currencyOptions.map(curr => {
                          const selected = stagedFilters.currencies.includes(curr.value);
                          return (
                            <Button
                              key={curr.value}
                              onClick={() => handleFilterChange('currencies', curr.value)}
                              aria-pressed={selected}
                              className={btnClass(selected)}
                            >
                              <span className="relative z-10">{curr.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setStagedFilters({ countries: [], importance: [], currencies: [], comparison: 'all' });
                      }}
                      className="neumorphic-button px-4 py-2 rounded-xl flex items-center gap-2 mt-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      {L.actions.reset}
                    </Button>
                  </div>

                  <DialogFooter className="p-6 pt-4 flex-shrink-0 bg-light-bg/50 dark:bg-dark-bg/50 rounded-b-2xl">
                    <Button onClick={applyFilters} className="w-full neumorphic-button text-white" style={{ backgroundColor: '#7cb342' }}>
                      {L.actions.applyFilters}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                onClick={clearFilters}
                className="neumorphic-button p-2 rounded-xl"
                title={L.actions.clearFilters}
              >
                <XIcon className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                className="neumorphic-button px-4 py-2 rounded-xl flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {L.actions.refresh}
              </Button>
            </div>
          </div>

          {isAdminUser && (
            <div className="mb-4 p-4 neumorphic-inset rounded-2xl">
              <div className="flex flex-wrap gap-3 items-center">
                <Button
                  onClick={handleBulkOfficialResultFetch}
                  disabled={bulkLoading}
                  className="neumorphic-button px-4 py-2 rounded-xl text-sm flex items-center gap-2 font-medium disabled:opacity-50"
                  style={{ color: '#7cb342' }}
                >
                  <RefreshCw className={`w-4 h-4 ${bulkLoading ? 'animate-spin' : ''}`} />
                  {bulkLoading ? L.admin.fetching : L.admin.fetchOfficialBulk}
                </Button>
                <span className="text-xs text-gray-500 flex items-center">
                  {L.admin.fetchNote}
                </span>
              </div>
            </div>
          )}

          {/* Date Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-medium text-secondary mr-2">{L.controls.filterByDate}:</span>
            <div className="neumorphic-button p-1 rounded-xl flex items-center justify-center gap-1 flex-wrap">
              {['today', 'tomorrow', 'thisWeek'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    dateFilter === filter ? 'neumorphic-pressed' : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {L.dateFilters[filter]}
                </button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setDateFilter('custom')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                      dateFilter === 'custom' ? 'neumorphic-pressed' : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <CalendarIcon className="w-3 h-3" />
                    {L.dateFilters.custom}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={customDateRange?.from}
                    selected={customDateRange}
                    onSelect={(range) => setCustomDateRange(range || { from: new Date(), to: new Date() })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="neumorphic-pressed p-3 rounded-xl flex items-center mb-4">
            <Search className="w-5 h-5 text-gray-500 mx-3" />
            <Input
              type="text"
              placeholder={L.searchPlaceholder} // Using the new top-level searchPlaceholder
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-primary placeholder-gray-500 py-2"
            />
          </div>

          {/* Timezone Selector */}
          <div className="mb-4 neumorphic p-4 sm:p-6 rounded-2xl">
            <h4 className="font-semibold mb-2 text-primary">{L.filterLabels.timezone}</h4>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  localStorage.setItem('liirat-timezone', e.target.value);
                }}
                className="neumorphic-pressed px-3 py-2 rounded-xl outline-none bg-transparent text-primary text-sm"
              >
                {timezoneOptions.map(tz => (
                  <option key={tz.value} value={tz.value} disabled={tz.disabled}>{tz.label}</option>
                ))}
              </select>
              <Button onClick={handleSetDefaultTimezone} className="neumorphic-button text-sm px-3 py-1.5 rounded-lg" style={{ color: 'var(--accent)' }}>
                {language === 'ar' ? 'اجعلها الافتراضية' : 'Set as Default'}
              </Button>
            </div>
          </div>

          {/* Counters */}
          {events.length > 0 && (
            <div className="flex items-center justify-between mb-4 text-sm text-secondary">
              <div className="flex gap-4">
                <span>{L.counters.total}: {stats.total}</span>
                <span>{L.counters.filtered}: {stats.filtered}</span>
                <span>{L.counters.showing}: {stats.showing}</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="text-red-500 text-center py-4">
              <AlertCircle className="w-10 h-10 mx-auto mb-3" />
              <p>{error}</p>
            </div>
          )}
        </div> {/* End of top neumorphic-inset */}

        {/* Main Content Area */}
        <div className="neumorphic-inset p-4 rounded-2xl">
          <div className="min-h-[600px]">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              {loading ? (
                <div className="text-center py-16 text-secondary">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: '#8b5cf6', borderTopColor: 'transparent' }}></div>
                  </div>
                </div>
              ) : sortedDays.length === 0 ? (
                <div className="text-center py-16 text-secondary">
                  <p className="text-lg font-medium">{L.misc.noEventsFound}</p>
                  <p className="text-sm">{L.misc.noEventsSubtitle}</p>
                </div>
              ) : (
                <table className="w-full">
                  <colgroup>
                    <col style={{ width: '360px' }} /> {/* Event */}
                    <col style={{ width: '96px' }} />  {/* Country */}
                    <col style={{ width: '140px' }} /> {/* Date & Time */}
                    <col style={{ width: '100px' }} /> {/* Impact */}
                    <col style={{ width: '112px' }} /> {/* Actual */}
                    <col style={{ width: '112px' }} /> {/* Estimate */}
                    <col style={{ width: '112px' }} /> {/* Forecast */}
                    <col style={{ width: '112px' }} /> {/* Previous */}
                    <col style={{ width: '144px' }} /> {/* Comparison */}
                    <col style={{ width: '144px' }} /> {/* Actions */}
                  </colgroup>

                  <thead>
                    <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                      <th className="py-3 px-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">{L.columns.economicEvent}</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">{L.columns.country}</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">{L.columns.datetime}</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">{L.columns.impact}</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">{L.columns.actual}</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">{L.columns.estimate}</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">{L.columns.forecast}</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">{L.columns.previous}</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">{L.columns.comparison}</th>
                      <th className="p-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider sticky right-0 bg-inherit">{L.columns.actions}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {filteredEvents.slice(0, displayCount).map((event) => (
                      <CalendarRow
                        key={event?.id || `${event.country}-${event.title_en}-${event.event_iso_utc}`}
                        event={event}
                        language={language}
                        timezone={timezone}
                        onEventAlert={handleEventAlert}
                        onQuickAnalysis={handleAIAnalysis} // Calls the AI analysis modal
                        onEventUpdate={handleEventUpdate}
                        isAdminUser={isAdminUser}
                        L={L}
                        getEventTitle={getEventTitle}
                        onFetchOfficial={handleTriggerResultAgent} // Calls the agent trigger
                        isLoadingOfficial={loadingOfficialResult}
                        resultMessage={resultMessages[event.id || `${event.country}|${event.title_en || event.title}|${String(event.event_iso_utc || '').split('T')[0]}`]}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Mobile-friendly cards */}
            <div className="block md:hidden p-3" key={`mobile-${dateFilter}-${customDateRange?.from?.toISOString()}-${customDateRange?.to?.toISOString()}`}>
              {loading ? (
                <div className="text-center py-8 text-secondary">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: '#8b5cf6', borderTopColor: 'transparent' }}></div>
                    <span>{L.toasts.fetching}</span>
                  </div>
                </div>
              ) : sortedDays.length === 0 ? (
                <div className="text-center py-8 text-secondary">
                  <p className="text-lg font-medium">{L.misc.noEventsFound}</p>
                  <p className="text-sm">{L.misc.noEventsSubtitle}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedEventCount = 0} {/* Reset counter for mobile view */}
                  {sortedDays.map((day) => {
                    if (displayedEventCount >= displayCount) return null; // Global limit check
                    return (
                      <div key={`mobile-day-${day}`}>
                        <h3 className="px-1 py-2 font-semibold text-primary">{formatDateHeader(day)}</h3>
                        <div className="space-y-3">
                          {groupedEvents[day].map((event) => {
                            if (displayedEventCount >= displayCount) return null; // Global limit check
                            displayedEventCount++; // Increment for each displayed event
                            if (!event) return null;
                            const rowKey = event.id || `${event.country}-${event.title_en}-${event.event_iso_utc}`;
                            const eventImpactBucket = event.impact; // Use pre-calculated impact
                            const label = impactLabel(eventImpactBucket, language);
                            const eventTitle = getEventTitle(event);

                            const hasActualValue = (event.actual !== null && event.actual !== undefined && String(event.actual).trim() !== '' && String(event.actual).trim() !== '—');
                            const isResultExpected = event.previous_raw != null || event.forecast_raw != null;
                            const isAISourced = event.source && /ai web search/i.test(event.source);
                            const displayUnit = event.unit; // Use event.unit
                            const trend = event.trend; // Use pre-calculated trend

                            // ✅ FIX: Define eventIdentifier for mobile section
                            const eventIdentifier = event.id || `${event.country}|${event.title_en || event.title}|${String(event.event_iso_utc || '').split('T')[0]}`;

                            // Mobile-specific official result fetch (will call the new handleTriggerResultAgent function)
                            const handleMobileGetOfficial = async (event) => {
                              if (!isAdminUser || event.is_non_numeric || hasActualValue || loadingOfficialResult[eventIdentifier]) {
                                return;
                              }
                              sonnerToast.loading(language === 'ar' ? `جاري إرسال طلب جلب النتيجة لـ "${getEventTitle(event)}"...` : `Dispatching fetch request for "${getEventTitle(event)}"...`);
                              try {
                                setLoadingOfficialResult(prev => ({ ...prev, [eventIdentifier]: true }));
                                // ✅ FIX: Call the new triggerEcoAgent function directly
                                const { data: response } = await triggerEcoAgent({ event });

                                if (response && response.success) {
                                  sonnerToast.success(language === 'ar' ? `تم جلب النتيجة لـ: ${eventTitle}` : `Result fetched for: ${eventTitle}`);
                                  // Trigger a refresh to update the display
                                  setTimeout(() => {
                                    setRefreshNonce(prev => prev + 1);
                                  }, 3000);
                                } else {
                                  sonnerToast.error(response?.error || (language === 'ar' ? `فشل: ${L.admin.fetchError}` : `Failed: ${L.admin.fetchError}`));
                                }
                              } catch (error) {
                                console.error("Error triggering fetch:", error);
                                const errorMessage = error.response?.data?.error || error.message || (language === 'ar' ? `فشل: ${L.admin.fetchError}` : `Failed: ${L.admin.fetchError}`);
                                sonnerToast.error(errorMessage);
                              } finally {
                                setLoadingOfficialResult(prev => ({ ...prev, [eventIdentifier]: false }));
                                sonnerToast.dismiss(); // Dismiss the loading toast
                              }
                            };


                            return (
                              <div
                                key={rowKey}
                                className="rounded-2xl p-4 neumorphic-pressed relative transition-transform duration-150 active:scale-[0.995]"
                                dir={isRTL ? 'rtl' : 'ltr'}
                              >
                                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />

                                <div className="mb-2">
                                  <h3 className="font-semibold text-primary leading-snug break-words">
                                    {isAISourced && (
                                      <span
                                        className="h-2 w-2 bg-blue-500 rounded-full inline-block mr-1 align-middle"
                                        title={`Sourced by AI: ${event.source}`}
                                      />
                                    )}
                                    {String(eventTitle)}
                                  </h3>
                                  <p className="text-xs text-secondary mt-1">
                                    {formatTimestampInTz(event.time_utc, timezone, language, event.time_tentative)}
                                  </p>
                                </div>

                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-secondary">{L.columns.country}</span>
                                    <div className="text-primary flex items-center justify-center">
                                      <CountryFlag code={event.country} className="w-4 h-3" />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-secondary">{L.columns.impact}</span>
                                    <span className={getImpactBadge(eventImpactBucket)}>
                                      {String(label)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-secondary">{L.columns.period}</span>
                                    <span className="text-primary">
                                      {event.period || '—'}
                                    </span>
                                  </div>

                                  <div className="h-[1px] my-2 bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />

                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-secondary">{L.columns.actual}</span>
                                    <span className={`text-primary flex items-center gap-1 tabular-nums ${trend === 'positive' ? 'text-green-600 dark:text-green-400 font-bold' : trend === 'negative' ? 'text-red-600 dark:text-red-500 font-bold' : ''}`}>
                                      {isAISourced && <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" title={`Sourced by AI: ${event.source}`}></div>}
                                      <FmtVal v={event.actual} u={displayUnit} event={event} />
                                      {event.verified && (
                                        <CheckCircle2 className="w-3 h-3 inline-block ml-1 text-green-500" title={L.tooltips.officialResult} />
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-secondary">{L.columns.estimate}</span>
                                    <span className="text-primary tabular-nums">
                                      <FmtVal v={event.estimate} u={displayUnit} event={event} />
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-secondary">{L.columns.forecast}</span>
                                    <span className="text-primary tabular-nums">
                                      <FmtVal v={event.forecast} u={displayUnit} event={event} />
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-secondary">{L.columns.previous}</span>
                                    <span className="text-primary tabular-nums">
                                      <FmtVal v={event.previous} u={displayUnit} event={event} />
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                  <Button
                                    onClick={() => handleEventAlert(event)}
                                    className="neumorphic-button px-2.5 py-1.5 rounded-full text-[11px] flex items-center"
                                    title={L.actions.alert}
                                    aria-label={L.actions.alert}
                                  >
                                    <Bell className="w-3.5 h-3.5 text-blue-500" />
                                  </Button>
                                  <Button
                                    onClick={() => handleAIAnalysis(event)} // Calls the AI analysis modal
                                    className="neumorphic-button px-2.5 py-1.5 rounded-full text-[11px] flex items-center"
                                    title={L.actions.aiAnalysis}
                                    aria-label={L.actions.aiAnalysis}
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                  </Button>
                                  {isAdminUser && isResultExpected && !hasActualValue && (
                                    <Button
                                      onClick={() => handleMobileGetOfficial(event)} // Calls the agent trigger
                                      className="neumorphic-button px-2.5 py-1.5 rounded-full text-[11px] flex items-center group"
                                      title={L.admin.getOfficialResult}
                                      aria-label={L.admin.getOfficialResult}
                                      disabled={loadingOfficialResult[eventIdentifier]}
                                    >
                                      {loadingOfficialResult[eventIdentifier] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-purple-500" />}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {hasMore && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setDisplayCount(prev => prev + 20)}
                  className="neumorphic-button px-4 py-2 rounded-xl"
                >
                  {L.actions.loadMore}
                </Button>
              </div>
            )}
          </div>
        </div>
        <AIAnalysisModal
          event={selectedEvent}
          isOpen={showQuickAnalysis}
          onClose={() => setShowQuickAnalysis(false)}
          analysis={analysisText}
          loading={analysisLoading}
          language={language}
          onRegenerate={handleRegenerateAnalysis}
          timezone={timezone}
        />
      </div>
    </div>
  );
}
