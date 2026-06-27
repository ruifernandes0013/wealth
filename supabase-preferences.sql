-- Migration: user_preferences — one row per user per year
-- Run this in the Supabase SQL editor.

-- Drop the old single-row-per-user table and recreate with per-year PK
DROP TABLE IF EXISTS user_preferences;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  selected_month integer NOT NULL DEFAULT EXTRACT(MONTH FROM NOW()),
  PRIMARY KEY (user_id, year)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_preferences'
    AND policyname = 'Users can manage own preferences'
  ) THEN
    CREATE POLICY "Users can manage own preferences"
      ON user_preferences FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
