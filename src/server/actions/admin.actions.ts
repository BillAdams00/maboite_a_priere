'use server';

import { AdminService } from '../services/admin.service';
import { revalidatePath } from 'next/cache';
import { prisma } from '../db';
import { AuditRepository } from '../repositories/audit.repository';
import type { AdminRole } from '@prisma/client';

export async function moderatePrayerAction(
  requestId: string,
  decision: 'APPROVE' | 'REJECT' | 'ARCHIVE' | 'MAKE_PRIVATE',
  note?: string | null
) {
  try {
    const updated = await AdminService.moderateRequest(requestId, decision, note);
    revalidatePath('/admin/sujets');
    revalidatePath(`/admin/sujets/${requestId}`);
    revalidatePath('/communaute');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur lors de la modération' };
  }
}

export async function resolveAnsweredClaimAction(
  requestId: string,
  confirm: boolean,
  note?: string | null
) {
  try {
    const result = await AdminService.resolveAnsweredClaim(requestId, confirm, note);
    revalidatePath('/admin/sujets');
    revalidatePath('/exauces');
    revalidatePath('/communaute');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur lors de la résolution de l’exaucement' };
  }
}

export async function inviteAdminAction(input: {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MODERATOR';
}) {
  try {
    const created = await AdminService.inviteAdmin(input);
    revalidatePath('/admin/administrateurs');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur lors de l’invitation' };
  }
}

export async function updateAdminAction(
  targetAdminId: string,
  data: { role?: AdminRole; status?: 'ACTIVE' | 'SUSPENDED' }
) {
  try {
    const updated = await AdminService.updateAdmin(targetAdminId, data);
    revalidatePath('/admin/administrateurs');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur de mise à jour administrateur' };
  }
}

export async function updateSettingAction(key: string, value: any) {
  try {
    const { admin } = await AdminService.requireAdmin(['SUPER_ADMIN']);
    const updated = await prisma.setting.upsert({
      where: { key },
      create: { key, value, updatedBy: admin.id },
      update: { value, updatedBy: admin.id },
    });

    await AuditRepository.log({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'UPDATE_SETTING',
      entityType: 'Setting',
      entityId: key,
      metadata: { key, value },
    });

    revalidatePath('/admin/parametres');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur de modification du paramètre' };
  }
}
