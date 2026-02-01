import { motion } from 'framer-motion'
import { Card as CardType, rarityColors, elementColors } from '../types'

interface CardDetailProps {
  card: CardType
  quantity: number
  onClose: () => void
}

export default function CardDetail({ card, quantity, onClose }: CardDetailProps) {
  const rarityColor = rarityColors[card.rarity]
  const elementColor = elementColors[card.element]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{card.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2 py-0.5 rounded text-sm font-medium capitalize"
                style={{ backgroundColor: elementColor + '40', color: elementColor }}
              >
                {card.element}
              </span>
              <span
                className="px-2 py-0.5 rounded text-sm font-medium capitalize"
                style={{ backgroundColor: rarityColor + '40', color: rarityColor }}
              >
                {card.rarity}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">{card.cost}</div>
            <div className="text-xs text-white/50">Mana</div>
          </div>
        </div>

        {/* Card Art Placeholder */}
        <div
          className="h-32 rounded-xl mb-4 flex items-center justify-center text-6xl"
          style={{ background: `linear-gradient(135deg, ${elementColor}40 0%, ${elementColor}20 100%)` }}
        >
          {card.element === 'fire' && '🔥'}
          {card.element === 'water' && '💧'}
          {card.element === 'nature' && '🌿'}
          {card.element === 'earth' && '🪨'}
          {card.element === 'lightning' && '⚡'}
          {card.element === 'shadow' && '🌑'}
          {card.element === 'light' && '✨'}
          {card.element === 'ice' && '❄️'}
        </div>

        {/* Card Type & HP */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70 capitalize">{card.type}</span>
          {card.type === 'creature' && card.hp && (
            <div className="flex items-center gap-1 text-lg">
              <span className="text-red-400">❤️</span>
              <span className="font-bold">{card.hp} HP</span>
            </div>
          )}
        </div>

        {/* Attacks (for creatures) */}
        {card.type === 'creature' && card.attacks && (
          <div className="space-y-3 mb-4">
            <h3 className="font-bold text-white/80">Attacks</h3>
            {card.attacks.map((attack, index) => (
              <div
                key={index}
                className="bg-white/10 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: elementColor }}
                    >
                      {attack.cost}
                    </span>
                    <span className="font-bold text-lg">{attack.name}</span>
                  </div>
                  <span className="font-bold text-xl text-red-400">{attack.damage}</span>
                </div>
                {attack.effect && (
                  <div className="text-white/60 text-sm mt-1">
                    {attack.effect}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Spell Effect */}
        {card.type === 'spell' && card.effect && (
          <div className="bg-purple-500/20 rounded-lg p-3 mb-4">
            <div className="font-bold text-purple-300 mb-1">Effect</div>
            <div className="text-white/80">{card.effect}</div>
          </div>
        )}

        {/* Flavor Text */}
        <p className="text-white/50 italic text-sm mb-4">"{card.description}"</p>

        {/* Quantity */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <span className="text-white/70">Owned</span>
          <span className="text-xl font-bold">x{quantity}</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}
