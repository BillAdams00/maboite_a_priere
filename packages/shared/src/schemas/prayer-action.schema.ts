import { z } from 'zod';

export const PrayerActionSchema = z.object({
  visitorId: z.string().min(1).max(64, 'Identifiant visiteur invalide'),
});

export type PrayerActionInput = z.infer<typeof PrayerActionSchema>;
