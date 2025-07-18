-- Migration: Update ai_settings table to match code expectations
-- This migration will:
--   1. Change access_level to TEXT (if not already)
--   2. Remove JSON/array usage and ensure one row per access level
--   3. Rename api_keys to api_key (if needed) and set as TEXT

-- 1. Change access_level to TEXT (if not already)
ALTER TABLE ai_settings
  ALTER COLUMN access_level TYPE TEXT USING access_level::text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='ai_settings' AND column_name='api_keys'
  ) THEN
    ALTER TABLE ai_settings RENAME COLUMN api_keys TO api_key;
  END IF;
END$$;

-- 2b. Ensure api_key is TEXT (not TEXT[])
ALTER TABLE ai_settings
  ALTER COLUMN api_key TYPE TEXT USING api_key::text;

-- 3. Remove all rows with JSON/array access_level and insert correct rows
DELETE FROM ai_settings WHERE access_level LIKE '{%';

-- Example: Insert a global (all) config row (edit values as needed)
INSERT INTO ai_settings (id, model, access_level, created_at, updated_at, api_key, current_index)
VALUES (
  gen_random_uuid(),
  'deepseek/deepseek-chat-v3-0324:free',
  'all',
  NOW(),
  NOW(),
  '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',
  0
);

-- Example: Insert a head-only config row (optional)
-- INSERT INTO ai_settings (id, model, access_level, created_at, updated_at, api_key, current_index)
-- VALUES (
--   gen_random_uuid(),
--   'deepseek/deepseek-chat-v3-0324:free',
--   'head',
--   NOW(),
--   NOW(),
--   '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',
--   0
-- );

-- Add more rows as needed for each role.
