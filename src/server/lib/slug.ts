import { nanoid } from 'nanoid';

export function generatePublicSlug(): string {
  // Génère un identifiant URL-safe court et convivial (10 caractères)
  return nanoid(10).toLowerCase();
}
