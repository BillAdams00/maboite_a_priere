import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
    DATABASE_URL: z
      .string({ required_error: 'DATABASE_URL est requise' })
      .default('postgresql://postgres:postgres@localhost:5432/maboiteapriere?schema=public'),
    DIRECT_URL: z.string().optional(),
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
    NEXT_PUBLIC_SUPABASE_URL: z.string().default('https://placeholder-project.supabase.co'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    NOTIFICATION_EMAIL_FROM: z.string().default('Ma boîte à prière <alertes@maboiteapriere.fr>'),
    ADMIN_ALERT_EMAIL: z.string().default('pastorale@maboiteapriere.fr'),
    CRON_SECRET: z.string().optional(),
    NEXT_PUBLIC_SITE_URL: z.string().default('http://localhost:3000'),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
    TURNSTILE_SECRET_KEY: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    INITIAL_SUPER_ADMIN_EMAIL: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Détection d'un build local Next.js (où Next.js force NODE_ENV=production lors de next build
    // mais où la machine locale ne possède pas encore les clés cloud Vercel de production)
    const isNextLocalBuild =
      typeof process !== 'undefined' &&
      process.env.NEXT_PHASE === 'phase-production-build' &&
      !process.env.VERCEL_ENV &&
      !process.env.VERCEL;

    const isProduction =
      (data.NODE_ENV === 'production' && !isNextLocalBuild) ||
      data.VERCEL_ENV === 'production';

    if (isProduction) {
      // 1. CRON_SECRET obligatoire (≥ 32 caractères)
      if (!data.CRON_SECRET || data.CRON_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'CRON_SECRET est obligatoire en production et doit comporter au moins 32 caractères',
          path: ['CRON_SECRET'],
        });
      }

      // 2. NEXT_PUBLIC_SITE_URL obligatoire, protocole https et interdiction de localhost
      if (!data.NEXT_PUBLIC_SITE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NEXT_PUBLIC_SITE_URL est obligatoire en production',
          path: ['NEXT_PUBLIC_SITE_URL'],
        });
      } else {
        try {
          const url = new URL(data.NEXT_PUBLIC_SITE_URL);
          if (url.protocol !== 'https:') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'NEXT_PUBLIC_SITE_URL doit impérativement utiliser le protocole https:// en production',
              path: ['NEXT_PUBLIC_SITE_URL'],
            });
          }
          if (url.hostname.includes('localhost') || url.hostname === '127.0.0.1') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'NEXT_PUBLIC_SITE_URL ne peut pas cibler localhost en production',
              path: ['NEXT_PUBLIC_SITE_URL'],
            });
          }
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'NEXT_PUBLIC_SITE_URL doit être une URL valide',
            path: ['NEXT_PUBLIC_SITE_URL'],
          });
        }
      }

      // 3. RESEND_API_KEY obligatoire
      if (!data.RESEND_API_KEY || data.RESEND_API_KEY.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'RESEND_API_KEY est obligatoire en production pour les alertes pastorales',
          path: ['RESEND_API_KEY'],
        });
      }

      // 4. SUPABASE_SERVICE_ROLE_KEY obligatoire
      if (!data.SUPABASE_SERVICE_ROLE_KEY || data.SUPABASE_SERVICE_ROLE_KEY.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SUPABASE_SERVICE_ROLE_KEY est obligatoire en production',
          path: ['SUPABASE_SERVICE_ROLE_KEY'],
        });
      }

      // 5. TURNSTILE_SECRET_KEY obligatoire
      if (!data.TURNSTILE_SECRET_KEY || data.TURNSTILE_SECRET_KEY.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'TURNSTILE_SECRET_KEY est obligatoire en production pour la protection anti-spam',
          path: ['TURNSTILE_SECRET_KEY'],
        });
      }

      // 6. UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN obligatoires
      if (!data.UPSTASH_REDIS_REST_URL || data.UPSTASH_REDIS_REST_URL.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'UPSTASH_REDIS_REST_URL est obligatoire en production pour le rate limiting distribué',
          path: ['UPSTASH_REDIS_REST_URL'],
        });
      }
      if (!data.UPSTASH_REDIS_REST_TOKEN || data.UPSTASH_REDIS_REST_TOKEN.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'UPSTASH_REDIS_REST_TOKEN est obligatoire en production',
          path: ['UPSTASH_REDIS_REST_TOKEN'],
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(environment: Record<string, string | undefined> = process.env): Env {
  // En environnement de test automatisé, on garantit des valeurs par défaut pour les suites de tests
  if (environment.NODE_ENV === 'test') {
    environment.APP_SECRET =
      environment.APP_SECRET || 'test-app-secret-at-least-32-chars-ok-123456';
    environment.PEPPER =
      environment.PEPPER || 'test-pepper-salt-key-16-chars!';
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
