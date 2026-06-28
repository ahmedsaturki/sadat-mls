export default function FavoritesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      <div className="flex items-center gap-2">
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
