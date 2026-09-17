import { prisma } from '../db';

export class AuditRepository {
  static async log(data: {
    actorId?: string | null;
    actorEmail?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: any;
    ipHash?: string | null;
  }) {
    return prisma.auditLog.create({
      data,
    });
  }

  static async findRecent(limit = 50) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
