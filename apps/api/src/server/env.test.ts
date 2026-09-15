import { describe, it, expect } from 'vitest';
import { envSchema, validateEnv } from './env.js';

describe('Environment validation', () => {
  it('valide un environnement complet et sécurisé', () => {
    const validEnv = {
      NODE_ENV: 'production',
      APP_SECRET: 'a-super-secret-key-that-is-at-least-32-chars-long!',
      PEPPER: 'pepper-secret-at-least-16-chars!',
      JWT_SECRET: 'jwt-super-secret-at-least-32-chars-long-here!',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    };

    const parsed = envSchema.safeParse(validEnv);
    expect(parsed.success).toBe(true);
  });

  it('refuse le démarrage si APP_SECRET est absent en production', () => {
    const invalidEnv = {
      NODE_ENV: 'production',
      PEPPER: 'pepper-secret-at-least-16-chars!',
      JWT_SECRET: 'jwt-super-secret-at-least-32-chars-long-here!',
    };

    expect(() => validateEnv(invalidEnv as any)).toThrow(/APP_SECRET/);
  });

  it('refuse le démarrage si PEPPER est trop court (< 16 caractères)', () => {
    const invalidEnv = {
      NODE_ENV: 'production',
      APP_SECRET: 'a-super-secret-key-that-is-at-least-32-chars-long!',
      PEPPER: 'short',
      JWT_SECRET: 'jwt-super-secret-at-least-32-chars-long-here!',
    };

    expect(() => validateEnv(invalidEnv as any)).toThrow(/PEPPER/);
  });

  it('refuse le démarrage si JWT_SECRET est trop court (< 32 caractères)', () => {
    const invalidEnv = {
      NODE_ENV: 'production',
      APP_SECRET: 'a-super-secret-key-that-is-at-least-32-chars-long!',
      PEPPER: 'pepper-secret-at-least-16-chars!',
      JWT_SECRET: 'short-jwt-secret',
    };

    expect(() => validateEnv(invalidEnv as any)).toThrow(/JWT_SECRET/);
  });
});
