import { z } from 'zod';

export const CreateReportSchema = z.object({
  reason: z
    .string({ required_error: 'Le motif de signalement est requis' })
    .min(3, 'Le motif doit contenir au moins 3 caractères')
    .max(500, 'Le motif ne doit pas dépasser 500 caractères'),
  visitorId: z.string().max(64).optional().nullable(),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
