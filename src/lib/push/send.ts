/**
 * Push notification compatibility surface.
 *
 * Push subscriptions previously lived on the retired `users` contract. Keep
 * exported helpers stable while the Aqarat notification/identity contract is
 * being rebuilt. No delivery is attempted against unverifiable storage.
 */

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

type PushResult = { sent: number; failed: number };
const DISABLED_RESULT: PushResult = { sent: 0, failed: 0 };

export async function sendPushToUser(
  _userId: string,
  _payload: PushPayload,
): Promise<PushResult> {
  return DISABLED_RESULT;
}

export async function sendPushToOffice(
  _officeId: string,
  _payload: PushPayload,
  _excludeUserId?: string,
): Promise<PushResult> {
  return DISABLED_RESULT;
}

export async function sendNewListingPush(
  _officeId: string,
  _propertyTitle: string,
  _propertyId: string,
): Promise<PushResult> {
  return DISABLED_RESULT;
}

export async function sendNewOfferPush(
  _officeId: string,
  _propertyTitle: string,
  _offerAmount: number,
): Promise<PushResult> {
  return DISABLED_RESULT;
}

export async function sendNewReferralPush(
  _officeId: string,
  _clientName: string,
): Promise<PushResult> {
  return DISABLED_RESULT;
}
