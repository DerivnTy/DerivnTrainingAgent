
REVOKE EXECUTE ON FUNCTION public.owns_conversation(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_conversation(uuid, uuid) TO authenticated, service_role;
