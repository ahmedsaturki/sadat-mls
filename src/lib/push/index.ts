/**
 * Push notification utilities.
 * Uses Web Push API with VAPID keys for reliable delivery.
 */

/** VAPID public key for the client side */
export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

/** Convert VAPID public key from base64url to Uint8Array */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Subscribe to push notifications */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) {
    console.warn("VAPID public key not configured");
    return null;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });
    return subscription;
  } catch (err) {
    console.error("Failed to subscribe to push:", err);
    return null;
  }
}

/** Send a push notification to a user's subscriptions */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) return;

  // This would typically be called from a server endpoint
  // For now, log the intent
  console.log("Push notification:", payload.title, payload.body);
}
