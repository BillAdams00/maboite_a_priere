'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur applicative capturée :', error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-danger-subtle text-danger flex items-center justify-center mx-auto">
        <AlertTriangle size={28} />
      </div>
      <h1 className="font-serif text-2xl font-bold text-encre">Une anomalie est survenue</h1>
      <p className="text-xs sm:text-sm text-encre-douce leading-relaxed">
        Nous nous excusons pour ce désagrément passager. Veuillez réessayer dans quelques instants.
      </p>
      <div className="pt-2 flex justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primaire text-white font-bold text-xs hover:bg-primaire-hover transition-colors"
        >
          <RefreshCw size={15} />
          <span>Réessayer</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-bordure text-encre text-xs font-semibold hover:bg-fond"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
