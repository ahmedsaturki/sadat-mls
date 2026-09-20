create or replace function public.increment_public_rate_limit(
  p_action text,
  p_client_ip text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text := lower(trim(coalesce(p_action, '')));
  v_client_ip inet;
  v_gateway_ip inet;
  v_headers jsonb;
  v_window_seconds integer;
  v_max_requests integer;
  v_gateway_max_requests integer := 5000;
  v_window_start timestamptz;
  v_client_count integer;
  v_gateway_count integer;
  v_reset_at timestamptz;
begin
  case v_action
    when 'login' then
      v_window_seconds := 15 * 60;
      v_max_requests := 5;
    when 'forgot' then
      v_window_seconds := 60 * 60;
      v_max_requests := 3;
    when 'resend' then
      v_window_seconds := 60 * 60;
      v_max_requests := 5;
    when 'csrf-token' then
      v_window_seconds := 60;
      v_max_requests := 100;
    when 'csp-report' then
      v_window_seconds := 60;
      v_max_requests := 100;
    when 'contact-post' then
      v_window_seconds := 60 * 60;
      v_max_requests := 5;
    else
      raise exception using
        errcode = '22023',
        message = 'Unsupported public rate-limit action';
  end case;

  begin
    v_client_ip := coalesce(nullif(trim(p_client_ip), '')::inet, '0.0.0.0'::inet);
  exception
    when others then
      v_client_ip := '0.0.0.0'::inet;
  end;

  v_headers := coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb,
    '{}'::jsonb
  );

  begin
    v_gateway_ip := coalesce(
      nullif(v_headers->>'cf-connecting-ip', ''),
      nullif(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1), ''),
      nullif(v_headers->>'x-real-ip', ''),
      '0.0.0.0'
    )::inet;
  exception
    when others then
      v_gateway_ip := '0.0.0.0'::inet;
  end;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / v_window_seconds) * v_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => v_window_seconds);

  insert into public.security_rate_limits(action, ip, window_start, request_count, updated_at)
  values (v_action, v_client_ip, v_window_start, 1, now())
  on conflict (action, ip, window_start)
  do update set
    request_count = public.security_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_client_count;

  insert into public.security_rate_limits(action, ip, window_start, request_count, updated_at)
  values ('__gateway__:' || v_action, v_gateway_ip, v_window_start, 1, now())
  on conflict (action, ip, window_start)
  do update set
    request_count = public.security_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_gateway_count;

  if random() < 0.01 then
    delete from public.security_rate_limits
    where window_start < now() - interval '2 hours'
      and (action = v_action or action = '__gateway__:' || v_action);
  end if;

  return jsonb_build_object(
    'allowed', v_client_count <= v_max_requests and v_gateway_count <= v_gateway_max_requests,
    'remaining', greatest(
      0,
      least(v_max_requests - v_client_count, v_gateway_max_requests - v_gateway_count)
    ),
    'retryAfter', greatest(
      1,
      ceil(extract(epoch from (v_reset_at - now())))::integer
    ),
    'resetAt', extract(epoch from v_reset_at)::bigint
  );
end;
$$;

revoke all on function public.increment_public_rate_limit(text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.increment_public_rate_limit(text, text)
  to anon, authenticated;