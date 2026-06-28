import { Globe } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Globe className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-gray-500 font-medium">جاري التحميل...</p>
        <p className="text-sm text-gray-400 mt-1">Loading...</p>
      </div>
    </div>
  );
}
