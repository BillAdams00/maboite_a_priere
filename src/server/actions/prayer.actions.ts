'use server';

import { cookies, headers } from 'next/headers';
import { PrayerService } from '../services/prayer.service';
import {
  CreatePrayerRequestSchema,
  ManagePrayerRequestSchema,
  type CreatePrayerRequestInput,
  type ManagePrayerRequestInput,
} from '../../lib/validation/prayer-request.schema';
import { CreateReportSchema } from '../../lib/validation/report.schema';
import { nanoid } from 'nanoid';
import { verifyTurnstileToken } from '../lib/turnstile';
import { checkRateLimit } from '../lib/rate-limit';
import { hashIp } from '../lib/crypto';

const VISITOR_COOKIE_NAME = 'mbap_visitor_id';

/**
 * Obtient ou génère l'identifiant anonyme du visiteur (visitorId) dans un cookie httpOnly.
 */
function getOrCreateVisitorId(): string {
  const cookieStore = cookies();
  const existing = cookieStore.get(VISITOR_COOKIE_NAME);
  if (existing?.value) {
    return existing.value;
  }

  const newVisitorId = nanoid(32);
  cookieStore.set(VISITOR_COOKIE_NAME, newVisitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60, // 1 an
    path: '/',
  });
  return newVisitorId;
}

/**
 * Action : Déposer un sujet de prière
 */
export async function submitPrayerAction(rawInput: unknown, turnstileToken?: string) {
  const validated = CreatePrayerRequestSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || 'Données invalides',
    };
  }

  const headerStore = headers();
  const clientIp =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerStore.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = headerStore.get('user-agent');
  const hashedIp = hashIp(clientIp) || clientIp;

  // 1. Rate-limit : 5 dépôts / heure / IP hachée
  const rateLimitResult = await checkRateLimit('prayerSubmission', hashedIp);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'Limite de dépôts atteinte (5 sujets par heure maximum). Veuillez réessayer plus tard.',
    };
  }

  // 2. Protection Cloudflare Turnstile anti-robot avant écriture
  const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp);
  if (!turnstileResult.success) {
    return {
      success: false,
      error: turnstileResult.error || 'Échec de la validation anti-robot',
    };
  }

  try {
    const result = await PrayerService.submitPrayerRequest(validated.data, clientIp, userAgent);
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Erreur submitPrayerAction :', error);
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors du dépôt du sujet',
    };
  }
}

/**
 * Action : « Je prie pour toi »
 */
export async function prayAction(publicSlug: string) {
  const visitorId = getOrCreateVisitorId();
  const headerStore = headers();
  const clientIp =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerStore.get('x-real-ip') ||
    '127.0.0.1';
  const hashedIp = hashIp(clientIp) || clientIp;

  // Rate-limit : 30 prières / heure / IP
  const rateLimitResult = await checkRateLimit('prayAction', hashedIp);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'Limite atteinte (30 prières par heure maximum). Merci de votre fidélité et à très bientôt.',
    };
  }

  try {
    const result = await PrayerService.prayForRequest(publicSlug, visitorId, clientIp);
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Impossible d’enregistrer votre prière',
    };
  }
}

/**
 * Action : Gérer son sujet (/mon-sujet/[token])
 */
export async function managePrayerAction(rawManageToken: string, rawInput: unknown) {
  const validated = ManagePrayerRequestSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || 'Action invalide',
    };
  }

  try {
    const result = await PrayerService.manageRequest(rawManageToken, validated.data);
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la gestion du sujet',
    };
  }
}

/**
 * Action : Signaler un sujet
 */
export async function reportPrayerAction(rawInput: unknown) {
  const validated = CreateReportSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || 'Signalement invalide',
    };
  }

  const visitorId = getOrCreateVisitorId();

  try {
    const result = await PrayerService.reportRequest(
      validated.data.requestId,
      validated.data.reason,
      visitorId
    );
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur lors de l’envoi du signalement',
    };
  }
}
