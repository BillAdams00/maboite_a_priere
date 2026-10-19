import { describe, it, expect } from 'vitest';
import { envSchema, validateEnv } from '../src/server/env';

describe('Environment validation', () => {
  const validProdEnv = {
    NODE_ENV: 'production',
    APP_SECRET: 'a-super-secret-key-that-is-at-least-32-chars-long!',
    PEPPER: 'pepper-secret-at-least-16-chars!',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    DIRECT_URL: 'postgresql://user:pass@localhost:5432/db',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    RESEND_API_KEY: 're_test_123456789',
    CRON_SECRET: 'cron-secret-that-is-at-least-32-chars-long!!',
    NEXT_PUBLIC_SITE_URL: 'https://maboiteapriere.fr',
    TURNSTILE_SECRET_KEY: '0x4AAAAAAtest-secret-key',
    UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token',
  };

  it('valide un environnement de production complet et sécurisé', () => {
    const parsed = envSchema.safeParse(validProdEnv);
    expect(parsed.success).toBe(true);
  });

  it('refuse le démarrage si APP_SECRET est trop court (< 32 caractères)', () => {
    const invalidEnv = {
      ...validProdEnv,
      APP_SECRET: 'short-secret',
    };

    expect(() => validateEnv(invalidEnv as any)).toThrow(/APP_SECRET/);
  });

  it('refuse le démarrage si PEPPER est trop court (< 16 caractères)', () => {
    const invalidEnv = {
      ...validProdEnv,
      PEPPER: 'short',
    };

    expect(() => validateEnv(invalidEnv as any)).toThrow(/PEPPER/);
  });

  it('refuse le démarrage en production sans CRON_SECRET valide (≥32 car.)', () => {
    const shortCronEnv = {
      ...validProdEnv,
      CRON_SECRET: 'short-cron-secret',
    };
    expect(() => validateEnv(shortCronEnv as any)).toThrow(/CRON_SECRET/);

    const missingCronEnv = {
      ...validProdEnv,
      CRON_SECRET: undefined,
    };
    expect(() => validateEnv(missingCronEnv as any)).toThrow(/CRON_SECRET/);
  });

  it('refuse le démarrage en production si NEXT_PUBLIC_SITE_URL cible localhost ou n\'est pas https', () => {
    const localhostEnv = {
      ...validProdEnv,
      NEXT_PUBLIC_SITE_URL: 'https://localhost:3000',
    };
    expect(() => validateEnv(localhostEnv as any)).toThrow(/localhost/);

    const httpEnv = {
      ...validProdEnv,
      NEXT_PUBLIC_SITE_URL: 'http://maboiteapriere.fr',
    };
    expect(() => validateEnv(httpEnv as any)).toThrow(/https/);
  });
});
