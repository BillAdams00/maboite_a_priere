import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug manquant' }, { status: 400 });
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
  } catch (err) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
