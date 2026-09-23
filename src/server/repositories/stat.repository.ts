import { prisma } from '../db';

export class StatRepository {
  /**
   * Statistiques globales instantanées
   */
  static async getSummary() {
    const [
      totalRequests,
      publicRequests,
      privateRequests,
      answeredRequests,
      totalPrayers,
      pendingCount,
      approvedPublicTotal,
      approvedPublicSupported,
    ] = await Promise.all([
      prisma.prayerRequest.count({ where: { deletedAt: null } }),
      prisma.prayerRequest.count({ where: { visibility: 'PUBLIC', deletedAt: null } }),
      prisma.prayerRequest.count({ where: { visibility: 'PRIVATE', deletedAt: null } }),
      prisma.prayerRequest.count({ where: { isAnswered: true, deletedAt: null } }),
      prisma.prayerAction.count(),
      prisma.prayerRequest.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.prayerRequest.count({
        where: { visibility: 'PUBLIC', status: 'APPROVED', deletedAt: null },
      }),
      prisma.prayerRequest.count({
        where: {
          visibility: 'PUBLIC',
          status: 'APPROVED',
          deletedAt: null,
          prayerCount: { gt: 0 },
        },
      }),
    ]);

    const supportRate =
      approvedPublicTotal > 0
        ? Math.round((approvedPublicSupported / approvedPublicTotal) * 100)
        : 100;

    return {
      totalRequests,
      publicRequests,
      privateRequests,
      answeredRequests,
      totalPrayers,
      pendingCount,
      approvedPublicTotal,
      approvedPublicSupported,
      supportRate,
    };
  }

