export default function NewPropertyLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6" aria-busy="true" role="status">
      <div className="flex items-center gap-3">
        <div className="h-10 bg-gray-200 rounded-lg w-10 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
      </div>
    </div>
  );
}
