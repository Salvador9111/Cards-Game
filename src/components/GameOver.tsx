import { useState } from 'react'
import type { GameMode, GameStats } from '../game/types'
import { submitScore } from '../lib/leaderboard'

interface GameOverProps {
  stats: GameStats
  mode: GameMode
  gridSize: string
  scoreAI: number
  onPlayAgain: () => void
  onSubmitted: () => void
}

export function GameOver({
  stats,
  mode,
  gridSize,
  scoreAI,
  onPlayAgain,
  onSubmitted,
}: GameOverProps) {
  const [playerName, setPlayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!playerName.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await submitScore({
        playerName: playerName.trim(),
        mode,
        gridSize,
        moves: stats.moves,
        stars: stats.stars,
        streak: stats.streak,
        score: stats.score,
        result: stats.result,
      })
      setSubmitted(true)
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit score')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <h2 className="game-over-title">
          {stats.result === 'win'
            ? 'Victory'
            : stats.result === 'lose'
              ? 'Defeat'
              : 'Complete!'}
        </h2>
        <div className="game-over-stars">
          {'★'.repeat(stats.stars)}
          {'☆'.repeat(3 - stats.stars)}
        </div>
        <div className="game-over-stats">
          <div className="stat-row">
            <span>Score</span>
            <span className="stat-value">{stats.score}</span>
          </div>
          {mode === 'AIDuel' && (
            <div className="stat-row">
              <span>AI Score</span>
              <span className="stat-value">{scoreAI}</span>
            </div>
          )}
          <div className="stat-row">
            <span>Moves</span>
            <span className="stat-value">{stats.moves}</span>
          </div>
          <div className="stat-row">
            <span>Best Streak</span>
            <span className="stat-value">{stats.streak}</span>
          </div>
        </div>

        {!submitted ? (
          <div className="submit-section">
            <input
              className="name-input"
              type="text"
              maxLength={20}
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={submitting}
            />
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !playerName.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit to Leaderboard'}
            </button>
            {error && <p className="error-text">{error}</p>}
          </div>
        ) : (
          <p className="success-text">Score submitted to the global leaderboard!</p>
        )}

        <button className="btn btn-secondary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  )
}
