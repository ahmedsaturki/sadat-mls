# Sadat MLS API

Base URL:

`https://sadat-mls.vercel.app/api`

This document describes the **actual current API surface** in the deployed application. Historical routes from the retired Sadat MLS relational model are not documented as supported APIs.

## Public property API

### GET /api/properties

Returns active properties using the public Aqarat property-read contract.

Supported query parameters:

| Parameter | Meaning |
|---|---|
| `q` | Search title, description, district, or neighborhood |
| `type` | Exact `property_type` filter |
| `district` | Exact district filter |
| `minPrice` | Minimum price |
| `maxPrice` | Maximum price |
| `minArea` | Minimum area in m² |
| `maxArea` | Maximum area in m² |
| `sort` | `newest`, `price_low`, `price_high`, or `area` |

The API:

- exposes active rows only;
- exposes only approved public columns;
- returns at most 48 rows per response;
- returns an exact matching count;
- applies a 60-requests-per-minute per-IP in-memory limit.

Example response shape:

```json
{
  "properties": [],
  "count": 0
}
```

Rate-limit headers:

`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After`.

## System health

### GET /api/health

Public health probe.

Successful response:

```json
{
  "status": "ok",
  "timestamp": "2026-09-18T00:00:00.000Z",
  "checks": {
    "supabase_api": "ok",
    "properties": "ok"
  }
}
```

The endpoint verifies that the application can reach the canonical Supabase API and read the active property contract.

It is limited to 100 requests per minute per IP in a bounded in-memory limiter.

HTTP 503 is returned when the property/Supabase probe fails.

## Contact submission

### POST /api/contact

Submits a public inquiry and records it as Aqarat `people` + `contacts` + `interactions`.

Request:

```json
{
  "propertyId": "optional-uuid",
  "contactType": "whatsapp",
  "visitorName": "Example",
  "visitorPhone": "01000000000",
  "visitorEmail": "optional@example.com",
  "message": "Message"
}
```

Rules:

- CSRF token required.
- 5 requests per hour per IP.
- Input is validated and escaped before persistence.
- An optional `propertyId` must refer to an active property.
- Privileged database access is server-only.

This route uses the publishable-key Supabase client against a constrained database RPC. It does not require the Vercel server to hold the lost Supabase privileged key.

## Authentication support APIs

### POST /api/auth/rate-limit

Consumes one login-rate-limit slot for the requesting IP through the constrained `increment_public_rate_limit` Supabase RPC.

- Limit: 5 attempts / 15 minutes.
- No request body is required.
- `429` indicates the login attempt window is exhausted.
- `503` indicates the rate-limit RPC dependency is unavailable.

### POST /api/auth/forgot-rate-limit

Consumes one forgot-password rate-limit slot for the requesting IP through the same constrained public rate-limit primitive.

- Limit: 3 requests / hour.
- No request body is required.
- `429` indicates the window is exhausted.
- `503` indicates the public rate-limit RPC dependency is unavailable.

### POST /api/auth/resend-verification

Resends a signup verification email; its public rate-limit gate uses the constrained public rate-limit primitive.

- CSRF token required.
- Limit: 5 requests / hour.
- Body: `{ "email": "user@example.com" }`.
- `429` indicates the resend window is exhausted.
- `503` indicates the public rate-limit RPC dependency is unavailable.

### GET /api/auth/csrf-token

Creates or returns the current CSRF token cookie.

- No authentication required.
- Returns `{ "token": string }`.
- Protected by the database rate-limit primitive.

## CSP reporting

### POST /api/csp-report

Accepts a CSP violation report for security monitoring.

- No authentication required.
- Rate limited.
- Report data is logged; it is not persisted to the application database.

## Retired/unavailable API routes

The current repository contains explicit 410 responses for these retired endpoints:

- `GET/POST /api/activity`
- `GET /api/analytics`
- `GET /api/export`

Historical endpoint families for offices, agents, notifications, messages, offers, commissions, saved searches, office registration, push subscriptions, and legacy admin workflows are **not part of the certified Aqarat public API contract**. They must not be treated as supported APIs until an authoritative replacement is implemented and verified.

## Error conventions

Common status codes:

| Code | Meaning |
|---|---|
| 200 | Successful request |
| 400 | Invalid request or validation input |
| 403 | CSRF validation failure |
| 404 | Requested active property does not exist |
| 410 | Explicitly retired endpoint |
| 429 | Rate limit exceeded |
| 500 | Server-side failure |
| 503 | Required protected operational dependency unavailable |

Do not rely on historical response shapes from the retired application model.
