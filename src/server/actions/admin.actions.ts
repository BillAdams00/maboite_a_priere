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

export async function sendAdminMagicLinkAction(input: {
  email: string;
  turnstileToken?: string;
}) {
  const { headers } = await import('next/headers');
  const { createClient: createServerSupabase } = await import('../supabase/server');
  const { env } = await import('../env');
  const { checkRateLimit } = await import('../lib/rate-limit');
  const { verifyTurnstileToken } = await import('../lib/turnstile');
  const { hashIp } = await import('../lib/crypto');

  const email = (input.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Adresse e-mail invalide' };
  }

  const headerStore = headers();
  const clientIp =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerStore.get('x-real-ip') ||
    '127.0.0.1';
  const hashedIp = hashIp(clientIp) || clientIp;

  // 1. Rate limiting : 5 demandes de lien magique par heure par IP
  const rateLimitResult = await checkRateLimit('adminMagicLink', hashedIp);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'Trop de tentatives de connexion (5 demandes maximum par heure). Veuillez patienter.',
    };
  }

  // 2. Vérification Turnstile anti-robot
  const turnstileResult = await verifyTurnstileToken(input.turnstileToken, clientIp);
  if (!turnstileResult.success) {
    return {
      success: false,
      error: turnstileResult.error || 'Échec de la validation anti-robot',
    };
  }

  // 3. Vérification que l'adresse appartient à un administrateur actif
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin || admin.deletedAt !== null) {
    return {
      success: false,
      error: 'Cette adresse e-mail ne correspond à aucun compte administrateur autorisé.',
    };
  }

  if (admin.status === 'SUSPENDED') {
    return {
      success: false,
      error: 'Ce compte administrateur est suspendu. Veuillez contacter un super-administrateur.',
    };
  }

  // 4. Envoi du lien magique via Supabase Auth
  try {
    const supabase = createServerSupabase();
    const siteUrl = env.NEXT_PUBLIC_SITE_URL;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error('Erreur Supabase signInWithOtp :', error);
      return {
        success: false,
        error: error.message || 'Impossible d’envoyer le lien magique.',
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erreur envoi lien magique :', err);
    return {
      success: false,
      error: err.message || 'Erreur lors de l’envoi du lien magique',
    };
  }
}

