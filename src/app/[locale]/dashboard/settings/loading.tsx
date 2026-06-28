export default function DashboardSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
      </div>

      {/* Form skeleton */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-6">
          {/* Logo section */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
          </div>

          {/* Form fields */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-lg w-full animate-pulse" />
            </div>
          ))}

          {/* Save button */}
          <div className="flex justify-end">
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
