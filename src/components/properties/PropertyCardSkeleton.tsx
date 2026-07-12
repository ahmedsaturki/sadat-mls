import { Skeleton } from "@/components/ui/Skeleton";

export function PropertyCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      aria-hidden="true"
    >
      <div className={compact ? "h-36" : "h-44 sm:h-48"}>
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        <Skeleton className={compact ? "h-4 w-3/4 mb-2" : "h-5 w-3/4 mb-2"} />
        <Skeleton className={compact ? "h-3 w-1/2 mb-2" : "h-4 w-1/2 mb-2"} />
        <div className="flex gap-3 mb-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-3 w-2/3 mb-3" />
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Skeleton className={compact ? "h-4 w-20" : "h-5 w-24"} />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function PropertyCardSkeletonGrid({
  count = 6,
  compact = false,
}: {
  count?: number;
  compact?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} compact={compact} />
      ))}
    </div>
  );
}
