create or replace function public.submit_public_contact(
  p_property_id uuid,
  p_contact_type text,
  p_visitor_name text,
  p_visitor_phone text,
  p_visitor_email text,
  p_message text,
  p_client_ip text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate jsonb;
  v_property_id uuid;
  v_person_id uuid;
  v_interaction_id uuid;
  v_name text;
  v_phone text;
  v_email text;
  v_message text;
  v_ip text;
  v_normalized_phone text;
  v_contact_type text := lower(trim(coalesce(p_contact_type, '')));
begin
  if v_contact_type not in ('whatsapp', 'phone', 'email') then
    raise exception using errcode = '22023', message = 'Invalid contact type';
  end if;
  if char_length(trim(coalesce(p_visitor_name, ''))) < 1
     or char_length(trim(p_visitor_name)) > 100 then
    raise exception using errcode = '22023', message = 'Invalid visitor name';
  end if;
  if char_length(coalesce(p_visitor_phone, '')) > 50 then
    raise exception using errcode = '22023', message = 'Invalid visitor phone';
  end if;
  if char_length(coalesce(p_visitor_email, '')) > 255 then
    raise exception using errcode = '22023', message = 'Invalid visitor email';
  end if;
  if p_visitor_email is not null
     and trim(p_visitor_email) <> ''
     and trim(p_visitor_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using errcode = '22023', message = 'Invalid visitor email';
  end if;
  if char_length(trim(coalesce(p_message, ''))) < 1
     or char_length(p_message) > 1000 then
    raise exception using errcode = '22023', message = 'Invalid message';
  end if;

  v_rate := public.increment_public_rate_limit('contact-post', p_client_ip);
  if coalesce((v_rate->>'allowed')::boolean, false) = false then
    return jsonb_build_object(
      'success', false,
      'error', 'rate_limited',
      'remaining', 0,
      'retryAfter', greatest(1, coalesce((v_rate->>'retryAfter')::integer, 30)),
      'resetAt', coalesce(
        (v_rate->>'resetAt')::bigint,
        extract(epoch from now() + interval '30 seconds')::bigint
      )
    );
  end if;

  if p_property_id is not null then
    select id into v_property_id
      from public.properties
     where id = p_property_id
       and status = 'active'
     limit 1;
    if v_property_id is null then
      return jsonb_build_object('success', false, 'error', 'property_not_found');
    end if;
  end if;

  v_name := replace(replace(replace(replace(replace(trim(p_visitor_name), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;');
  v_phone := case
    when p_visitor_phone is null or trim(p_visitor_phone) = '' then null
    else replace(replace(replace(replace(replace(trim(p_visitor_phone), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;')
  end;
  v_email := case
    when p_visitor_email is null or trim(p_visitor_email) = '' then null
    else replace(replace(replace(replace(replace(lower(trim(p_visitor_email)), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;')
  end;
  v_message := replace(replace(replace(replace(replace(trim(p_message), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;');
  v_ip := case
    when p_client_ip is null or trim(p_client_ip) = '' or trim(p_client_ip) = 'unknown' then '0.0.0.0'
    else trim(p_client_ip)
  end;

  insert into public.people(full_name, role, notes, confidence)
  values (
    v_name,
    'unknown'::person_role,
    'Public contact request (' || v_contact_type || ')',
    1
  )
  returning id into v_person_id;

  if v_email is not null then
    insert into public.contacts(
      person_id, contact_type, value, normalized_value, is_primary, verified, confidence
    )
    values (
      v_person_id, 'email', v_email, lower(v_email),
      v_contact_type = 'email', false, 1
    );
  end if;

  if v_phone is not null then
    v_normalized_phone := regexp_replace(v_phone, '[^0-9]', '', 'g');
    insert into public.contacts(
      person_id, contact_type, value, normalized_value, is_primary, verified, confidence
    )
    values (
      v_person_id,
      case when v_contact_type = 'whatsapp' then 'whatsapp' else 'phone' end,
      v_phone,
      v_normalized_phone,
      v_contact_type <> 'email',
      false,
      1
    );
  end if;

  insert into public.interactions(
    person_id, property_id, channel, interaction_type, direction, payload, observed_at
  )
  values (
    v_person_id,
    v_property_id,
    v_contact_type,
    'contact_request',
    'inbound',
    jsonb_build_object(
      'visitor_name', v_name,
      'visitor_email', v_email,
      'visitor_phone', v_phone,
      'message', v_message,
      'source', 'public_contact_form',
      'ip', v_ip
    ),
    now()
  )
  returning id into v_interaction_id;

  return jsonb_build_object(
    'success', true,
    'id', v_interaction_id,
    'remaining', greatest(0, coalesce((v_rate->>'remaining')::integer, 0)),
    'retryAfter', greatest(0, coalesce((v_rate->>'retryAfter')::integer, 0)),
    'resetAt', coalesce(
      (v_rate->>'resetAt')::bigint,
      extract(epoch from now())::bigint
    )
  );
end;
$$;

revoke all on function public.submit_public_contact(uuid, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.submit_public_contact(uuid, text, text, text, text, text, text)
  to anon, authenticated;