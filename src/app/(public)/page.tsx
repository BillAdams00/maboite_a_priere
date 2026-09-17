import Link from 'next/link';
import { PlusCircle, Users, BookOpen, Sparkles, ShieldCheck, HeartHandshake, Lock, Globe } from 'lucide-react';
import { PrayerRepository } from '../../server/repositories/prayer.repository';
import { PrayerCard } from '../../components/prayer/PrayerCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let latestPrayers: any[] = [];
  try {
    const res = await PrayerRepository.findPublicFeed({ limit: 3 });
    latestPrayers = res.items;
  } catch (err) {
    // Si la base n'est pas encore connectée (phase de build/init)
    latestPrayers = [];
  }

  return (
    <div className="space-y-12 sm:space-y-16 py-4">
      {/* Hero Header */}
      <section className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primaire/10 text-primaire text-xs font-semibold tracking-wide">
          <HeartHandshake size={15} />
          <span>Intercession fraternelle chrétienne</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-encre tracking-tight leading-tight">
          Portons nos fardeaux les uns les autres
        </h1>

        <p className="text-sm sm:text-base text-encre-douce leading-relaxed">
          Un lieu de paix où déposer vos besoins, vos épreuves et vos louanges. Aucun compte nécessaire,
          anonymat respecté et bienveillance assurée.
        </p>

        {/* CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/deposer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primaire text-white font-bold text-sm shadow-md hover:bg-primaire-hover transition-all duration-150 active:scale-95"
          >
            <PlusCircle size={18} />
            <span>Déposer un sujet de prière</span>
          </Link>

          <Link
            href="/communaute"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface border border-bordure text-primaire font-semibold text-sm hover:bg-fond transition-colors shadow-sm"
          >
            <Users size={18} />
            <span>Découvrir les sujets de prière</span>
          </Link>
        </div>
      </section>

      {/* Verset biblique d'ancrage */}
      <section className="max-w-2xl mx-auto bg-surface border border-bordure rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-lumiere mb-2">
          <BookOpen size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">Parole d'espérance</span>
        </div>
        <blockquote className="font-serif italic text-base sm:text-lg text-encre leading-relaxed">
          « Je vous dis encore que, si deux d'entre vous s'accordent sur la terre pour demander
          une chose quelconque, elle leur sera accordée par mon Père qui est dans les cieux. »
        </blockquote>
        <p className="text-right text-xs font-bold text-encre-douce mt-3">
          Matthieu 18:19 (LSG)
        </p>
      </section>

      {/* Les 3 étapes */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-encre">Comment ça marche ?</h2>
          <p className="text-xs sm:text-sm text-encre-douce mt-1">Simple, gratuit et sans friction.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-full bg-primaire/10 text-primaire flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-sm text-encre">Tu écris</h3>
            <p className="text-xs text-encre-douce leading-relaxed">
              Confie tes besoins, tes épreuves ou tes actions de grâce en moins de 45 secondes,
              sans créer de compte.
            </p>
          </div>

          <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-full bg-lumiere/15 text-lumiere flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-sm text-encre">Tu choisis</h3>
            <p className="text-xs text-encre-douce leading-relaxed">
              🔒 <strong>Privé</strong> (chiffré et visible uniquement par l'équipe pastorale) ou 🌍 <strong>Public</strong> pour être porté par l'intercession de tous.
            </p>
          </div>

          <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-full bg-paix/15 text-paix flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-sm text-encre">La communauté prie</h3>
            <p className="text-xs text-encre-douce leading-relaxed">
              Des frères et sœurs intercèdent fidèlement pour toi. Tu conserves un lien privé pour suivre
              le soutien reçu et partager ton exaucement.
            </p>
          </div>
        </div>
      </section>

      {/* Aperçu des prières récentes */}
      {latestPrayers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-encre">
                Sujets récents de la communauté
              </h2>
              <p className="text-xs text-encre-douce">Prenez quelques secondes pour intercéder.</p>
            </div>
            <Link
              href="/communaute"
              className="text-xs font-semibold text-primaire hover:underline"
            >
              Tout voir →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestPrayers.map(prayer => (
              <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </div>
        </section>
      )}

      {/* Foire aux questions rapide */}
      <section className="bg-surface border border-bordure rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="font-serif text-xl font-bold text-encre mb-4">Questions fréquentes</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm text-encre-douce">
          <div className="space-y-1">
            <h4 className="font-bold text-encre">Mon sujet privé est-il vraiment sécurisé ?</h4>
            <p className="leading-relaxed">
              Oui, il est chiffré en base de données avec l'algorithme militaire AES-256-GCM.
              Seule l'équipe pastorale habilitée peut le lire.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-encre">Mon nom de famille apparaît-il ?</h4>
            <p className="leading-relaxed">
              Non, jamais. Seul votre prénom (ou la mention anonyme « Un frère · une sœur ») est affiché publiquement.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-encre">Comment retrouver mon sujet plus tard ?</h4>
            <p className="leading-relaxed">
              À la fin du dépôt, vous recevez un lien de gestion privé unique que vous pouvez copier ou ajouter à vos favoris.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-encre">Est-ce entièrement gratuit ?</h4>
            <p className="leading-relaxed">
              Oui, le service est 100 % gratuit et sans aucune publicité.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
