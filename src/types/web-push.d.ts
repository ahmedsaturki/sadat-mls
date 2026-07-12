declare module "web-push" {
  interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  interface PushSubscription {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  interface Options {
    TTL?: number;
    urgency?: string;
    topic?: string;
    proxyOrigin?: string;
    contentEncoding?: string;
    headers?: Record<string, string>;
    agent?: unknown;
  }

  const webPush: {
    setVapidDetails(
      subject: string,
      publicKey: string,
      privateKey: string
    ): void;
    sendNotification(
      subscription: PushSubscription,
      payload?: string | Buffer,
      options?: Options
    ): Promise<SendResult>;
    generateVAPIDKeys(): {
      publicKey: string;
      privateKey: string;
    };
  };

  export default webPush;
}
