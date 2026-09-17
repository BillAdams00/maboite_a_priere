import { z } from 'zod';

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;
const HTML_REGEX = /<[^>]*>/g;

export const cleanText = (str: string): string => {
  return str.replace(HTML_REGEX, '').trim().replace(/\s+/g, ' ');
};

export const CreatePrayerRequestSchema = z.object({
  firstName: z
    .string({ required_error: 'Le prénom est requis' })
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(40, 'Le prénom ne doit pas dépasser 40 caractères')
    .transform(cleanText),
  lastName: z
    .string({ required_error: 'Le nom est requis' })
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(40, 'Le nom ne doit pas dépasser 40 caractères')
    .transform(cleanText),
  content: z
    .string({ required_error: 'Le sujet de prière est requis' })
    .min(10, 'Votre sujet de prière doit contenir au moins 10 caractères')
    .max(1000, 'Votre sujet de prière ne doit pas dépasser 1000 caractères')
    .transform(cleanText)
    .refine(val => !URL_REGEX.test(val), {
      message: 'Les liens internet (URLs) ne sont pas autorisés dans le sujet de prière',
    }),
  visibility: z.enum(['PRIVATE', 'PUBLIC'], {
    required_error: 'Veuillez choisir la confidentialité de votre sujet',
  }),
  category: z.string().max(40).optional().nullable(),
  displayAsAnonymous: z.boolean().default(false),
  turnstileToken: z.string().optional().nullable(),
});

export type CreatePrayerRequestInput = z.infer<typeof CreatePrayerRequestSchema>;

export const PrayerRequestFeedQuerySchema = z.object({
  cursor: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['recent', 'needed']).optional().default('recent'),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

export type PrayerRequestFeedQuery = z.input<typeof PrayerRequestFeedQuerySchema>;
export type PrayerRequestFeedOutput = z.output<typeof PrayerRequestFeedQuerySchema>;

export const ManagePrayerRequestSchema = z.object({
  action: z.enum(['claimAnswered', 'private', 'delete'], {
    required_error: 'Une action valide est requise',
  }),
  note: z.string().max(500, 'Le témoignage ne peut pas dépasser 500 caractères').optional().nullable(),
});

export type ManagePrayerRequestInput = z.infer<typeof ManagePrayerRequestSchema>;
