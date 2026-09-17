'use client';

import { useEffect, useState } from 'react';
import { HeartHandshake, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function PrayerFidelityBadge() {
  const [daysThisWeek, setDaysThisWeek] = useState<number | null>(null);

  useEffect(() => {
    try {
      const storedDays: string[] = JSON.parse(
        localStorage.getItem('mbap_prayer_days') || '[]'
      );

      if (!Array.isArray(storedDays)) {
        setDaysThisWeek(0);
        return;
      }

      // Calcul des 7 derniers jours
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const minDateStr = sevenDaysAgo.toISOString().slice(0, 10);

      const recentDays = storedDays.filter(day => typeof day === 'string' && day >= minDateStr);
      setDaysThisWeek(recentDays.length);
    } catch {
      setDaysThisWeek(0);
    }
  }, []);

  if (daysThisWeek === null) {
    return null;
  }

  return (
    <div className="bg-surface border border-bordure rounded-2xl p-4 sm:p-5 shadow-xs transition-colors duration-200 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-paix/15 text-paix flex items-center justify-center">
          <HeartHandshake size={18} />
        </div>
        <div>
          <span className="text-xs font-bold text-encre uppercase tracking-wider">
            Votre fidélité dans la prière
          </span>
          <p className="text-[11px] text-encre-douce">
            Espace personnel & anonyme (enregistré uniquement sur cet appareil)
          </p>
        </div>
      </div>

      {daysThisWeek > 0 ? (
        <div className="bg-paix/10 border border-paix/20 rounded-xl p-3 flex items-start gap-2 text-xs text-encre">
          <Sparkles size={16} className="text-paix shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Tu as soutenu la communauté{' '}
            <strong className="text-paix font-bold">
              {daysThisWeek} {daysThisWeek > 1 ? 'jours' : 'jour'}
            </strong>{' '}
            cette semaine. Merci pour ta fidélité fraternelle et tes prières fidèles !
          </p>
        </div>
      ) : (
        <div className="bg-fond border border-bordure/60 rounded-xl p-3 text-xs text-encre-douce leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p>
            🕊️ Chaque prière portée dans le secret est une bénédiction précieuse pour celui qui souffre.
          </p>
          <Link
            href="/communaute"
            className="self-start sm:self-auto text-primaire hover:underline font-semibold shrink-0"
          >
            Prier maintenant →
          </Link>
        </div>
      )}
    </div>
  );
}
