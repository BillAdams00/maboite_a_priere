import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL est requise' })
    .default('postgresql://postgres:postgres@localhost:5432/maboiteapriere?schema=public'),
  APP_SECRET: z
    .string({
      required_error: 'APP_SECRET est requise pour le chiffrement AES-256 des sujets privés',
    })
    .min(32, 'APP_SECRET doit comporter au moins 32 caractères'),
  PEPPER: z
    .string({
      required_error: 'PEPPER est requise pour le hachage sécurisé des adresses IP et tokens',
    })
    .min(16, 'PEPPER doit comporter au moins 16 caractères'),
  JWT_SECRET: z
    .string({
      required_error: 'JWT_SECRET est requise pour la signature des jetons administrateurs',
    })
    .min(32, 'JWT_SECRET doit comporter au moins 32 caractères'),
  RESEND_API_KEY: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(environment: Record<string, string | undefined> = process.env): Env {
  // En environnement de test automatisé, on garantit des valeurs par défaut pour les suites de tests
  if (environment.NODE_ENV === 'test') {
    environment.APP_SECRET =
      environment.APP_SECRET || 'test-app-secret-at-least-32-chars-ok-123456';
    environment.PEPPER =
      environment.PEPPER || 'test-pepper-salt-key-16-chars!';
    environment.JWT_SECRET =
      environment.JWT_SECRET || 'test-jwt-secret-at-least-32-chars-ok-123456';
  }

  const result = envSchema.safeParse(environment);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map(err => `  - [${err.path.join('.')}]: ${err.message}`)
      .join('\n');
    console.error(`\n❌ ERREUR CRITIQUE DE CONFIGURATION ENVIRONNEMENT :\n${errorDetails}\n`);
    throw new Error(`Variables d'environnement manquantes ou invalides :\n${errorDetails}`);
  }
  return result.data;
}

export const env = validateEnv();
