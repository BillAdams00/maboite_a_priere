import Link from 'next/link';
import { PrayerRepository } from '../../../server/repositories/prayer.repository';
import { PrayerCard } from '../../../components/prayer/PrayerCard';
import { CATEGORIES } from '../../../lib/constants/design-tokens';
import { PlusCircle, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CommunautePageProps {
  searchParams: {
    category?: string;
    sort?: 'recent' | 'needed';
    cursor?: string;
  };
}

export default async function CommunautePage({ searchParams }: CommunautePageProps) {
  const currentCategory = searchParams.category || '';
  const currentSort = searchParams.sort || 'recent';

  let prayers: any[] = [];
  let nextCursor: string | null = null;
  let dbOffline = false;

  try {
    const res = await PrayerRepository.findPublicFeed({
      category: currentCategory || undefined,
      sort: currentSort,
      cursor: searchParams.cursor,
      limit: 18,
    });
    prayers = res.items;
    nextCursor = res.nextCursor;
  } catch (err) {
    dbOffline = true;
  }

  return (
    <div className="space-y-8 py-2">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-encre">
            Sujets de prière de la communauté
          </h1>
          <p className="text-xs sm:text-sm text-encre-douce mt-0.5">
            Intercédez fidèlement pour vos frères et sœurs.
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

      {/* Barre de filtrage par catégorie */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-surface p-3 sm:p-4 rounded-2xl border border-bordure shadow-sm scrollbar-none">
        <Link
          href="/communaute"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            !currentCategory
              ? 'bg-primaire text-white shadow-sm'
              : 'text-encre-douce hover:text-encre hover:bg-fond'
          }`}
        >
          Tous les thèmes
        </Link>

        {CATEGORIES.map(cat => (
          <Link
            key={cat.id}
            href={`/communaute?category=${cat.id}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              currentCategory === cat.id
                ? 'bg-primaire text-white shadow-sm'
                : 'text-encre-douce hover:text-encre hover:bg-fond'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Grille des sujets de prière */}
      {prayers.length === 0 ? (
        <div className="bg-surface border border-bordure rounded-3xl p-12 text-center space-y-3">
          <p className="font-serif text-lg font-bold text-encre">
            {dbOffline ? 'En attente de connexion à Supabase Postgres' : 'Aucun sujet trouvé'}
          </p>
          <p className="text-xs sm:text-sm text-encre-douce max-w-sm mx-auto">
            {dbOffline
              ? 'Renseignez vos clés réelles DATABASE_URL dans .env.local pour charger les sujets en direct.'
              : 'Soyez le premier à déposer un sujet de prière ou ajustez vos critères de filtrage.'}
          </p>
          <div className="pt-2">
            <Link
              href="/deposer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primaire text-white text-xs font-bold hover:bg-primaire-hover"
            >
              <PlusCircle size={16} />
              <span>Déposer un sujet</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prayers.map(prayer => (
            <PrayerCard key={prayer.id} prayer={prayer} />
          ))}
        </div>
      )}

      {/* Pagination par curseur */}
      {nextCursor && (
        <div className="text-center pt-6">
          <Link
            href={`/communaute?${currentCategory ? `category=${currentCategory}&` : ''}sort=${currentSort}&cursor=${nextCursor}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-bordure text-primaire font-semibold text-xs sm:text-sm hover:bg-fond transition-colors shadow-sm"
          >
            <span>Charger les sujets suivants</span>
          </Link>
        </div>
      )}
    </div>
  );
}
