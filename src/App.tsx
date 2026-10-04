import { useState, useEffect, useCallback } from 'react'
import { useGame } from './game/useGame'
import { Board } from './components/Board'
import { Leaderboard } from './components/Leaderboard'
import { GameOver } from './components/GameOver'
import type { GameMode } from './game/types'

const GRID_OPTIONS = [
  { cols: 4, rows: 4, label: '4×4' },
  { cols: 4, rows: 6, label: '4×6' },
  { cols: 6, rows: 6, label: '6×6' },
]

export default function App() {
  const { state, build, onCardTap, getStats } = useGame()
  const [selectedMode, setSelectedMode] = useState<GameMode>('ZenSolitaire')
  const [selectedGrid, setSelectedGrid] = useState(0)
  const [showMenu, setShowMenu] = useState(true)
  const [leaderboardKey, setLeaderboardKey] = useState(0)

  const startGame = useCallback(() => {
    const g = GRID_OPTIONS[selectedGrid]
    build(selectedMode, g.cols, g.rows)
    setShowMenu(false)
  }, [selectedMode, selectedGrid, build])

  const playAgain = useCallback(() => {
    const g = GRID_OPTIONS[selectedGrid]
    build(selectedMode, g.cols, g.rows)
  }, [selectedMode, selectedGrid, build])

  const backToMenu = useCallback(() => {
    setShowMenu(true)
  }, [])

  const onScoreSubmitted = useCallback(() => {
    setLeaderboardKey((k) => k + 1)
  }, [])

  if (showMenu) {
    return (
      <div className="app">
        <div className="menu-screen">
          <div className="menu-content">
            <h1 className="menu-title">Atelier</h1>
            <p className="menu-subtitle">Memory Match</p>

            <div className="menu-section">
              <label className="menu-label">Game Mode</label>
              <div className="mode-buttons">
                <button
                  className={`mode-btn ${selectedMode === 'ZenSolitaire' ? 'active' : ''}`}
                  onClick={() => setSelectedMode('ZenSolitaire')}
                >
                  <span className="mode-btn-title">Zen Solitaire</span>
                  <span className="mode-btn-desc">Find all pairs solo</span>
                </button>
                <button
                  className={`mode-btn ${selectedMode === 'AIDuel' ? 'active' : ''}`}
                  onClick={() => setSelectedMode('AIDuel')}
                >
                  <span className="mode-btn-title">AI Duel</span>
                  <span className="mode-btn-desc">Compete against the AI</span>
                </button>
              </div>
            </div>

            <div className="menu-section">
              <label className="menu-label">Board Size</label>
              <div className="grid-buttons">
                {GRID_OPTIONS.map((g, i) => (
                  <button
                    key={g.label}
                    className={`grid-btn ${selectedGrid === i ? 'active' : ''}`}
                    onClick={() => setSelectedGrid(i)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-large" onClick={startGame}>
              Start Game
            </button>
          </div>

          <Leaderboard
            key={leaderboardKey}
            mode={selectedMode}
            gridSize={GRID_OPTIONS[selectedGrid].label.replace('×', 'x')}
          />
        </div>
      </div>
    )
  }

  const stats = getStats()
  const pairs = (state.cols * state.rows) / 2

  return (
    <div className="app">
      <div className="game-screen">
        <header className="game-header">
          <button className="btn btn-ghost" onClick={backToMenu}>
            ← Menu
          </button>
          <div className="hud">
            <div className="hud-item">
              <span className="hud-label">Moves</span>
              <span className="hud-value">{state.moves}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Streak</span>
              <span className="hud-value">{state.streak}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Pairs</span>
              <span className="hud-value">
                {state.matchedPairs}/{pairs}
              </span>
            </div>
            {state.mode === 'AIDuel' && (
              <>
                <div className="hud-item">
                  <span className="hud-label">You</span>
                  <span className="hud-value">{state.scorePlayer}</span>
                </div>
                <div className="hud-item">
                  <span className="hud-label">AI</span>
                  <span className="hud-value">{state.scoreAI}</span>
                </div>
              </>
            )}
          </div>
        </header>

        <p className="game-message">{state.message}</p>

        <Board
          cards={state.cards}
          cols={state.cols}
          rows={state.rows}
          onCardTap={onCardTap}
          disabled={state.locked || (state.mode === 'AIDuel' && state.turn === 1)}
        />

        {state.gameOver && (
          <GameOver
            stats={stats}
            mode={state.mode}
            gridSize={state.gridSizeLabel}
            scoreAI={state.scoreAI}
            onPlayAgain={playAgain}
            onSubmitted={onScoreSubmitted}
          />
        )}
      </div>
    </div>
  )
}
