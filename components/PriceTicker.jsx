'use client';

/**
 * PriceTicker — real data only, no mock.
 * - Uses fetchRealTimePrices (working function) instead of problematic updatePriceData
 * - Keeps previous rows on errors (no fake data)
 * - RTL-safe marquee, gapless via cloning
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fetchRealTimePrices } from "@/api/functions";
import { toEnDigits, formatEnPercentage } from "./enDigits";

/* -------- Tuning -------- */
const SPEED_PX_PER_SEC = 55;     // marquee speed
const BASE_POLL_MS     = 20000;  // base poll interval (20s)
const HTTP_TIMEOUT_MS  = 6000;   // request timeout (6s)
const MAX_ROWS         = 50;

/* -------- Symbols requested (kept small => faster, reliable) -------- */
const PRIORITY_SYMBOLS = [
  "BTC", "ETH", "XAUUSD", "XAGUSD",
  "EURUSD", "GBPUSD", "USDJPY",
  "US30", "NAS100", "US500",
];

/* -------- Display names -------- */
const NAMES = {
  BTC:"Bitcoin", ETH:"Ethereum",
  XAUUSD:"Gold", XAGUSD:"Silver",
  US30:"US30", NAS100:"NAS100", US500:"US500",
  EURUSD:"EUR/USD", GBPUSD:"GBP/USD", USDJPY:"USD/JPY",
};

/* -------- Helpers -------- */
function formatPrice(symbol, raw) {
  const s = (symbol || "").toUpperCase();
  const n = Number(raw);
  if (!Number.isFinite(n)) return "0";
  if (s.endsWith("JPY")) return toEnDigits(n.toFixed(3));
  if (s === "XAUUSD" || s === "XAGUSD") return toEnDigits(n.toFixed(2));
  if (s === "BTC" || s === "ETH") return toEnDigits(n.toFixed(2));
  return toEnDigits(n.toFixed(4));
}

function normalize(prices) {
  if (!Array.isArray(prices)) return [];
  const map = new Map();
  for (const p of prices) {
    const s = String(p.symbol || "").toUpperCase();
    if (!s || map.has(s)) continue;
    const pct = Number(p.change_percent);
    map.set(s, {
      symbol: s,
      displayName: NAMES[s] || s,
      price: formatPrice(s, p.price),
      change_percent: Number.isFinite(pct) ? Math.max(-50, Math.min(50, pct)) : 0,
    });
  }
  const first = PRIORITY_SYMBOLS.map(s => map.get(s)).filter(Boolean);
  const rest  = [...map.values()].filter(x => !PRIORITY_SYMBOLS.includes(x.symbol));
  return [...first, ...rest].slice(0, MAX_ROWS);
}

/* ================================================================ */

