'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar, Minus } from 'lucide-react';

interface ChartPoint {
  date: string;
  label: string;
  sujetsTotal: number;
  sujetsPublics: number;
  sujetsPrives: number;
  prieres: number;
  exaucements: number;
}

interface PeriodStatsData {
  period: 'week' | 'month' | 'year';
  offset: number;
  periodLabel: string;
  startDate: string;
  endDate: string;
  chartData: ChartPoint[];
  totals: {
    totalRequests: number;
    publicRequests: number;
    privateRequests: number;
    totalPrayers: number;
    answeredRequests: number;
  };
  kpi: {
    prayersGrowth: number;
    requestsGrowth: number;
    prevTotalPrayers: number;
    prevTotalRequests: number;
  };
  canGoNext: boolean;
}

interface AdminStatsChartsProps {
  stats: PeriodStatsData;
}

export function AdminStatsCharts({ stats }: AdminStatsChartsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'year') => {
    router.push(`/admin/statistiques?period=${newPeriod}&offset=0`);
  };

  const handleOffsetChange = (delta: number) => {
    const newOffset = stats.offset + delta;
    if (newOffset > 0) return; // Pas dans le futur
    router.push(`/admin/statistiques?period=${stats.period}&offset=${newOffset}`);
  };

  const handleResetCurrent = () => {
    router.push(`/admin/statistiques?period=${stats.period}&offset=0`);
  };

  // Calcul pour l'arc de progression circulaire SVG (jauge 180° ou 240°)
  // Borne le taux d'évolution visuel entre 0% et 100% de remplissage de l'arc
  const growthValue = stats.kpi.prayersGrowth;
  const isPositive = growthValue > 0;
  const isNeutral = growthValue === 0;

  // Arc de jauge : circonférence d'un cercle r=54 -> 2 * PI * 54 = ~339.29
  // On utilise un arc semi-circulaire (180 degrés)
  const radius = 52;
  const arcLength = Math.PI * radius; // 163.36
  const normalizedProgress = Math.min(100, Math.max(0, 50 + growthValue / 2));
  const strokeDashoffset = arcLength - (arcLength * normalizedProgress) / 100;

  return (
    <div className="space-y-6">
      {/* Barre de contrôle : sélecteur de période & navigation temporelle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-bordure rounded-2xl p-4 shadow-xs">
        {/* Onglets Période : Hebdo / Mensuel / Annuel */}
        <div className="inline-flex items-center rounded-xl bg-fond p-1 border border-bordure/60 self-start md:self-auto">
          <button
            onClick={() => handlePeriodChange('week')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              stats.period === 'week'
                ? 'bg-surface text-primaire shadow-xs font-bold'
                : 'text-encre-douce hover:text-encre'
            }`}
          >
            Hebdomadaire
          </button>
          <button
            onClick={() => handlePeriodChange('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              stats.period === 'month'
                ? 'bg-surface text-primaire shadow-xs font-bold'
                : 'text-encre-douce hover:text-encre'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => handlePeriodChange('year')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              stats.period === 'year'
                ? 'bg-surface text-primaire shadow-xs font-bold'
                : 'text-encre-douce hover:text-encre'
            }`}
          >
            Annuel
          </button>
        </div>

        {/* Navigation Précédent / Actuel / Suivant */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => handleOffsetChange(-1)}
            className="p-2 rounded-xl border border-bordure bg-surface hover:bg-fond text-encre transition-colors shadow-xs active:scale-95"
            title="Période précédente"
            aria-label="Période précédente"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-bordure bg-fond/60 text-xs font-bold text-encre min-w-[190px] justify-center">
            <Calendar size={14} className="text-primaire" />
            <span>{stats.periodLabel}</span>
          </div>

          <button
            onClick={() => handleOffsetChange(1)}
            disabled={!stats.canGoNext}
            className={`p-2 rounded-xl border border-bordure transition-colors shadow-xs ${
              stats.canGoNext
                ? 'bg-surface hover:bg-fond text-encre active:scale-95'
                : 'bg-fond/40 text-encre-subtile/40 border-bordure/40 cursor-not-allowed'
            }`}
            title="Période suivante"
            aria-label="Période suivante"
          >
            <ChevronRight size={16} />
          </button>

          {stats.offset !== 0 && (
            <button
              onClick={handleResetCurrent}
              className="ml-1 text-[11px] font-semibold text-primaire hover:underline px-2 py-1"
            >
              Aujourd'hui
            </button>
          )}
        </div>
      </div>

      {/* Grille principale : Courbe/Aire empilée + Arc de progression KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique principal : Courbe / Aire empilée (2 colonnes sur grand écran) */}
        <div className="lg:col-span-2 bg-surface border border-bordure rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif font-bold text-base text-encre">
                Activité communautaire — {stats.periodLabel}
              </h2>
              <p className="text-xs text-encre-douce">
                Évolution combinée des sujets déposés (publics/privés) et des prières élevées.
              </p>
            </div>

            {/* Badges récapitulatifs de la période */}
            <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-primaire bg-primaire/10 px-2 py-0.5 rounded-lg">
                {stats.totals.totalRequests} sujets
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-paix bg-paix/15 px-2 py-0.5 rounded-lg">
                {stats.totals.totalPrayers} prières
              </span>
            </div>
          </div>

          {/* Conteneur Recharts avec gradient defs sans bleu froid */}
          <div className="w-full h-72 sm:h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Dégradé ambre pour sujets publics (--lumiere) */}
                  <linearGradient id="colorPublics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8A33D" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#E8A33D" stopOpacity={0.05} />
                  </linearGradient>

                  {/* Dégradé bleu nuit pour sujets privés (--primaire) */}
                  <linearGradient id="colorPrives" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2F4A78" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#2F4A78" stopOpacity={0.05} />
                  </linearGradient>

                  {/* Dégradé vert sauge pour prières reçues (--paix) */}
                  <linearGradient id="colorPrieres" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6FA287" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#6FA287" stopOpacity={0.08} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#EAE3D8" vertical={false} />

                <XAxis
                  dataKey="label"
                  stroke="#55607A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#EAE3D8' }}
                />
                <YAxis
                  stroke="#55607A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface border border-bordure rounded-xl p-3 shadow-md text-xs space-y-1.5 min-w-[150px]">
                          <p className="font-bold text-encre border-b border-bordure/60 pb-1">
                            {label}
                          </p>
                          {payload.map((item: any) => (
                            <div key={item.name} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-encre-douce">{item.name} :</span>
                              </div>
                              <span className="font-bold text-encre font-mono">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  height={32}
                  iconType="circle"
                  iconSize={8}
                  formatter={value => (
                    <span className="text-xs text-encre-douce font-medium mr-2">{value}</span>
                  )}
                />

                {/* Aire empilée : Sujets Privés (base) */}
                <Area
                  type="monotone"
                  dataKey="sujetsPrives"
                  name="Sujets Privés"
                  stackId="sujets"
                  stroke="#2F4A78"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrives)"
                />

                {/* Aire empilée : Sujets Publics (au-dessus des privés) */}
                <Area
                  type="monotone"
                  dataKey="sujetsPublics"
                  name="Sujets Publics"
                  stackId="sujets"
                  stroke="#E8A33D"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPublics)"
                />

                {/* Courbe libre indépendante : Prières (axe d'intercession communautaire) */}
                <Area
                  type="monotone"
                  dataKey="prieres"
                  name="Prières Reçues"
                  stroke="#6FA287"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPrieres)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Arc de progression en dégradé ambre→sauge pour KPI mis en avant */}
        <div className="bg-surface border border-bordure rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-encre">
                Dynamique d'Intercession
              </h3>
              <span className="text-[11px] text-encre-subtile font-medium">
                vs période préc.
              </span>
            </div>
            <p className="text-xs text-encre-douce mt-0.5">
              Progression du soutien fraternel élevé pour la communauté.
            </p>
          </div>

          {/* Jauge / Arc de cercle en SVG avec dégradé ambre -> sauge (--lumiere vers --paix) */}
          <div className="relative flex flex-col items-center justify-center my-2">
            <svg
              className="w-48 h-28 overflow-visible"
              viewBox="0 0 120 68"
              aria-label={`Évolution des prières : ${growthValue > 0 ? '+' : ''}${growthValue}%`}
            >
              <defs>
                {/* Dégradé ambre vers sauge — strictement chaleureux, sans bleu/violet froid */}
                <linearGradient id="arcProgressionGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E8A33D" />
                  <stop offset="100%" stopColor="#6FA287" />
                </linearGradient>
              </defs>

              {/* Arc de fond (gris clair / bordure douce) */}
              <path
                d="M 8 60 A 52 52 0 0 1 112 60"
                fill="none"
                stroke="#EAE3D8"
                strokeWidth="10"
                strokeLinecap="round"
              />

              {/* Arc actif avec dégradé ambre → sauge */}
              <path
                d="M 8 60 A 52 52 0 0 1 112 60"
                fill="none"
                stroke="url(#arcProgressionGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
              />
            </svg>

            {/* Valeur du KPI au centre de l'arc */}
            <div className="text-center -mt-8 space-y-0.5">
              <div className="inline-flex items-center gap-1 font-serif text-2xl sm:text-3xl font-extrabold text-encre">
                {isPositive ? (
                  <TrendingUp size={20} className="text-paix inline" />
                ) : isNeutral ? (
                  <Minus size={20} className="text-encre-douce inline" />
                ) : (
                  <TrendingDown size={20} className="text-lumiere inline" />
                )}
                <span>
                  {growthValue > 0 ? `+${growthValue}` : growthValue} %
                </span>
              </div>
              <p className="text-[11px] font-semibold text-encre-douce">
                {stats.period === 'week'
                  ? 'cette semaine'
                  : stats.period === 'year'
                  ? 'cette année'
                  : 'ce mois-ci'}
              </p>
            </div>
          </div>

          {/* Détails du KPI en bas */}
          <div className="bg-fond/60 border border-bordure/60 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-encre-douce">
              <span>Prières période actuelle :</span>
              <span className="font-bold text-encre font-mono">{stats.totals.totalPrayers}</span>
            </div>
            <div className="flex items-center justify-between text-encre-douce">
              <span>Période précédente :</span>
              <span className="font-medium text-encre font-mono">{stats.kpi.prevTotalPrayers}</span>
            </div>
            <div className="pt-1 border-t border-bordure/60 flex items-center justify-between text-encre-douce">
              <span>Nouveaux sujets :</span>
              <span className="font-bold text-encre font-mono">
                {stats.totals.totalRequests}{' '}
                <span className="text-[10px] text-encre-subtile font-normal">
                  ({stats.kpi.requestsGrowth > 0 ? `+${stats.kpi.requestsGrowth}%` : `${stats.kpi.requestsGrowth}%`})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
