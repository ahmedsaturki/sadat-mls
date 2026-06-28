import Link from "next/link";
import { LayoutDashboard, ArrowRight } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="min-h-[50vh] bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-5xl font-bold text-gray-300 mb-2">404</h1>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">الصفحة غير موجودة / Page not found</h2>
        <p className="text-gray-500 mb-4">الصفحة المطلوبة غير موجودة أو تم نقلها / Page not found or moved</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للوحة التحكم / Back to dashboard
        </Link>
      </div>
    </div>
  );
}
