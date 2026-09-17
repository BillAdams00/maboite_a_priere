import { Resend } from 'resend';
import { env } from '../env';
import { signExpressToken } from '../lib/crypto';

let resendClient: Resend | null = null;
if (env.RESEND_API_KEY) {
  resendClient = new Resend(env.RESEND_API_KEY);
}

export class EmailService {
  /**
   * Alerte l'équipe pastorale / modérateurs lors d'un nouveau sujet public.
   * Inclut un lien de retrait express en 1 clic (jeton HMAC signé).
   */
  static async sendNewPublicPrayerAlert(params: {
    requestId: string;
    publicSlug: string;
    authorName: string;
    category?: string | null;
    content: string;
    status: 'APPROVED' | 'PENDING';
  }) {
    const expressToken = signExpressToken(params.requestId, 'unpublish', 48);
    const expressUnpublishUrl = `${env.NEXT_PUBLIC_SITE_URL}/express-moderation/${expressToken}`;
    const publicUrl = `${env.NEXT_PUBLIC_SITE_URL}/communaute/${params.publicSlug}`;

    const subject =
      params.status === 'PENDING'
        ? `⚠️ [Modération requise] Nouveau sujet suspect à valider`
        : `🙏 Nouveau sujet public déposé par ${params.authorName}`;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1C2541;">
        <h2 style="color: #2F4A78;">${subject}</h2>
        <p><strong>Auteur :</strong> ${params.authorName}</p>
        <p><strong>Catégorie :</strong> ${params.category || 'Général'}</p>
        <p><strong>Statut :</strong> ${params.status === 'PENDING' ? 'En attente de validation (mots-clés ou coordonnées détectés)' : 'Publié immédiatement'}</p>
        <div style="background-color: #FBF8F3; border: 1px solid #EAE3D8; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="white-space: pre-wrap; font-size: 15px; margin: 0;">${params.content}</p>
        </div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EAE3D8;">
          <a href="${publicUrl}" style="background-color: #2F4A78; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 12px;">
            Voir sur le site
          </a>
          <a href="${expressUnpublishUrl}" style="background-color: #C85250; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Retirer en 1 clic
          </a>
        </div>
        <p style="font-size: 12px; color: #8C96AB; margin-top: 24px;">
          Le lien de retrait express permet de suspendre immédiatement ce sujet sans avoir à vous connecter.
        </p>
      </div>
    `;

    if (!resendClient) {
      console.log(`[DEV/TEST EMAIL] To: ${env.ADMIN_ALERT_EMAIL} | Subject: ${subject}`);
      return { id: 'mock-email-id', success: true };
    }

    try {
      const response = await resendClient.emails.send({
        from: env.NOTIFICATION_EMAIL_FROM,
        to: [env.ADMIN_ALERT_EMAIL],
        subject,
        html: htmlContent,
      });
      return { success: true, id: response.data?.id };
    } catch (error) {
      console.error('Erreur lors de l’envoi de l’alerte e-mail Resend :', error);
      return { success: false, error };
    }
  }

  /**
   * Alerte lors d'un signalement de contenu.
   */
  static async sendReportAlert(params: {
    requestId: string;
    publicSlug: string;
    reason: string;
    totalReports: number;
  }) {
    const expressToken = signExpressToken(params.requestId, 'unpublish', 48);
    const expressUnpublishUrl = `${env.NEXT_PUBLIC_SITE_URL}/express-moderation/${expressToken}`;

    const subject = `🚨 Signalement de contenu (${params.totalReports} signalement(s))`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1C2541;">
        <h2 style="color: #C85250;">${subject}</h2>
        <p>Un utilisateur a signalé un sujet sur Ma boîte à prière.</p>
        <p><strong>Motif invoqué :</strong></p>
        <blockquote style="background-color: #FDF2F2; border-left: 4px solid #C85250; margin: 12px 0; padding: 12px;">
          ${params.reason}
        </blockquote>
        <div style="margin-top: 24px;">
          <a href="${expressUnpublishUrl}" style="background-color: #C85250; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Retirer le sujet immédiatement (1 clic)
          </a>
        </div>
      </div>
    `;

    if (!resendClient) {
      console.log(`[DEV/TEST EMAIL] Signalement | To: ${env.ADMIN_ALERT_EMAIL}`);
      return { id: 'mock-report-email', success: true };
    }

    try {
      const response = await resendClient.emails.send({
        from: env.NOTIFICATION_EMAIL_FROM,
        to: [env.ADMIN_ALERT_EMAIL],
        subject,
        html: htmlContent,
      });
      return { success: true, id: response.data?.id };
    } catch (error) {
      console.error('Erreur envoi email signalement :', error);
      return { success: false, error };
    }
  }
}
