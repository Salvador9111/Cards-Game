import { Card } from './Card'
import type { CardData } from '../game/types'

interface BoardProps {
  cards: CardData[]
  cols: number
  rows: number
  onCardTap: (id: number) => void
  disabled: boolean
}

export function Board({ cards, cols, rows, onCardTap, disabled }: BoardProps) {
  return (
    <div
      className="board"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        '--cols': cols,
        '--rows': rows,
      } as React.CSSProperties}
    >
      {cards.map((card) => (
        <Card key={card.id} card={card} onTap={onCardTap} disabled={disabled} />
      ))}
    </div>
  )
}
