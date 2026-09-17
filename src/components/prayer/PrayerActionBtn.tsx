'use client';

import { useState } from 'react';
import { prayAction } from '../../server/actions/prayer.actions';
import { Heart, Check } from 'lucide-react';

interface PrayerActionBtnProps {
  publicSlug: string;
  initialCount: number;
}

export function PrayerActionBtn({ publicSlug, initialCount }: PrayerActionBtnProps) {
  const [count, setCount] = useState(initialCount);
  const [hasPrayed, setHasPrayed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePray = async () => {
    if (isLoading || hasPrayed) return;

    setIsLoading(true);
    // Mise à jour optimiste
    setCount(prev => prev + 1);
    setHasPrayed(true);

    try {
      const res = await prayAction(publicSlug);
      if (res.success && res.data) {
        setCount(res.data.prayerCount);
        setHasPrayed(true);
      } else {
        // En cas d'erreur de requête
        console.warn('Erreur prière :', res.error);
      }
    } catch (err) {
      console.error('Erreur :', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePray}
      disabled={isLoading || hasPrayed}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
        hasPrayed
          ? 'bg-paix/15 text-paix border border-paix/30 cursor-default'
          : 'bg-primaire/10 text-primaire hover:bg-primaire hover:text-white border border-primaire/20'
      }`}
      aria-label="Prier pour ce sujet"
    >
      {hasPrayed ? (
        <>
          <Check size={16} className="text-paix" />
          <span>J'ai prié ({count})</span>
        </>
      ) : (
        <>
          <Heart size={16} className={isLoading ? 'animate-pulse' : ''} />
          <span>Je prie pour toi ({count})</span>
        </>
      )}
    </button>
  );
}
