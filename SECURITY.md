# Sadat MLS Security Policy

## Current status

The current security baseline is designed around the verified Aqarat OS public property contract.

Security decisions are intentionally conservative where the connected live schema does not provide an authoritative replacement for historical Sadat MLS features.

## Public property data protection

The `properties` table is protected by:

- Row Level Security.
- A public SELECT policy restricted to `status = 'active'`.
- Column-level privileges for `anon` and `authenticated`.
- A public column allowlist that excludes internal provenance/identity fields.

The public contract includes listing fields such as title, description, property type, transaction type, status, geography, address, coordinates, area, bedrooms, bathrooms, floor, finishing, price, currency, features, and observed timestamps.

The following internal fields are not part of the public grant:

- `confidence`
- `parcel_number`
- `installments_clear`
- `canonical_key`

This boundary is enforced in the database, not only in application code.

## Supabase configuration

Browser and normal server-side Auth clients use the verified project URL and publishable key from:

`src/lib/supabase/public-config.ts`

The privileged key is never shipped to the browser. Server-only privileged operations read it from environment configuration.

## Authentication

Supabase Auth is the identity provider.

The application deliberately does **not** treat user-editable metadata as an authorization source. In particular, the following are not trusted for role checks:

- `user_metadata.role`
- `user_metadata.office_id`

The current live `people` table has no verified Auth identity column, so Auth ↔ business-person/organization mapping is not certified yet. Protected role-gated workflows therefore fail closed rather than accepting a forged client role.

## CSRF protection

State-changing public endpoints use a double-submit cookie pattern:

- Cookie: `csrf_token`
- Header: `x-csrf-token`
- Token format: timestamp + 32 cryptographically random bytes.
- Token validity: 24 hours.
- Comparison is performed using a fixed-length XOR loop.
- Production cookies use `Secure` and `SameSite=Lax`.

## Rate limiting

Current verified limits:

| Surface | Limit |
|---|---|
| Public property API | 60 requests / minute / IP |
| Health endpoint | 100 requests / minute / IP |
| Login rate-limit gate | 5 attempts / 15 minutes / IP |
| Forgot-password gate | 3 requests / hour / IP |
| Resend-verification | 5 requests / hour / IP |
| Contact submission | 5 requests / hour / IP |

Public property/health endpoints use bounded in-memory limiters so public reads do not depend on privileged Supabase credentials.

Protected operational endpoints use the database security rate-limit primitive and **fail closed** when that dependency is unavailable.

## Input validation and output handling

The application uses Zod for structured request validation, explicit maximum lengths on public input, and JSON-LD sanitization for structured metadata.

The contact flow escapes persisted visitor text before writing it to the Aqarat interaction model.

## Security boundaries that are intentionally not activated

The following historical features are not certified because the corresponding authoritative Aqarat contracts are not currently present:

- office/user RBAC based on the retired relational model;
- property image/storage persistence;
- favorite persistence;
- saved-search persistence;
- legacy office/admin/agent data workflows.

No compatibility tables or guessed relationships are introduced merely to make these features appear functional.

## Database advisory state

The connected Supabase security advisor currently reports only informational notices that `rate_limit_state` and `security_rate_limits` have RLS enabled without public policies. These tables are private operational state and are intentionally not exposed to `anon` or ordinary authenticated reads.

The performance advisor reports unused indexes. They are not removed solely because they are unused in the current low-volume dataset; deletion requires workload evidence.

## Reporting security issues

Do not include secrets, tokens, passwords, or privileged database keys in bug reports.

For private security issues, use the repository's configured private reporting mechanism where available. Do not publish exploit details for an unresolved vulnerability.

## Security rule

A security control is considered complete only when its application behavior and database boundary agree in production. When the authoritative contract is unknown, the default behavior is deny/fail-closed.
