import { z } from 'zod';

export const AdminLoginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide').toLowerCase().trim(),
});

export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export const AdminInvitationSchema = z.object({
  email: z.string().email('Adresse e-mail invalide').toLowerCase().trim(),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50),
  role: z.enum(['ADMIN', 'MODERATOR'], {
    required_error: 'Veuillez choisir un rôle pour cet administrateur',
  }),
});

export type AdminInvitationInput = z.infer<typeof AdminInvitationSchema>;

export const ModeratePrayerRequestSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'ARCHIVE', 'MAKE_PRIVATE']),
  note: z.string().max(500).optional().nullable(),
});

export type ModeratePrayerRequestInput = z.infer<typeof ModeratePrayerRequestSchema>;

export const ResolveAnsweredClaimSchema = z.object({
  confirm: z.boolean(),
  note: z.string().max(500).optional().nullable(),
});

export type ResolveAnsweredClaimInput = z.infer<typeof ResolveAnsweredClaimSchema>;
