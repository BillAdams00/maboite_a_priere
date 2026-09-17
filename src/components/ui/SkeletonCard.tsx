export function SkeletonCard() {
  return (
    <div className="bg-surface border border-bordure rounded-2xl p-5 shadow-xs space-y-4 overflow-hidden relative">
      {/* Header squelette */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-24 h-4 rounded-md bg-fond shimmer-effect" />
          <div className="w-16 h-4 rounded-full bg-fond shimmer-effect" />
        </div>
        <div className="w-12 h-3 rounded-md bg-fond shimmer-effect" />
      </div>

      {/* Lignes de texte */}
      <div className="space-y-2 py-1">
        <div className="w-full h-3.5 rounded-md bg-fond shimmer-effect" />
        <div className="w-11/12 h-3.5 rounded-md bg-fond shimmer-effect" />
        <div className="w-4/5 h-3.5 rounded-md bg-fond shimmer-effect" />
      </div>

      {/* Footer avec boutons squelettes */}
      <div className="pt-3 border-t border-bordure/60 flex items-center justify-between">
        <div className="w-32 h-8 rounded-xl bg-fond shimmer-effect" />
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 rounded-xl bg-fond shimmer-effect" />
          <div className="w-7 h-7 rounded-xl bg-fond shimmer-effect" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
