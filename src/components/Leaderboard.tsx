import { useState, useEffect } from 'react'
import type { LeaderboardEntry, GameMode } from '../game/types'
import { fetchLeaderboard } from '../lib/leaderboard'

interface LeaderboardProps {
  mode: GameMode
  gridSize: string
}

export function Leaderboard({ mode, gridSize }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchLeaderboard(mode, gridSize, 10)
      .then((data) => {
        if (!cancelled) {
          setEntries(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [mode, gridSize])

  if (loading) {
    return (
      <div className="leaderboard">
        <h3 className="leaderboard-title">Global Leaderboard</h3>
        <p className="leaderboard-empty">Loading rankings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="leaderboard">
        <h3 className="leaderboard-title">Global Leaderboard</h3>
        <p className="leaderboard-error">{error}</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="leaderboard">
        <h3 className="leaderboard-title">Global Leaderboard</h3>
        <p className="leaderboard-empty">
          No scores yet — be the first to make the board!
        </p>
      </div>
    )
  }

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">Global Leaderboard</h3>
      <div className="leaderboard-list">
        {entries.map((entry, i) => (
          <div key={entry.id} className="leaderboard-row">
            <span className="leaderboard-rank">
              {i === 0 ? '①' : i === 1 ? '②' : i === 2 ? '③' : `${i + 1}.`}
            </span>
            <span className="leaderboard-name">{entry.player_name}</span>
            <span className="leaderboard-stars">
              {'★'.repeat(entry.stars)}
              {'☆'.repeat(3 - entry.stars)}
            </span>
            <span className="leaderboard-score">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
