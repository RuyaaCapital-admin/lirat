// src/components/utils.js

// ---- ASCII digits only (convert Arabic-Indic & Persian → Latin) ----
export const toLatinDigits = (input) => {
  const s = input == null ? "" : String(input);
  const ar = "٠١٢٣٤٥٦٧٨٩";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const ia = ar.indexOf(ch);
    if (ia !== -1) { out += "0123456789"[ia]; continue; }
    const ifa = fa.indexOf(ch);
    if (ifa !== -1) { out += "0123456789"[ifa]; continue; }
    out += ch;
  }
  return out;
};

// ✅ FIX: Centralized, robust, and safe string/regex utilities
// Safe string: never undefined/null/not a string; returns trimmed string.
export const S = (v) => {
  if (v === null || v === undefined) return "";
  return String(v).trim();
};

// Safe RegExp match: Always runs on a valid string. Returns null on no match.
export const MATCH = (str, re) => {
  const safeStr = S(str);
  if (!safeStr || !re) return null;
  try {
    return safeStr.match(re);
  } catch {
    return null;
  }
};

// Safe RegExp test: Always runs on a valid string. Returns false on no match.
export const TEST = (str, re) => {
  const safeStr = S(str);
  if (!safeStr || !re) return false;
  try {
    return re.test(safeStr);
  } catch {
    return false;
  }
};

// Safe JSON parse with fallback
export const safeJSON = (text, fallback = null) => {
  try {
    if (typeof text !== "string") return fallback;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

// Safe deep get with dot-path
export const safeGet = (obj, path, def = "") => {
  if (!obj || !path) return def;
  try {
    const parts = String(path).split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return def;
      cur = cur[p];
    }
    return cur == null ? def : cur;
  } catch {
    return def;
  }
};

// Safe number parse (strips % , spaces)
export const toSafeNumber = (val) => {
  const s = S(val).replace(/[,%\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};