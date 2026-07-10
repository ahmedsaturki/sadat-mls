"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (supported && "Notification" in window) {
      setPermission(Notification.permission);
    }

    // Check existing subscription
    if (supported && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false;

    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return false;

      // Register service worker and subscribe
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Send subscription to server
      const { data: { session } } = await (await import("@/lib/supabase/client")).createClient().auth.getSession();
      if (session?.access_token) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      logger.error("Failed to subscribe to push notifications", { error: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Notify server
        const { data: { session } } = await (await import("@/lib/supabase/client")).createClient().auth.getSession();
        if (session?.access_token) {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
      }

      setIsSubscribed(false);
      return true;
    } catch (err) {
      logger.error("Failed to unsubscribe from push notifications", { error: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe };
}
