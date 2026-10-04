/*
# Create leaderboard table for Atelier Memory Match

1. New Tables
- `leaderboard`
  - `id` (uuid, primary key, auto-generated)
  - `player_name` (text, not null — the name the player enters)
  - `mode` (text, not null — 'ZenSolitaire' or 'AIDuel')
  - `grid_size` (text, not null — e.g. '4x4', '4x6')
  - `moves` (integer, not null — number of moves taken)
  - `stars` (integer, not null — 1-3 star rating)
  - `streak` (integer, not null — best streak in the game)
  - `score` (integer, not null — final score)
  - `result` (text, not null — 'win', 'lose', or 'solo')
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `leaderboard`.
- Allow anon + authenticated to read all leaderboard entries (public ranking).
- Allow anon + authenticated to insert new scores (no sign-in required).
- No updates or deletes — scores are immutable once submitted.
3. Indexes
- Index on (mode, grid_size, score DESC) for efficient leaderboard queries.
- Index on created_at for recency queries.
*/

CREATE TABLE IF NOT EXISTS leaderboard (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name text NOT NULL CHECK (length(player_name) BETWEEN 1 AND 20),
    mode text NOT NULL DEFAULT 'ZenSolitaire',
    grid_size text NOT NULL DEFAULT '4x4',
    moves integer NOT NULL CHECK (moves >= 0),
    stars integer NOT NULL CHECK (stars BETWEEN 1 AND 3),
    streak integer NOT NULL DEFAULT 0,
    score integer NOT NULL DEFAULT 0,
    result text NOT NULL DEFAULT 'solo',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leaderboard" ON leaderboard;
CREATE POLICY "anon_select_leaderboard"
ON leaderboard FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leaderboard" ON leaderboard;
CREATE POLICY "anon_insert_leaderboard"
ON leaderboard FOR INSERT
TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leaderboard_mode_grid_score
ON leaderboard (mode, grid_size, score DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at
ON leaderboard (created_at DESC);
