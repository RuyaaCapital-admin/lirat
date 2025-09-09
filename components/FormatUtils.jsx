
// Format utilities for calendar data

import { MATCH, S, TEST, toSafeNumber } from './utils'; // ✅ Import safe helpers

export const formatArrowIndicator = (actual, forecast) => {
  if (!actual || !forecast) return null;
  
  const actualNum = parseFloat(actual);
  const forecastNum = parseFloat(forecast);
  
  if (isNaN(actualNum) || isNaN(forecastNum)) return null;
  
  if (actualNum > forecastNum) {
    return { direction: 'up', symbol: '↑', color: '#22c55e' };
  } else if (actualNum < forecastNum) {
    return { direction: 'down', symbol: '↓', color: '#ef4444' };
  }
  
  return null;
};

export const formatTimeForTraders = (dateTime, timezone = 'UTC') => {
  try {
    const date = new Date(dateTime);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    }).format(date);
  } catch (error) {
    return '--:--';
  }
};

export const getImpactLevel = (importance) => {
  switch (importance) {
    case 3: return { level: 'high', color: '#ef4444', label: 'High Impact' };
    case 2: return { level: 'medium', color: '#f59e0b', label: 'Medium Impact' };
    case 1: return { level: 'low', color: '#6b7280', label: 'Low Impact' };
    default: return { level: 'low', color: '#6b7280', label: 'Low Impact' };
  }
};

export const formatCurrencyValue = (value, currency) => {
  if (!value) return '-';
  
  // Handle percentage values
  if (typeof value === 'string' && value.includes('%')) {
    return value;
  }
  
  // Handle numeric values
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  
  // Format based on currency type
  if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
    return new Intl.NumberFormat('en-US').format(numValue);
  }
  
  return value;
};

// ✅ FIX: Replace all string operations with safe helpers
export const getTrend = (actual, forecast, event) => {
  if (!actual && actual !== 0) return 'neutral';
  if (!forecast && forecast !== 0) return 'neutral';
  
  const actualStr = S(actual);
  const forecastStr = S(forecast);
  
  if (!actualStr && !forecastStr) return 'neutral';
  
  const actualNum = toSafeNumber(actualStr);
  const forecastNum = toSafeNumber(forecastStr);
  
  if (actualNum === null || forecastNum === null) return 'neutral';
  
  const diff = actualNum - forecastNum;
  const tolerance = Math.abs(forecastNum) * 0.001; // Small tolerance for floating point comparison
  
  if (Math.abs(diff) <= tolerance) return 'neutral';
  return diff > 0 ? 'up' : 'down';
};

export const pickForecast = (event) => {
  if (!event) return '';
  
  // ✅ SAFE: Pick forecast or estimate
  const forecast = S(event.forecast);
  const estimate = S(event.estimate);
  
  return forecast || estimate || '';
};

export const normalizeImpactBucket = (event) => {
  if (!event) return 'medium';
  
  // ✅ SAFE: Handle various impact field names
  const importance = event.importance || event.impact || event.impact_level;
  
  if (typeof importance === 'number') {
    return importance >= 3 ? 'high' : importance <= 1 ? 'low' : 'medium';
  }
  
  const impactStr = S(importance).toLowerCase();
  if (TEST(impactStr, /^(3|high|red)$/)) return 'high';
  if (TEST(impactStr, /^(1|low|green)$/)) return 'low';
  return 'medium'; // default
};

// ✅ FIX: Safe value formatting
export const formatValue = (value, unit) => {
  const valueStr = S(value).trim();
  const unitStr = S(unit).trim();
  
  if (!valueStr || valueStr === '—') return '—';
  
  // ✅ SAFE: Check for percentage
  if (TEST(valueStr, /%/) || unitStr === '%') {
    return valueStr.includes('%') ? valueStr : `${valueStr}%`;
  }
  
  // ✅ SAFE: Check for currency
  if (TEST(unitStr, /^(USD|EUR|GBP|JPY|CAD|AUD|CHF)$/i)) {
    const numMatch = MATCH(valueStr, /(-?\d+(?:\.\d+)?(?:[kmb])?)/i);
    if (numMatch) {
      return `${numMatch[1]} ${unitStr}`;
    }
  }
  
  return unitStr ? `${valueStr} ${unitStr}` : valueStr;
};

// ✅ FIX: Safe country code extraction
export const extractCountryCode = (event) => {
  if (!event) return '';
  
  const country = S(event.country || event.countryCode || '').toUpperCase();
  
  // ✅ SAFE: Use TEST for validation
  if (TEST(country, /^[A-Z]{2}$/)) {
    return country;
  }
  
  // Try to extract from other fields
  const title = S(event.title || event.title_en || '').toLowerCase();
  
  if (TEST(title, /united states|usa|us /)) return 'US';
  if (TEST(title, /eurozone|euro area|emu/)) return 'EU';
  if (TEST(title, /united kingdom|uk |britain/)) return 'GB';
  if (TEST(title, /japan|japanese/)) return 'JP';
  if (TEST(title, /germany|german/)) return 'DE';
  if (TEST(title, /france|french/)) return 'FR';
  if (TEST(title, /canada|canadian/)) return 'CA';
  if (TEST(title, /australia|australian/)) return 'AU';
  
  return country || 'US'; // Default fallback
};

// ✅ FIX: Safe numeric extraction
export const extractNumericValue = (value) => {
  const str = S(value);
  if (!str) return null;
  
  // ✅ SAFE: Extract numbers with MATCH
  const numMatch = MATCH(str, /(-?\d+(?:\.\d+)?)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    return isNaN(num) ? null : num;
  }
  
  return null;
};