  /**
   * Agrégats journaliers (DailyStat) pour graphiques et exports
   */
  static async getDailyStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.dailyStat.findMany({
      where: {
        day: { gte: since },
      },
      orderBy: { day: 'asc' },
    });
  }

  /**
   * Statistiques consolidées par période (hebdomadaire, mensuelle, annuelle)
   * avec calcul d'évolution (KPI) et données calibrées pour Recharts.
   */
  static async getPeriodStats(period: 'week' | 'month' | 'year' = 'month', offset = 0) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    const curDay = parseInt(parts.find(p => p.type === 'day')?.value ?? '1', 10);
    const curMonth = parseInt(parts.find(p => p.type === 'month')?.value ?? '1', 10) - 1; // 0-indexed
    const curYear = parseInt(parts.find(p => p.type === 'year')?.value ?? '2026', 10);

    let startDate: Date;
    let endDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;
    let periodLabel: string;

    if (period === 'week') {
      // Semaine : du Lundi au Dimanche
      const refDate = new Date(Date.UTC(curYear, curMonth, curDay));
      const dayOfWeek = (refDate.getUTCDay() + 6) % 7; // 0 = Lundi, 6 = Dimanche
      const mondayOffset = -dayOfWeek + offset * 7;

      startDate = new Date(Date.UTC(curYear, curMonth, curDay + mondayOffset, 0, 0, 0));
      endDate = new Date(Date.UTC(curYear, curMonth, curDay + mondayOffset + 6, 23, 59, 59, 999));

      prevStartDate = new Date(Date.UTC(curYear, curMonth, curDay + mondayOffset - 7, 0, 0, 0));
      prevEndDate = new Date(Date.UTC(curYear, curMonth, curDay + mondayOffset - 1, 23, 59, 59, 999));

      const startLabel = startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const endLabel = endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      periodLabel = `Semaine du ${startLabel} au ${endLabel}`;
    } else if (period === 'year') {
      // Année : du 1er janvier au 31 décembre
      const targetYear = curYear + offset;
      startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

      prevStartDate = new Date(Date.UTC(targetYear - 1, 0, 1, 0, 0, 0));
      prevEndDate = new Date(Date.UTC(targetYear - 1, 11, 31, 23, 59, 59, 999));

      periodLabel = `Année ${targetYear}`;
    } else {
      // Mois (défaut) : du 1er au dernier jour du mois
      const targetMonthDate = new Date(Date.UTC(curYear, curMonth + offset, 1));
      const targetYear = targetMonthDate.getUTCFullYear();
      const targetMonth = targetMonthDate.getUTCMonth();

      startDate = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0));
      // Dernier jour du mois (jour 0 du mois suivant)
      endDate = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

      prevStartDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0));
      prevEndDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

      periodLabel = startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      periodLabel = periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);
    }

    // Récupération des DailyStat enregistrés
    const [periodRows, prevPeriodRows] = await Promise.all([
      prisma.dailyStat.findMany({
        where: {
          day: { gte: startDate, lte: endDate },
        },
        orderBy: { day: 'asc' },
      }),
      prisma.dailyStat.findMany({
        where: {
          day: { gte: prevStartDate, lte: prevEndDate },
        },
      }),
    ]);

    // Totaux période actuelle & précédente
    const totalRequests = periodRows.reduce((acc, r) => acc + r.requestsTotal, 0);
    const publicRequests = periodRows.reduce((acc, r) => acc + r.requestsPublic, 0);
    const privateRequests = periodRows.reduce((acc, r) => acc + r.requestsPrivate, 0);
    const totalPrayers = periodRows.reduce((acc, r) => acc + r.prayers, 0);
    const answeredRequests = periodRows.reduce((acc, r) => acc + r.requestsAnswered, 0);

    const prevTotalPrayers = prevPeriodRows.reduce((acc, r) => acc + r.prayers, 0);
    const prevTotalRequests = prevPeriodRows.reduce((acc, r) => acc + r.requestsTotal, 0);

    // Calcul de l'évolution en % (KPI arc de progression)
    let prayersGrowth = 0;
    if (prevTotalPrayers > 0) {
      prayersGrowth = Math.round(((totalPrayers - prevTotalPrayers) / prevTotalPrayers) * 100);
    } else if (totalPrayers > 0) {
      prayersGrowth = 100;
    }

    let requestsGrowth = 0;
    if (prevTotalRequests > 0) {
      requestsGrowth = Math.round(((totalRequests - prevTotalRequests) / prevTotalRequests) * 100);
    } else if (totalRequests > 0) {
      requestsGrowth = 100;
    }

    // Indexation des stats journalières par ISO date YYYY-MM-DD
    const statsMap = new Map<string, typeof periodRows[0]>();
    for (const r of periodRows) {
      const dStr = r.day.toISOString().slice(0, 10);
      statsMap.set(dStr, r);
    }

    // Génération des points continus pour Recharts
    const chartData: Array<{
      date: string;
      label: string;
      sujetsTotal: number;
      sujetsPublics: number;
      sujetsPrives: number;
      prieres: number;
      exaucements: number;
    }> = [];

    if (period === 'year') {
      // Pour l'année : regroupement par mois (12 points)
      const targetYear = startDate.getUTCFullYear();
      for (let m = 0; m < 12; m++) {
        const mStart = new Date(Date.UTC(targetYear, m, 1));
        const mEnd = new Date(Date.UTC(targetYear, m + 1, 0));
        const mLabel = mStart.toLocaleDateString('fr-FR', { month: 'short' });

        let mTotal = 0;
        let mPub = 0;
        let mPriv = 0;
        let mPrayers = 0;
        let mAns = 0;

        for (const [dStr, r] of statsMap.entries()) {
          const d = new Date(dStr);
          if (d >= mStart && d <= mEnd) {
            mTotal += r.requestsTotal;
            mPub += r.requestsPublic;
            mPriv += r.requestsPrivate;
            mPrayers += r.prayers;
            mAns += r.requestsAnswered;
          }
        }

        chartData.push({
          date: `${targetYear}-${String(m + 1).padStart(2, '0')}`,
          label: mLabel.charAt(0).toUpperCase() + mLabel.slice(1),
          sujetsTotal: mTotal,
          sujetsPublics: mPub,
          sujetsPrives: mPriv,
          prieres: mPrayers,
          exaucements: mAns,
        });
      }
    } else {
      // Pour semaine ou mois : 1 point par jour
      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        const dStr = cursor.toISOString().slice(0, 10);
        const row = statsMap.get(dStr);
        const dayLabel = cursor.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: period === 'week' ? 'short' : undefined,
        });

        chartData.push({
          date: dStr,
          label: dayLabel,
          sujetsTotal: row ? row.requestsTotal : 0,
          sujetsPublics: row ? row.requestsPublic : 0,
          sujetsPrives: row ? row.requestsPrivate : 0,
          prieres: row ? row.prayers : 0,
          exaucements: row ? row.requestsAnswered : 0,
        });

        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    return {
      period,
      offset,
      periodLabel,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      chartData,
      totals: {
        totalRequests,
        publicRequests,
        privateRequests,
        totalPrayers,
        answeredRequests,
      },
      kpi: {
        prayersGrowth,
        requestsGrowth,
        prevTotalPrayers,
        prevTotalRequests,
      },
      canGoNext: offset < 0,
    };
  }

  /**
   * Consolidation du jour pour le cron Vercel
   */
  static async consolidateDay(targetDate: Date) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [total, pub, priv, answered, prayers] = await Promise.all([
      prisma.prayerRequest.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.prayerRequest.count({
        where: { visibility: 'PUBLIC', createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.prayerRequest.count({
        where: { visibility: 'PRIVATE', createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.prayerRequest.count({
        where: { isAnswered: true, answeredAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.prayerAction.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
    ]);

    return prisma.dailyStat.upsert({
      where: { day: startOfDay },
      create: {
        day: startOfDay,
        requestsTotal: total,
        requestsPublic: pub,
        requestsPrivate: priv,
        requestsAnswered: answered,
        prayers,
      },
      update: {
        requestsTotal: total,
        requestsPublic: pub,
        requestsPrivate: priv,
        requestsAnswered: answered,
        prayers,
      },
    });
  }
}
