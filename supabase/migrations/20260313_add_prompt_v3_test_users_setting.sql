-- Add prompt_v3_test_users setting for V3 prompt feature flag.
-- Value: JSON array of user UUIDs, e.g. ["uuid-1","uuid-2"] or ["*"] for all users.
-- Empty array = V3 disabled for everyone (default).
INSERT INTO app_settings (key, value)
VALUES ('prompt_v3_test_users', '[]')
ON CONFLICT (key) DO NOTHING;
