"use client";
import { useEffect, useMemo, useRef, memo } from "react";

function TradingViewOfficial({
  symbol = "FX:XAUUSD",
  interval = "60",
  theme = "dark",
  locale = "ar",
  studies, // pass memoized: useMemo(() => ["MACD@tv-basicstudies"], [])
}) {
  const containerRef = useRef(null);
  const containerIdRef = useRef(`tv-${Math.random().toString(36).slice(2)}`);
  const widgetRef = useRef(null);

  const depsKey = useMemo(() => {
    const sk = JSON.stringify(studies ?? []);
    return `${symbol}|${interval}|${theme}|${locale}|${sk}`;
  }, [symbol, interval, theme, locale, studies]);

  useEffect(() => {
    const create = () => {
      if (!window.TradingView || !containerRef.current) return;
      try { widgetRef.current?.remove?.(); } catch {}
      containerRef.current.innerHTML = "";
      containerRef.current.id = containerIdRef.current;

      widgetRef.current = new window.TradingView.widget({
        container_id: containerIdRef.current,
        autosize: true,
        symbol,
        interval,
        theme,
        locale,
        withdateranges: true,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        details: false,
        hotlist: false,
        calendar: false,
        studies: studies ?? [],
        overrides: {
          "paneProperties.background": theme === "dark" ? "#0b0f1a" : "#ffffff",
          "paneProperties.vertGridProperties.color": theme === "dark" ? "rgba(255,255,255,0.06)" : "#e5e7eb",
          "paneProperties.horzGridProperties.color": theme === "dark" ? "rgba(255,255,255,0.06)" : "#e5e7eb",
          "scalesProperties.textColor": theme === "dark" ? "#A3ADC2" : "#111827",
          "mainSeriesProperties.candleStyle.upColor": "#22c55e",
          "mainSeriesProperties.candleStyle.downColor": "#ef4444",
          "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
        },
      });
    };

    const script = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
    if (!window.TradingView && !script) {
      const s = document.createElement("script");
      s.src = "https://s3.tradingview.com/tv.js";
      s.async = true;
      s.onload = create;
      document.head.appendChild(s);
    } else if (!window.TradingView && script) {
      script.addEventListener("load", create, { once: true });
    } else {
      create();
    }

    return () => {
      try { widgetRef.current?.remove?.(); } catch {}
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [depsKey]);

  return (
    <div className="relative w-full">
      {/* height 560–600px prevents bottom tools from being hidden */}
      <div ref={containerRef} className="h-[560px] w-full overflow-hidden rounded-2xl border border-white/10" />
    </div>
  );
}
export default memo(TradingViewOfficial);
