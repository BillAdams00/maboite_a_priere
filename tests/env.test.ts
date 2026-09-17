import { describe, it, expect } from 'vitest';
import { envSchema, validateEnv } from '../src/server/env';

describe('Environment validation', () => {
  it('valide un environnement complet et sécurisé', () => {
    const validEnv = {
      NODE_ENV: 'production',
      APP_SECRET: 'a-super-secret-key-that-is-at-least-32-chars-long!',
      PEPPER: 'pepper-secret-at-least-16-chars!',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      DIRECT_URL: 'postgresql://user:pass@localhost:5432/db',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };

    const parsed = envSchema.safeParse(validEnv);
    expect(parsed.success).toBe(true);
  });

  it('refuse le démarrage si APP_SECRET est trop court (< 32 caractères)', () => {
    const invalidEnv = {
      NODE_ENV: 'production',
      APP_SECRET: 'short-secret',
      PEPPER: 'pepper-secret-at-least-16-chars!',
    };

    expect(() => validateEnv(invalidEnv as any)).toThrow(/APP_SECRET/);
  });

  it('refuse le démarrage si PEPPER est trop court (< 16 caractères)', () => {
    const invalidEnv = {
      NODE_ENV: 'production',
      APP_SECRET: 'a-super-secret-key-that-is-at-least-32-chars-long!',
      PEPPER: 'short',
    };

    expect(() => validateEnv(invalidEnv as any)).toThrow(/PEPPER/);
  });
});
