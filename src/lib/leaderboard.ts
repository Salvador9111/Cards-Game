import { supabase } from '../lib/supabase'
import type { LeaderboardEntry, GameMode, GameResult } from '../game/types'

export async function fetchLeaderboard(
  mode: GameMode,
  gridSize: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('mode', mode)
    .eq('grid_size', gridSize)
    .order('score', { ascending: false })
    .order('moves', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to load leaderboard: ${error.message}`)
  }
  return (data ?? []) as LeaderboardEntry[]
}

export async function submitScore(params: {
  playerName: string
  mode: GameMode
  gridSize: string
  moves: number
  stars: number
  streak: number
  score: number
  result: GameResult
}): Promise<LeaderboardEntry | null> {
  const { data, error } = await supabase
    .from('leaderboard')
    .insert({
      player_name: params.playerName,
      mode: params.mode,
      grid_size: params.gridSize,
      moves: params.moves,
      stars: params.stars,
      streak: params.streak,
      score: params.score,
      result: params.result,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to submit score: ${error.message}`)
  }
  return data as LeaderboardEntry
}
