import { SkeletonCard } from "@/components/ui/Skeleton";

export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar skeleton */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-10 h-8 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="w-40 h-4 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
