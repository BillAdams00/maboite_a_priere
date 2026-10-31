import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitPrayerAction } from '../src/server/actions/prayer.actions';
import { PrayerService } from '../src/server/services/prayer.service';
import * as rateLimitModule from '../src/server/lib/rate-limit';
import * as turnstileModule from '../src/server/lib/turnstile';

// Mock de next/headers pour l'environnement de test Vitest
vi.mock('next/headers', () => ({
  headers: () => ({
    get: (key: string) => {
      if (key === 'x-forwarded-for') return '127.0.0.1';
      if (key === 'user-agent') return 'Vitest/Test';
      return null;
    },
  }),
  cookies: () => ({
    get: () => null,
    set: () => {},
  }),
}));

// Mock par défaut du rate-limit
vi.mock('../src/server/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock par défaut de Turnstile
vi.mock('../src/server/lib/turnstile', () => ({
  verifyTurnstileToken: vi.fn().mockResolvedValue({ success: true }),
}));

describe('submitPrayerAction - Sécurité & Fuite d’erreurs internes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ne divulgue JAMAIS d’erreur Prisma/Postgres brute (ni prisma, ni invocation, ni postgres)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulation exacte de l'erreur Prisma observée en production
    const prismaRawError = new Error(
      "Invalid `prisma.prayerRequest.create()` invocation:\n\nError: tenant/user postgres.abcdefghijklm not found"
    );

    vi.spyOn(PrayerService, 'submitPrayerRequest').mockRejectedValueOnce(prismaRawError);

    const validInput = {
      firstName: 'Paul',
      lastName: 'Martin',
      content: 'Prière pour notre assemblée et pour la paix dans les cœurs.',
      visibility: 'PUBLIC',
      category: 'Général',
      displayAsAnonymous: false,
    };

    const response = await submitPrayerAction(validInput, 'dummy-turnstile-token');

    // 1. L'action doit retourner un statut d'échec
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();

    // 2. Vérification stricte : aucun détail interne ou chaîne sensible
    const errorText = response.error!.toLowerCase();
    expect(errorText).not.toContain('prisma');
    expect(errorText).not.toContain('invocation');
    expect(errorText).not.toContain('postgres');

    // 3. Doit renvoyer le message générique en français
    expect(response.error).toBe(
      'Une erreur technique est survenue. Veuillez réessayer dans quelques instants.'
    );

    consoleSpy.mockRestore();
  });

  it('affiche les erreurs de validation Zod telles quelles', async () => {
    const invalidInput = {
      firstName: 'P', // Moins de 2 caractères
      lastName: 'Martin',
      content: 'Trop court', // Moins de 10 caractères
      visibility: 'PUBLIC',
    };

    const response = await submitPrayerAction(invalidInput);

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    // Le message Zod doit être renvoyé (pas le message technique générique)
    expect(response.error).not.toBe(
      'Une erreur technique est survenue. Veuillez réessayer dans quelques instants.'
    );
  });

  it('affiche le message de rate-limit tel quel lorsqu’il est déclenché', async () => {
    vi.spyOn(rateLimitModule, 'checkRateLimit').mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 3600000,
    });

    const validInput = {
      firstName: 'Paul',
      lastName: 'Martin',
      content: 'Prière pour notre assemblée et pour la paix dans les cœurs.',
      visibility: 'PUBLIC',
      category: 'Général',
      displayAsAnonymous: false,
    };

    const response = await submitPrayerAction(validInput);

    expect(response.success).toBe(false);
    expect(response.error).toContain('Limite de dépôts atteinte');
  });

  it('affiche le message d’échec anti-robot Turnstile tel quel', async () => {
    vi.spyOn(turnstileModule, 'verifyTurnstileToken').mockResolvedValueOnce({
      success: false,
      error: 'Échec de la validation anti-robot',
    });

    const validInput = {
      firstName: 'Paul',
      lastName: 'Martin',
      content: 'Prière pour notre assemblée et pour la paix dans les cœurs.',
      visibility: 'PUBLIC',
      category: 'Général',
      displayAsAnonymous: false,
    };

    const response = await submitPrayerAction(validInput, 'invalid-token');

    expect(response.success).toBe(false);
    expect(response.error).toBe('Échec de la validation anti-robot');
  });
});

describe('getSafeErrorMessage - Assainissement des erreurs', () => {
  it('masque les erreurs contenant des termes techniques Prisma ou Postgres', async () => {
    const { getSafeErrorMessage, GENERIC_TECHNICAL_ERROR } = await import('../src/server/lib/errors');

    expect(getSafeErrorMessage(new Error('Invalid `prisma.prayerRequest.findMany()` invocation'))).toBe(
      GENERIC_TECHNICAL_ERROR
    );
    expect(getSafeErrorMessage(new Error('FATAL: tenant/user postgres.ref not found'))).toBe(
      GENERIC_TECHNICAL_ERROR
    );
    expect(getSafeErrorMessage(new Error('Supabase Auth connection timed out'))).toBe(
      GENERIC_TECHNICAL_ERROR
    );
  });

  it('préserve les messages métier et autorisations reconnus', async () => {
    const { getSafeErrorMessage } = await import('../src/server/lib/errors');

    expect(getSafeErrorMessage(new Error('Authentification requise'))).toBe('Authentification requise');
    expect(getSafeErrorMessage(new Error('Sujet introuvable ou jeton de gestion invalide'))).toBe(
      'Sujet introuvable ou jeton de gestion invalide'
    );
    expect(getSafeErrorMessage(new Error('Limite atteinte (30 prières par heure maximum). Merci de votre fidélité et à très bientôt.'))).toBe(
      'Limite atteinte (30 prières par heure maximum). Merci de votre fidélité et à très bientôt.'
    );
  });
});

