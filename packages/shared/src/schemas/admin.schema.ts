import { z } from 'zod';

export const AdminLoginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide').toLowerCase().trim(),
});

export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export const AdminExchangeSchema = z.object({
  magicLinkToken: z.string().min(1, 'Jeton magique manquant'),
  deviceLabel: z.string().max(100).optional().nullable(),
});

export type AdminExchangeInput = z.infer<typeof AdminExchangeSchema>;

export const AdminRefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Jeton de rafraîchissement manquant'),
});

export type AdminRefreshTokenInput = z.infer<typeof AdminRefreshTokenSchema>;

export const AdminInvitationSchema = z.object({
  email: z.string().email('Adresse e-mail invalide').toLowerCase().trim(),
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

export const RegisterAdminPushTokenSchema = z.object({
  expoPushToken: z.string().min(1).max(255),
  deviceLabel: z.string().max(100).optional().nullable(),
});

export type RegisterAdminPushTokenInput = z.infer<typeof RegisterAdminPushTokenSchema>;
