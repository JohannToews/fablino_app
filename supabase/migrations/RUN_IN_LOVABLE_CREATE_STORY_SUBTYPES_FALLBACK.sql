-- =============================================================================
-- Lovable FALLBACK: Nur story_subtypes anlegen (ohne story_subtype_history)
-- Nutzen wenn RUN_IN_LOVABLE_CREATE_STORY_SUBTYPES.sql fehlschlaegt wegen:
--   relation "user_roles" / "kid_profiles" / "stories" does not exist
--   oder function update_updated_at_column() does not exist.
-- Enthaelt: Tabelle story_subtypes, einfache RLS (kein user_roles), kein Trigger,
--   keine story_subtype_history, gleicher Seed (~42 Subtypes).
-- Danach: story_subtypes-Uebersetzungen aus RUN_IN_LOVABLE_ONLY_2_TO_10.sql
--   (Block "20260223_translations_story_subtypes") in Lovable ausfuehren.
-- =============================================================================

create table if not exists story_subtypes (
  id uuid default gen_random_uuid() primary key,
  theme_key text not null,
  subtype_key text not null,
  labels jsonb not null,
  descriptions jsonb not null,
  age_groups text[] not null,
  weight integer default 10,
  is_active boolean default true,
  prompt_hint_en text not null,
  setting_ideas jsonb default '[]',
  title_seeds jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(theme_key, subtype_key)
);

create index if not exists idx_story_subtypes_theme_age on story_subtypes using gin (age_groups);
create index if not exists idx_story_subtypes_theme_key on story_subtypes (theme_key);

alter table story_subtypes enable row level security;

create policy "Authenticated can read story_subtypes"
  on story_subtypes for select to authenticated using (true);

create policy "Authenticated can modify story_subtypes"
  on story_subtypes for all to authenticated using (true) with check (true);

-- SEED: In RUN_IN_LOVABLE_CREATE_STORY_SUBTYPES.sql ab Zeile 91 (── SEED DATA)
-- bis Ende kopieren und in Lovable als zweites ausfuehren. Oder die komplette
-- Hauptdatei bis auf die Abschnitte "story_subtype_history" und "Only admins
-- can modify" zuerst ausfuehren, dann diese Fallback-Datei nur fuer Tabelle+RLS.
