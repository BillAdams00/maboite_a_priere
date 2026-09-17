'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Lock,
  Archive,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  moderatePrayerAction,
  resolveAnsweredClaimAction,
} from '../../../../server/actions/admin.actions';

interface AdminPrayerActionsProps {
  requestId: string;
  currentStatus: string;
  hasPendingClaim: boolean;
}

export function AdminPrayerActions({
  requestId,
  currentStatus,
  hasPendingClaim,
}: AdminPrayerActionsProps) {
  const router = useRouter();

  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleModerate = async (decision: 'APPROVE' | 'REJECT' | 'ARCHIVE' | 'MAKE_PRIVATE') => {
    setIsSubmitting(true);
    setFeedback(null);

    const res = await moderatePrayerAction(requestId, decision, note || null);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback(`Action ${decision} effectuée avec succès.`);
      router.refresh();
    } else {
      alert(res.error || 'Erreur lors de la modération');
    }
  };

  const handleResolveClaim = async (confirm: boolean) => {
    setIsSubmitting(true);
    setFeedback(null);

    const res = await resolveAnsweredClaimAction(requestId, confirm, note || null);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback(confirm ? 'Exaucement validé 🙌' : 'Témoignage d’exaucement rejeté.');
      router.refresh();
    } else {
      alert(res.error || 'Erreur lors du traitement de l’exaucement');
    }
  };

  return (
    <div className="bg-surface border border-bordure rounded-2xl p-6 shadow-sm space-y-5">
      <h3 className="font-serif font-bold text-base text-encre">Actions de Modération</h3>

      {feedback && (
        <div className="p-3 bg-paix-subtle border border-paix/30 rounded-xl text-paix text-xs font-medium">
          {feedback}
        </div>
      )}

      {/* Note de modération */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-encre-douce uppercase tracking-wider">
          Note de modération interne (optionnelle)
        </label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ex. Validé après vérification du contenu..."
          className="w-full px-3.5 py-2 rounded-xl border border-bordure bg-fond text-xs text-encre focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20"
        />
      </div>

      {/* Validation d'un témoignage d'exaucement si en attente */}
      {hasPendingClaim && (
        <div className="p-4 bg-lumiere-subtle/50 border border-lumiere/30 rounded-xl space-y-3">
          <p className="text-xs font-bold text-lumiere flex items-center gap-1.5">
            <Sparkles size={16} />
            <span>Un témoignage d'exaucement a été signalé par le déposant</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleResolveClaim(true)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-paix text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              Confirmer l'exaucement 🙌
            </button>
            <button
              onClick={() => handleResolveClaim(false)}
              disabled={isSubmitting}
              className="px-3.5 py-2 bg-surface border border-bordure text-encre-douce text-xs font-medium rounded-xl hover:bg-fond"
            >
              Rejeter
            </button>
          </div>
        </div>
      )}

      {/* Boutons de modération standard */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={() => handleModerate('APPROVE')}
          disabled={isSubmitting || currentStatus === 'APPROVED'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-paix text-white text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <CheckCircle2 size={15} />
          <span>Approuver</span>
        </button>

        <button
          onClick={() => handleModerate('MAKE_PRIVATE')}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-bordure text-encre text-xs font-semibold hover:bg-fond transition-colors"
        >
          <Lock size={15} className="text-primaire" />
          <span>Basculer en Privé</span>
        </button>

        <button
          onClick={() => handleModerate('ARCHIVE')}
          disabled={isSubmitting || currentStatus === 'ARCHIVED'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-bordure text-encre-douce text-xs font-semibold hover:bg-fond transition-colors"
        >
          <Archive size={15} />
          <span>Archiver</span>
        </button>

        <button
          onClick={() => handleModerate('REJECT')}
          disabled={isSubmitting || currentStatus === 'REJECTED'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-danger-subtle border border-danger/20 text-danger text-xs font-bold hover:bg-danger hover:text-white transition-colors ml-auto"
        >
          <XCircle size={15} />
          <span>Rejeter</span>
        </button>
      </div>
    </div>
  );
}
