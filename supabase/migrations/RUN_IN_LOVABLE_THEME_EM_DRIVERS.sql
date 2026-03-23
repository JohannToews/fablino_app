-- =============================================================================
-- Theme → Emotional Driver Config
-- Two new app_settings keys for the Theme → em_driver → Path filtering flow
-- =============================================================================

-- 1a. Theme → erlaubte em_drivers
INSERT INTO app_settings (key, value) VALUES ('fse3_theme_em_drivers', '{
  "fantasy": ["spannung", "humor", "staunen"],
  "action": ["spannung", "humor", "staunen"],
  "everyday": ["gefühl", "humor", "spannung"]
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 1b. em_driver Config (Emoji, Labels, EM-Codes)
INSERT INTO app_settings (key, value) VALUES ('fse3_em_driver_config', '{
  "spannung": {
    "emoji": "⚡",
    "em_codes": ["EM-T"],
    "primary_driver": "suspense",
    "labels": {
      "de": "Spannend",
      "fr": "Palpitant",
      "en": "Thrilling",
      "es": "Emocionante",
      "nl": "Spannend",
      "it": "Emozionante"
    },
    "description": "Nervenkitzel, Gefahr, Zeitdruck"
  },
  "humor": {
    "emoji": "😂",
    "em_codes": ["EM-H"],
    "primary_driver": "humor",
    "labels": {
      "de": "Lustig",
      "fr": "Drôle",
      "en": "Funny",
      "es": "Divertido",
      "nl": "Grappig",
      "it": "Divertente"
    },
    "description": "Chaos, Missgeschicke, alles geht komisch schief"
  },
  "gefühl": {
    "emoji": "❤️",
    "em_codes": ["EM-W", "EM-D"],
    "primary_driver": "empathy",
    "labels": {
      "de": "Herzerwärmend",
      "fr": "Émouvant",
      "en": "Heartwarming",
      "es": "Conmovedor",
      "nl": "Hartverwarmend",
      "it": "Commovente"
    },
    "description": "Freundschaft, Zusammenhalt, inneres Wachstum"
  },
  "staunen": {
    "emoji": "✨",
    "em_codes": ["EM-C", "EM-J"],
    "primary_driver": "adventure",
    "labels": {
      "de": "Magisch",
      "fr": "Magique",
      "en": "Magical",
      "es": "Mágico",
      "nl": "Magisch",
      "it": "Magico"
    },
    "description": "Entdeckung, Wunder, neue Welten"
  }
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
