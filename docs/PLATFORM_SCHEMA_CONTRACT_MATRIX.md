# Platform Schema Contract Matrix

## Verified status — 2026-09-18

This matrix is the current decision record for the connected Aqarat OS schema. It is descriptive and evidence-based; it does not authorize speculative compatibility changes.

## Current verified observations

- The connected Supabase production database follows the Aqarat OS migration lineage.
- `properties` exposes the active property contract used by the public application.
- `people` contains business-person data but no verified Auth identity field.
- No live relations matching `offices`, `public.users`, `zones`, `property_types`, `property_images`, or `property_favorites` are present.
- `rate_limit_state` and `security_rate_limits` both exist and are private RLS-enabled operational tables.
- `increment_rate_limit(text, inet, timestamptz)` and `increment_security_rate_limit(text, inet, timestamptz)` both exist.
- Public runtime primitives `increment_public_rate_limit(text, text)` and `submit_public_contact(uuid, text, text, text, text, text, text)` exist and are restricted to `anon` execution.

## Contract matrix

| Historical assumption | Verified live observation | Current decision | Certified path |
|---|---|---|---|
| `offices` | No live relation | Retired / redesign required | None |
| `public.users` | No live relation | Retired / redesign required | Supabase Auth for identity only |
| `zones` | No live relation | Retired / redesign required | `city` / `district` / `neighborhood` |
| `property_types` | No live relation | Retired / redesign required | `properties.property_type` |
| `property_images` | No live relation | Redesign required | Placeholder media only |
| `property_owners` | No live relation | Replaced | `people` + `property_people` + provenance |
| `contact_requests` | No live relation | Replaced | `interactions` + `contacts` + `people` |
| `property_favorites` | No live relation | Unresolved | Not persisted |
| `rate_limit_state` | Present, RLS enabled, no public policy | Private operational state | Not exposed publicly |
| `security_rate_limits` | Present, RLS enabled, no public policy | Preferred protected primitive | Used by protected API rate limiting |
| `properties.status = 'available'` | Live enum uses `active`/other Aqarat values | Breaking mismatch resolved | Active reads use `active` |
| `properties.is_active` | No live column | Breaking mismatch resolved | Not used |
| `properties.area` | Live column is `area_m2` | Breaking mismatch resolved | `area_m2` |
| `properties.zone_id` | No live column | Breaking mismatch resolved | Geography fields |
| `properties.property_type_id` | No live column | Breaking mismatch resolved | `property_type` |
| `properties.office_id` | No live column | Breaking mismatch resolved | No office attribution assumed |
| Legacy office/user joins | No equivalent verified | Retired | No guessed join |

## Public property read contract

Public reads are granted only for approved listing fields and only when `status = 'active'`.

Internal fields excluded from the public grant:

`confidence`, `parcel_number`, `installments_clear`, `canonical_key`.

Public contact persistence is implemented through the constrained `submit_public_contact(...)` SECURITY DEFINER RPC, with execution restricted to `anon`. Public auth/CSRF/CSP/contact rate limiting uses the constrained `increment_public_rate_limit(...)` RPC. Neither RPC grants direct table access.

## Migration history

The public property contract is registered in Supabase as:

`20260918152055_public_property_read_contract`

The repository contains the same migration version.

## Remaining work rule

The unresolved rows above do not become implementation tasks until an authoritative Aqarat contract exists. Once available, implement them forward against that contract rather than resurrecting the retired schema.

## Safety rules

- No compatibility tables solely for tests.
- No E2E weakening.
- No user-metadata role inference.
- No speculative storage/media mapping.
- No speculative favorite ownership model.