export default function PriceTicker() {
  const [rows, setRows] = useState([]);

  // DOM / animation refs
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const segRef = useRef(null);
  const segW = useRef(1);
  const pos = useRef(0);
  const last = useRef(0);
  const raf = useRef(0);
  const [copies, setCopies] = useState(4);

  /* -------- Polling (real data only) -------- */
  useEffect(() => {
    let alive = true;
    let timer;
    let attempts = 0;

    const run = async () => {
      if (!alive) return;

      const timeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), HTTP_TIMEOUT_MS)
      );

      try {
        // Use fetchRealTimePrices instead of problematic updatePriceData
        const res = await Promise.race([
          fetchRealTimePrices({ symbols: PRIORITY_SYMBOLS }),
          timeout
        ]);

        const payload = res?.data || res;
        if (payload?.success && Array.isArray(payload.prices) && payload.prices.length) {
          const list = normalize(payload.prices);
          if (list.length) {
            setRows(list);
            attempts = 0; // reset backoff on success
          }
        }
        // on empty/invalid: keep previous rows (no fake replacement)
      } catch {
        // timeout/network — keep previous rows
      } finally {
        if (alive) {
          attempts += 1;
          const backoff = Math.min(BASE_POLL_MS * Math.pow(1.6, Math.max(0, attempts - 1)), 60000);
          timer = setTimeout(run, backoff);
        }
      }
    };

    run();
    return () => { alive = false; clearTimeout(timer); };
  }, []); // once

  /* -------- MEASURE & CLONE COUNT (gapless coverage) -------- */
  useLayoutEffect(() => {
    if (!rows.length) return;
    const wrap = wrapRef.current, seg = segRef.current, track = trackRef.current;
    if (!wrap || !seg || !track) return;

    const compute = () => {
      const w = seg.scrollWidth || 1;
      const cw = wrap.clientWidth || 1;
      segW.current = w;
      const required = Math.ceil((cw + w) / Math.max(1, w));
      setCopies(Math.max(4, required));
      pos.current = ((pos.current % w) + w) % w;
      track.style.transform = `translate3d(${-pos.current}px,0,0)`;
    };

    let r = requestAnimationFrame(compute);
    const ro = new ResizeObserver(() => requestAnimationFrame(compute));
    ro.observe(wrap); ro.observe(seg);

    const onVis = () => { if (!document.hidden) requestAnimationFrame(compute); };
    document.addEventListener('visibilitychange', onVis, { passive: true });

    return () => {
      cancelAnimationFrame(r);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [rows]);

  /* -------- rAF SCROLL -------- */
  useEffect(() => {
    if (!trackRef.current || !rows.length) return;
    let running = true;
    last.current = performance.now();

    const step = (ts) => {
      if (!running || !trackRef.current) return;
      const dt = Math.min((ts - (last.current || ts)) / 1000, 0.12);
      last.current = ts;
      if (!document.hidden) {
        const w = segW.current > 0 ? segW.current : 1;
        pos.current += SPEED_PX_PER_SEC * dt;
        if (pos.current >= w) pos.current -= w;
        trackRef.current.style.transform = `translate3d(${-pos.current}px,0,0)`;
      }
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => { running = false; if (raf.current) cancelAnimationFrame(raf.current); };
  }, [rows]);

  if (!rows.length) {
    return (
      <div className="neumorphic mx-4 mt-2 rounded-2xl overflow-hidden">
        <div className="h-12 flex items-center justify-center bg-light-bg dark:bg-dark-bg">
          <span className="text-sm text-secondary">Loading prices…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="neumorphic mx-4 mt-2 rounded-2xl overflow-hidden">
      <style>{`.price-ticker * { direction: ltr !important; text-align: left !important; }`}</style>

      <div
        ref={wrapRef}
        className="price-ticker relative h-12 overflow-hidden bg-light-bg dark:bg-dark-bg"
        dir="ltr"
        style={{ direction: 'ltr', isolation: 'isolate' }}
      >
        <div
          ref={trackRef}
          className="flex items-center whitespace-nowrap h-full will-change-transform"
          dir="ltr"
          style={{ backfaceVisibility: "hidden", direction: 'ltr' }}
        >
          {/* Measured segment */}
          <div ref={segRef} className="flex items-center h-full" style={{ flex: '0 0 auto' }}>
            {rows.map((p, i) => <Item key={`${p.symbol}-0-${i}`} p={p} />)}
          </div>
          {/* Clones */}
          {Array.from({ length: Math.max(0, copies - 1) }).map((_, idx) => (
            <div key={`seg-${idx+1}`} className="flex items-center h-full" style={{ flex: '0 0 auto' }}>
              {rows.map((p, i) => <Item key={`${p.symbol}-${idx+1}-${i}`} p={p} />)}
            </div>
          ))}
        </div>

        {/* Edge fades */}
        <div className="absolute inset-y-0 left-0 w-6 sm:w-8 bg-gradient-to-r from-light-bg dark:from-dark-bg to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-6 sm:w-8 bg-gradient-to-l from-light-bg dark:from-dark-bg to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}

/* -------- Item cell -------- */
function Item({ p }) {
  const pct = p.change_percent ?? 0;
  const isPos = pct >= 0;
  const color = isPos ? "text-green-600 bg-green-900/15" : "text-red-600 bg-red-900/15";
  const arrow = isPos ? "↗" : "↘";

  return (
    <div
      className="flex items-center px-4 sm:px-6 py-2"
      style={{ flex: '0 0 auto', minWidth: 148 }}
      dir="ltr"
    >
      <span className="font-semibold text-primary text-xs sm:text-sm mr-2">
        {p.displayName}
      </span>
      <span
        className="font-mono text-xs sm:text-sm text-primary mr-2"
        lang="en" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {p.price}
      </span>
      <span
        className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${color} flex items-center gap-1`}
        lang="en" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span className="text-xs">{arrow}</span>
        <span>{formatEnPercentage(Math.abs(pct).toFixed(2))}%</span>
      </span>
      <div className="w-px h-4 bg-white/15 ml-4" />
    </div>
  );
}