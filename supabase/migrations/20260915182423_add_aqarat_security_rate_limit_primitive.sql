create table if not exists public.security_rate_limits (
  action text not null,
  ip inet not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (action, ip, window_start),
  constraint security_rate_limits_request_count_nonnegative check (request_count >= 0)
);

alter table public.security_rate_limits enable row level security;

create or replace function public.increment_security_rate_limit(p_action text, p_ip inet, p_window_start timestamptz)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.security_rate_limits(action, ip, window_start, request_count, updated_at)
  values (p_action, p_ip, p_window_start, 1, now())
  on conflict (action, ip, window_start)
  do update set request_count = public.security_rate_limits.request_count + 1,
                updated_at = now()
  returning request_count into v_count;
  return v_count;
end;
$$;

revoke all on public.security_rate_limits from anon, authenticated;
revoke all on function public.increment_security_rate_limit(text, inet, timestamptz) from public, anon, authenticated;
grant execute on function public.increment_security_rate_limit(text, inet, timestamptz) to service_role;
