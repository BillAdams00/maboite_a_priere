import { z } from 'zod';

export const CreateReportSchema = z.object({
  requestId: z.string().min(1, 'Identifiant du sujet requis'),
  reason: z
    .string({ required_error: 'Le motif du signalement est requis' })
    .min(5, 'Veuillez préciser le motif (au moins 5 caractères)')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères'),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
