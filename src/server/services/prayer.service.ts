import { PrayerRepository } from '../repositories/prayer.repository';
import { encryptText, generateSecureToken, hashIp, hashToken } from '../lib/crypto';
import { generatePublicSlug } from '../lib/slug';
import { EmailService } from './email.service';
import type { CreatePrayerRequestInput, ManagePrayerRequestInput } from '../../lib/validation/prayer-request.schema';
import { prisma } from '../db';

const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const SPAM_KEYWORDS = ['crypto', 'viagra', 'casino', 'prêt d’argent', 'pret d argent', 'voyance', 'marabout'];

export class PrayerService {
  /**
   * Analyse le contenu pour détecter des éléments suspects (téléphone, email, spam keywords)
   */
  static isSuspiciousContent(text: string): boolean {
    const lower = text.toLowerCase();
    if (PHONE_REGEX.test(text)) return true;
    if (EMAIL_REGEX.test(text)) return true;
    return SPAM_KEYWORDS.some(kw => lower.includes(kw));
  }

  /**
   * Dépôt d'un sujet de prière conformément aux règles §5.1
   */
  static async submitPrayerRequest(
    input: CreatePrayerRequestInput,
    clientIp?: string | null,
    userAgent?: string | null
  ) {
    const ipHash = hashIp(clientIp);
    const publicSlug = generatePublicSlug();
    const manageToken = generateSecureToken(32);
    const manageTokenHash = hashToken(manageToken);

    let contentToStore = input.content;
    let contentIv: string | null = null;
    let status: 'APPROVED' | 'PENDING' = 'APPROVED';

    if (input.visibility === 'PRIVATE') {
      // Chiffrement applicatif AES-256-GCM
      const encrypted = encryptText(input.content);
      contentToStore = encrypted.ciphertext;
      contentIv = encrypted.iv;
      status = 'APPROVED'; // Accessible directement aux administrateurs
    } else {
      // Pour le public : surveillance a posteriori ou auto-retenue si suspect
      const isSuspicious = this.isSuspiciousContent(input.content);
      if (isSuspicious) {
        status = 'PENDING';
      } else {
        status = 'APPROVED';
      }
    }

    const created = await PrayerRepository.create({
      publicSlug,
      manageToken: manageTokenHash,
      firstName: input.firstName,
      lastName: input.lastName,
      displayAsAnonymous: input.displayAsAnonymous,
      content: contentToStore,
      contentIv,
      category: input.category,
      visibility: input.visibility,
      status,
      ipHash,
      userAgent,
    });

    // Si le sujet est public ou suspect, envoi d'une alerte email à l'équipe avec lien 1-clic
    if (input.visibility === 'PUBLIC') {
      const authorName = input.displayAsAnonymous ? 'Un frère · une sœur (Anonyme)' : `${input.firstName} ${input.lastName.charAt(0)}.`;
      // Exécution asynchrone non-bloquante
      EmailService.sendNewPublicPrayerAlert({
        requestId: created.id,
        publicSlug: created.publicSlug,
        authorName,
        category: input.category,
        content: input.content,
        status,
      }).catch(err => console.error('Erreur alerte nouveau sujet :', err));
    }

    // On retourne le manageToken EN CLAIR au déposant pour son lien de gestion privé
    return {
      id: created.id,
      publicSlug: created.publicSlug,
      manageToken, // token en clair pour /mon-sujet/[token]
      status: created.status,
    };
  }

  /**
   * Action « Je prie pour toi » (§5.2)
   */
  static async prayForRequest(slug: string, visitorId: string, clientIp?: string | null) {
    const ipHash = hashIp(clientIp);
    return PrayerRepository.recordPrayer(slug, visitorId, ipHash);
  }

  /**
   * Gestion d'un sujet par le déposant depuis son lien privé /mon-sujet/[token] (§5.3, §5.6)
   */
  static async manageRequest(
    rawManageToken: string,
    input: ManagePrayerRequestInput
  ) {
    const request = await PrayerRepository.findByRawManageToken(rawManageToken);
    if (!request) {
      throw new Error('Sujet introuvable ou jeton de gestion invalide');
    }

    if (input.action === 'delete') {
      await prisma.prayerRequest.update({
        where: { id: request.id },
        data: { deletedAt: new Date() },
      });
      return { success: true, message: 'Votre sujet a été supprimé avec succès.' };
    }

    if (input.action === 'private') {
      const encrypted = encryptText(request.content);
      await prisma.prayerRequest.update({
        where: { id: request.id },
        data: {
          visibility: 'PRIVATE',
          content: encrypted.ciphertext,
          contentIv: encrypted.iv,
        },
      });
      return { success: true, message: 'Votre sujet est désormais privé et confié à l’équipe pastorale.' };
    }

    if (input.action === 'claimAnswered') {
      await prisma.answeredClaim.upsert({
        where: { requestId: request.id },
        create: {
          requestId: request.id,
          note: input.note,
        },
        update: {
          note: input.note,
        },
      });
      return {
        success: true,
        message: 'Votre témoignage a été transmis avec joie à l’équipe pastorale 🙌',
      };
    }

    throw new Error('Action non reconnue');
  }

  /**
   * Signalement d'un sujet inapproprié.
   */
  static async reportRequest(requestId: string, reason: string, visitorId?: string) {
    const request = await prisma.prayerRequest.findUnique({
      where: { id: requestId },
      select: { id: true, publicSlug: true },
    });

    if (!request) {
      throw new Error('Sujet introuvable');
    }

    await prisma.report.create({
      data: {
        requestId,
        reason,
        visitorId,
      },
    });

    const reportCount = await prisma.report.count({
      where: { requestId },
    });

    // Dès 3 signalements, mise en attente automatique réversible
    if (reportCount >= 3) {
      await prisma.prayerRequest.update({
        where: { id: requestId },
        data: { status: 'PENDING' },
      });
    }

    // Alerte e-mail
    EmailService.sendReportAlert({
      requestId,
      publicSlug: request.publicSlug,
      reason,
      totalReports: reportCount,
    }).catch(err => console.error('Erreur alerte signalement :', err));

    return { success: true, message: 'Le signalement a bien été pris en compte.' };
  }
}
