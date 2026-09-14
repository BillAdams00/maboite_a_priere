import { NextRequest, NextResponse } from 'next/server';
import { ManagePrayerRequestSchema } from '@maboiteapriere/shared';
import { PrayerService } from '@/server/services/prayer.service';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const manageToken = request.headers.get('x-manage-token');

    if (!manageToken) {
      return NextResponse.json(
        { error: 'En-tête X-Manage-Token requis pour gérer ce sujet' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = ManagePrayerRequestSchema.parse(body);

    const result = await PrayerService.manageRequest(id, manageToken, validated);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Impossible de mettre à jour le sujet' },
      { status: 400 }
    );
  }
}
