"use client";

import { type ReactNode } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export default function ErrorBoundaryWrapper({
  children,
  fallbackTitle,
  fallbackMessage,
}: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary fallbackTitle={fallbackTitle} fallbackMessage={fallbackMessage}>
      {children}
    </ErrorBoundary>
  );
}
