import { motion } from 'framer-motion'
import { BattleCard } from '../../types'
import { useBattleStore } from '../../stores/battleStore'

interface FieldProps {
  cards: BattleCard[]
  isEnemy: boolean
}

export default function Field({ cards, isEnemy }: FieldProps) {
  const { attack, selectedCardIndex, selectCard, player } = useBattleStore()

  const handleCardClick = (index: number) => {
    if (isEnemy) {
      // Clicking enemy card = attack target
      if (selectedCardIndex !== null && player?.field[selectedCardIndex]?.canAttack) {
        attack(selectedCardIndex, index)
      }
    } else {
      // Clicking own card = select for attack
      if (cards[index].canAttack) {
        selectCard(selectedCardIndex === index ? null : index)
      }
    }
  }

  const handlePlayerClick = () => {
    if (isEnemy && selectedCardIndex !== null && player?.field[selectedCardIndex]?.canAttack) {
      // Attack enemy player directly (only if no taunt)
      attack(selectedCardIndex, 'player')
    }
  }

  return (
    <div className="min-h-[120px] flex items-center justify-center gap-4">
      {/* Player portrait for enemy side (attack target) */}
      {isEnemy && (
        <motion.div
          whileHover={selectedCardIndex !== null ? { scale: 1.1 } : undefined}
          onClick={handlePlayerClick}
          className={`
            w-16 h-16 rounded-full bg-red-600/50 flex items-center justify-center text-2xl
            ${selectedCardIndex !== null ? 'cursor-pointer ring-2 ring-red-400 animate-pulse' : ''}
          `}
        >
          🎯
        </motion.div>
      )}

      {/* Field cards */}
      {cards.length === 0 ? (
        <div className="text-white/30 text-center py-8">
          {isEnemy ? 'Enemy field is empty' : 'Your field is empty - play creatures from your hand!'}
        </div>
      ) : (
        cards.map((card, index) => (
          <motion.div
            key={card.instanceId}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ y: -5 }}
            onClick={() => handleCardClick(index)}
            className={`
              relative cursor-pointer
              ${!isEnemy && card.canAttack ? 'ring-2 ring-green-400' : ''}
              ${!isEnemy && selectedCardIndex === index ? 'ring-4 ring-yellow-400' : ''}
            `}
          >
            {/* Simplified field card display */}
            <div
              className={`
                w-24 h-32 rounded-lg p-2 flex flex-col
                bg-gradient-to-br
                ${isEnemy ? 'from-red-800 to-red-900' : 'from-blue-800 to-blue-900'}
                border-2
                ${card.canAttack && !isEnemy ? 'border-green-400' : 'border-white/30'}
              `}
            >
              {/* Cost */}
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                {card.cost}
              </div>

              {/* Name */}
              <div className="text-xs font-bold text-center truncate mt-3">
                {card.name}
              </div>

              {/* Element icon */}
              <div className="flex-1 flex items-center justify-center text-2xl">
                {card.element === 'fire' && '🔥'}
                {card.element === 'water' && '💧'}
                {card.element === 'nature' && '🌿'}
                {card.element === 'earth' && '🪨'}
                {card.element === 'lightning' && '⚡'}
                {card.element === 'shadow' && '🌑'}
                {card.element === 'light' && '✨'}
                {card.element === 'ice' && '❄️'}
              </div>

              {/* Stats */}
              <div className="flex justify-between text-xs">
                <span className="text-red-400">⚔️{card.currentAttack}</span>
                <span className="text-green-400">❤️{card.currentHp}</span>
              </div>
            </div>

            {/* Can attack indicator */}
            {!isEnemy && card.canAttack && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-green-500 px-2 rounded"
              >
                Ready!
              </motion.div>
            )}
          </motion.div>
        ))
      )}
    </div>
  )
}
