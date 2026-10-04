import { useState, useCallback, useRef, useEffect } from 'react'
import type { CardData, GameMode, GameStats, GameResult } from './types'
import {
  createCards,
  computeStars,
  computeScore,
  createAIMemory,
  aiObserveCard,
  aiForgetCard,
  aiDecayMemory,
  aiFindKnownPair,
  aiFindMatch,
  aiRandomUnknown,
} from './engine'

export interface GameState {
  cards: CardData[]
  mode: GameMode
  cols: number
  rows: number
  moves: number
  streak: number
  maxStreak: number
  matchedPairs: number
  scorePlayer: number
  scoreAI: number
  turn: 0 | 1
  locked: boolean
  gameOver: boolean
  result: GameResult
  gridSizeLabel: string
  message: string
}

const FLIP_MS = 420
const MISMATCH_MS = 900
const AI_THINK_MS = 1000

function pairsOf(cols: number, rows: number) {
  return (cols * rows) / 2
}

export function useGame() {
  const [state, setState] = useState<GameState>(() => ({
    cards: [],
    mode: 'ZenSolitaire',
    cols: 4,
    rows: 4,
    moves: 0,
    streak: 0,
    maxStreak: 0,
    matchedPairs: 0,
    scorePlayer: 0,
    scoreAI: 0,
    turn: 0,
    locked: false,
    gameOver: false,
    result: 'incomplete',
    gridSizeLabel: '4x4',
    message: '',
  }))

  const aiMem = useRef(createAIMemory(0.8, 0.15))
  const picksRef = useRef<(CardData | null)[]>([null, null])
  const pickCountRef = useRef(0)
  const turnRef = useRef<0 | 1>(0)
  const modeRef = useRef<GameMode>('ZenSolitaire')
  const colsRef = useRef(4)
  const rowsRef = useRef(4)
  const busyRef = useRef(false)

  useEffect(() => {
    modeRef.current = state.mode
    colsRef.current = state.cols
    rowsRef.current = state.rows
  }, [state.mode, state.cols, state.rows])

  const build = useCallback((mode: GameMode, cols: number, rows: number) => {
    picksRef.current = [null, null]
    pickCountRef.current = 0
    turnRef.current = 0
    busyRef.current = false
    aiMem.current = createAIMemory(0.8, 0.15)
    setState({
      cards: createCards(cols, rows),
      mode,
      cols,
      rows,
      moves: 0,
      streak: 0,
      maxStreak: 0,
      matchedPairs: 0,
      scorePlayer: 0,
      scoreAI: 0,
      turn: 0,
      locked: false,
      gameOver: false,
      result: 'incomplete',
      gridSizeLabel: `${cols}x${rows}`,
      message: mode === 'AIDuel' ? 'Your turn — flip two cards' : 'Find all matching pairs',
    })
  }, [])

  const onCardTap = useCallback(
    (cardId: number) => {
      if (busyRef.current) return
      if (modeRef.current === 'AIDuel' && turnRef.current !== 0) return
      pickCard(cardId)
    },
    [],
  )

  const pickCard = useCallback((cardId: number) => {
    setState((s) => {
      const card = s.cards.find((c) => c.id === cardId)
      if (!card || card.state !== 'FaceDown') return s
      if (busyRef.current) return s

      const slot = pickCountRef.current
      picksRef.current[slot] = card
      pickCountRef.current++

      if (modeRef.current === 'AIDuel') {
        aiObserveCard(aiMem.current, card.id, card.symbolId)
      }

      const newCards = s.cards.map((c) =>
        c.id === cardId ? { ...c, state: 'Flipping' as const } : c,
      )

      const isSecond = pickCountRef.current >= 2
      if (isSecond) busyRef.current = true

      // Schedule flip-up
      setTimeout(() => {
        setState((s2) => ({
          ...s2,
          cards: s2.cards.map((c) =>
            c.id === cardId ? { ...c, state: 'FaceUp' as const } : c,
          ),
        }))

        if (isSecond) {
          setTimeout(() => resolve(), 150)
        }
      }, FLIP_MS)

      return {
        ...s,
        cards: newCards,
        locked: isSecond,
      }
    })
  }, [])

  const resolve = useCallback(() => {
    setState((s) => {
      const first = picksRef.current[0]
      const second = picksRef.current[1]
      if (!first || !second) return s

      const isMatch = first.symbolId === second.symbolId
      const newMoves = s.moves + 1
      const pairs = pairsOf(s.cols, s.rows)
      const isAITurn = turnRef.current === 1

      if (isMatch) {
        const newStreak = s.streak + 1
        const newMaxStreak = Math.max(s.maxStreak, newStreak)
        const newMatched = s.matchedPairs + 1
        const newScoreP = isAITurn ? s.scorePlayer : s.scorePlayer + 1
        const newScoreAI = isAITurn ? s.scoreAI + 1 : s.scoreAI

        aiForgetCard(aiMem.current, first.id)
        aiForgetCard(aiMem.current, second.id)

        picksRef.current = [null, null]
        pickCountRef.current = 0
        busyRef.current = false

        const matchedCards = s.cards.map((c) =>
          c.id === first.id || c.id === second.id
            ? { ...c, state: 'Matched' as const }
            : c,
        )

        const isOver = newMatched >= pairs

        if (isOver) {
          const result: GameResult =
            s.mode === 'AIDuel'
              ? newScoreP > newScoreAI
                ? 'win'
                : newScoreP < newScoreAI
                  ? 'lose'
                  : 'solo'
              : 'solo'
          const finalScore = computeScore(s.mode, pairs, newMoves, newMaxStreak, result)

          setTimeout(() => {
            setState((cur) => ({
              ...cur,
              gameOver: true,
              result,
              scorePlayer: result === 'lose' ? 0 : finalScore,
              message:
                result === 'win'
                  ? `Victory! ${computeStars(newMoves, pairs)} stars`
                  : result === 'lose'
                    ? 'AI wins this round'
                    : `Complete! ${computeStars(newMoves, pairs)} stars`,
            }))
          }, 600)

          return {
            ...s,
            cards: matchedCards,
            moves: newMoves,
            streak: newStreak,
            maxStreak: newMaxStreak,
            matchedPairs: newMatched,
            scorePlayer: newScoreP,
            scoreAI: newScoreAI,
            locked: false,
            message: isAITurn ? 'AI matched the last pair!' : 'You matched the last pair!',
          }
        }

        // On a match, the same player goes again (no turn switch)
        return {
          ...s,
          cards: matchedCards,
          moves: newMoves,
          streak: newStreak,
          maxStreak: newMaxStreak,
          matchedPairs: newMatched,
          scorePlayer: newScoreP,
          scoreAI: newScoreAI,
          locked: false,
          message: isAITurn ? 'AI found a match!' : 'Match! Keep going',
        }
      }

      // Mismatch
      picksRef.current = [null, null]
      pickCountRef.current = 0

      // Unflip after delay
      setTimeout(() => {
        setState((cur) => {
          const unflipped = cur.cards.map((c) =>
            c.id === first.id || c.id === second.id
              ? { ...c, state: 'FaceDown' as const }
              : c,
          )
          if (s.mode === 'AIDuel') {
            turnRef.current = turnRef.current === 0 ? 1 : 0
            busyRef.current = false
            return {
              ...cur,
              cards: unflipped,
              locked: false,
              streak: 0,
              turn: turnRef.current,
              message: turnRef.current === 0 ? 'Your turn' : 'AI thinking...',
            }
          }
          busyRef.current = false
          return {
            ...cur,
            cards: unflipped,
            locked: false,
            streak: 0,
            message: 'No match — try again',
          }
        })
      }, MISMATCH_MS)

      return {
        ...s,
        moves: newMoves,
        streak: 0,
        locked: true,
        message: isAITurn ? 'AI missed' : 'No match',
      }
    })
  }, [])

  // AI turn driver
  useEffect(() => {
    if (state.mode !== 'AIDuel') return
    if (state.gameOver) return
    if (state.turn !== 1) return
    if (busyRef.current) return
    if (state.matchedPairs >= pairsOf(state.cols, state.rows)) return

    const timer = setTimeout(() => {
      if (busyRef.current || turnRef.current !== 1) return
      aiDecayMemory(aiMem.current)

      if (pickCountRef.current === 0) {
        const pair = aiFindKnownPair(aiMem.current, state.cards)
        if (pair) {
          pickCard(pair[0])
        } else {
          const idx = aiRandomUnknown(aiMem.current, state.cards, -1)
          pickCard(idx)
        }
      } else if (pickCountRef.current === 1) {
        const first = picksRef.current[0]
        if (!first) return
        const match = aiFindMatch(aiMem.current, first.id, first.symbolId, state.cards)
        if (match !== null) {
          pickCard(match)
        } else {
          const idx = aiRandomUnknown(aiMem.current, state.cards, first.id)
          pickCard(idx)
        }
      }
    }, AI_THINK_MS)

    return () => clearTimeout(timer)
  }, [state.turn, state.gameOver, state.matchedPairs, state.cards, state.locked, pickCard])

  const getStats = useCallback((): GameStats => {
    const pairs = pairsOf(state.cols, state.rows)
    return {
      moves: state.moves,
      streak: state.maxStreak,
      maxStreak: state.maxStreak,
      stars: computeStars(state.moves, pairs),
      score: state.scorePlayer,
      result: state.result,
    }
  }, [state.moves, state.maxStreak, state.cols, state.rows, state.scorePlayer, state.result])

  return { state, build, onCardTap, getStats }
}
