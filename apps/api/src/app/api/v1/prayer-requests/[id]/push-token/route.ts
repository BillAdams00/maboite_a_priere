import { NextRequest, NextResponse } from 'next/server';
import { UpdatePushTokenSchema } from '@maboiteapriere/shared';
import { PrayerRepository } from '@/server/repositories/prayer.repository';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const manageToken = request.headers.get('x-manage-token');

    if (!manageToken) {
      return NextResponse.json(
        { error: 'En-tête X-Manage-Token requis' },
        { status: 401 }
      );
    }

    const prayer = await PrayerRepository.findByManageToken(id, manageToken);
    if (!prayer) {
      return NextResponse.json(
        { error: 'Sujet introuvable ou jeton invalide' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { expoPushToken } = UpdatePushTokenSchema.parse(body);

    await PrayerRepository.updatePushToken(id, expoPushToken);

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Impossible d’enregistrer le jeton push' },
      { status: 400 }
    );
  }
}
