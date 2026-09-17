import { AdminService } from '../../server/services/admin.service';
import { StatRepository } from '../../server/repositories/stat.repository';
import { PrayerRepository } from '../../server/repositories/prayer.repository';
import Link from 'next/link';
import {
  Inbox,
  Clock,
  Lock,
  Heart,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let adminInfo;
  try {
    adminInfo = await AdminService.requireAdmin(['MODERATOR', 'ADMIN', 'SUPER_ADMIN']);
  } catch (error: any) {
    return (
      <div className="bg-surface border border-bordure rounded-2xl p-8 text-center space-y-3">
        <AlertTriangle size={32} className="text-danger mx-auto" />
        <h2 className="font-serif text-lg font-bold text-encre">Accès Restreint</h2>
        <p className="text-xs text-encre-douce">{error.message}</p>
        <Link
          href="/admin/connexion"
          className="inline-flex items-center px-4 py-2 bg-primaire text-white text-xs font-bold rounded-xl"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const { admin } = adminInfo;
  const stats = await StatRepository.getSummary();
  const pendingRequests = await PrayerRepository.findAdminList({
    status: 'PENDING',
    pageSize: 5,
  });

  return (
    <div className="space-y-6 py-2">
      {/* En-tête de bienvenue */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface border border-bordure rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-encre">
            Bonjour, {admin.firstName} 👋
          </h1>
          <p className="text-xs text-encre-douce">
            Rôle : <span className="font-semibold text-primaire">{admin.role}</span> · Bienvenue sur
            votre espace de modération pastorale.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/sujets?status=PENDING"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primaire text-white text-xs font-bold hover:bg-primaire-hover transition-colors shadow-sm"
          >
            <Clock size={14} />
            <span>En attente ({stats.pendingCount})</span>
          </Link>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-surface border border-bordure rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-encre-douce mb-1">
            <Inbox size={16} className="text-primaire" />
            <span className="text-xs font-medium">Total Sujets</span>
          </div>
          <p className="font-serif text-2xl font-bold text-encre">{stats.totalRequests}</p>
        </div>

        <div className="bg-surface border border-bordure rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-encre-douce mb-1">
            <Clock size={16} className="text-lumiere" />
            <span className="text-xs font-medium">À valider</span>
          </div>
          <p className="font-serif text-2xl font-bold text-lumiere">{stats.pendingCount}</p>
        </div>

        <div className="bg-surface border border-bordure rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-encre-douce mb-1">
            <Lock size={16} className="text-encre-douce" />
            <span className="text-xs font-medium">Sujets Privés</span>
          </div>
          <p className="font-serif text-2xl font-bold text-encre">{stats.privateRequests}</p>
        </div>

        <div className="bg-surface border border-bordure rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-encre-douce mb-1">
            <Heart size={16} className="text-danger" />
            <span className="text-xs font-medium">Prières</span>
          </div>
          <p className="font-serif text-2xl font-bold text-encre">{stats.totalPrayers}</p>
        </div>

        <div className="bg-surface border border-bordure rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-encre-douce mb-1">
            <Sparkles size={16} className="text-paix" />
            <span className="text-xs font-medium">Exaucés</span>
          </div>
          <p className="font-serif text-2xl font-bold text-paix">{stats.answeredRequests}</p>
        </div>
      </div>

      {/* Sujets en attente de modération */}
      <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-lumiere" />
            <h2 className="font-serif font-bold text-base text-encre">
              Sujets retenus ou en attente de modération ({pendingRequests.total})
            </h2>
          </div>
          <Link
            href="/admin/sujets?status=PENDING"
            className="text-xs font-semibold text-primaire hover:underline"
          >
            Voir tous →
          </Link>
        </div>

        {pendingRequests.items.length === 0 ? (
          <div className="py-8 text-center text-xs text-encre-douce bg-fond rounded-xl">
            Aucun sujet en attente de validation. Tout est à jour ! 🙏
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.items.map(req => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-bordure bg-fond flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-encre">
                      {req.firstName} {req.lastName}
                    </span>
                    <span className="text-[11px] text-encre-subtile">
                      {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    {req.visibility === 'PRIVATE' && (
                      <span className="text-[10px] font-bold text-white bg-encre-douce px-1.5 py-0.5 rounded">
                        Privé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-encre-douce line-clamp-2">{req.content}</p>
                </div>

                <Link
                  href={`/admin/sujets/${req.id}`}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primaire text-white text-xs font-semibold hover:bg-primaire-hover self-start sm:self-center"
                >
                  <span>Examiner</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
