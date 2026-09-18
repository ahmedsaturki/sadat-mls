-- Public browsing access for active properties.
-- RLS permits only active rows and column grants prevent access to internal fields.

drop policy if exists deny_direct_properties on public.properties;
drop policy if exists public_read_active_properties on public.properties;

create policy public_read_active_properties
on public.properties
for select
to anon, authenticated
using (status = 'active'::public.property_status);

revoke all on public.properties from anon, authenticated;

grant select (
  id, title, description, property_type, transaction_type, status,
  city, district, neighborhood, address, latitude, longitude, area_m2,
  bedrooms, bathrooms, floor, finishing, price, currency, features,
  first_seen_at, last_seen_at, created_at, updated_at
) on public.properties to anon, authenticated;
