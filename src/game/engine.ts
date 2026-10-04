import type { CardData, GameMode } from './types'

// Fisher-Yates shuffle
export function shuffleDeck(n: number): number[] {
  const deck: number[] = []
  for (let i = 0; i < n; i++) deck.push(Math.floor(i / 2))
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function createCards(cols: number, rows: number): CardData[] {
  const n = cols * rows
  const deck = shuffleDeck(n)
  return deck.map((symbolId, i) => ({
    id: i,
    symbolId,
    state: 'FaceDown' as const,
  }))
}

export function computeStars(moves: number, pairs: number): number {
  if (moves <= pairs * 1.4) return 3
  if (moves <= pairs * 2.1) return 2
  return 1
}

export function computeScore(
  mode: GameMode,
  pairs: number,
  moves: number,
  maxStreak: number,
  result: string,
): number {
  if (result === 'lose') return 0
  const base = pairs * 100
  const efficiencyBonus = Math.max(0, (pairs * 2 - moves) * 25)
  const streakBonus = maxStreak * 50
  return base + efficiencyBonus + streakBonus
}

// Emscripten-style port of the AI memory logic from MemoryBoardManager.cs
export interface AIMemory {
  // index -> symbolId
  known: Map<number, number>
  retention: number
  decay: number
}

export function createAIMemory(retention: number, decay: number): AIMemory {
  return { known: new Map(), retention, decay }
}

export function aiObserveCard(mem: AIMemory, index: number, symbolId: number) {
  if (Math.random() < mem.retention) {
    mem.known.set(index, symbolId)
  }
}

export function aiForgetCard(mem: AIMemory, index: number) {
  mem.known.delete(index)
}

export function aiDecayMemory(mem: AIMemory) {
  const toRemove: number[] = []
  mem.known.forEach((_v, k) => {
    if (Math.random() < mem.decay) toRemove.push(k)
  })
  toRemove.forEach((k) => mem.known.delete(k))
}

// Find a known pair from memory
export function aiFindKnownPair(
  mem: AIMemory,
  cards: CardData[],
): [number, number] | null {
  const entries = Array.from(mem.known.entries())
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [a, sa] = entries[i]
      const [b, sb] = entries[j]
      if (
        sa === sb &&
        cards[a]?.state === 'FaceDown' &&
        cards[b]?.state === 'FaceDown'
      ) {
        return [a, b]
      }
    }
  }
  return null
}

// Find a card that matches the first pick from memory
export function aiFindMatch(
  mem: AIMemory,
  firstIndex: number,
  firstSymbol: number,
  cards: CardData[],
): number | null {
  for (const [k, v] of mem.known) {
    if (
      k !== firstIndex &&
      v === firstSymbol &&
      cards[k]?.state === 'FaceDown'
    ) {
      return k
    }
  }
  return null
}

// Pick a random unknown face-down card
export function aiRandomUnknown(
  mem: AIMemory,
  cards: CardData[],
  exclude: number,
): number {
  const available: number[] = []
  cards.forEach((c) => {
    if (c.state === 'FaceDown' && c.id !== exclude && !mem.known.has(c.id)) {
      available.push(c.id)
    }
  })
  if (available.length === 0) {
    cards.forEach((c) => {
      if (c.state === 'FaceDown' && c.id !== exclude) available.push(c.id)
    })
  }
  return available[Math.floor(Math.random() * available.length)]
}

export const SYMBOLS = [
  { emoji: '✦', name: 'star' },
  { emoji: '❖', name: 'diamond' },
  { emoji: '⚜', name: 'fleur' },
  { emoji: '♛', name: 'crown' },
  { emoji: '☕', name: 'cup' },
  { emoji: '♠', name: 'spade' },
  { emoji: '♣', name: 'club' },
  { emoji: '♥', name: 'heart' },
  { emoji: '♦', name: 'rhombus' },
  { emoji: '☽', name: 'moon' },
  { emoji: '☀', name: 'sun' },
  { emoji: '❀', name: 'flower' },
  { emoji: '♪', name: 'note' },
  { emoji: '⚡', name: 'bolt' },
  { emoji: '☘', name: 'clover' },
  { emoji: '◉', name: 'target' },
  { emoji: '⬡', name: 'hexagon' },
  { emoji: '◆', name: 'gem' },
]

export function getSymbol(symbolId: number) {
  return SYMBOLS[symbolId % SYMBOLS.length]
}
