export default function UsersLoading() {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse" />
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
                <div className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
