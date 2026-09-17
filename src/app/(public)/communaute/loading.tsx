import { SkeletonGrid } from '../../../components/ui/SkeletonCard';

export default function CommunauteLoading() {
  return (
    <div className="space-y-8 py-2 animate-fade-in">
      {/* En-tête squelette */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="w-64 h-8 rounded-xl bg-surface shimmer-effect" />
          <div className="w-80 h-4 rounded-md bg-surface shimmer-effect" />
        </div>
        <div className="w-36 h-10 rounded-xl bg-surface shimmer-effect" />
      </div>

      {/* Barre de thèmes squelette */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-surface p-3 rounded-2xl border border-bordure">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-24 h-7 rounded-xl bg-fond shimmer-effect shrink-0" />
        ))}
      </div>

      {/* Grille de cartes squelettes */}
      <SkeletonGrid count={6} />
    </div>
  );
}
