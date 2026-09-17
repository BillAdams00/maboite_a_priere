import { PrayerActionBtn } from './PrayerActionBtn';
import { ShareButton } from './ShareButton';
import { ReportModal } from './ReportModal';
import { Sparkles, Calendar } from 'lucide-react';
import type { PublicPrayerRequestItem } from '../../lib/types/index';
import { CATEGORIES } from '../../lib/constants/design-tokens';

interface PrayerCardProps {
  prayer: PublicPrayerRequestItem;
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    return '';
  }
}

export function PrayerCard({ prayer }: PrayerCardProps) {
  const categoryMeta = CATEGORIES.find(c => c.id === prayer.category);

  return (
    <article className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
      <div>
        {/* En-tête de la carte */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-encre">
              {prayer.displayName}
            </span>
            {categoryMeta && (
              <span className="text-[11px] font-medium text-encre-douce bg-fond px-2.5 py-0.5 rounded-full border border-bordure/60">
                {categoryMeta.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-encre-subtile">
            <Calendar size={12} />
            <span>{formatDate(prayer.createdAt)}</span>
          </div>
        </div>

        {/* Badge Exaucé si applicable */}
        {prayer.isAnswered && (
          <div className="mb-3 inline-flex items-center gap-1.5 bg-lumiere-subtle text-lumiere border border-lumiere/30 px-3 py-1 rounded-xl text-xs font-bold">
            <Sparkles size={14} className="fill-current" />
            <span>Prière exaucée 🙌</span>
          </div>
        )}

        {/* Contenu du sujet */}
        <p className="text-sm text-encre leading-relaxed whitespace-pre-wrap font-sans">
          {prayer.content}
        </p>

        {/* Témoignage d'exaucement si disponible */}
        {prayer.isAnswered && prayer.answeredNote && (
          <div className="mt-3 bg-fond border-l-2 border-lumiere p-3 rounded-r-xl text-xs italic text-encre-douce">
            <p className="font-semibold not-italic text-encre mb-0.5">Témoignage :</p>
            {prayer.answeredNote}
          </div>
        )}
      </div>

      {/* Pied de carte avec actions */}
      <div className="mt-5 pt-3.5 border-t border-bordure/60 flex items-center justify-between">
        <PrayerActionBtn
          publicSlug={prayer.publicSlug}
          initialCount={prayer.prayerCount}
        />

        <div className="flex items-center gap-1">
          <ShareButton publicSlug={prayer.publicSlug} title={prayer.displayName} />
          <ReportModal requestId={prayer.id} />
        </div>
      </div>
    </article>
  );
}
