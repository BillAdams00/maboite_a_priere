import { notFound } from 'next/navigation';
import { PrayerRepository } from '../../../../server/repositories/prayer.repository';
import { decryptText } from '../../../../server/lib/crypto';
import { MonSujetClient } from './MonSujetClient';
import { prisma } from '../../../../server/db';
import { hashToken } from '../../../../server/lib/crypto';

export const dynamic = 'force-dynamic';

interface MonSujetPageProps {
  params: {
    token: string;
  };
}

export default async function MonSujetPage({ params }: MonSujetPageProps) {
  const token = params.token;
  const tokenHash = hashToken(token);

  const rawItem = await prisma.prayerRequest.findUnique({
    where: { manageToken: tokenHash },
    include: { answeredClaim: true },
  });

  if (!rawItem || rawItem.deletedAt !== null) {
    notFound();
  }

  // Déchiffrement si le sujet était privé
  let content = rawItem.content;
  if (rawItem.visibility === 'PRIVATE' && rawItem.contentIv) {
    try {
      content = decryptText(rawItem.content, rawItem.contentIv);
    } catch {
      content = '[Contenu chiffré]';
    }
  }

  const prayerData = {
    id: rawItem.id,
    publicSlug: rawItem.publicSlug,
    firstName: rawItem.firstName,
    lastName: rawItem.lastName,
    displayAsAnonymous: rawItem.displayAsAnonymous,
    content,
    visibility: rawItem.visibility,
    status: rawItem.status,
    category: rawItem.category,
    prayerCount: rawItem.prayerCount,
    isAnswered: rawItem.isAnswered,
    answeredAt: rawItem.answeredAt ? rawItem.answeredAt.toISOString() : null,
    answeredNote: rawItem.answeredNote,
    hasPendingAnsweredClaim: !!(
      rawItem.answeredClaim &&
      !rawItem.answeredClaim.confirmedAt &&
      !rawItem.answeredClaim.rejectedAt
    ),
    createdAt: rawItem.createdAt.toISOString(),
  };

  return <MonSujetClient prayer={prayerData} rawToken={token} />;
}
