"use client";

import { useEffect, useRef, useCallback } from "react";
import { logger } from "@/lib/logger";

interface MetricEntry {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: MetricEntry[] = [];
  private observers: PerformanceObserver[] = [];
  private readonly MAX_METRICS = 100;

  observeLCP(callback?: (metric: MetricEntry) => void) {
    if (typeof window === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          const metric = this.processMetric("LCP", lastEntry.startTime);
          callback?.(metric);
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
      this.observers.push(observer);
    } catch {
      // LCP not supported
    }
  }

  observeFID(callback?: (metric: MetricEntry) => void) {
    if (typeof window === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const metric = this.processMetric(
            "FID",
            (entry as PerformanceEventTiming).processingStart - entry.startTime
          );
          callback?.(metric);
        });
      });
      observer.observe({ type: "first-input", buffered: true });
      this.observers.push(observer);
    } catch {
      // FID not supported
    }
  }

  observeCLS(callback?: (metric: MetricEntry) => void) {
    if (typeof window === "undefined") return;

    let clsValue = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            clsValue += layoutShiftEntry.value;
          }
        });
        const metric = this.processMetric("CLS", clsValue);
        callback?.(metric);
      });
      observer.observe({ type: "layout-shift", buffered: true });
      this.observers.push(observer);
    } catch {
      // CLS not supported
    }
  }

  observeINP(callback?: (metric: MetricEntry) => void) {
    if (typeof window === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let maxDuration = 0;
        entries.forEach((entry) => {
          const eventEntry = entry as PerformanceEventTiming;
          if (eventEntry.duration > maxDuration) {
            maxDuration = eventEntry.duration;
          }
        });
        if (maxDuration > 0) {
          const metric = this.processMetric("INP", maxDuration);
          callback?.(metric);
        }
      });
      observer.observe({ type: "event", buffered: true });
      this.observers.push(observer);
    } catch {
      // INP not supported
    }
  }

  private processMetric(name: string, value: number): MetricEntry {
    const rating = this.getRating(name, value);
    const metric: MetricEntry = { name, value, rating, timestamp: Date.now() };

    this.metrics.push(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    return metric;
  }

  private getRating(name: string, value: number): MetricEntry["rating"] {
    switch (name) {
      case "LCP":
        if (value <= 2500) return "good";
        if (value <= 4000) return "needs-improvement";
        return "poor";
      case "FID":
        if (value <= 100) return "good";
        if (value <= 300) return "needs-improvement";
        return "poor";
      case "CLS":
        if (value <= 0.1) return "good";
        if (value <= 0.25) return "needs-improvement";
        return "poor";
      case "INP":
        if (value <= 200) return "good";
        if (value <= 500) return "needs-improvement";
        return "poor";
      default:
        return "good";
    }
  }

  getMetrics(): MetricEntry[] {
    return [...this.metrics];
  }

  getSummary() {
    const summary: Record<string, { latest: number; average: number; rating: string }> = {};

    const grouped = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) acc[metric.name] = [];
        acc[metric.name].push(metric);
        return acc;
      },
      {} as Record<string, MetricEntry[]>
    );

    for (const [name, entries] of Object.entries(grouped)) {
      const latest = entries[entries.length - 1];
      const average = entries.reduce((sum, e) => sum + e.value, 0) / entries.length;
      summary[name] = {
        latest: Math.round(latest.value),
        average: Math.round(average),
        rating: latest.rating,
      };
    }

    return summary;
  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function usePerformanceMonitor() {
  const monitorRef = useRef(performanceMonitor);
  const reportedRef = useRef<Set<string>>(new Set());

  const reportMetric = useCallback(
    (metric: MetricEntry) => {
      if (reportedRef.current.has(metric.name)) return;
      reportedRef.current.add(metric.name);

      if (process.env.NODE_ENV === "development") {
        logger.info(`[Perf] ${metric.name}: ${metric.value} (${metric.rating})`);
      }
    },
    []
  );

  useEffect(() => {
    const monitor = monitorRef.current;
    monitor.observeLCP(reportMetric);
    monitor.observeFID(reportMetric);
    monitor.observeCLS(reportMetric);
    monitor.observeINP(reportMetric);

    return () => {
      monitor.disconnect();
    };
  }, [reportMetric]);

  return {
    getMetrics: () => monitorRef.current.getMetrics(),
    getSummary: () => monitorRef.current.getSummary(),
  };
}

export function useMeasureRender(name: string) {
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = performance.now();
    return () => {
      const duration = performance.now() - startRef.current;
      if (duration > 16) {
        logger.warn(`Slow render: ${name} took ${Math.round(duration)}ms`);
      }
    };
  }, [name]);
}
