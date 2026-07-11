# Aqar Cloud API Documentation

> Base URL: `https://sadat-mls.vercel.app/api`

All endpoints return JSON. Authenticated endpoints require a valid Supabase session cookie or Bearer token. Rate-limited endpoints return standard rate-limit headers (`X-RateLimit-Remaining`, `Retry-After`).

---

## Auth Endpoints

### `POST /api/auth/csrf-token`
Get a CSRF token for state-changing operations.
- **Auth**: None
- **Response**: `{ token: string }`

### `POST /api/auth/rate-limit`
Record a rate limit attempt (for login lockout).
- **Auth**: None
- **Body**: `{ type: "login" | "forgot_password" }`

### `GET /api/auth/forgot-rate-limit`
Check if forgot-password is rate-limited.
- **Auth**: None
- **Response**: `{ locked: boolean, attemptsRemaining: number, retryAfter?: number }`

### `POST /api/auth/resend-verification`
Resend email verification link.
- **Auth**: None (requires valid email)
- **Body**: `{ email: string }`

---

## Property Endpoints

### `POST /api/contact`
Submit a contact/inquiry request for a property.
- **Auth**: CSRF required
- **Rate Limit**: 5/hour per IP
- **Body**: `{ propertyId?, officeId?, contactType: "whatsapp"|"phone"|"email", visitorName, visitorPhone?, visitorEmail?, message }`
- **Response**: `{ success: true, id: string }`

### `POST /api/ai/description`
Generate AI property description (mock).
- **Auth**: Rate limited
- **Body**: `{ title, property_type, zone, area, bedrooms, bathrooms }`
- **Response**: `{ description: string }`

---

## Office Endpoints

### `GET /api/offices`
List all active offices.
- **Auth**: Rate limited
- **Response**: `{ offices: Office[] }`

### `GET /api/offices/active`
List active offices for public display.
- **Auth**: None
- **Response**: `{ offices: Office[] }`
- **Cache**: `s-maxage=300, stale-while-revalidate=60`

---

## Agent Endpoints

### `POST /api/agents`
Create a new agent (office admin or super admin only).
- **Auth**: Super admin or office admin
- **CSRF**: Required
- **Body**: `{ email, password, fullName, role, officeId, phone? }`
- **Response**: `{ success: true, userId: string }`

### `DELETE /api/agents`
Delete an agent.
- **Auth**: Super admin or office admin
- **CSRF**: Required
- **Query**: `?id={userId}`

---

## Contact Requests

### `GET /api/contact-requests`
List contact requests for current office.
- **Auth**: Office member
- **Response**: `{ contactRequests: ContactRequest[] }`

---

## Activity

### `GET /api/activity`
List activity log for current office.
- **Auth**: Office member
- **Response**: `{ activities: Activity[] }`

### `POST /api/activity`
Log an activity event.
- **Auth**: Authenticated
- **CSRF**: Required
- **Body**: `{ action, entityType, entityId?, entityTitle?, metadata? }`

---

## Notifications

### `GET /api/notifications`
List notifications for current user.
- **Auth**: Authenticated
- **Query**: `?limit=20&offset=0&unread=true`
- **Response**: `{ notifications: Notification[], unreadCount: number }`

### `POST /api/notifications`
Create a notification.
- **Auth**: Authenticated
- **CSRF**: Required
- **Body**: `{ type, title, message, entityType?, entityId? }`

### `PATCH /api/notifications`
Mark notifications as read.
- **Auth**: Authenticated
- **CSRF**: Required
- **Body**: `{ ids: string[] }` or `{ markAll: true }`

### `DELETE /api/notifications/cleanup`
Delete old notifications (super admin only).
- **Auth**: Super admin

---

## Messages

### `GET /api/messages`
List messages for current office.
- **Auth**: Office member
- **Response**: `{ messages: Message[], unreadCount: number }`

### `POST /api/messages`
Send a message.
- **Auth**: Authenticated
- **Body**: `{ body, subject?, recipientOfficeId?, parentId?, visitorName?, visitorEmail?, propertyId? }`

### `PATCH /api/messages`
Mark messages as read.
- **Auth**: Authenticated
- **Body**: `{ ids: string[] }`

---

## Offers

### `GET /api/offices` → `/api/offices`
List offices.

