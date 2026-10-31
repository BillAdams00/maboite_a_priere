import { NextResponse } from 'next/server';
import { AdminService } from '@/server/services/admin.service';
import { prisma } from '@/server/db';
import type { DailyStat } from '@prisma/client';
import { GENERIC_TECHNICAL_ERROR, getSafeErrorMessage } from '@/server/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await AdminService.requireAdmin(['ADMIN', 'SUPER_ADMIN']);

    const stats = await prisma.dailyStat.findMany({
      orderBy: { day: 'desc' },
      take: 365,
    });

    const headers = [
      'Date',
      'Total sujets',
      'Sujets publics',
      'Sujets privés',
      'Exaucements',
      'Prières enregistrées',
    ];

    const rows = stats.map((s: DailyStat) => [
      s.day.toISOString().split('T')[0],
      s.requestsTotal,
      s.requestsPublic,
      s.requestsPrivate,
      s.requestsAnswered,
      s.prayers,
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row: (string | number)[]) => row.join(';')),
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="statistiques-maboiteapriere-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Erreur API admin/stats/export :', error);
    const safeError = getSafeErrorMessage(error);
    const isAuth = safeError !== GENERIC_TECHNICAL_ERROR;
    return NextResponse.json(
      { error: safeError },
      { status: isAuth ? 403 : 500 }
    );
  }
}
