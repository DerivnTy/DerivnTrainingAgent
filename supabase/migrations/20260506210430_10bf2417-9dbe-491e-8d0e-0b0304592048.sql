
-- Profiles: extend with onboarding fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS strength_days_per_week int,
  ADD COLUMN IF NOT EXISTS cardio_days_per_week int,
  ADD COLUMN IF NOT EXISTS time_per_session text,
  ADD COLUMN IF NOT EXISTS pain_notes text,
  ADD COLUMN IF NOT EXISTS nutrition_context text,
  ADD COLUMN IF NOT EXISTS other_notes text,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  openai_thread_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS conversations_user_id_updated_at_idx
  ON public.conversations (user_id, updated_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: avoid recursive RLS on messages
CREATE OR REPLACE FUNCTION public.owns_conversation(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id AND user_id = _user_id
  );
$$;

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx
  ON public.messages (conversation_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own messages"
  ON public.messages FOR SELECT
  USING (public.owns_conversation(conversation_id, auth.uid()));
CREATE POLICY "Users insert own messages"
  ON public.messages FOR INSERT
  WITH CHECK (public.owns_conversation(conversation_id, auth.uid()));
CREATE POLICY "Users update own messages"
  ON public.messages FOR UPDATE
  USING (public.owns_conversation(conversation_id, auth.uid()));
CREATE POLICY "Users delete own messages"
  ON public.messages FOR DELETE
  USING (public.owns_conversation(conversation_id, auth.uid()));

-- Usage
CREATE TABLE IF NOT EXISTS public.usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  input_tokens int NOT NULL DEFAULT 0,
  output_tokens int NOT NULL DEFAULT 0,
  total_tokens int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, billing_period_start)
);
CREATE INDEX IF NOT EXISTS usage_user_period_idx
  ON public.usage (user_id, billing_period_start);

ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Read-only for the user; writes happen via service role only
CREATE POLICY "Users select own usage"
  ON public.usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER usage_set_updated_at
  BEFORE UPDATE ON public.usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
