import { Globe } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";

export default function Loading() {
  const dict = getMessages();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Globe className="w-8 h-8 text-navy-600" />
        </div>
        <p className="text-gray-500 font-medium">{dict.common.loading}</p>
      </div>
    </div>
  );
}
