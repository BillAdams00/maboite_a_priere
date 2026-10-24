'use client';

import { useState } from 'react';
import { Flag, X, AlertTriangle } from 'lucide-react';
import { reportPrayerAction } from '../../server/actions/prayer.actions';
import { withTimeout } from '../../lib/utils/async';

interface ReportModalProps {
  requestId: string;
}

export function ReportModal({ requestId }: ReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Veuillez préciser le motif (au moins 5 caractères).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await withTimeout(
        reportPrayerAction({ requestId, reason }),
        15000,
        'L’envoi du signalement met plus de 15 secondes à aboutir. Veuillez réessayer.'
      );

      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setReason('');
        }, 2000);
      } else {
        setError(res.error || 'Erreur lors du signalement.');
      }
    } catch (err: any) {
      setError(err?.message || 'Une erreur réseau est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] text-encre-subtile hover:text-danger transition-colors p-1"
        title="Signaler un contenu inapproprié"
        aria-label="Signaler"
      >
        <Flag size={13} />
        <span className="hidden sm:inline">Signaler</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-encre/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-bordure rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-encre-subtile hover:text-encre p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 text-danger mb-3">
              <AlertTriangle size={20} />
              <h3 className="font-bold text-base text-encre">Signaler ce sujet</h3>
            </div>

            {submitted ? (
              <div className="py-6 text-center text-paix font-medium text-sm">
                🙏 Merci, votre signalement a été transmis à l'équipe de modération.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-encre-douce leading-relaxed">
                  Si ce sujet contient des propos blessants, du spam, des coordonnées personnelles ou
                  des liens commerciaux, décrivez brièvement le problème ci-dessous :
                </p>

                {error && (
                  <div className="text-xs text-danger bg-danger-subtle p-2.5 rounded-lg border border-danger/20">
                    {error}
                  </div>
                )}

                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex : Propos haineux, publicité pour marabout, numéro de téléphone..."
                  rows={3}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-bordure bg-fond focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20 text-encre resize-none"
                  required
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-encre-douce hover:text-encre rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-danger text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
