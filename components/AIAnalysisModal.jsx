import React from "react";
import { X, RefreshCw, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

/**
 * AIAnalysisModal
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - event: object | null
 * - analysis: string | null
 * - loading: boolean
 * - language: 'ar' | 'en'
 * - onRegenerate: () => void
 * - timezone?: string (optional; defaults to 'UTC')
 */
export default function AIAnalysisModal({
  isOpen,
  onClose,
  event,
  analysis,
  loading,
  language = "ar",
  onRegenerate,
  timezone = "UTC",
}) {
  if (!isOpen) return null;

  // ------- safe dt formatters (no regex, no crashes) -------
  const fmtDateTime = (iso, tz = "UTC") => {
    if (!iso) return { date: "—", time: "—" };
    try {
      const d = new Date(iso);
      const date = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: tz || "UTC",
      }).format(d);
      const time = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz || "UTC",
      }).format(d);
      return { date, time };
    } catch {
      return { date: "—", time: "—" };
    }
  };

  const titleText = language === "ar" ? "تحليل الذكاء الاصطناعي" : "AI Analysis";

  // prefer localized event title if you have it; else fallback
  const eventTitle =
    (language === "ar" ? event?.title_ar : event?.title_en) ||
    event?.title ||
    "";

  // your data sometimes uses event_iso_utc, sometimes time_utc
  const isoTime = event?.event_iso_utc || event?.time_utc || null;
  const { date, time } = fmtDateTime(isoTime, timezone);

  // ------- empty event guard (keeps modal UX instead of exploding) -------
  if (!event) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="neumorphic p-6 rounded-2xl w-[95vw] max-w-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={titleText}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold service-title">
              {language === "ar" ? "تحميل..." : "Loading..."}
            </h3>
            <button onClick={onClose} className="neumorphic-button p-2 rounded-full" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8 text-secondary">
            <p>{language === "ar" ? "بيانات الحدث غير متوفرة." : "Event data is not available."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="neumorphic p-6 rounded-2xl w-[95vw] max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titleText}
      >
        {/* header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-xl font-bold service-title flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {titleText}
          </h3>
          <button onClick={onClose} className="neumorphic-button p-2 rounded-full" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* event summary */}
        <div className="neumorphic-inset p-4 rounded-xl mb-4 flex-shrink-0">
          <p className="font-semibold text-primary truncate" title={eventTitle}>
            {eventTitle || (language === "ar" ? "حدث بدون عنوان" : "Untitled event")}
          </p>
          <p className="text-sm text-secondary" lang="en" dir="ltr">
            {date} {time} ({timezone || "UTC"})
          </p>
        </div>

        {/* analysis body */}
        <div className="overflow-y-auto flex-grow pr-2 -mr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-center py-12 text-secondary space-y-3">
              <div
                className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
                style={{ borderColor: "#8b5cf6", borderTopColor: "transparent" }}
              />
              <p className="font-semibold">
                {language === "ar" ? "جارٍ إنشاء التحليل..." : "Generating analysis..."}
              </p>
              <p className="text-xs">
                {language === "ar" ? "قد يستغرق هذا بعض الوقت..." : "This may take a moment..."}
              </p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>
                {analysis && String(analysis).trim()
                  ? analysis
                  : language === "ar"
                  ? "لم يتم العثور على تحليل."
                  : "No analysis found."}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end flex-shrink-0">
          <button
            onClick={onRegenerate}
            disabled={!!loading}
            className="neumorphic-button px-5 py-2.5 flex items-center gap-2 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {language === "ar" ? "إعادة إنشاء" : "Regenerate"}
          </button>
        </div>
      </div>
    </div>
  );
}
