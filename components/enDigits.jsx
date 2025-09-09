// Centralized English digits utilities
export const toEnDigits = (s) => {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
};

export const nfEn = (value, opts = {}) => {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'string' ? Number(value) : value;
  if (isNaN(n)) return String(value);
  return toEnDigits(new Intl.NumberFormat('en-US', opts).format(n));
};

export const timeEn = (isoOrDate, tz = 'UTC') => {
  try {
    return new Intl.DateTimeFormat('en-GB', { 
      timeZone: tz, 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }).format(new Date(isoOrDate));
  } catch (error) {
    console.warn('timeEn error:', error);
    return '12:00';
  }
};

export const dateEn = (isoOrDate, tz = 'UTC') => {
  try {
    const d = new Date(isoOrDate);
    const parts = new Intl.DateTimeFormat('en-CA', { 
      timeZone: tz, 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).formatToParts(d);
    
    const y = parts.find(p => p.type === 'year')?.value ?? '';
    const m = parts.find(p => p.type === 'month')?.value ?? '';
    const da = parts.find(p => p.type === 'day')?.value ?? '';
    return `${y}-${m}-${da}`;
  } catch (error) {
    console.warn('dateEn error:', error);
    return '2024-01-01';
  }
};

export const formatEnNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return toEnDigits(num.toFixed(decimals));
};

export const formatEnPercentage = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${toEnDigits(num.toFixed(2))}%`;
};