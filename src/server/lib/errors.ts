export const GENERIC_TECHNICAL_ERROR =
  'Une erreur technique est survenue. Veuillez réessayer dans quelques instants.';

/**
 * Liste des messages d'erreurs métier et d'autorisation explicites autorisés à être renvoyés au client.
 */
export const ALLOWED_BUSINESS_ERRORS = new Set([
  'Authentification requise',
  'Compte administrateur introuvable ou supprimé',
  'Ce compte administrateur est suspendu ou en attente d’activation',
  'Permissions insuffisantes pour effectuer cette action',
  'Un administrateur avec cette adresse e-mail existe déjà',
  'Administrateur introuvable',
  'Impossible de modifier le dernier Super-Administrateur actif du système.',
  'Cette adresse e-mail ne correspond à aucun compte administrateur autorisé.',
  'Ce compte administrateur est suspendu. Veuillez contacter un super-administrateur.',
  'Adresse e-mail invalide',
  'Données invalides',
  'Action invalide',
  'Signalement invalide',
  'Sujet de prière introuvable ou indisponible',
  'Sujet introuvable ou jeton de gestion invalide',
  'Action non reconnue',
  'Sujet introuvable',
  'Non autorisé',
]);

/**
 * Détermine si une erreur peut être renvoyée telle quelle ou doit être remplacée par le message générique.
 * Protège strictement contre les fuites de détails internes (Prisma, PostgreSQL, Supabase, etc.).
 */
export function getSafeErrorMessage(error: unknown, fallbackMessage = GENERIC_TECHNICAL_ERROR): string {
  if (!error) return fallbackMessage;

  const msg = typeof error === 'string' ? error : (error as any)?.message;
  if (!msg || typeof msg !== 'string') return fallbackMessage;

  const lower = msg.toLowerCase();

  // Détection des fuites techniques (Prisma, PostgreSQL, Supabase, syntaxe SQL, timeouts, etc.)
  if (
    lower.includes('prisma') ||
    lower.includes('invocation') ||
    lower.includes('postgres') ||
    lower.includes('tenant') ||
    lower.includes('supabase') ||
    lower.includes('postgrest') ||
    lower.includes('connection') ||
    lower.includes('timed out') ||
    lower.includes('econnrefused') ||
    lower.includes('unique constraint') ||
    lower.includes('foreign key') ||
    (error as any)?.name?.startsWith('Prisma') ||
    (error as any)?.code?.startsWith('P')
  ) {
    return GENERIC_TECHNICAL_ERROR;
  }

  // Si c'est un message métier ou d'autorisation reconnu
  if (ALLOWED_BUSINESS_ERRORS.has(msg)) {
    return msg;
  }

  // Préfixes connus pour rate-limit ou validations Turnstile
  if (
    msg.startsWith('Limite ') ||
    msg.startsWith('Trop de ') ||
    msg.includes('anti-robot') ||
    msg.includes('Turnstile')
  ) {
    return msg;
  }

  // Par défaut, toute erreur technique ou non identifiée est masquée
  return GENERIC_TECHNICAL_ERROR;
}
