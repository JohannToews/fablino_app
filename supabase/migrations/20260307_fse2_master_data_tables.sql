-- FSE2 Phase 1: Master Data Tables
-- Creates 4 new tables for the FSE2 (Story Engine 2) pipeline.
-- Does NOT modify any existing tables.

------------------------------------------------------------
-- 1. story_levels
------------------------------------------------------------
CREATE TABLE public.story_levels (
  id                    integer PRIMARY KEY,
  label                 jsonb,
  description           jsonb,
  max_plot_twists       integer,
  max_characters        integer,
  allow_subplot         boolean,
  plot_complexity       text,
  cliffhanger_allowed   boolean,
  max_sentence_length   integer,
  sentence_structures   text,
  allowed_tenses        text[],
  tense_switch_allowed  boolean,
  allow_foreign_words   text,
  dialogue_ratio        text,
  paragraph_length      text,
  new_words_per_story   integer,
  figurative_language   text,
  idiom_usage           text,
  repetition_strategy   text,
  narrative_perspective text
);

------------------------------------------------------------
-- 2. story_length_levels
------------------------------------------------------------
CREATE TABLE public.story_length_levels (
  complexity_level  integer,
  length_level      integer,
  paragraph_count   integer,
  word_approx       integer,
  PRIMARY KEY (complexity_level, length_level)
);

INSERT INTO public.story_length_levels (complexity_level, length_level, paragraph_count, word_approx) VALUES
  (1,1,4,40),  (1,2,5,50),  (1,3,6,60),  (1,4,7,70),  (1,5,8,80),
  (2,1,5,105), (2,2,6,126), (2,3,7,147), (2,4,8,168), (2,5,9,189),
  (3,1,6,192), (3,2,7,224), (3,3,8,256), (3,4,9,288), (3,5,10,320),
  (4,1,7,350), (4,2,8,400), (4,3,9,450), (4,4,10,500),(4,5,11,550),
  (5,1,8,528), (5,2,9,594), (5,3,10,660),(5,4,11,726),(5,5,12,792);

------------------------------------------------------------
-- 3. kid_language_settings
------------------------------------------------------------
CREATE TABLE public.kid_language_settings (
  kid_profile_id    uuid REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  language          text,
  language_class    integer,
  language_level    integer,
  content_level     integer,
  length_level      integer DEFAULT 1,
  PRIMARY KEY (kid_profile_id, language)
);

------------------------------------------------------------
-- 4. age_level_defaults
------------------------------------------------------------
CREATE TABLE public.age_level_defaults (
  age            integer PRIMARY KEY,
  default_level  integer
);

INSERT INTO public.age_level_defaults (age, default_level) VALUES
  (6,1),(7,2),(8,3),(9,4),(10,5);
