import React from 'react';
import { S } from './utils'; // Import the safe string utility

/**
 * FmtVal - A crash-proof component for rendering formatted calendar values.
 * 
 * ✅ FIX: This component now uses the S() utility to ensure that the `value` prop
 * is always a safe, non-null string before being rendered. This completely
 * prevents the "Cannot read properties of undefined (reading 'match')" error
 * that occurred when API data for 'actual', 'forecast', or 'previous' was missing.
 */
export default function FmtVal({ value }) {
  // Convert the incoming value to a safe, trimmed string. Handles null/undefined.
  const safeValue = S(value);

  // If the value is empty or explicitly a dash, render a standardized placeholder.
  if (safeValue === '' || safeValue === '-') {
    return <span className="text-muted text-lg tabular-nums">—</span>;
  }

  // Render the safe value, ensuring it uses left-to-right numerals.
  return (
    <span className="tabular-nums" lang="en" dir="ltr">
      {safeValue}
    </span>
  );
}