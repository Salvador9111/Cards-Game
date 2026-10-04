import { memo } from 'react'
import type { CardData } from '../game/types'
import { getSymbol } from '../game/engine'

interface CardProps {
  card: CardData
  onTap: (id: number) => void
  disabled: boolean
}

function CardComponent({ card, onTap, disabled }: CardProps) {
  const symbol = getSymbol(card.symbolId)
  const isDown = card.state === 'FaceDown'
  const isMatched = card.state === 'Matched'
  const isFlipping = card.state === 'Flipping'

  const handleClick = () => {
    if (disabled || isDown === false) return
    if (card.state !== 'FaceDown') return
    onTap(card.id)
  }

  return (
    <button
      className={`card ${card.state.toLowerCase()}`}
      onClick={handleClick}
      disabled={disabled || card.state !== 'FaceDown'}
      aria-label={isDown ? 'Face down card' : `Card showing ${symbol.name}`}
    >
      <div className="card-inner">
        <div className="card-face card-back">
          <div className="card-back-pattern" />
        </div>
        <div className="card-face card-front">
          <span className="card-symbol">{symbol.emoji}</span>
        </div>
      </div>
      {isMatched && <div className="card-glow" />}
      {isFlipping && <div className="card-shimmer" />}
    </button>
  )
}

export const Card = memo(CardComponent)
