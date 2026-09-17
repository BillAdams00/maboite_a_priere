import { AdminService } from '../../../server/services/admin.service';
import { PrayerRepository } from '../../../server/repositories/prayer.repository';
import Link from 'next/link';
import {
  Inbox,
  Filter,
  CheckCircle2,
  XCircle,
  Lock,
  Globe,
  AlertTriangle,
  ArrowRight,
  Eye,
} from 'lucide-react';
import type { RequestStatus, Visibility } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface AdminSujetsPageProps {
  searchParams: {
    status?: RequestStatus;
    visibility?: Visibility;
    page?: string;
  };
}

export default async function AdminSujetsPage({ searchParams }: AdminSujetsPageProps) {
  await AdminService.requireAdmin(['MODERATOR', 'ADMIN', 'SUPER_ADMIN']);

  const page = Number(searchParams.page) || 1;
  const status = searchParams.status;
  const visibility = searchParams.visibility;

  const result = await PrayerRepository.findAdminList({
    status,
    visibility,
    page,
    pageSize: 15,
  });

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-encre">
            Gestion & Modération des Sujets
          </h1>
          <p className="text-xs text-encre-douce mt-0.5">
            Surveillez, modérez et validez les requêtes et témoignages d'exaucement.
          </p>
        </div>

        {/* Filtres par statut */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface p-1.5 rounded-xl border border-bordure">
          <Link
            href="/admin/sujets"
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              !status && !visibility
                ? 'bg-primaire text-white font-bold'
                : 'text-encre-douce hover:text-encre'
            }`}
          >
            Tous
          </Link>
          <Link
            href="/admin/sujets?status=PENDING"
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              status === 'PENDING'
                ? 'bg-lumiere text-white font-bold'
                : 'text-encre-douce hover:text-encre'
            }`}
          >
            À valider
          </Link>
          <Link
            href="/admin/sujets?status=APPROVED"
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              status === 'APPROVED'
                ? 'bg-paix text-white font-bold'
                : 'text-encre-douce hover:text-encre'
            }`}
          >
            Approuvés
          </Link>
          <Link
            href="/admin/sujets?visibility=PRIVATE"
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              visibility === 'PRIVATE'
                ? 'bg-encre text-white font-bold'
                : 'text-encre-douce hover:text-encre'
            }`}
          >
            Privés
          </Link>
        </div>
      </div>

      {/* Tableau des sujets */}
      <div className="bg-surface border border-bordure rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-encre">
            <thead className="bg-fond border-b border-bordure text-[11px] font-bold text-encre-douce uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Auteur</th>
                <th className="p-3.5">Visibilité</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5">Prières</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure/60">
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-encre-douce">
                    Aucun sujet ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                result.items.map(req => (
                  <tr key={req.id} className="hover:bg-fond/50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-encre">
                        {req.firstName} {req.lastName}
                      </div>
                      <div className="text-[11px] text-encre-subtile truncate max-w-xs">
                        {req.category || 'Sans catégorie'}
                      </div>
                    </td>

                    <td className="p-3.5">
                      {req.visibility === 'PUBLIC' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primaire bg-primaire/10 px-2 py-0.5 rounded-full">
                          <Globe size={12} />
                          <span>Public</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-encre-douce bg-fond px-2 py-0.5 rounded-full border border-bordure">
                          <Lock size={12} />
                          <span>Privé (chiffré)</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'APPROVED'
                            ? 'bg-paix-subtle text-paix'
                            : req.status === 'PENDING'
                            ? 'bg-lumiere-subtle text-lumiere'
                            : req.status === 'REJECTED'
                            ? 'bg-danger-subtle text-danger'
                            : 'bg-fond text-encre-subtile'
                        }`}
                      >
                        {req.status}
                      </span>
                      {req.reportsCount && req.reportsCount > 0 ? (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-danger bg-danger-subtle px-1.5 py-0.5 rounded">
                          <AlertTriangle size={10} />
                          <span>{req.reportsCount} signalement(s)</span>
                        </span>
                      ) : null}
                    </td>

                    <td className="p-3.5 font-semibold text-encre">
                      {req.prayerCount}
                    </td>

                    <td className="p-3.5 text-[11px] text-encre-subtile">
                      {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </td>

                    <td className="p-3.5 text-right">
                      <Link
                        href={`/admin/sujets/${req.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primaire/10 text-primaire font-semibold text-xs hover:bg-primaire hover:text-white transition-colors"
                      >
                        <Eye size={13} />
                        <span>Détails</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {result.totalPages > 1 && (
          <div className="p-4 border-t border-bordure flex items-center justify-between text-xs text-encre-douce">
            <span>
              Page {result.page} sur {result.totalPages} ({result.total} sujets)
            </span>
            <div className="flex gap-1">
              {result.page > 1 && (
                <Link
                  href={`/admin/sujets?page=${result.page - 1}${status ? `&status=${status}` : ''}${visibility ? `&visibility=${visibility}` : ''}`}
                  className="px-3 py-1 rounded-lg bg-fond hover:bg-surface border border-bordure"
                >
                  Précédent
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={`/admin/sujets?page=${result.page + 1}${status ? `&status=${status}` : ''}${visibility ? `&visibility=${visibility}` : ''}`}
                  className="px-3 py-1 rounded-lg bg-fond hover:bg-surface border border-bordure"
                >
                  Suivant
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
