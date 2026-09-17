'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ShareButtonProps {
  publicSlug: string;
  title: string;
}

export function ShareButton({ publicSlug, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/communaute/${publicSlug}`;
    const text = `🙏 Soutenez ce sujet de prière sur Ma boîte à prière : ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ma boîte à prière',
          text,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      console.warn('Impossible de copier le lien');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 text-xs text-encre-douce hover:text-primaire transition-colors px-2.5 py-1.5 rounded-lg hover:bg-fond"
      title="Partager ce sujet (WhatsApp, lien direct)"
      aria-label="Partager"
    >
      {copied ? (
        <>
          <Check size={14} className="text-paix" />
          <span className="text-paix">Copié !</span>
        </>
      ) : (
        <>
          <Share2 size={14} />
          <span>Partager</span>
        </>
      )}
    </button>
  );
}
