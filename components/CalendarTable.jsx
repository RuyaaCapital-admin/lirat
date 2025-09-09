
// --- File: src/components/CalendarTable.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, RefreshCw, Bell, Sparkles, Calendar as CalendarIcon, X, Star, Globe, ArrowUp, ArrowDown, Info, BarChart2, Zap, HelpCircle, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ar, enUS } from "date-fns/locale";
import { useTheme } from "./ui/Theme";
import { WatchlistItem } from "@/api/entities";
import { Alert } from "@/api/entities";
import { analyzeEconomicEvent } from "@/api/functions";
import { timezones } from "./Translations";
import NewsAlertModal from "./NewsAlertModal";
import FmtVal from "./FmtVal";
import { S, TEST } from "./utils"; // TEST utility is already imported

// shadcn/ui
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { CountryFlag } from './CountryFlag';
import { LABELS } from "./EconomicCalendar";
import CalendarRow from './CalendarRow';

// ---- FORCE ASCII DIGITS (Arabic-Indic & Persian -> Latin) ----
const toLatinDigits = (s) => {
  const ar = "٠١٢٣٤٥٦٧٨٩";
  const fa = "۰۱۲۳٤٥٦٧٨٩"; // Persian digits also
  return String(s)
    .replace(/[٠-٩]/g, (d) => "0123456789"[ar.indexOf(d)])
    .replace(/[۰-۹]/g, (d) => "0123456789"[fa.indexOf(d)]);
};

// English 24h formatter (always ASCII)
const formatTimeEn = (iso, tz) => {
  try {
    return toLatinDigits(formatInTimeZone(parseISO(iso), tz || "UTC", "HH:mm"));
  } catch {
    return toLatinDigits(format(parseISO(iso), "HH:mm"));
  }
};

// helpers
const dash = (v) => (S(v).trim() === "" ? "—" : S(v));
const normalizeTZ = (tz) => (S(tz).trim() || "UTC");
const getEnDate = (isoString, timezone) => {
  const iso = S(isoString).trim();
  if (!iso) return "—";
  try { return formatInTimeZone(parseISO(iso), timezone, "MMM d"); } catch { return "—"; }
};
const getEnTime = (isoString, timezone) => {
  const iso = S(isoString).trim();
  if (!iso) return "—";
  try { return formatInTimeZone(parseISO(iso), timezone, "HH:mm"); } catch { return "—"; }
};

// Modified getImpactBadge to return an object with label and color class
function getImpactBadge(impact, language) {
  const isAr = language === 'ar';
  
  let level = 'medium';
  // Use a safe string to prevent errors
  let impactVal = S(impact).toLowerCase();

  // Use the safe TEST utility for matching
  if (TEST(impactVal, /high|3/)) level = 'high';
  else if (TEST(impactVal, /low|1/)) level = 'low';

  const config = {
    high: { label: isAr ? 'مرتفع' : 'High', color: 'bg-red-400' },
    medium: { label: isAr ? 'متوسط' : 'Medium', color: 'bg-yellow-400' },
    low: { label: isAr ? 'منخفض' : 'Low', color: 'bg-sky-400' },
  };

  return config[level];
}


const impactLabel = (impact, language) => {
  let level = "medium";
  if (typeof impact === "number") {
    level = impact >= 3 ? "high" : impact <= 1 ? "low" : "medium";
  } else {
    const s = S(impact).toLowerCase();
    if (TEST(s, /^(3|high|red)$/)) level = "high";
    else if (TEST(s, /^(1|low|green)$/)) level = "low";
  }
  if (language === "ar") return level === "high" ? "عالي" : level === "low" ? "منخفض" : "متوسط";
  return level === "high" ? "High" : level === "low" ? "Low" : "Medium";
};

const LoadingSkeleton = () => (
  <div className="space-y-2">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="grid grid-cols-7 gap-4 p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20" />
        </div>
      </div>
    ))}
  </div>
);

