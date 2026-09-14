import { NextRequest, NextResponse } from 'next/server';
import { CreateReportSchema } from '@maboiteapriere/shared';
import { prisma } from '@/server/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const validated = CreateReportSchema.parse(body);

    const prayerRequest = await prisma.prayerRequest.findUnique({
      where: { publicSlug: slug },
      select: { id: true },
    });

    if (!prayerRequest) {
      return NextResponse.json({ error: 'Sujet introuvable' }, { status: 404 });
    }

    await prisma.report.create({
      data: {
        requestId: prayerRequest.id,
        reason: validated.reason,
        visitorId: validated.visitorId,
      },
    });

    // Règle §5.4 : Si au moins 3 signalements, masquage auto réversible
    const reportCount = await prisma.report.count({
      where: { requestId: prayerRequest.id },
    });

    if (reportCount >= 3) {
      await prisma.prayerRequest.update({
        where: { id: prayerRequest.id },
        data: { status: 'PENDING' },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Impossible d’enregistrer le signalement' },
      { status: 400 }
    );
  }
}
