import { PrayerRepository } from '../repositories/prayer.repository.js';
import { encryptText, generateSecureToken, hashIp } from '../lib/crypto.js';
import { generatePublicSlug } from '../lib/slug.js';
import type { CreatePrayerRequestInput, ManagePrayerRequestInput } from '@maboiteapriere/shared';
import { prisma } from '../db.js';

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

    let contentToStore = input.content;
    let contentIv: string | null = null;
    let status: 'APPROVED' | 'PENDING' = 'APPROVED';

    if (input.visibility === 'PRIVATE') {
      // Chiffrement applicatif AES-256-GCM
      const encrypted = encryptText(input.content);
      contentToStore = encrypted.ciphertext;
      contentIv = encrypted.iv;
      status = 'APPROVED'; // Accessible directement aux admins
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
      manageToken,
      firstName: input.firstName,
      lastName: input.lastName,
      displayAsAnonymous: input.displayAsAnonymous,
      content: contentToStore,
      contentIv,
      category: input.category,
      visibility: input.visibility,
      status,
      ownerPushToken: input.pushToken,
      ipHash,
      userAgent,
    });

    return {
      id: created.id,
      publicSlug: created.publicSlug,
      manageToken: created.manageToken,
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
   * Gestion d'un sujet par le déposant depuis « Mes sujets » (§5.3, §5.6)
   */
  static async manageRequest(
    id: string,
    manageToken: string,
    input: ManagePrayerRequestInput
  ) {
    const request = await PrayerRepository.findByManageToken(id, manageToken);
    if (!request) {
      throw new Error('Sujet introuvable ou jeton de gestion invalide');
    }

    if (input.action === 'delete') {
      // Soft delete
      await prisma.prayerRequest.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return { success: true, message: 'Le sujet a été supprimé avec succès' };
    }

    if (input.action === 'private') {
      // Basculer en privé
      const encrypted = encryptText(request.content);
      await prisma.prayerRequest.update({
        where: { id },
        data: {
          visibility: 'PRIVATE',
          content: encrypted.ciphertext,
          contentIv: encrypted.iv,
        },
      });
      return { success: true, message: 'Le sujet est désormais privé' };
    }

    if (input.action === 'claimAnswered') {
      // Crée un signalement d'exaucement (AnsweredClaim) à confirmer par un admin
      await prisma.answeredClaim.upsert({
        where: { requestId: id },
        create: {
          requestId: id,
          note: input.note,
        },
        update: {
          note: input.note,
        },
      });
      return {
        success: true,
        message: 'Votre témoignage a été transmis aux administrateurs pour confirmation 🙌',
      };
    }

    throw new Error('Action non reconnue');
  }
}
