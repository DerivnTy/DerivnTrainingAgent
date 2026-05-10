ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own admin row"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);