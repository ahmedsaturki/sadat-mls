export default function PropertyTypesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse" />
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
