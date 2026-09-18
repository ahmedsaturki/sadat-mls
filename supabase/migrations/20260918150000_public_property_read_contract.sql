-- Public, read-only property projection for the website.
-- Keeps public clients away from the full properties table and internal fields.

create or replace function public.get_public_active_properties(
  p_property_id uuid default null,
  p_query text default null,
  p_property_type text default null,
  p_district text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_area numeric default null,
  p_max_area numeric default null,
  p_sort text default 'newest',
  p_limit integer default 48,
  p_offset integer default 0
)
returns table (
  id uuid, title text, description text, property_type text,
  transaction_type public.property_transaction_type, status public.property_status,
  city text, district text, neighborhood text, address text,
  latitude double precision, longitude double precision, area_m2 numeric,
  bedrooms integer, bathrooms integer, floor text, finishing text,
  price numeric, currency text, features jsonb,
  first_seen_at timestamptz, last_seen_at timestamptz,
  created_at timestamptz, updated_at timestamptz, total_count bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p.id, p.title, p.description, p.property_type, p.transaction_type, p.status,
    p.city, p.district, p.neighborhood, p.address, p.latitude, p.longitude,
    p.area_m2, p.bedrooms, p.bathrooms, p.floor, p.finishing, p.price, p.currency,
    p.features, p.first_seen_at, p.last_seen_at, p.created_at, p.updated_at,
    count(*) over() as total_count
  from public.properties p
  where p.status = 'active'::public.property_status
    and (p_property_id is null or p.id = p_property_id)
    and (
      p_query is null
      or strpos(lower(coalesce(p.title, '')), lower(p_query)) > 0
      or strpos(lower(coalesce(p.description, '')), lower(p_query)) > 0
      or strpos(lower(coalesce(p.district, '')), lower(p_query)) > 0
      or strpos(lower(coalesce(p.neighborhood, '')), lower(p_query)) > 0
    )
    and (p_property_type is null or p.property_type = p_property_type)
    and (p_district is null or p.district = p_district)
    and (p_min_price is null or p.price >= p_min_price)
    and (p_max_price is null or p.price <= p_max_price)
    and (p_min_area is null or p.area_m2 >= p_min_area)
    and (p_max_area is null or p.area_m2 <= p_max_area)
  order by
    case when coalesce(p_sort, 'newest') = 'price_low' then p.price end asc nulls last,
    case when coalesce(p_sort, 'newest') = 'price_high' then p.price end desc nulls last,
    case when coalesce(p_sort, 'newest') = 'area' then p.area_m2 end desc nulls last,
    p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 48), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

revoke all on function public.get_public_active_properties(
  uuid, text, text, text, numeric, numeric, numeric, numeric, text, integer, integer
) from public;

grant execute on function public.get_public_active_properties(
  uuid, text, text, text, numeric, numeric, numeric, numeric, text, integer, integer
) to anon, authenticated;
