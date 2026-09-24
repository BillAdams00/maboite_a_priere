import { AdminService } from '../../../server/services/admin.service';
import { StatRepository } from '../../../server/repositories/stat.repository';
import { AdminStatsCharts } from '../../../components/admin/AdminStatsCharts';
import Link from 'next/link';
import { Download, TrendingUp, Heart, Sparkles, Inbox, Database, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AdminStatistiquesPageProps {
  searchParams?: {
    period?: 'week' | 'month' | 'year';
    offset?: string;
  };
}

export default async function AdminStatistiquesPage({ searchParams }: AdminStatistiquesPageProps) {
  await AdminService.requireAdmin(['ADMIN', 'SUPER_ADMIN']);

  const period =
    searchParams?.period && ['week', 'month', 'year'].includes(searchParams.period)
      ? searchParams.period
      : 'month';
  const offset = parseInt(searchParams?.offset ?? '0', 10) || 0;

  let summary: any = null;
  let dailyStats: any[] = [];
  let periodStats: any = null;
  let dbOffline = false;

  try {
    const [s, d, p] = await Promise.all([
      StatRepository.getSummary(),
      StatRepository.getDailyStats(30),
      StatRepository.getPeriodStats(period, offset),
    ]);
    summary = s;
    dailyStats = d;
    periodStats = p;
  } catch (err) {
    dbOffline = true;
  }

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-encre">
            Statistiques & Rapports d'Activité
          </h1>
          <p className="text-xs text-encre-douce mt-0.5">
            Suivi de l'intercession communautaire (Europe/Paris).
          </p>
        </div>

        {!dbOffline && (
          <a
            href="/api/admin/stats/export"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primaire text-white text-xs sm:text-sm font-bold shadow-sm hover:bg-primaire-hover transition-colors self-start sm:self-auto"
          >
            <Download size={16} />
            <span>Exporter en CSV</span>
          </a>
        )}
      </div>

      {dbOffline ? (
        /* État clairement affiché lorsque la base de données est indisponible : zéro donnée inventée */
        <div className="bg-surface border border-bordure rounded-3xl p-8 sm:p-14 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
            <Database size={26} />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-encre">
              Statistiques indisponibles — vérifiez la connexion à la base
            </h2>
            <p className="text-xs sm:text-sm text-encre-douce leading-relaxed">
              Impossible de charger les agrégats d'activité en temps réel. Veuillez vérifier la connexion
              à la base de données PostgreSQL (variable <code className="px-1.5 py-0.5 rounded bg-fond font-mono text-xs text-primaire">DATABASE_URL</code>).
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-encre-subtile">
            <AlertCircle size={14} className="text-lumiere" />
            <span>Aucune statistique fictive ou approximative n'est affichée.</span>
          </div>
        </div>
      ) : (
        <>
          {/* Résumé global instantané */}
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
              <p className="font-serif text-3xl font-bold text-paix">{summary.supportRate} %</p>
              <p className="text-[11px] text-encre-subtile mt-1">
                {summary.approvedPublicSupported} / {summary.approvedPublicTotal} sujets publics portés
              </p>
            </div>
          </div>

          {/* Graphiques interactifs Recharts & Arc de progression en dégradé */}
          {periodStats && <AdminStatsCharts stats={periodStats} />}

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
        </>
      )}
    </div>
  );
}