const ImpactIndicator = ({ level, className = "" }) => {
  const { language: themeLanguage } = useTheme();
  const colors = level >= 3 ? "#ef4444" : level <= 1 ? "#6b7280" : "#f59e0b";
  const label =
    level >= 3
      ? themeLanguage === "ar" ? "تأثير عالي" : "High impact"
      : level <= 1
      ? themeLanguage === "ar" ? "تأثير منخفض" : "Low impact"
      : themeLanguage === "ar" ? "تأثير متوسط" : "Medium impact";

  return (
    <div
      className={`w-3 h-3 rounded-full ${className}`}
      style={{ backgroundColor: colors }}
      aria-label={label}
      title={label}
    />
  );
};

const QuickAnalysisModal = ({ event, isOpen, onClose, userTimezone, language }) => {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event && !analysis) perform();
    if (!isOpen) setAnalysis("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, event]);

  const perform = async () => {
    setLoading(true);
    try {
      const response = await analyzeEconomicEvent({
        eventData: {
          event_name: S(event?.title || event?.title_en),
          currency: S(event?.currency),
          previous: S(event?.previous),
          forecast: S(event?.forecast),
          actual_value: S(event?.actual),
          event_time: S(event?.event_iso_utc),
        },
        language,
        userTimezone,
      });
      const { data } = response;
      setAnalysis(data?.success ? data.analysis : (language === "ar" ? "فشل في التحليل" : "Analysis failed"));
    } catch {
      setAnalysis(language === "ar" ? "فشل في التحليل" : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const headerTime = event ? toLatinDigits(format(parseISO(S(event.event_iso_utc)), "PPp", { locale: enUS })) : "";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="neumorphic max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: "#8b5cf6" }} />
            {language === "ar" ? "تحليل سريع" : "Quick Analysis"}
          </h3>
          <button onClick={onClose} className="neumorphic-button p-2 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="neumorphic-inset p-4 rounded-xl mb-4">
          <h4 className="font-semibold text-primary mb-2">{event?.title || event?.title_en}</h4>
          <div className="flex items-center gap-4 text-sm text-secondary">
            <CountryFlag countryCode={event?.country} currency={event?.currency} />
            <span lang="en" dir="ltr">{headerTime}</span>
          </div>
        </div>

        <div className="neumorphic-inset p-4 rounded-xl">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full mr-3" />
              <span className="text-secondary">{language === "ar" ? "جاري التحليل..." : "Analyzing..."}</span>
            </div>
          ) : (
            <div className="text-primary whitespace-pre-line leading-relaxed text-sm">
              {analysis || (language === "ar" ? "لا يوجد تحليل متاح" : "No analysis available")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function groupEventsByDay(events, timezone) {
  const grouped = {};
  if (!events) return grouped;

  events.forEach(event => {
    const eventDate = S(event.event_iso_utc).trim();
    const groupKey = eventDate ? formatInTimeZone(parseISO(eventDate), timezone, 'yyyy-MM-dd') : null;

    if (groupKey) {
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(event);
    }
  });

  for (const day in grouped) {
    grouped[day].sort((a, b) => {
      const A = S(a.event_iso_utc), B = S(b.event_iso_utc);
      if (!A && !B) return 0;
      if (!A) return 1;
      if (!B) return -1;
      try {
        return parseISO(A).getTime() - parseISO(B).getTime();
      } catch {
        return 0;
      }
    });
  }

  const sortedDays = Object.keys(grouped).sort();
  const sortedGrouped = {};
  sortedDays.forEach(day => {
    sortedGrouped[day] = grouped[day];
  });

  return sortedGrouped;
}

export default function CalendarTable({
  events,
  timezone,
  language,
  loading,
  onToggleAlert,
  onEcoScrape,
  onAnalyze,
  onNotificationAdd,
  onTimezoneChange,
}) {
  const { t } = useTheme();

  const [filteredEvents, setFilteredEvents] = useState([]);
  const [userSpecificDataLoading, setUserSpecificDataLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [watchlist, setWatchlist] = useState(new Set());
  const [eventAlerts, setEventAlerts] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showQuickAnalysis, setShowQuickAnalysis] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    date: null,
    importance: [],
    category: "all",
    country: "all",
  });
  const [activeDateFilter, setActiveDateFilter] = useState("all");
  const [loadingResults, setLoadingResults] = useState({});

  const dateLocale = language === "ar" ? ar : enUS;
  const isRTL = language === "ar";

  const loadData = useCallback(async () => {
    setUserSpecificDataLoading(true);
    try {
      const saved = localStorage.getItem("liirat-user-session");
      let currentUser = null;
      if (saved) {
        try {
          currentUser = JSON.parse(saved);
          if (currentUser && currentUser.id && currentUser.email) setUser(currentUser);
          else setUser(null);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      if (currentUser && currentUser.id) {
        try {
          const userWatchlist = await WatchlistItem.filter({ user_id: currentUser.id, itemType: "event" });
          setWatchlist(new Set(userWatchlist.map((i) => i.event_id)));

          const userAlerts = await Alert.filter({ user_id: currentUser.id, isActive: true });
          const alertsMap = {};
          userAlerts.forEach((a) => { if (a.event_id) alertsMap[a.event_id] = a; });
          setEventAlerts(alertsMap);
        } catch {
          console.error("Failed to load user-specific data (watchlist/alerts)");
          setWatchlist(new Set());
          setEventAlerts({});
        }
      } else {
        setWatchlist(new Set());
        setEventAlerts({});
      }
    } finally {
      setUserLoading(false);
      setUserSpecificDataLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filterEvents = useCallback(() => {
    let results = [...(events || [])];

    if (filters.search) {
      const q = S(filters.search).toLowerCase();
      results = results.filter((e) =>
        S(e.title || e.title_en).toLowerCase().includes(q) ||
        S(e.currency).toLowerCase().includes(q) ||
        S(e.country).toLowerCase().includes(q)
      );
    }

    if (filters.importance.length > 0) {
      results = results.filter((e) => filters.importance.includes(e.importance));
    }

    if (filters.country && filters.country !== "all") {
      results = results.filter((e) => S(e.country).toUpperCase() === S(filters.country).toUpperCase());
    }

    if (filters.category && filters.category !== "all") {
      results = results.filter((e) => S(e.category).toLowerCase() === S(filters.category).toLowerCase());
    }

    if (activeDateFilter === "today") {
      const todayUTC = format(new Date(), 'yyyy-MM-dd');
      results = results.filter((ev) => (S(ev.event_day_utc) || S(ev.event_iso_utc).slice(0, 10)) === todayUTC);
    }

    setFilteredEvents(results);
  }, [events, filters, activeDateFilter]);

  useEffect(() => { filterEvents(); }, [filterEvents]);

  const handleSetAlert = useCallback((eventId) => {
    if (!user) {
      alert(language === "ar" ? "يرجى تسجيل الدخول لتعيين التنبيهات." : "Please log in to set alerts.");
      return;
    }
    const event = (events || []).find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowAlertModal(true);
    }
  }, [user, events, language]);

  const toggleWatchlist = useCallback(async (eventId) => {
    if (!user) {
      alert(language === "ar" ? "يرجى تسجيل الدخول لإدارة قائمة المتابعة." : "Please log in to manage your watchlist.");
      return;
    }
    try {
      const newSet = new Set(watchlist);
      const existing = await WatchlistItem.filter({ user_id: user.id, event_id: eventId });
      const row = existing.length > 0 ? existing[0] : null;

      if (row) {
        await WatchlistItem.delete(row.id);
        newSet.delete(eventId);
      } else {
        await WatchlistItem.create({ user_id: user.id, event_id: eventId, itemType: "event" });
        newSet.add(eventId);
      }
      setWatchlist(newSet);

      const ev = (events || []).find((e) => e.id === eventId);
      if (ev && onNotificationAdd) {
        onNotificationAdd({
          id: Date.now(),
          type: "watchlist_updated",
          message: language === "ar"
            ? `${newSet.has(eventId) ? "تم إضافة" : "تم إزالة"} ${ev.title || ev.title_en} ${newSet.has(eventId) ? "إلى" : "من"} قائمة المتابعة`
            : `${ev.title || ev.title_en} ${newSet.has(eventId) ? "added to" : "removed from"} watchlist`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
    }
  }, [user, watchlist, events, onNotificationAdd, language]);

  const onInfoClick = useCallback((event) => {
    setSelectedEvent(event);
    setShowQuickAnalysis(true);
  }, []);

  const onAlertClick = useCallback((event) => {
    setSelectedEvent(event);
    setShowAlertModal(true);
  }, []);

  const onChartClick = useCallback((event) => {
    if (onAnalyze) onAnalyze(event);
    else console.log("Chart click for event:", event.id);
  }, [onAnalyze]);

  const onGetResult = useCallback(async (event) => {
    if (onEcoScrape) {
      setLoadingResults(prev => ({ ...prev, [event.id]: true }));
      try {
        await onEcoScrape(event.id);
      } catch (error) {
        console.error("Failed to get result for event:", event.id, error);
      } finally {
        setLoadingResults(prev => ({ ...prev, [event.id]: false }));
      }
    } else {
      console.log("Get result click for event:", event.id);
    }
  }, [onEcoScrape]);

  const uniqueCategories = useMemo(() => {
    return [...new Set((events || []).map((e) => S(e.category)))].filter(Boolean);
  }, [events]);

  const importanceLevels = [
    { label: t.high, value: 3 },
    { label: t.medium, value: 2 },
    { label: t.low, value: 1 },
  ];

  const groupedEvents = useMemo(() => {
    return groupEventsByDay(filteredEvents, timezone);
  }, [filteredEvents, timezone]);

  const now = new Date();

  return (
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto fade-in">
        <div className="neumorphic p-6 lg:p-8 mb-8 rounded-3xl">
          <h3 className="text-2xl lg:text-3xl font-bold mb-2 service-title">{t.calendarTitle}</h3>
          <p className="text-secondary mb-6">{t.calendarDescription}</p>

          {/* Timezone Selector */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">{t.timezone}</span>
            </div>
            <select
              value={timezone}
              onChange={(e) => {
                if (onTimezoneChange) onTimezoneChange(e.target.value);
                else localStorage.setItem("liirat-timezone", e.target.value);
              }}
              className="neumorphic-pressed px-3 py-2 rounded-xl outline-none bg-transparent text-primary text-sm"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="neumorphic-pressed p-3 rounded-xl flex items-center">
              <Search className="w-5 h-5 text-gray-500 mx-3" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent outline-none text-primary placeholder-gray-500 py-2"
              />
              {filters.search && (
                <button onClick={() => setFilters({ ...filters, search: "" })} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center mb-4">
            {["all", "today"].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveDateFilter(filter);
                }}
                className={`neumorphic-button px-3 py-2.5 rounded-xl transition-all text-sm ${activeDateFilter === filter ? "neumorphic-pressed" : ""}`}
              >
                {t[filter]}
              </button>
            ))}

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="neumorphic-button px-3 py-2.5 rounded-xl outline-none bg-transparent text-sm"
            >
              <option value="all">{t.category}: {t.all}</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{t[cat] || cat}</option>
              ))}
            </select>

            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              className="neumorphic-button px-3 py-2.5 rounded-xl outline-none bg-transparent text-sm"
            >
              <option value="all">{t.country}: {t.all}</option>
              {Array.from(new Set(events.map(e => e.country))).filter(Boolean).sort().map(countryCode => (
                <option key={countryCode} value={countryCode}>{LABELS[countryCode] || countryCode}</option>
              ))}
            </select>
          </div>

          {/* Importance */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-medium text-secondary mr-2">{t.importance}:</span>
            <div className="neumorphic-button p-1 rounded-xl flex items-center justify-center gap-1 flex-wrap">
              {importanceLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() =>
                    setFilters((prev) => {
                      const next = new Set(prev.importance);
                      if (next.has(level.value)) next.delete(level.value);
                      else next.add(level.value);
                      return { ...prev, importance: Array.from(next) };
                    })
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filters.importance.includes(level.value) ? "neumorphic-pressed" : "hover:bg-gray-100/50 dark:hover:bg-gray-700/50"}`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results + Refresh */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary">
              {filteredEvents.length} {filteredEvents.length === 1 ? t.eventSingular : t.eventPlural}
              {filters.search && ` ${language === "ar" ? "لـ" : "for"} "${filters.search}"`}
            </span>
            <button
              onClick={loadData}
              disabled={userSpecificDataLoading}
              className="neumorphic-button px-4 py-2 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm"
              style={{ color: "#7cb342" }}
            >
              <RefreshCw className={`w-4 h-4 ${userSpecificDataLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{userSpecificDataLoading ? t.updating : t.updateNow}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="neumorphic p-0 rounded-2xl overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
          {loading ? (
            <LoadingSkeleton />
          ) : (Object.keys(groupedEvents).length === 0) ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">{t.noEventsFound || "No Events Found"}</h3>
              <p className="text-secondary">{language === "ar" ? "لا توجد أحداث تطابق البحث" : "No events match your search"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1000px] w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <TableHeader className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400">
                  <TableRow>
                    <TableHead className="px-6 py-3 w-[80px]">{t?.time || 'Time'}</TableHead>
                    <TableHead className="px-6 py-3 w-[120px]">{t?.country || 'Country'}</TableHead>
                    <TableHead className="px-6 py-3">{t?.event || 'Event'}</TableHead>
                    <TableHead className="px-6 py-3 w-[100px] text-center">{t?.actual || 'Actual'}</TableHead>
                    <TableHead className="px-6 py-3 w-[100px] text-center">{t?.forecast || 'Forecast'}</TableHead>
                    <TableHead className="px-6 py-3 w-[100px] text-center">{t?.previous || 'Previous'}</TableHead>
                    <TableHead className="px-6 py-3 w-[180px] text-center">{t?.actions || 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(groupedEvents).map(day => {
                    const dayEvents = groupedEvents[day];
                    const isToday = formatInTimeZone(now, timezone, 'yyyy-MM-dd') === day;
                    let nextEventIndex = -1;
                    if (isToday) {
                      nextEventIndex = dayEvents.findIndex(e => {
                        const eventUtcTime = S(e.event_iso_utc);
                        return eventUtcTime && parseISO(eventUtcTime).getTime() > now.getTime();
                      });
                    }

                    return (
                      <React.Fragment key={day}>
                        <TableRow className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">
                          <TableCell colSpan={7} className="font-bold text-lg text-primary py-3 px-6">
                            {formatInTimeZone(parseISO(day), timezone, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
                          </TableCell>
                        </TableRow>
                        {dayEvents.map((event, index) => {
                          const eventId = event.id || `${event.country}|${event.title_en}|${event.event_iso_utc}`;
                          // Destructure the returned object to get the color
                          const { color: impactBadgeColor } = getImpactBadge(event.importance, language);

                          return (
                            <CalendarRow
                              key={eventId}
                              event={event}
                              timezone={timezone}
                              language={language}
                              isRTL={isRTL}
                              onInfoClick={onInfoClick}
                              onChartClick={onChartClick}
                              onAlertClick={onAlertClick}
                              onGetResult={onGetResult}
                              toggleWatchlist={toggleWatchlist}
                              isNext={isToday && index === nextEventIndex}
                              // Pass only the color class string to impactClass prop
                              impactClass={impactBadgeColor} 
                              loadingResult={loadingResults[eventId]}
                              hasAlert={!!eventAlerts[event.id]}
                              isInWatchlist={watchlist.has(event.id)}
                              t={t}
                            />
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <NewsAlertModal
        event={selectedEvent}
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        existingAlerts={eventAlerts}
        onNotificationAdd={onNotificationAdd}
        user={user}
        refreshAlerts={loadData}
      />
      <QuickAnalysisModal event={selectedEvent} isOpen={showQuickAnalysis} onClose={() => setShowQuickAnalysis(false)} userTimezone={timezone} language={language} />
    </div>
  );
}
