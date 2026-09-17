import Link from 'next/link';
import { PrayerRepository } from '../../../server/repositories/prayer.repository';
import { PrayerCard } from '../../../components/prayer/PrayerCard';
import { Sparkles, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ExaucesPageProps {
  searchParams: {
    cursor?: string;
  };
}

export default async function ExaucesPage({ searchParams }: ExaucesPageProps) {
  let answeredPrayers: any[] = [];
  let nextCursor: string | null = null;
  let dbOffline = false;

  try {
    const res = await PrayerRepository.findAnswered(searchParams.cursor, 18);
    answeredPrayers = res.items;
    nextCursor = res.nextCursor;
  } catch (err) {
    dbOffline = true;
  }

  return (
    <div className="space-y-8 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-lumiere text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles size={16} className="fill-current" />
            <span>Actions de grâce & Gloire à Dieu</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-encre">
            Prières exaucées & Témoignages
          </h1>
          <p className="text-xs sm:text-sm text-encre-douce mt-0.5">
            Découvrez comment Dieu a répondu aux prières fidèles de la communauté.
          </p>
        </div>

        <Link
          href="/deposer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primaire text-white text-xs sm:text-sm font-bold shadow-sm hover:bg-primaire-hover transition-colors self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          <span>Déposer un sujet</span>
        </Link>
      </div>

      {answeredPrayers.length === 0 ? (
        <div className="bg-surface border border-bordure rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-lumiere-subtle text-lumiere flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <p className="font-serif text-lg font-bold text-encre">Aucun exaucement répertorié pour le moment</p>
          <p className="text-xs sm:text-sm text-encre-douce max-w-sm mx-auto">
            Les déposants peuvent témoigner de leur exaucement grâce à leur lien privé de gestion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {answeredPrayers.map(prayer => (
            <PrayerCard key={prayer.id} prayer={prayer} />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="text-center pt-6">
          <Link
            href={`/exauces?cursor=${nextCursor}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-bordure text-primaire font-semibold text-xs sm:text-sm hover:bg-fond transition-colors shadow-sm"
          >
            <span>Voir plus de témoignages</span>
          </Link>
        </div>
      )}
    </div>
  );
}
