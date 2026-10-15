'use client';

import { useState, useEffect } from 'react';

export function useLivePrayerCount(publicSlug: string, initialCount: number) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!publicSlug) return;

    let isMounted = true;

    // Polling régulier de /api/prayers/count (toutes les 20s, onglet visible uniquement)
    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      try {
        const res = await fetch(`/api/prayers/count?slug=${encodeURIComponent(publicSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.prayerCount === 'number') {
            setCount(prev => Math.max(prev, data.prayerCount));
          }
        }
      } catch {
        // Silencieux en cas de déconnexion momentanée
      }
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [publicSlug]);

  return { count, setCount };
}
