import { env } from '../env';

/**
 * Valide un jeton Cloudflare Turnstile côté serveur.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  clientIp?: string | null
): Promise<{ success: boolean; error?: string }> {
  // En environnement de développement ou de test : si TURNSTILE_SECRET_KEY n'est pas configurée, on autorise pour les tests locaux
  if (!env.TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Configuration Turnstile manquante en production' };
    }
    return { success: true };
  }

  if (!token || typeof token !== 'string') {
    return { success: false, error: 'Veuillez valider le contrôle de sécurité anti-robot' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      return { success: false, error: 'Échec de communication avec le service anti-robot' };
    }

    const outcome = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    if (!outcome.success) {
      return { success: false, error: 'Validation anti-robot invalide ou expirée' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erreur validation Turnstile :', err);
    return { success: false, error: 'Erreur lors de la validation anti-robot' };
  }
}
