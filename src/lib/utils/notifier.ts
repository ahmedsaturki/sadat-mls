/**
 * Notification compatibility surface.
 *
 * The previous implementation depended on retired `users`, `offices`, and
 * `notifications` relations. Preserve the public helper signatures while
 * failing closed until the verified Aqarat notification contract exists.
 */

interface CreateNotificationParams {
  userId: string;
  officeId?: string | null;
  type: string;
  title: string;
  message: string;
  title_params?: Record<string, string | number>;
  message_params?: Record<string, string | number>;
  entityType?: string | null;
  entityId?: string | null;
  supabase?: unknown;
}

export async function createNotification(_params: CreateNotificationParams): Promise<void> {}

export async function notifyOffice(
  _officeId: string,
  _notification: Omit<CreateNotificationParams, "userId" | "officeId">,
  _supabase?: unknown,
): Promise<void> {}

export async function notifyUsers(
  _userIds: string[],
  _notification: Omit<CreateNotificationParams, "userId" | "officeId">,
  _supabase?: unknown,
): Promise<void> {}
