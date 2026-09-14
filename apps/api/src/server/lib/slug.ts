import { customAlphabet } from 'nanoid';

// Alphabet sans caractères ambigus (pas de 0, O, 1, l, I)
const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 10);

export function generatePublicSlug(): string {
  return nanoid();
}
