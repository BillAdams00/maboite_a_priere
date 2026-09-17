import { NextResponse } from 'next/server';
import { verifyExpressToken, hashToken } from '@/server/lib/crypto';
import { prisma } from '@/server/db';
import { AuditRepository } from '@/server/repositories/audit.repository';

export const dynamic = 'force-dynamic';

/**
 * GET : Affiche la page de confirmation de retrait express (SANS muter l'état)
 * Protège contre les robots/scanners d'e-mails qui préchargent les URLs.
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const verification = verifyExpressToken(token);

  if (!verification.valid || !verification.requestId) {
    return new NextResponse(
      renderHtmlPage({
        title: 'Lien invalide ou expiré',
        body: '<p style="color: #C85250; font-weight: bold;">Ce lien de modération express n’est plus valide (délai de 48h dépassé ou jeton altéré).</p>',
      }),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Vérifier si le jeton a déjà été consommé (usage unique)
  const tokenHash = hashToken(token);
  let alreadyUsed = null;
  try {
    alreadyUsed = await prisma.usedExpressToken.findUnique({
      where: { tokenHash },
    });
  } catch (err) {
    // Si la table n'est pas encore créée en local
  }

  if (alreadyUsed) {
    return new NextResponse(
      renderHtmlPage({
        title: 'Lien déjà utilisé',
        body: `<p style="color: #55607A;">Ce lien de retrait express à usage unique a déjà été utilisé le ${new Date(
          alreadyUsed.usedAt
        ).toLocaleString('fr-FR')}. Le sujet a déjà été traité.</p>`,
      }),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Récupérer le sujet concerné pour afficher le récapitulatif
  let prayer = null;
  try {
    prayer = await prisma.prayerRequest.findUnique({
      where: { id: verification.requestId },
    });
  } catch (err) {}

  if (!prayer || prayer.deletedAt !== null) {
    return new NextResponse(
      renderHtmlPage({
        title: 'Sujet introuvable',
        body: '<p style="color: #55607A;">Ce sujet de prière n’existe plus ou a déjà été supprimé.</p>',
      }),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (prayer.status !== 'APPROVED') {
    return new NextResponse(
      renderHtmlPage({
        title: 'Sujet déjà retiré',
        body: `<p style="color: #55607A;">Ce sujet n’est plus en ligne (Statut actuel : <strong>${prayer.status}</strong>).</p>`,
      }),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const author = prayer.displayAsAnonymous
    ? 'Un frère · une sœur (Anonyme)'
    : `${prayer.firstName} ${prayer.lastName.charAt(0)}.`;

  const confirmationForm = `
    <div style="text-align: left; background: #FBF8F3; border: 1px solid #EAE3D8; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #55607A;"><strong>Auteur :</strong> ${author}</p>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #55607A;"><strong>Catégorie :</strong> ${prayer.category || 'Général'}</p>
      <p style="margin: 0; font-size: 14px; color: #1C2541; font-style: italic;">« ${escapeHtml(prayer.content.slice(0, 300))}${prayer.content.length > 300 ? '...' : ''} »</p>
    </div>

    <p style="font-size: 14px; color: #55607A; margin-bottom: 24px;">
      Confirmez-vous le <strong>retrait immédiat</strong> de ce sujet du flux public ? Il sera immédiatement placé en attente de modération.
    </p>

    <form method="POST" action="/express-moderation/${token}">
      <button type="submit" style="background-color: #C85250; color: #ffffff; padding: 12px 24px; border: none; border-radius: 10px; font-size: 14px; font-weight: bold; cursor: pointer;">
        Confirmer le retrait immédiat
      </button>
      <a href="/communaute" style="margin-left: 16px; font-size: 13px; color: #55607A; text-decoration: none;">
        Annuler
      </a>
    </form>
  `;

  return new NextResponse(
    renderHtmlPage({
      title: 'Confirmation de retrait express',
      body: confirmationForm,
    }),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

/**
 * POST : Effectue la mutation d'état et enregistre le jeton comme consommé (usage unique).
 */
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const verification = verifyExpressToken(token);

  if (!verification.valid || !verification.requestId) {
    return new NextResponse(
      renderHtmlPage({
        title: 'Lien invalide ou expiré',
        body: '<p style="color: #C85250;">Ce lien de modération express n’est plus valide.</p>',
      }),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const tokenHash = hashToken(token);

  // Vérification d'usage unique
  try {
    const alreadyUsed = await prisma.usedExpressToken.findUnique({
      where: { tokenHash },
    });
    if (alreadyUsed) {
      return new NextResponse(
        renderHtmlPage({
          title: 'Lien déjà utilisé',
          body: '<p style="color: #55607A;">Ce lien à usage unique a déjà été utilisé pour retirer le sujet.</p>',
        }),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
  } catch {}

  // Mutation atomique : marquage du jeton consommé + mise en attente du sujet
  try {
    await prisma.$transaction([
      prisma.usedExpressToken.create({
        data: {
          tokenHash,
          requestId: verification.requestId,
          action: verification.action || 'unpublish',
        },
      }),
      prisma.prayerRequest.update({
        where: { id: verification.requestId },
        data: {
          status: 'PENDING',
          moderationNote: 'Retiré via confirmation de retrait express (lien e-mail)',
          moderatedAt: new Date(),
        },
      }),
    ]);

    await AuditRepository.log({
      action: 'EXPRESS_ONE_CLICK_UNPUBLISH_CONFIRMED',
      entityType: 'PrayerRequest',
      entityId: verification.requestId,
      metadata: { via: 'email_alert_link_post' },
    });
  } catch (err: any) {
    console.error('Erreur lors du retrait express POST :', err);
    return new NextResponse(
      renderHtmlPage({
        title: 'Erreur lors du traitement',
        body: '<p style="color: #C85250;">Une erreur est survenue lors du retrait. Le sujet est peut-être déjà retiré.</p>',
      }),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  return new NextResponse(
    renderHtmlPage({
      title: 'Action effectuée avec succès 🙏',
      body: `
        <p style="font-size: 15px; color: #1C2541; line-height: 1.6;">
          Le sujet a été <strong>immédiatement retiré de la communauté</strong> et transféré en file de modération.
        </p>
        <p style="font-size: 13px; color: #55607A; margin-top: 12px;">
          Ce lien de retrait express à usage unique est désormais désactivé.
        </p>
        <div style="margin-top: 24px;">
          <a href="/admin/connexion" style="background-color: #2F4A78; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
            Accéder à l'espace Admin
          </a>
        </div>
      `,
    }),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderHtmlPage({ title, body }: { title: string; body: string }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · Ma boîte à prière</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FBF8F3; color: #1C2541; margin: 0; padding: 32px 16px; display: flex; justify-content: center;">
  <div style="max-width: 520px; width: 100%; background: #FFFFFF; border: 1px solid #EAE3D8; border-radius: 20px; padding: 32px 24px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="display: inline-block; width: 44px; height: 44px; border-radius: 50%; background: #EBF0F8; color: #2F4A78; line-height: 44px; font-size: 22px; margin-bottom: 12px;">
      🛡️
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #1C2541; margin: 0 0 12px 0;">${escapeHtml(
      title
    )}</h2>
    ${body}
  </div>
</body>
</html>`;
}
