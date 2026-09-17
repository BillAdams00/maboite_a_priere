'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../server/supabase/browser';

export function useLivePrayerCount(publicSlug: string, initialCount: number) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!publicSlug) return;

    let isSubscribed = true;
    let channel: any = null;

    // 1. Tentative d'abonnement Supabase Realtime si les clés sont actives
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const isRealtimeCandidate =
        supabaseUrl &&
        !supabaseUrl.includes('placeholder') &&
        !supabaseUrl.includes('127.0.0.1:54321');

      if (isRealtimeCandidate) {
        const supabase = createClient();
        channel = supabase
          .channel(`prayer-count-${publicSlug}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'prayer_requests',
              filter: `publicSlug=eq.${publicSlug}`,
            },
            (payload: { new?: { prayerCount?: number } }) => {
              if (isSubscribed && payload.new && typeof payload.new.prayerCount === 'number') {
                setCount(payload.new.prayerCount);
              }
            }
          )
          .subscribe();
      }
    } catch {
      // Ignorer si indisponible
    }

    // 2. Repli automatique propre : polling léger toutes les 45s si l'onglet est actif
    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      try {
        const res = await fetch(`/api/prayers/count?slug=${encodeURIComponent(publicSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && typeof data.prayerCount === 'number') {
            setCount(prev => Math.max(prev, data.prayerCount));
          }
        }
      } catch {
        // Silencieux en cas de déconnexion momentanée
      }
    }, 45000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [publicSlug]);

  return { count, setCount };
}
