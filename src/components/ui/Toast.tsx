"use client";

import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import enDict from "@/i18n/messages/en.json";
import arDict from "@/i18n/messages/ar.json";

// Toast is a global component rendered outside page context, so it cannot
// receive a dict prop. Detect locale from the URL path instead — the project
// uses /ar/* and /en/* prefixes consistently.
const getLocaleFromPath = (): "ar" | "en" => {
  if (typeof window === "undefined") return "ar";
  return window.location.pathname.startsWith("/en") ? "en" : "ar";
};

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const clearAllTimers = () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
    return clearAllTimers;
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, 4000);
    timersRef.current.set(id, timer);
  }, []);

  const removeToast = (id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  // Escape key handler for dismissing toasts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && toasts.length > 0) {
        // Dismiss the most recent toast
        removeToast(toasts[toasts.length - 1].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 sm:max-w-sm sm:left-auto sm:bottom-4" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          const locale = getLocaleFromPath();
          const dismissLabel = locale === "en" ? enDict.common.dismiss : arDict.common.dismiss;
          return (
<div
       key={toast.id}
       className={cn(
         "flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-bottom-5",
         colors[toast.type]
       )}
       onMouseEnter={() => {
         const timer = timersRef.current.get(toast.id);
         if (timer) {
           clearTimeout(timer);
           timersRef.current.delete(toast.id);
         }
       }}
       onMouseLeave={() => {
         const timer = setTimeout(() => {
           setToasts((prev) => prev.filter((t) => t.id !== toast.id));
           timersRef.current.delete(toast.id);
         }, 4000);
         timersRef.current.set(toast.id, timer);
       }}
     >
       <Icon className="w-5 h-5 shrink-0" />
       <p className="flex-1 text-sm font-medium">{toast.message}</p>
       <button
         onClick={() => removeToast(toast.id)}
         className="shrink-0 p-1 rounded-full hover:bg-black/10"
         aria-label={dismissLabel}
       >
         <X className="w-4 h-4" />
       </button>
     </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
