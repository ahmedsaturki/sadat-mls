"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Messages } from "@/i18n/getMessages";

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  showBack?: boolean;
  dict?: Messages;
}

export default function PageHeader({ title, action, showBack, dict }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={dict?.common?.back}
          >
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
