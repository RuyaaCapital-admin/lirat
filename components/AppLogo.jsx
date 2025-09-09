'use client';

import React from 'react';
import { BRAND_LOGO_URL } from './brand';

const RETRY_DELAY_MS = 250;

export default function AppLogo({
  className = 'h-10 w-auto object-contain',
  alt = 'Liirat Logo',
  style,
  title = 'Liirat',
}) {
  const [error, setError] = React.useState(false);
  const [retrySrc, setRetrySrc] = React.useState('');

  const trySrc = React.useMemo(() => {
    const base = BRAND_LOGO_URL || '';
    // Cache-busting param to avoid broken cache scenarios
    return error ? `${base}?v=${Date.now()}` : base;
  }, [error]);

  React.useEffect(() => {
    // Preload image to avoid layout flicker and ensure availability
    if (!BRAND_LOGO_URL) return;
    const img = new Image();
    img.src = BRAND_LOGO_URL;
  }, []);

  const handleError = () => {
    if (!error) {
      // retry once with cache-buster quickly
      setTimeout(() => {
        setError(true);
        setRetrySrc(`${BRAND_LOGO_URL || ''}?v=${Date.now()}`);
      }, RETRY_DELAY_MS);
      return;
    }
    // final fallback
    setError(true);
  };

  if ((BRAND_LOGO_URL || retrySrc) && !(!BRAND_LOGO_URL && !retrySrc)) {
    return (
      <img
        src={retrySrc || trySrc}
        alt={alt}
        title={title}
        className={className}
        style={{ minHeight: '40px', minWidth: '40px', ...style }}
        loading="eager"
        decoding="async"
        onError={handleError}
        draggable={false}
      />
    );
  }

  // Minimal text fallback
  return (
    <div
      className={`${className} flex items-center justify-center text-xs font-bold`}
      style={{
        ...style,
        minWidth: '2.5rem',
        minHeight: '2.5rem',
        borderRadius: '0.75rem',
        background: 'linear-gradient(135deg, #7cb342, #8fcc52)',
        color: 'white',
      }}
      aria-label="App Logo"
      role="img"
    >
      LIIRAT
    </div>
  );
}