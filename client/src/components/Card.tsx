import { motion } from 'framer-motion'
import { Card as CardType, rarityColors, elementColors } from '../types'

interface CardProps {
  card: CardType
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  isPlayable?: boolean
  isSelected?: boolean
  canAttack?: boolean
}

export default function Card({
  card,
  size = 'md',
  onClick,
  isPlayable = false,
  isSelected = false,
  canAttack = false
}: CardProps) {
  const sizeClasses = {
    sm: 'w-32 h-48',
    md: 'w-44 h-64',
    lg: 'w-56 h-80'
  }

  const rarityColor = rarityColors[card.rarity]
  const elementColor = elementColors[card.element]

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.05, y: -5 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        relative rounded-xl overflow-hidden
        border-2 transition-all
        ${onClick ? 'cursor-pointer' : ''}
        ${isPlayable ? 'ring-2 ring-green-400 ring-opacity-75' : ''}
        ${isSelected ? 'ring-4 ring-yellow-400' : ''}
        ${canAttack ? 'ring-2 ring-red-400 animate-pulse' : ''}
        ${card.rarity === 'legendary' ? 'animate-glow' : ''}
      `}
      style={{ borderColor: rarityColor }}
    >
      {/* Card background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${elementColor}50 0%, ${elementColor}20 30%, #1a1a2e 100%)`
        }}
      />

      {/* Card content */}
      <div className="relative h-full flex flex-col p-2">
        {/* Header: Cost + Name + HP */}
        <div className="flex items-start justify-between mb-1">
          {/* Cost badge */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg"
            style={{ backgroundColor: elementColor }}
          >
            {card.cost}
          </div>

          {/* HP badge (creatures only) */}
          {card.type === 'creature' && card.hp && (
            <div className="bg-red-600 px-2 py-0.5 rounded text-white font-bold text-xs flex items-center gap-1">
              <span>❤️</span> {card.hp}
            </div>
          )}
        </div>

        {/* Card name */}
        <div className={`font-bold text-center leading-tight mb-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {card.name}
        </div>

        {/* Card art - main focus */}
        <div className="flex-1 rounded-lg bg-black/30 flex items-center justify-center overflow-hidden">
          <span className={`${size === 'sm' ? 'text-4xl' : size === 'md' ? 'text-5xl' : 'text-6xl'}`}>
            {card.element === 'fire' && '🔥'}
            {card.element === 'water' && '💧'}
            {card.element === 'nature' && '🌿'}
            {card.element === 'earth' && '🪨'}
            {card.element === 'lightning' && '⚡'}
            {card.element === 'shadow' && '🌑'}
            {card.element === 'light' && '✨'}
          </span>
        </div>

        {/* Type line */}
        <div className={`text-center text-white/60 capitalize mt-1 ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'}`}>
          {card.type} • {card.element}
        </div>
      </div>

      {/* Rarity glow for legendary */}
      {card.rarity === 'legendary' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 20px ${rarityColor}80`
          }}
        />
      )}
    </motion.div>
  )
}
