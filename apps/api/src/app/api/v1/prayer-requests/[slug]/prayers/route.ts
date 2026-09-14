import { NextRequest, NextResponse } from 'next/server';
import { PrayerActionSchema } from '@maboiteapriere/shared';
import { PrayerService } from '@/server/services/prayer.service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const validated = PrayerActionSchema.parse(body);

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip');

    const result = await PrayerService.prayForRequest(slug, validated.visitorId, clientIp);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Impossible d’enregistrer la prière' },
      { status: 400 }
    );
  }
}
