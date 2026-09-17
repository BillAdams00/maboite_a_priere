import { prisma } from '../db';
import { hashToken, safeEqual } from '../lib/crypto';
import type { Prisma, Visibility, RequestStatus } from '@prisma/client';
import type {
  PublicPrayerRequestItem,
  MyPrayerRequestDetail,
  AdminPrayerRequestItem,
} from '../../lib/types/index';
import type { PrayerRequestFeedQuery } from '../../lib/validation/prayer-request.schema';

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
        // Sécurité : lastName, manageToken, contentIv, ipHash ne sont JAMAIS sélectionnés ici
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
   * Flux des prières exaucées pour /exauces
   */
  static async findAnswered(
    cursor?: string,
    limit = 20
  ): Promise<{ items: PublicPrayerRequestItem[]; nextCursor: string | null }> {
    const rawItems = await prisma.prayerRequest.findMany({
      where: {
        visibility: 'PUBLIC',
        status: 'APPROVED',
        isAnswered: true,
        deletedAt: null,
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: [{ answeredAt: 'desc' }, { createdAt: 'desc' }],
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
      isAnswered: true,
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
   * Récupère un sujet public individuel par son slug.
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
   * Récupère un sujet pour la page de gestion privée /mon-sujet/[token]
   * Recherche directe par hachage du jeton.
   */
  static async findByRawManageToken(token: string): Promise<MyPrayerRequestDetail | null> {
    const hashed = hashToken(token);
    const item = await prisma.prayerRequest.findUnique({
      where: { manageToken: hashed },
      include: { answeredClaim: true },
    });

    if (!item || item.deletedAt !== null) {
      return null;
    }

    return {
      id: item.id,
      publicSlug: item.publicSlug,
      firstName: item.firstName,
      lastName: item.lastName,
      displayAsAnonymous: item.displayAsAnonymous,
      content: item.content,
      visibility: item.visibility,
      status: item.status,
      category: item.category,
      prayerCount: item.prayerCount,
      isAnswered: item.isAnswered,
      answeredAt: item.answeredAt ? item.answeredAt.toISOString() : null,
      answeredNote: item.answeredNote,
      hasPendingAnsweredClaim: !!(item.answeredClaim && !item.answeredClaim.confirmedAt && !item.answeredClaim.rejectedAt),
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
   * Action « Je prie pour toi » : idempotente par (requestId, visitorId).
   */
  static async recordPrayer(
    publicSlug: string,
    visitorId: string,
    ipHash?: string | null
  ): Promise<{ prayerCount: number; alreadyPrayed: boolean; requestId: string }> {
    const request = await prisma.prayerRequest.findUnique({
      where: { publicSlug },
      select: { id: true, prayerCount: true, visibility: true, status: true },
    });

    if (!request || request.visibility !== 'PUBLIC' || request.status !== 'APPROVED') {
      throw new Error('Sujet de prière introuvable ou indisponible');
    }

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
        requestId: request.id,
      };
    }

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
      requestId: request.id,
    };
  }

  /**
   * Liste des sujets pour l'administration.
   */
  static async findAdminList(params: {
    status?: RequestStatus;
    visibility?: Visibility;
    isAnswered?: boolean;
    hasReports?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PrayerRequestWhereInput = {
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
      ...(params.visibility ? { visibility: params.visibility } : {}),
      ...(params.isAnswered !== undefined ? { isAnswered: params.isAnswered } : {}),
      ...(params.hasReports ? { reports: { some: {} } } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.prayerRequest.count({ where }),
      prisma.prayerRequest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { reports: true },
          },
          answeredClaim: true,
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items: items.map(item => ({
        id: item.id,
        publicSlug: item.publicSlug,
        firstName: item.firstName,
        lastName: item.lastName,
        displayAsAnonymous: item.displayAsAnonymous,
        content: item.content,
        contentIv: item.contentIv,
        category: item.category,
        visibility: item.visibility,
        status: item.status,
        prayerCount: item.prayerCount,
        viewCount: item.viewCount,
        isAnswered: item.isAnswered,
        answeredAt: item.answeredAt ? item.answeredAt.toISOString() : null,
        answeredNote: item.answeredNote,
        moderationNote: item.moderationNote,
        createdAt: item.createdAt.toISOString(),
        reportsCount: item._count.reports,
        answeredClaim: item.answeredClaim,
      })),
    };
  }

  /**
   * Récupère un sujet par id avec ses détails pour la vue admin.
   */
  static async findAdminById(id: string) {
    return prisma.prayerRequest.findUnique({
      where: { id },
      include: {
        answeredClaim: true,
        reports: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
