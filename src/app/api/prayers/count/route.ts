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
      select: { prayerCount: true, status: true },
    });

    if (!prayer || prayer.status !== 'APPROVED') {
      return NextResponse.json({ prayerCount: 0 });
    }

    return NextResponse.json(
      { prayerCount: prayer.prayerCount },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ prayerCount: 0 }, { status: 200 });
  }
}
