import React from 'react';

// Use a named export for robustness
export const CountryFlag = ({ code, className, ...props }) => {
  if (!code || typeof code !== 'string') {
    // Render a placeholder or nothing if the code is invalid
    return <div className={`w-4 h-3 bg-gray-200 rounded-sm ${className || ''}`} title="Unknown Country"></div>;
  }

  const countryCode = code.toLowerCase();
  
  // Using flagcdn.com for reliable flag images
  const flagUrl = `https://flagcdn.com/w40/${countryCode}.png`;

  const handleError = (e) => {
    // Attempt to hide the broken image icon
    e.target.style.visibility = 'hidden';
    e.target.style.width = '0';
    e.target.style.height = '0';
  };

  return (
    <img
      src={flagUrl}
      alt={`${code.toUpperCase()} Flag`}
      title={code.toUpperCase()}
      className={`object-contain ${className || ''}`}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

// No longer using default export