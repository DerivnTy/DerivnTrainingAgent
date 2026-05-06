ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS average_steps integer,
  ADD COLUMN IF NOT EXISTS main_barriers text[],
  ADD COLUMN IF NOT EXISTS pain_or_injury_flag boolean,
  ADD COLUMN IF NOT EXISTS guidance_preference text[],
  ADD COLUMN IF NOT EXISTS nutrition_tags text[];