'use client';

import { useState } from 'react';
import { Sparkles, Share2, Check, Copy } from 'lucide-react';
import { getDailyVerse } from '../../lib/constants/daily-verses';

export function DailyVerseBanner() {
  const verse = getDailyVerse();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareText = `« ${verse.text} » — ${verse.reference} (Ma boîte à prière)`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maboiteapriere.fr';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Verset du jour · ${verse.reference}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // L'utilisateur a annulé ou le partage a échoué -> repli sur copie
      }
    }

    // Repli presse-papiers
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      console.warn('Impossible de copier dans le presse-papiers');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-bordure bg-gradient-to-r from-fond via-surface to-fond p-4 sm:p-5 shadow-xs transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-lumiere uppercase tracking-wider bg-lumiere/10 dark:bg-lumiere/15 px-2.5 py-0.5 rounded-full">
              <Sparkles size={13} className="fill-current" />
              <span>Verset du jour</span>
            </span>
            <span className="text-[11px] text-encre-douce font-medium">
              • {verse.theme}
            </span>
          </div>

          <p className="font-serif italic text-sm text-encre leading-relaxed">
            « {verse.text} »
          </p>

          <p className="text-xs font-semibold text-encre-douce">
            {verse.reference}
          </p>
        </div>

        <button
          onClick={handleShare}
          className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-bordure text-encre text-xs font-medium hover:bg-fond hover:border-primaire/30 transition-all shadow-xs active:scale-95"
          aria-label="Partager le verset du jour"
          title="Partager ou copier le verset du jour"
        >
          {copied ? (
            <>
              <Check size={14} className="text-paix" />
              <span className="text-paix font-bold">Copié !</span>
            </>
          ) : (
            <>
              <Share2 size={14} className="text-encre-douce" />
              <span>Partager</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
