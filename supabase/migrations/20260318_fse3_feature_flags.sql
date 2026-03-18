-- Migration 3: FSE3 Feature Flags + Model Config + EM-Code Mapping
-- Inserts app_settings entries for FSE3 configuration.

-- FSE3 Feature Flag (empty user list = disabled for everyone)
INSERT INTO app_settings (key, value) VALUES
  ('fse3_enabled_users', '[]')
ON CONFLICT (key) DO NOTHING;

-- Model per pass (all on Gemini 2.5 Flash)
INSERT INTO app_settings (key, value) VALUES
  ('fse3_model_interpreter', '"gemini-2.5-flash"')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('fse3_model_pass0', '"gemini-2.5-flash"')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('fse3_model_pass1', '"gemini-2.5-flash"')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('fse3_model_pass2', '"gemini-2.5-flash"')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('fse3_model_pass3', '"gemini-2.5-flash"')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('fse3_model_pass4', '"gemini-2.5-flash"')
ON CONFLICT (key) DO NOTHING;

-- EM-Code Mapping (emotion codes used by Blueprint / Pass 0)
INSERT INTO app_settings (key, value) VALUES
  ('fse3_em_code_mapping', $JSON${
    "EM-H": {"label": "Humor", "description": "Absurd logic, deadpan, wordplay. Humor from character and situation."},
    "EM-T": {"label": "Thrill", "description": "Ticking clock, mounting dread, false leads. Threat must feel real."},
    "EM-J": {"label": "Joy", "description": "Triumph, celebration, warmth. Earned satisfaction."},
    "EM-W": {"label": "Warmth", "description": "Connection, comfort, empathy. Relationships matter."},
    "EM-D": {"label": "Depth", "description": "Growth, reflection, moral complexity. Inner world."},
    "EM-C": {"label": "Curiosity", "description": "Discovery, wonder, mystery. What lies beyond?"}
  }$JSON$)
ON CONFLICT (key) DO NOTHING;

-- Variant C Tone Alternation (toggles between empathy/wonder per story count)
INSERT INTO app_settings (key, value) VALUES
  ('fse3_variant_c_tones', $JSON$[
    {"key": "empathy", "label_de": "Gefühlvoll", "label_en": "Emotional", "description": "Emotional, touching — friendship, courage, inner growth"},
    {"key": "wonder", "label_de": "Staunend", "label_en": "Wondrous", "description": "Wondrous, mysterious — discovery, magic, the unexpected"}
  ]$JSON$)
ON CONFLICT (key) DO NOTHING;
