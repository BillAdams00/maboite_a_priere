export default function AdminLoading() {
  return (
    <div className="space-y-6 py-2">
      {/* Header squelette */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-48 h-8 rounded-xl bg-surface shimmer-effect" />
          <div className="w-64 h-4 rounded-md bg-surface shimmer-effect" />
        </div>
        <div className="w-28 h-9 rounded-xl bg-surface shimmer-effect" />
      </div>

      {/* Cartes KPI squelettes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-bordure rounded-2xl p-5 space-y-3"
          >
            <div className="w-20 h-4 rounded bg-fond shimmer-effect" />
            <div className="w-16 h-8 rounded bg-fond shimmer-effect" />
          </div>
        ))}
      </div>

      {/* Table squelette */}
      <div className="bg-surface border border-bordure rounded-2xl p-6 space-y-4">
        <div className="w-40 h-5 rounded bg-fond shimmer-effect" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-full h-12 rounded-xl bg-fond shimmer-effect" />
          ))}
        </div>
      </div>
    </div>
  );
}
