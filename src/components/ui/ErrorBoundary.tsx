"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function getBilingualText() {
  if (typeof window === "undefined") {
    return { title: "An error occurred", message: "An unexpected error occurred. Please try again.", retry: "Try again" };
  }
  const isAr = window.location.pathname.startsWith("/ar");
  if (isAr) {
    return { title: "حدث خطأ", message: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.", retry: "حاول مرة أخرى" };
  }
  return { title: "An error occurred", message: "An unexpected error occurred. Please try again.", retry: "Try again" };
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught", { error: error.message, componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      const texts = getBilingualText();
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-1">
            {this.props.fallbackTitle || texts.title}
          </h3>
          <p className="text-sm text-red-600 mb-4 text-center">
            {this.props.fallbackMessage || texts.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            aria-label={texts.retry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            {texts.retry}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
