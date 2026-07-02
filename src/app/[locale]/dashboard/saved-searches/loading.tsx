export default function SavedSearchesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 bg-gray-100 rounded-full w-24 animate-pulse" />
                  <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                  <div className="h-6 bg-gray-100 rounded-full w-28 animate-pulse" />
                  <div className="h-6 bg-gray-100 rounded-full w-16 animate-pulse" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
