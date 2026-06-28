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
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={dict?.common?.back || "Back"}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
