'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Sparkles,
  Lock,
  Trash2,
  Copy,
  Check,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { managePrayerAction } from '../../../../server/actions/prayer.actions';
import type { MyPrayerRequestDetail } from '../../../../lib/types/index';
import { PrayerFidelityBadge } from '../../../../components/prayer/PrayerFidelityBadge';
import Link from 'next/link';

interface MonSujetClientProps {
  prayer: MyPrayerRequestDetail;
  rawToken: string;
}

export function MonSujetClient({ prayer, rawToken }: MonSujetClientProps) {
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [testimonyNote, setTestimonyNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      console.warn('Erreur de copie');
    }
  };

  const handleClaimAnswered = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await managePrayerAction(rawToken, {
      action: 'claimAnswered',
      note: testimonyNote || null,
    });

    setIsSubmitting(false);

    if (res.success) {
      setShowAnswerModal(false);
      setActionMessage(res.data?.message || 'Votre témoignage a été transmis 🙌');
      router.refresh();
    } else {
      setErrorMessage(res.error || 'Une erreur est survenue.');
    }
  };

  const handleMakePrivate = async () => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir rendre ce sujet privé ? Il ne sera plus visible de la communauté et sera chiffré pour l’équipe pastorale.'
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await managePrayerAction(rawToken, { action: 'private' });
    setIsSubmitting(false);

    if (res.success) {
      setActionMessage(res.data?.message || 'Votre sujet est désormais privé.');
      router.refresh();
    } else {
      setErrorMessage(res.error || 'Une erreur est survenue.');
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer définitivement ce sujet de prière ? Cette action est irréversible.'
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await managePrayerAction(rawToken, { action: 'delete' });
    setIsSubmitting(false);

    if (res.success) {
      alert('Votre sujet de prière a été supprimé.');
      router.push('/communaute');
    } else {
      setErrorMessage(res.error || 'Une erreur est survenue.');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-6 space-y-6">
      {/* Navigation retour */}
      <Link
        href="/communaute"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primaire hover:underline"
      >
        <ArrowLeft size={16} />
        <span>Retour au flux public</span>
      </Link>

      {/* En-tête de la page de gestion */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-encre">
            Gestion de votre sujet
          </h1>
          <p className="text-xs text-encre-douce mt-0.5">
            Espace privé et confidentiel lié à votre lien de gestion.
          </p>
        </div>

        {/* Badge de visibilité */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border border-bordure bg-surface">
          {prayer.visibility === 'PUBLIC' ? (
            <>
              <Globe size={14} className="text-primaire" />
              <span className="text-primaire">Public</span>
            </>
          ) : (
            <>
              <Lock size={14} className="text-encre-douce" />
              <span className="text-encre">Privé</span>
            </>
          )}
        </div>
      </div>

      {/* Notifications / Messages de retour */}
      {actionMessage && (
        <div className="bg-paix-subtle border border-paix/30 text-paix text-xs sm:text-sm p-4 rounded-2xl flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-danger-subtle border border-danger/30 text-danger text-xs sm:text-sm p-4 rounded-2xl flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Compteur de soutien */}
      <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primaire/10 text-primaire flex items-center justify-center">
            <Heart size={24} className="fill-current" />
          </div>
          <div>
            <p className="text-xs text-encre-douce font-medium">Prières portées pour vous</p>
            <p className="font-serif text-2xl font-bold text-encre">
              {prayer.prayerCount} {prayer.prayerCount <= 1 ? 'prière' : 'prières'}
            </p>
          </div>
        </div>

        {prayer.isAnswered ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lumiere-subtle text-lumiere border border-lumiere/30 text-xs font-bold">
            <Sparkles size={14} className="fill-current" />
            <span>Exaucé</span>
          </div>
        ) : prayer.hasPendingAnsweredClaim ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fond text-encre-douce border border-bordure text-xs font-semibold">
            <span>Témoignage en cours de confirmation</span>
          </div>
        ) : null}
      </div>

      {/* Fiche du sujet */}
      <div className="bg-surface border border-bordure rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-encre-douce">
          <span>Déposé sous le nom : <strong>{prayer.firstName}</strong></span>
          <span>Le {new Date(prayer.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>

        <div className="bg-fond p-4 rounded-xl border border-bordure/60">
          <p className="text-sm text-encre leading-relaxed whitespace-pre-wrap font-sans">
            {prayer.content}
          </p>
        </div>

        {prayer.isAnswered && prayer.answeredNote && (
          <div className="bg-lumiere-subtle/50 border-l-2 border-lumiere p-3 rounded-r-xl text-xs text-encre">
            <p className="font-bold text-lumiere mb-1">Votre témoignage d'exaucement :</p>
            <p className="italic">{prayer.answeredNote}</p>
          </div>
        )}
      </div>

      {/* Indicateur de fidélité privée et positive */}
      <PrayerFidelityBadge />

      {/* Actions de gestion */}
      <div className="bg-surface border border-bordure rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-serif font-bold text-base text-encre">Actions sur votre sujet</h2>

        <div className="flex flex-col gap-3">
          {/* Bouton Témoigner d'un exaucement */}
          {!prayer.isAnswered && !prayer.hasPendingAnsweredClaim && (
            <button
              onClick={() => setShowAnswerModal(true)}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-lumiere-subtle border border-lumiere/40 text-lumiere font-bold text-xs sm:text-sm hover:bg-lumiere hover:text-white transition-colors"
            >
              <Sparkles size={16} />
              <span>Témoigner d'un exaucement 🙌</span>
            </button>
          )}

          {/* Basculer en privé */}
          {prayer.visibility === 'PUBLIC' && (
            <button
              onClick={handleMakePrivate}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-fond border border-bordure text-encre text-xs sm:text-sm font-semibold hover:bg-surface transition-colors"
            >
              <Lock size={16} className="text-primaire" />
              <span>Basculer ce sujet en confidentiel (privé)</span>
            </button>
          )}

          {/* Supprimer le sujet */}
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-danger/20 text-danger text-xs sm:text-sm font-semibold hover:bg-danger-subtle transition-colors"
          >
            <Trash2 size={16} />
            <span>Supprimer définitivement ce sujet</span>
          </button>
        </div>
      </div>

      {/* Rappel du lien privé */}
      <div className="bg-fond border border-bordure rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
        <div className="truncate">
          <p className="font-bold text-encre">Conservez votre lien privé :</p>
          <p className="text-encre-subtile font-mono truncate">{typeof window !== 'undefined' ? window.location.href : ''}</p>
        </div>

        <button
          onClick={handleCopyLink}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-bordure text-encre font-semibold hover:bg-white shadow-xs transition-colors"
        >
          {copied ? <Check size={14} className="text-paix" /> : <Copy size={14} />}
          <span>{copied ? 'Copié' : 'Copier'}</span>
        </button>
      </div>

      {/* Modal Témoignage d'exaucement */}
      {showAnswerModal && (
        <div className="fixed inset-0 z-50 bg-encre/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-bordure rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-lumiere">
              <Sparkles size={20} />
              <h3 className="font-bold text-base text-encre">Témoigner d'un exaucement 🙌</h3>
            </div>

            <p className="text-xs text-encre-douce leading-relaxed">
              Gloire à Dieu ! Vous pouvez ajouter un court mot de témoignage ou de remerciement pour
              encourager la foi des frères et sœurs qui ont intercédé pour vous.
            </p>

            <form onSubmit={handleClaimAnswered} className="space-y-4">
              <textarea
                value={testimonyNote}
                onChange={e => setTestimonyNote(e.target.value)}
                placeholder="Ex. Le Seigneur a répondu à mes prières, l'opération s'est bien déroulée..."
                rows={4}
                maxLength={500}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-bordure bg-fond focus:bg-surface focus:outline-none focus:ring-2 focus:ring-lumiere/30 text-encre resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnswerModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-encre-douce hover:text-encre rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-lumiere text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Envoi...' : 'Transmettre mon témoignage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
