"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function InstallBanner({ dict }: { dict: Record<string, unknown> }) {
  const { isInstallable, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  const common = dict?.common as Record<string, string> | undefined;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-navy-600 text-white shadow-lg safe-area-bottom">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            {common?.installApp || "Install Sadat MLS on your device for a better experience"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={install}
            className="px-4 py-2 bg-white text-navy-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-600"
          >
            {common?.install || "Install"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-navy-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={common?.dismiss || "Dismiss"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
