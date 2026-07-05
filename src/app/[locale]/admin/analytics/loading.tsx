import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonCard />
      <SkeletonTable rows={5} />
    </div>
  );
}
