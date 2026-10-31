import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { checkRateLimit } from '@/server/lib/rate-limit';
import { hashIp } from '@/server/lib/crypto';
import { GENERIC_TECHNICAL_ERROR } from '@/server/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug manquant' }, { status: 400 });
  }

  // Rate limiting : 60 requêtes / min / IP
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
  const hashedIp = hashIp(clientIp) || clientIp;

  const rateCheck = await checkRateLimit('prayerCount', hashedIp);
  if (!rateCheck.success) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  try {
    const prayer = await prisma.prayerRequest.findUnique({
      where: { publicSlug: slug },
      select: {
        prayerCount: true,
        status: true,
        visibility: true,
        deletedAt: true,
      },
    });

    if (
      !prayer ||
      prayer.visibility !== 'PUBLIC' ||
      prayer.status !== 'APPROVED' ||
      prayer.deletedAt !== null
    ) {
      return NextResponse.json({ error: 'Sujet introuvable' }, { status: 404 });
    }

    return NextResponse.json(
      { prayerCount: prayer.prayerCount },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
        },
      }
    );
  } catch (err: any) {
    console.error('Erreur API prayers/count :', err);
    return NextResponse.json({ error: GENERIC_TECHNICAL_ERROR }, { status: 500 });
  }
}
