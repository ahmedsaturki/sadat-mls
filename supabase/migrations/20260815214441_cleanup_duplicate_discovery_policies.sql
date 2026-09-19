BEGIN;

DROP POLICY IF EXISTS deny_discovery_permission_evidence_anon ON public.discovery_permission_evidence;

DROP POLICY IF EXISTS deny_discovery_permission_evidence_auth ON public.discovery_permission_evidence;

COMMIT;