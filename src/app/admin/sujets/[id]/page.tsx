import { notFound } from 'next/navigation';
import { AdminService } from '../../../../server/services/admin.service';
import { AdminPrayerActions } from './AdminPrayerActions';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  Globe,
  Heart,
  Calendar,
  Sparkles,
  AlertTriangle,
  Shield,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AdminPrayerDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminPrayerDetailPage({ params }: AdminPrayerDetailPageProps) {
  await AdminService.requireAdmin(['MODERATOR', 'ADMIN', 'SUPER_ADMIN']);

  const prayer = await AdminService.getDecryptedPrayer(params.id);
  if (!prayer) {
    notFound();
  }

  const hasPendingClaim = !!(
    prayer.answeredClaim &&
    !prayer.answeredClaim.confirmedAt &&
    !prayer.answeredClaim.rejectedAt
  );

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6">
      <Link
        href="/admin/sujets"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primaire hover:underline"
      >
        <ArrowLeft size={16} />
        <span>Retour à la liste des sujets</span>
      </Link>

      {/* Fiche d'information principale */}
      <div className="bg-surface border border-bordure rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bordure/60 pb-4">
          <div>
            <span className="text-[11px] text-encre-subtile font-mono">ID: {prayer.id}</span>
            <h1 className="font-serif text-2xl font-bold text-encre mt-0.5">
              {prayer.firstName} {prayer.lastName}
            </h1>
            <p className="text-xs text-encre-douce">
              {prayer.displayAsAnonymous
                ? 'Option activée : Anonyme en public (« Un frère · une sœur »)'
                : 'Affichage public du prénom autorisé'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                prayer.status === 'APPROVED'
                  ? 'bg-paix-subtle text-paix'
                  : prayer.status === 'PENDING'
                  ? 'bg-lumiere-subtle text-lumiere'
                  : prayer.status === 'REJECTED'
                  ? 'bg-danger-subtle text-danger'
                  : 'bg-fond text-encre-subtile'
              }`}
            >
              {prayer.status}
            </span>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-bordure bg-fond flex items-center gap-1">
              {prayer.visibility === 'PUBLIC' ? (
                <>
                  <Globe size={13} className="text-primaire" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock size={13} className="text-encre-douce" />
                  <span>Privé (chiffré)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Métadonnées */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-encre-subtile block font-medium">Catégorie</span>
            <span className="font-bold text-encre">{prayer.category || 'Non renseignée'}</span>
          </div>

          <div>
            <span className="text-encre-subtile block font-medium">Prières reçues</span>
            <span className="font-bold text-encre">{prayer.prayerCount}</span>
          </div>

          <div>
            <span className="text-encre-subtile block font-medium">Date de dépôt</span>
            <span className="font-bold text-encre">
              {new Date(prayer.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>

          <div>
            <span className="text-encre-subtile block font-medium">Exaucement</span>
            <span className="font-bold text-encre">
              {prayer.isAnswered ? 'Oui 🙌' : 'Non'}
            </span>
          </div>
        </div>

        {/* Contenu déchiffré */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-encre-douce uppercase tracking-wider">
              Contenu du sujet
            </span>
            {prayer.visibility === 'PRIVATE' && (
              <span className="text-[11px] text-paix font-medium flex items-center gap-1">
                <Shield size={12} />
                <span>Déchiffré pour consultation pastorale</span>
              </span>
            )}
          </div>

          <div className="bg-fond p-4 sm:p-5 rounded-xl border border-bordure text-sm text-encre whitespace-pre-wrap leading-relaxed">
            {prayer.content}
          </div>
        </div>

        {/* Témoignage d'exaucement si renseigné */}
        {prayer.answeredClaim && prayer.answeredClaim.note && (
          <div className="bg-lumiere-subtle/40 border-l-3 border-lumiere p-4 rounded-r-xl space-y-1 text-xs">
            <span className="font-bold text-lumiere flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>Témoignage d'exaucement soumis par le déposant :</span>
            </span>
            <p className="italic text-encre">{prayer.answeredClaim.note}</p>
          </div>
        )}
      </div>

      {/* Signalements si existants */}
      {prayer.reports && prayer.reports.length > 0 && (
        <div className="bg-danger-subtle/50 border border-danger/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={18} />
            <h3 className="font-bold text-sm">
              Signalements de modération ({prayer.reports.length})
            </h3>
          </div>

          <div className="space-y-2">
            {prayer.reports.map(rep => (
              <div
                key={rep.id}
                className="bg-surface p-3 rounded-xl border border-danger/20 text-xs space-y-1"
              >
                <div className="flex justify-between text-encre-subtile text-[11px]">
                  <span>Visiteur anonyme</span>
                  <span>{new Date(rep.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-encre font-medium">{rep.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bloc interactif d'actions de modération */}
      <AdminPrayerActions
        requestId={prayer.id}
        currentStatus={prayer.status}
        hasPendingClaim={hasPendingClaim}
      />
    </div>
  );
}
