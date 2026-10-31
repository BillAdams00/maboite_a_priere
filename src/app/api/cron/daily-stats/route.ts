import { NextResponse } from 'next/server';
import { env } from '../../../../server/env';
import { StatRepository } from '../../../../server/repositories/stat.repository';

import { GENERIC_TECHNICAL_ERROR } from '../../../../server/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const consolidated = await StatRepository.consolidateDay(yesterday);
    return NextResponse.json({ success: true, day: consolidated.day });
  } catch (error: any) {
    console.error('Erreur Vercel Cron daily-stats :', error);
    return NextResponse.json(
      { error: GENERIC_TECHNICAL_ERROR },
      { status: 500 }
    );
  }
}
