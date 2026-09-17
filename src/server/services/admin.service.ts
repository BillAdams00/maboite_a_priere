import { createClient as createServerSupabase } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';
import { AdminRepository } from '../repositories/admin.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { decryptText } from '../lib/crypto';
import { prisma } from '../db';
import type { AdminRole, RequestStatus } from '@prisma/client';

export class AdminService {
  /**
   * Vérification RBAC stricte :
   * 1. Session Supabase Auth valide
   * 2. Ligne correspondante dans la table Admin avec status ACTIVE
   */
  static async requireAdmin(allowedRoles: AdminRole[] = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN']) {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Authentification requise');
    }

    const admin = await AdminRepository.findByAuthUserId(user.id);
    if (!admin || admin.deletedAt !== null) {
      throw new Error('Compte administrateur introuvable ou supprimé');
    }

    if (admin.status !== 'ACTIVE') {
      throw new Error('Ce compte administrateur est suspendu ou en attente d’activation');
    }

    if (!allowedRoles.includes(admin.role)) {
      throw new Error('Permissions insuffisantes pour effectuer cette action');
    }

    return { user, admin };
  }

  /**
   * Modère un sujet de prière (Approuver, Rejeter, Archiver, Basculer en privé)
   */
  static async moderateRequest(
    requestId: string,
    decision: 'APPROVE' | 'REJECT' | 'ARCHIVE' | 'MAKE_PRIVATE',
    note?: string | null
  ) {
    const { admin } = await this.requireAdmin(['MODERATOR', 'ADMIN', 'SUPER_ADMIN']);

    let status: RequestStatus = 'APPROVED';
    let visibilityUpdate: { visibility?: 'PRIVATE'; content?: string; contentIv?: string | null } = {};

    if (decision === 'APPROVE') status = 'APPROVED';
    if (decision === 'REJECT') status = 'REJECTED';
    if (decision === 'ARCHIVE') status = 'ARCHIVED';

    if (decision === 'MAKE_PRIVATE') {
      const current = await prisma.prayerRequest.findUnique({ where: { id: requestId } });
      if (current && current.visibility === 'PUBLIC') {
        const { encryptText } = await import('../lib/crypto');
        const enc = encryptText(current.content);
        visibilityUpdate = {
          visibility: 'PRIVATE',
          content: enc.ciphertext,
          contentIv: enc.iv,
        };
      }
    }

    const updated = await prisma.prayerRequest.update({
      where: { id: requestId },
      data: {
        status,
        moderatedById: admin.id,
        moderatedAt: new Date(),
        moderationNote: note || undefined,
        ...visibilityUpdate,
      },
    });

    await AuditRepository.log({
      actorId: admin.id,
      actorEmail: admin.email,
      action: `MODERATE_${decision}`,
      entityType: 'PrayerRequest',
      entityId: requestId,
      metadata: { note, status, visibility: updated.visibility },
    });

    return updated;
  }

  /**
   * Confirme ou rejette un témoignage d'exaucement
   */
  static async resolveAnsweredClaim(requestId: string, confirm: boolean, note?: string | null) {
    const { admin } = await this.requireAdmin(['MODERATOR', 'ADMIN', 'SUPER_ADMIN']);

    if (confirm) {
      await prisma.$transaction([
        prisma.answeredClaim.update({
          where: { requestId },
          data: {
            confirmedById: admin.id,
            confirmedAt: new Date(),
          },
        }),
        prisma.prayerRequest.update({
          where: { id: requestId },
          data: {
            isAnswered: true,
            answeredAt: new Date(),
            answeredNote: note || undefined,
            answeredBy: admin.id,
          },
        }),
      ]);
    } else {
      await prisma.answeredClaim.update({
        where: { requestId },
        data: {
          rejectedAt: new Date(),
        },
      });
    }

    await AuditRepository.log({
      actorId: admin.id,
      actorEmail: admin.email,
      action: confirm ? 'CONFIRM_ANSWERED' : 'REJECT_ANSWERED',
      entityType: 'AnsweredClaim',
      entityId: requestId,
      metadata: { confirm, note },
    });

    return { success: true };
  }

  /**
   * Invite un nouvel administrateur via Supabase Auth Admin.
   * Seul un ADMIN ou SUPER_ADMIN peut inviter.
   */
  static async inviteAdmin(input: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MODERATOR';
  }) {
    const { admin: inviter } = await this.requireAdmin(['ADMIN', 'SUPER_ADMIN']);

    const existing = await AdminRepository.findByEmail(input.email);
    if (existing && existing.deletedAt === null) {
      throw new Error('Un administrateur avec cette adresse e-mail existe déjà');
    }

    const adminSupabase = createAdminClient();
    const { data: authData, error: authError } = await adminSupabase.auth.admin.inviteUserByEmail(
      input.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
      }
    );

    if (authError || !authData.user) {
      throw new Error(`Erreur Supabase Auth lors de l'invitation : ${authError?.message}`);
    }

    const createdAdmin = await AdminRepository.create({
      authUserId: authData.user.id,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      status: 'INVITED',
      invitedById: inviter.id,
    });

    await AuditRepository.log({
      actorId: inviter.id,
      actorEmail: inviter.email,
      action: 'INVITE_ADMIN',
      entityType: 'Admin',
      entityId: createdAdmin.id,
      metadata: { email: input.email, role: input.role },
    });

    return createdAdmin;
  }

  /**
   * Modifie le rôle ou suspend un compte (Réservé au SUPER_ADMIN avec garde-fou).
   */
  static async updateAdmin(
    targetAdminId: string,
    data: { role?: AdminRole; status?: 'ACTIVE' | 'SUSPENDED' }
  ) {
    const { admin: caller } = await this.requireAdmin(['SUPER_ADMIN']);

    const target = await prisma.admin.findUnique({ where: { id: targetAdminId } });
    if (!target) throw new Error('Administrateur introuvable');

    // Garde-fou : si la cible est SUPER_ADMIN et qu'on la rétrograde ou suspend,
    // vérifier qu'il reste au moins un autre SUPER_ADMIN actif.
    if (
      target.role === 'SUPER_ADMIN' &&
      (data.role !== 'SUPER_ADMIN' || data.status === 'SUSPENDED')
    ) {
      const superAdminCount = await AdminRepository.countActiveSuperAdmins();
      if (superAdminCount <= 1) {
        throw new Error('Impossible de modifier le dernier Super-Administrateur actif du système.');
      }
    }

    const updated = await AdminRepository.update(targetAdminId, data);

    await AuditRepository.log({
      actorId: caller.id,
      actorEmail: caller.email,
      action: 'UPDATE_ADMIN_ROLE_STATUS',
      entityType: 'Admin',
      entityId: targetAdminId,
      metadata: data,
    });

    return updated;
  }

  /**
   * Récupère le contenu en clair d'un sujet (déchiffre si privé).
   */
  static async getDecryptedPrayer(id: string) {
    const { admin } = await this.requireAdmin(['MODERATOR', 'ADMIN', 'SUPER_ADMIN']);

    const request = await prisma.prayerRequest.findUnique({
      where: { id },
      include: { answeredClaim: true, reports: true },
    });

    if (!request) return null;

    let content = request.content;
    if (request.visibility === 'PRIVATE' && request.contentIv) {
      try {
        content = decryptText(request.content, request.contentIv);
        await AuditRepository.log({
          actorId: admin.id,
          actorEmail: admin.email,
          action: 'VIEW_DECRYPTED_PRAYER',
          entityType: 'PrayerRequest',
          entityId: id,
          metadata: { visibility: 'PRIVATE' },
        });
      } catch (err) {
        console.error('Erreur déchiffrement sujet privé :', err);
        content = '[Erreur de déchiffrement]';
      }
    }

    return {
      ...request,
      content,
    };
  }
}
