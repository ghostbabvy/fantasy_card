import { motion } from 'framer-motion'
import { BattleCard } from '../../types'
import { useBattleStore } from '../../stores/battleStore'
import Card from '../Card'

interface HandProps {
  cards: BattleCard[]
  mana: number
}

export default function Hand({ cards, mana }: HandProps) {
  const { playCard, selectedCardIndex } = useBattleStore()

  const handleCardClick = (index: number) => {
    const card = cards[index]
    if (card.cost <= mana && (card.type !== 'creature' || true)) {
      playCard(index)
    }
  }

  return (
    <div className="bg-black/30 rounded-xl p-4">
      <div className="flex justify-center gap-2 flex-wrap">
        {cards.map((card, index) => {
          const isPlayable = card.cost <= mana
          const isSelected = selectedCardIndex === index

          return (
            <motion.div
              key={card.instanceId}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -20 }}
            >
              <Card
                card={card}
                size="md"
                onClick={() => handleCardClick(index)}
                isPlayable={isPlayable}
                isSelected={isSelected}
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
