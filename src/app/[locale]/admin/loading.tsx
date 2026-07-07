export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50" aria-busy="true" role="status">
      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-64 bg-white border-e border-gray-200 min-h-screen">
          <div className="p-4 space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
