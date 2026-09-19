# Supabase migration source of truth

This directory is the executable schema lineage for the Sadat MLS / Aqarat OS production database.

- Production project: `aaxauqznfhcvgevfczye`
- Verified production migration records: 41
- Verified repository migrations: 41
- Verification method: Git blob SHA computed from each production migration statement and compared with the checked-in file blob SHA.
- Result: 41/41 exact matches.
- Historical 2024 Sadat MLS migrations are not executable in this repository.
- Legacy seed/helper SQL was removed from the executable path; `[db.seed]` is disabled in `supabase/config.toml`.
- Do not run `supabase db reset --linked`, `supabase migration repair`, or destructive production schema operations as part of local reproducibility work.

Future schema changes must be recorded as versioned migrations and verified against the target environment before merge.
