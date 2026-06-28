import { SkeletonDashboard } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
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

      {/* Sidebar skeleton */}
      <div className="hidden lg:block fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200">
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="lg:ml-64 p-4 sm:p-6 pt-20 lg:pt-6">
        <SkeletonDashboard />
      </div>
    </div>
  );
}
