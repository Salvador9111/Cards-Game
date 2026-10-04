export type GameMode = 'ZenSolitaire' | 'AIDuel'
export type CardState = 'FaceDown' | 'Flipping' | 'FaceUp' | 'Matched'
export type GameResult = 'win' | 'lose' | 'solo' | 'incomplete'

export interface CardData {
  id: number
  symbolId: number
  state: CardState
}

export interface LeaderboardEntry {
  id: string
  player_name: string
  mode: GameMode
  grid_size: string
  moves: number
  stars: number
  streak: number
  score: number
  result: string
  created_at: string
}

export interface GameStats {
  moves: number
  streak: number
  maxStreak: number
  stars: number
  score: number
  result: GameResult
}

export interface GridConfig {
  cols: number
  rows: number
  label: string
}
