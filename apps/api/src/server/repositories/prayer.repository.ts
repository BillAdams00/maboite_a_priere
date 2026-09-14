import { prisma } from '../db.js';
import type { Prisma, Visibility, RequestStatus } from '@prisma/client';
import type { PublicPrayerRequestItem, PrayerRequestFeedQuery } from '@maboiteapriere/shared';

export interface CreatePrayerRequestData {
  publicSlug: string;
  manageToken: string;
  firstName: string;
  lastName: string;
  displayAsAnonymous: boolean;
  content: string;
  contentIv?: string | null;
  category?: string | null;
  visibility: Visibility;
  status: RequestStatus;
  ownerPushToken?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
}

export class PrayerRepository {
  /**
   * Sécurité par construction :
   * L'unique requête pour le flux public de la communauté.
   * Filtre STRICT : PUBLIC, APPROVED, deletedAt null, et si exaucé alors exaucé depuis < 5 jours.
   */
  static async findPublicFeed(
    query: PrayerRequestFeedQuery
  ): Promise<{ items: PublicPrayerRequestItem[]; nextCursor: string | null }> {
    const limit = query.limit || 20;
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const whereClause: Prisma.PrayerRequestWhereInput = {
      visibility: 'PUBLIC',
      status: 'APPROVED',
      deletedAt: null,
      OR: [
        { isAnswered: false },
        {
          isAnswered: true,
          answeredAt: {
            gte: fiveDaysAgo,
          },
        },
      ],
      ...(query.category ? { category: query.category } : {}),
    };

    const orderBy: Prisma.PrayerRequestOrderByWithRelationInput[] =
      query.sort === 'needed'
        ? [{ prayerCount: 'asc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

    const rawItems = await prisma.prayerRequest.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy,
      select: {
        id: true,
        publicSlug: true,
        firstName: true,
        displayAsAnonymous: true,
        content: true,
        category: true,
        prayerCount: true,
        isAnswered: true,
        answeredAt: true,
        answeredNote: true,
        createdAt: true,
        // ATTENTION : lastName, manageToken, ownerPushToken, contentIv, ipHash ne sont JAMAIS sélectionnés ici
      },
    });

    let nextCursor: string | null = null;
    let items = rawItems;

    if (rawItems.length > limit) {
      const nextItem = rawItems[limit];
      nextCursor = nextItem ? nextItem.id : null;
      items = rawItems.slice(0, limit);
    }

    const formatted: PublicPrayerRequestItem[] = items.map(item => ({
      id: item.id,
      publicSlug: item.publicSlug,
      displayName: item.displayAsAnonymous ? 'Un frère · une sœur' : item.firstName,
      displayAsAnonymous: item.displayAsAnonymous,
      content: item.content,
      category: item.category,
      prayerCount: item.prayerCount,
      isAnswered: item.isAnswered,
      answeredAt: item.answeredAt ? item.answeredAt.toISOString() : null,
      answeredNote: item.answeredNote,
      createdAt: item.createdAt.toISOString(),
    }));

    return {
      items: formatted,
      nextCursor,
    };
  }

  /**
   * Récupère un sujet public individuel par son slug public.
   */
  static async findPublicBySlug(slug: string): Promise<PublicPrayerRequestItem | null> {
    const item = await prisma.prayerRequest.findUnique({
      where: { publicSlug: slug },
      select: {
        id: true,
        publicSlug: true,
        firstName: true,
        displayAsAnonymous: true,
        content: true,
        category: true,
        prayerCount: true,
        isAnswered: true,
        answeredAt: true,
        answeredNote: true,
        createdAt: true,
        visibility: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!item || item.deletedAt !== null || item.visibility !== 'PUBLIC' || item.status !== 'APPROVED') {
      return null;
    }

    return {
      id: item.id,
      publicSlug: item.publicSlug,
      displayName: item.displayAsAnonymous ? 'Un frère · une sœur' : item.firstName,
      displayAsAnonymous: item.displayAsAnonymous,
      content: item.content,
      category: item.category,
      prayerCount: item.prayerCount,
      isAnswered: item.isAnswered,
      answeredAt: item.answeredAt ? item.answeredAt.toISOString() : null,
      answeredNote: item.answeredNote,
      createdAt: item.createdAt.toISOString(),
    };
  }

  /**
   * Création d'un nouveau sujet de prière.
   */
  static async create(data: CreatePrayerRequestData) {
    return prisma.prayerRequest.create({
      data,
      select: {
        id: true,
        publicSlug: true,
        manageToken: true,
        visibility: true,
        status: true,
      },
    });
  }

  /**
   * Action « Je prie pour toi » : idempotente par (requestId, visitorId)
   */
  static async recordPrayer(
    publicSlug: string,
    visitorId: string,
    ipHash?: string | null
  ): Promise<{ prayerCount: number; alreadyPrayed: boolean; ownerPushToken?: string | null }> {
    const request = await prisma.prayerRequest.findUnique({
      where: { publicSlug },
      select: { id: true, prayerCount: true, ownerPushToken: true, visibility: true, status: true },
    });

    if (!request || request.visibility !== 'PUBLIC' || request.status !== 'APPROVED') {
      throw new Error('Sujet de prière introuvable ou indisponible');
    }

    // Vérifier si ce visiteur a déjà prié
    const existing = await prisma.prayerAction.findUnique({
      where: {
        requestId_visitorId: {
          requestId: request.id,
          visitorId,
        },
      },
    });

    if (existing) {
      return {
        prayerCount: request.prayerCount,
        alreadyPrayed: true,
        ownerPushToken: request.ownerPushToken,
      };
    }

    // Insertion atomique dans PrayerAction et incrément de prayerCount
    const updated = await prisma.$transaction(async tx => {
      await tx.prayerAction.create({
        data: {
          requestId: request.id,
          visitorId,
          ipHash,
        },
      });

      return tx.prayerRequest.update({
        where: { id: request.id },
        data: {
          prayerCount: { increment: 1 },
        },
        select: { prayerCount: true },
      });
    });

    return {
      prayerCount: updated.prayerCount,
      alreadyPrayed: false,
      ownerPushToken: request.ownerPushToken,
    };
  }

  /**
   * Gestion d'un sujet par son propriétaire (via X-Manage-Token)
   */
  static async findByManageToken(id: string, manageToken: string) {
    const item = await prisma.prayerRequest.findUnique({
      where: { id },
      include: { answeredClaim: true },
    });

    if (!item || item.manageToken !== manageToken || item.deletedAt !== null) {
      return null;
    }

    return item;
  }

  static async updatePushToken(id: string, pushToken: string) {
    return prisma.prayerRequest.update({
      where: { id },
      data: { ownerPushToken: pushToken },
    });
  }
}
