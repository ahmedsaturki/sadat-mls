revoke execute on function public.increment_public_rate_limit(text, text) from authenticated;
revoke execute on function public.submit_public_contact(uuid, text, text, text, text, text, text) from authenticated;
grant execute on function public.increment_public_rate_limit(text, text) to anon;
grant execute on function public.submit_public_contact(uuid, text, text, text, text, text, text) to anon;