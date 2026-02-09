import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card as CardType, rarityColors, elementColors } from '../types'
import { ElementIcon } from './ElementIcon'
import MasteryBadge from './MasteryBadge'

interface CardProps {
  card: CardType
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  isPlayable?: boolean
  isSelected?: boolean
  canAttack?: boolean
  showDetailsDefault?: boolean
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  masteryXp?: number
}

export default function Card({
  card,
  size = 'md',
  onClick,
  isPlayable = false,
  isSelected = false,
  canAttack = false,
  showDetailsDefault = false,
  isFavorite = false,
  onFavoriteToggle,
  masteryXp
}: CardProps) {
  const [showDetails, setShowDetails] = useState(showDetailsDefault)

  const sizeClasses = {
    sm: 'w-32 h-48',
    md: 'w-44 h-64',
    lg: 'w-56 h-80'
  }

  const rarityColor = rarityColors[card.rarity]
  const elementColor = elementColors[card.element]

  // Rarity-based CSS classes
  const rarityClasses = {
    basic: '',
    uncommon: 'rarity-uncommon',
    mythical: 'rarity-mythical',
    legendary: 'rarity-legendary',
    celestial: 'rarity-celestial'
  }

  const handleClick = (e: React.MouseEvent) => {
    if (card.artwork) {
      e.stopPropagation()
      setShowDetails(!showDetails)
    }
    if (onClick) onClick()
  }


  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        relative rounded-xl overflow-hidden
        border-2 transition-all cursor-pointer
        ${isPlayable ? 'ring-2 ring-green-400 ring-opacity-75' : ''}
        ${isSelected ? 'ring-4 ring-yellow-400' : ''}
        ${canAttack ? 'ring-2 ring-red-400 animate-pulse' : ''}
        ${rarityClasses[card.rarity]}
      `}
      style={{ borderColor: rarityColor }}
    >
      {/* Full card artwork background */}
      {card.artwork ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${elementColor}40 0%, ${elementColor}20 50%, #1a1a2e 100%)`
            }}
          />
          <img
            src={card.artwork}
            alt={card.name}
            className={`absolute inset-0 w-full h-full ${
              card.artwork.includes('earth_dragon') ? 'object-contain' : 'object-cover'
            }`}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(180deg, ${elementColor}50 0%, ${elementColor}20 30%, #1a1a2e 100%)`
          }}
        >
          <ElementIcon
            element={card.element}
            size={size === 'sm' ? 64 : size === 'md' ? 80 : 96}
          />
        </div>
      )}

      {/* Always visible: Name banner at bottom + Cost badge */}
      <div className="absolute inset-0 flex flex-col justify-between p-2">
        {/* Top: Cost + Mastery + HP */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg border-2 border-white/30"
              style={{ backgroundColor: elementColor }}
            >
              {card.cost}
            </div>
            {masteryXp !== undefined && masteryXp > 0 && (
              <MasteryBadge xp={masteryXp} size={size === 'sm' ? 'sm' : 'md'} showTooltip />
            )}
          </div>
          {card.type === 'creature' && card.hp && (
            <div className="bg-red-600/90 px-2 py-1 rounded text-white font-bold text-xs flex items-center gap-1 shadow-lg">
              <span>❤️</span> {card.hp}
            </div>
          )}
        </div>

        {/* Bottom: Name banner */}
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
          <div className={`font-bold text-white leading-tight flex items-center justify-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {onFavoriteToggle ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onFavoriteToggle()
                }}
                className={`transition-colors ${isFavorite ? 'text-pink-400' : 'text-white/30 hover:text-pink-300'}`}
              >
                &#9829;
              </button>
            ) : isFavorite ? (
              <span className="text-pink-400">&#9829;</span>
            ) : null}
            <span>{card.name}</span>
          </div>
          <div className={`text-center text-white/60 capitalize ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'}`}>
            {card.type} • {card.element}
          </div>
        </div>
      </div>

      {/* Details overlay - shown on click */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm p-2 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: elementColor }}
              >
                {card.cost}
              </div>
              {card.type === 'creature' && card.hp && (
                <div className="bg-red-600 px-2 py-0.5 rounded text-white font-bold text-xs">
                  ❤️ {card.hp}
                </div>
              )}
            </div>

            {/* Name */}
            <div className={`font-bold text-center text-white mb-2 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              {card.name}
            </div>

            {/* Attacks or Effect */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {card.attacks?.map((attack, i) => (
                <div key={i} className="bg-white/10 rounded p-1.5">
                  <div className="flex justify-between items-center">
                    <span className={`font-semibold text-white ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
                      {attack.name}
                    </span>
                    <span className="text-yellow-400 font-bold text-xs">{attack.damage}</span>
                  </div>
                  <div className="flex justify-between text-white/50 text-[9px]">
                    <span>Cost: {attack.cost}</span>
                    {attack.effect && <span className="text-blue-300">{attack.effect}</span>}
                  </div>
                </div>
              ))}
              {card.effect && (
                <div className={`text-white/80 text-center ${size === 'sm' ? 'text-[9px]' : 'text-xs'}`}>
                  {card.effect}
                </div>
              )}
            </div>

            {/* Type line */}
            <div className={`text-center text-white/50 capitalize mt-1 ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'}`}>
              {card.rarity} {card.type} • {card.element}
            </div>

            {/* Tap hint */}
            <div className="text-center text-white/30 text-[8px] mt-1">
              tap to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rarity glow effects */}
      {(card.rarity === 'mythical' || card.rarity === 'legendary' || card.rarity === 'celestial') && (
        <div
          className={`absolute inset-0 pointer-events-none ${card.rarity === 'celestial' ? 'animate-rainbow-border' : ''}`}
          style={{
            boxShadow: card.rarity === 'celestial'
              ? 'inset 0 0 25px rgba(236, 72, 153, 0.6), inset 0 0 50px rgba(139, 92, 246, 0.3)'
              : `inset 0 0 20px ${rarityColor}80`
          }}
        />
      )}

      {/* Rarity indicator badge */}
      <div
        className={`absolute bottom-12 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
          card.rarity === 'celestial' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white animate-pulse' :
          card.rarity === 'legendary' ? 'bg-amber-500/90 text-black' :
          card.rarity === 'mythical' ? 'bg-purple-500/90 text-white' :
          card.rarity === 'uncommon' ? 'bg-green-500/90 text-white' :
          'bg-gray-500/90 text-white'
        }`}
      >
        {card.rarity === 'basic' ? 'B' :
         card.rarity === 'uncommon' ? 'U' :
         card.rarity === 'mythical' ? 'M' :
         card.rarity === 'legendary' ? 'L' : 'C'}
      </div>
    </motion.div>
  )
}
