import { AdminService } from '../../../server/services/admin.service';
import { StatRepository } from '../../../server/repositories/stat.repository';
import Link from 'next/link';
import { BarChart3, Download, Calendar, TrendingUp, Heart, Sparkles, Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminStatistiquesPage() {
  await AdminService.requireAdmin(['ADMIN', 'SUPER_ADMIN']);

  const summary = await StatRepository.getSummary();
  const dailyStats = await StatRepository.getDailyStats(30);

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-encre">
            Statistiques & Rapports d'Activité
          </h1>
          <p className="text-xs text-encre-douce mt-0.5">
            Suivi de l'intercession communautaire sur les 30 derniers jours (Europe/Paris).
          </p>
        </div>

        <a
          href="/api/admin/stats/export"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primaire text-white text-xs sm:text-sm font-bold shadow-sm hover:bg-primaire-hover transition-colors self-start sm:self-auto"
        >
          <Download size={16} />
          <span>Exporter en CSV</span>
        </a>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-encre-douce mb-1">
            <Inbox size={16} className="text-primaire" />
            <span className="text-xs font-semibold">Total Sujets</span>
          </div>
          <p className="font-serif text-3xl font-bold text-encre">{summary.totalRequests}</p>
          <p className="text-[11px] text-encre-subtile mt-1">
            {summary.publicRequests} publics · {summary.privateRequests} privés
          </p>
        </div>

        <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-encre-douce mb-1">
            <Heart size={16} className="text-danger" />
            <span className="text-xs font-semibold">Prières Reçues</span>
          </div>
          <p className="font-serif text-3xl font-bold text-danger">{summary.totalPrayers}</p>
          <p className="text-[11px] text-encre-subtile mt-1">
            Moyenne : {(summary.totalPrayers / (summary.totalRequests || 1)).toFixed(1)} / sujet
          </p>
        </div>

        <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-encre-douce mb-1">
            <Sparkles size={16} className="text-lumiere" />
            <span className="text-xs font-semibold">Exaucements</span>
          </div>
          <p className="font-serif text-3xl font-bold text-lumiere">{summary.answeredRequests}</p>
          <p className="text-[11px] text-encre-subtile mt-1">
            {((summary.answeredRequests / (summary.totalRequests || 1)) * 100).toFixed(0)} % du total
          </p>
        </div>

        <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-encre-douce mb-1">
            <TrendingUp size={16} className="text-paix" />
            <span className="text-xs font-semibold">Taux de Soutien</span>
          </div>
          <p className="font-serif text-3xl font-bold text-paix">100 %</p>
          <p className="text-[11px] text-encre-subtile mt-1">Chaque sujet est porté</p>
        </div>
      </div>

      {/* Tableau des consolidations journalières */}
      <div className="bg-surface border border-bordure rounded-2xl shadow-sm overflow-hidden space-y-3 p-5">
        <h2 className="font-serif font-bold text-base text-encre">Historique Journalier Consolidé</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-encre">
            <thead className="bg-fond border-b border-bordure text-[11px] font-bold text-encre-douce uppercase tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Nouveaux sujets</th>
                <th className="p-3">Publics</th>
                <th className="p-3">Privés</th>
                <th className="p-3">Prières élevées</th>
                <th className="p-3">Exaucements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure/60">
              {dailyStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-encre-douce">
                    Aucune consolidation journalière disponible pour l'instant. Le cron Vercel nocturne
                    agrègera les données automatiquement chaque nuit.
                  </td>
                </tr>
              ) : (
                dailyStats.map(row => (
                  <tr key={row.day.toISOString()} className="hover:bg-fond/50 transition-colors">
                    <td className="p-3 font-semibold text-encre">
                      {new Date(row.day).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-3">{row.requestsTotal}</td>
                    <td className="p-3">{row.requestsPublic}</td>
                    <td className="p-3">{row.requestsPrivate}</td>
                    <td className="p-3 font-bold text-danger">{row.prayers}</td>
                    <td className="p-3 font-bold text-lumiere">{row.requestsAnswered}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
