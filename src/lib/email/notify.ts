/**
 * Email notification compatibility surface.
 *
 * The former implementation depended on the retired `users` and `offices`
 * contract. Keep the exported functions stable but fail closed until the
 * verified Aqarat identity/notification contract is implemented.
 */

export async function sendContactRequestNotification(
  _officeId: string,
  _propertyTitle: string | null,
  _visitorName: string,
  _visitorEmail: string | null,
  _visitorPhone: string | null,
  _message: string,
  _supabase?: unknown,
): Promise<void> {}

export async function sendAgentJoinedNotification(
  _officeId: string,
  _agentName: string,
  _agentEmail: string,
  _role: string,
  _supabase?: unknown,
): Promise<void> {}

export async function sendWelcomeEmail(
  _userEmail: string,
  _userName: string,
  _officeName?: string,
): Promise<void> {}

export async function sendPropertyStatusChangeNotification(
  _officeId: string,
  _propertyTitle: string,
  _oldStatus: string,
  _newStatus: string,
  _supabase?: unknown,
): Promise<void> {}
