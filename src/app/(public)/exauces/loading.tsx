import { SkeletonGrid } from '../../../components/ui/SkeletonCard';

export default function ExaucesLoading() {
  return (
    <div className="space-y-8 py-2">
      <div className="space-y-2">
        <div className="w-56 h-8 rounded-xl bg-surface shimmer-effect" />
        <div className="w-72 h-4 rounded-md bg-surface shimmer-effect" />
      </div>
      <SkeletonGrid count={6} />
    </div>
  );
}
