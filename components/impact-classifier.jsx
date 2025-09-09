
// components/impact-classifier.js
const HIGH_IMPACT_PATTERNS = [
  /non-farm|payrolls|unemployment rate|cpi|interest rate|gdp|inflation rate|fomc|ecb|boe|boj|rba|rbnz|boc|snb/i
];
const MEDIUM_IMPACT_PATTERNS = [
  /retail sales|trade balance|pmi|ism|producer price|ppi|consumer confidence|leading indicators|building permits|housing starts|industrial production/i
];

// The main inference function with additional safety
function inferImpact(title_en) {
  // --- ADDITIONAL SAFETY: More robust input validation ---
  if (!title_en) {
    return { bucket: 'Low', score: 0.1, source: 'default' };
  }

  // Ensure title_en is a string and handle edge cases
  let normalizedTitle;
  try {
    normalizedTitle = String(title_en).toLowerCase().trim();
    if (!normalizedTitle) {
      return { bucket: 'Low', score: 0.1, source: 'default' };
    }
  } catch (error) {
    console.error('Error normalizing title in inferImpact:', error);
    return { bucket: 'Low', score: 0.1, source: 'default' };
  }

  // Check high impact patterns with additional safety
  try {
    for (const pattern of HIGH_IMPACT_PATTERNS) {
      if (pattern && typeof pattern.test === 'function') {
        if (pattern.test(normalizedTitle)) {
          return { bucket: 'High', score: 0.9, source: 'pattern' };
        }
      }
    }

    // Check medium impact patterns with additional safety
    for (const pattern of MEDIUM_IMPACT_PATTERNS) {
      if (pattern && typeof pattern.test === 'function') {
        if (pattern.test(normalizedTitle)) {
          return { bucket: 'Medium', score: 0.6, source: 'pattern' };
        }
      }
    }
  } catch (error) {
    console.error('Error in pattern matching:', error);
    return { bucket: 'Low', score: 0.2, source: 'default' };
  }

  // Default to low if no match
  return { bucket: 'Low', score: 0.2, source: 'default' };
}

export { inferImpact };
