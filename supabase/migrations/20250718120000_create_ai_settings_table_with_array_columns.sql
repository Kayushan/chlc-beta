
-- Migration: create_ai_settings_table_with_jsonb_access_level_and_uuid
-- This migration creates the ai_settings table with jsonb access_level, uuid PK, and other fields matching your current structure

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NULL DEFAULT 'gpt-3.5-turbo'::text,
  access_level jsonb NULL DEFAULT '{"head": true, "admin": true, "creator": true, "teacher": false}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  api_keys text[] NULL DEFAULT '{}'::text[],
  current_index integer NULL DEFAULT 0
);

-- Drop the trigger if it exists, but do NOT drop the function (it may be shared)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_settings_updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON ai_settings;
    END IF;
END $$;

-- Create the function only if it does not exist (shared by other tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
        EXECUTE '
            CREATE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS ''
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            '' LANGUAGE plpgsql;
        ';
    END IF;
END $$;

CREATE TRIGGER update_ai_settings_updated_at
BEFORE UPDATE ON ai_settings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
