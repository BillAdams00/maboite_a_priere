import { prisma } from '../db';

export class StatRepository {
  /**
   * Statistiques globales instantanées
   */
  static async getSummary() {
    const [totalRequests, publicRequests, privateRequests, answeredRequests, totalPrayers, pendingCount] =
      await Promise.all([
        prisma.prayerRequest.count({ where: { deletedAt: null } }),
        prisma.prayerRequest.count({ where: { visibility: 'PUBLIC', deletedAt: null } }),
        prisma.prayerRequest.count({ where: { visibility: 'PRIVATE', deletedAt: null } }),
        prisma.prayerRequest.count({ where: { isAnswered: true, deletedAt: null } }),
        prisma.prayerAction.count(),
        prisma.prayerRequest.count({ where: { status: 'PENDING', deletedAt: null } }),
      ]);

    return {
      totalRequests,
      publicRequests,
      privateRequests,
      answeredRequests,
      totalPrayers,
      pendingCount,
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
