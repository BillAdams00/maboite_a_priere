import { prisma } from '../db';
import type { AdminRole, AdminStatus } from '@prisma/client';

export class AdminRepository {
  /**
   * Recherche un administrateur par son ID Supabase Auth.
   */
  static async findByAuthUserId(authUserId: string) {
    return prisma.admin.findUnique({
      where: { authUserId },
    });
  }

  /**
   * Recherche un administrateur par son adresse e-mail.
   */
  static async findByEmail(email: string) {
    return prisma.admin.findUnique({
      where: { email },
    });
  }

  /**
   * Liste tous les administrateurs non supprimés.
   */
  static async findAll() {
    return prisma.admin.findMany({
      where: { deletedAt: null },
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Crée un enregistrement d'administrateur.
   */
  static async create(data: {
    authUserId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
    status?: AdminStatus;
    invitedById?: string;
  }) {
    return prisma.admin.create({
      data: {
        ...data,
        status: data.status || 'ACTIVE',
      },
    });
  }

  /**
   * Met à jour un administrateur.
   */
  static async update(
    id: string,
    data: {
      role?: AdminRole;
      status?: AdminStatus;
      lastLoginAt?: Date;
      authUserId?: string;
    }
  ) {
    return prisma.admin.update({
      where: { id },
      data,
    });
  }

  /**
   * Nombre de super-administrateurs actifs (protection du dernier super-admin).
   */
  static async countActiveSuperAdmins(): Promise<number> {
    return prisma.admin.count({
      where: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  /**
   * Suppression douce d'un administrateur.
   */
  static async softDelete(id: string) {
    return prisma.admin.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'SUSPENDED' },
    });
  }
}
