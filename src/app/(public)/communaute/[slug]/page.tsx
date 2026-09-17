import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PrayerRepository } from '../../../../server/repositories/prayer.repository';
import { PrayerCard } from '../../../../components/prayer/PrayerCard';
import { ArrowLeft, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface SinglePrayerPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: SinglePrayerPageProps): Promise<Metadata> {
  const prayer = await PrayerRepository.findPublicBySlug(params.slug);
  if (!prayer) return { title: 'Sujet introuvable' };

  return {
    title: `Prière pour ${prayer.displayName} · Ma boîte à prière`,
    description: prayer.content.slice(0, 160),
  };
}

export default async function SinglePrayerPage({ params }: SinglePrayerPageProps) {
  const prayer = await PrayerRepository.findPublicBySlug(params.slug);

  if (!prayer) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <Link
        href="/communaute"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primaire hover:underline"
      >
        <ArrowLeft size={16} />
        <span>Retour au flux de prières</span>
      </Link>

      <PrayerCard prayer={prayer} />

      <div className="text-center pt-4">
        <Link
          href="/communaute"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-bordure text-encre font-medium text-xs hover:bg-fond transition-colors"
        >
          <Users size={16} className="text-primaire" />
          <span>Découvrir d'autres sujets à porter</span>
        </Link>
      </div>
    </div>
  );
}