### `POST /api/offers`
Submit an offer on a property.
- **Auth**: Authenticated
- **CSRF**: Required
- **Body**: `{ property_id, offerer_name, offerer_email?, offerer_phone?, offer_amount: number, message? }`

### `PATCH /api/offers/[id]`
Update offer status (accept/reject/counter).
- **Auth**: Office member
- **CSRF**: Required
- **Body**: `{ status: "accepted"|"rejected"|"countered", counter_amount?, counter_message?, notes? }`

---

## Commissions

### `GET /api/commissions`
List commissions for current office.
- **Auth**: Office member
- **Query**: `?period=all|month|quarter`
- **Response**: `{ commissions: Commission[], summary: { total, pending, paid, count } }`

### `PATCH /api/commissions/[id]`
Mark commission as paid (super admin only).
- **Auth**: Super admin
- **CSRF**: Required
- **Body**: `{ status: "paid", notes? }`

---

## Saved Searches

### `GET /api/saved-searches`
List saved searches for current user.
- **Auth**: Authenticated
- **Response**: `{ savedSearches: SavedSearch[] }`

### `POST /api/saved-searches`
Create a saved search.
- **Auth**: Authenticated
- **CSRF**: Required
- **Body**: `{ name: string, filters: object }`

### `DELETE /api/saved-searches?id={id}`
Delete a saved search.
- **Auth**: Authenticated
- **CSRF**: Required

### `POST /api/saved-searches/check`
Check all saved searches for new matching properties.
- **Auth**: Authenticated
- **CSRF**: Required
- **Response**: `{ searches: number, matches: number, emailsSent: number }`

---

## Analytics

### `GET /api/analytics`
Get office-level analytics (super admin only).
- **Auth**: Super admin
- **Query**: `?officeId={uuid}`
- **Response**: `{ totalProperties, byStatus, totalFavorites, topProperties, contactsByType, totalContacts, recentContacts }`

### `POST /api/analytics/property`
Record a property analytics event.
- **Auth**: None (public)
- **Body**: `{ property_id, event_type: "view"|"inquiry"|"favorite"|"share", metadata? }`

### `GET /api/analytics/property/[id]`
Get analytics for a specific property.
- **Auth**: Office member
- **Response**: `{ views, inquiries, favorites, shares, viewsByDay }`

---

## Office Registration

### `POST /api/office-registration`
Register a new office (public, pending approval).
- **Auth**: None
- **Body**: `{ officeName, officeEmail, officePhone?, officeAddress?, adminName, adminEmail, adminPassword }`
- **Response**: `{ success: true, officeId: string }`

---

## Invitations

### `POST /api/invitations`
Create an agent invitation.
- **Auth**: Office admin
- **Body**: `{ email, officeId }`

### `GET /api/invitations/verify?token={token}`
Verify an invitation token.
- **Auth**: None

### `POST /api/invitations/accept`
Accept an invitation and create account.
- **Auth**: None (uses token)

---

## Push Notifications

### `POST /api/push/subscribe`
Subscribe to push notifications.
- **Auth**: Authenticated
- **Body**: `{ endpoint, keys: { p256dh, auth } }`

### `DELETE /api/push/unsubscribe`
Unsubscribe from push notifications.
- **Auth**: Authenticated

---

## Admin

### `POST /api/admin/users`
Admin user management (super admin only).
- **Auth**: Super admin
- **CSRF**: Required

---

## System

### `GET /api/health`
Health check endpoint.
- **Auth**: None
- **Response**: `{ status: "ok", timestamp: string, checks: { supabase: "ok" } }`

### `POST /api/csp-report`
CSP violation reporting endpoint.
- **Auth**: None

### `GET /api/cron/cleanup`
Rate limit and data cleanup cron job.
- **Auth**: Optional (CRON_SECRET)
- **Schedule**: Daily at 3am (Vercel Cron)

---

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message",
  "details": { "field": ["validation error"] }
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / validation error |
| 401 | Unauthorized (no session) |
| 403 | Forbidden (CSRF invalid or insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate email) |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 15 min lockout |
| Forgot password | 3 attempts | 1 hour |
| Contact form | 5 requests | 1 hour |
| API reads | 100 requests | 1 minute |
| API writes | 30 requests | 1 minute |
| Agent creation | 10 requests | 1 minute |
| Office registration | 3 requests | 1 hour |
