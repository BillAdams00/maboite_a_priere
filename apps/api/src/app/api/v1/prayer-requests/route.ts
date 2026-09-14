import { NextRequest, NextResponse } from 'next/server';
import {
  CreatePrayerRequestSchema,
  PrayerRequestFeedQuerySchema,
} from '@maboiteapriere/shared';
import { PrayerRepository } from '@/server/repositories/prayer.repository';
import { PrayerService } from '@/server/services/prayer.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = PrayerRequestFeedQuerySchema.parse({
      cursor: searchParams.get('cursor') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      sort: searchParams.get('sort') ?? 'recent',
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    });

    const result = await PrayerRepository.findPublicFeed(query);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des sujets' },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreatePrayerRequestSchema.parse(body);

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    const result = await PrayerService.submitPrayerRequest(validated, clientIp, userAgent);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation échouée', details: error.errors },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du sujet' },
      { status: 500 }
    );
  }
}
