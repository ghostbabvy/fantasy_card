import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import PackOpening from '../components/PackOpening'

interface PackType {
  id: string
  name: string
  cost: number
  cardCount: number
  guarantee: string
  color: string
  icon: string
}

const packs: PackType[] = [
  {
    id: 'basic',
    name: 'Basic Pack',
    cost: 100,
    cardCount: 3,
    guarantee: '1 Uncommon+',
    color: 'from-gray-500 to-gray-700',
    icon: '📦'
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    cost: 300,
    cardCount: 5,
    guarantee: '1 Rare+',
    color: 'from-blue-500 to-blue-700',
    icon: '🎁'
  },
  {
    id: 'legendary',
    name: 'Legendary Pack',
    cost: 1000,
    cardCount: 5,
    guarantee: '1 Epic+',
    color: 'from-amber-500 to-orange-600',
    icon: '👑'
  }
]

export default function ShopPage() {
  const { coins, buyPack } = useGameStore()
  const [openingPack, setOpeningPack] = useState<PackType | null>(null)
  const [newCards, setNewCards] = useState<string[]>([])

  const handleBuyPack = (pack: PackType) => {
    if (coins < pack.cost) return

    const cardIds = buyPack(pack.id)
    setNewCards(cardIds)
    setOpeningPack(pack)
  }

  const handleCloseOpening = () => {
    setOpeningPack(null)
    setNewCards([])
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Shop</h1>

      {/* Pack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {packs.map(pack => (
          <motion.div
            key={pack.id}
            whileHover={{ scale: 1.02 }}
            className={`bg-gradient-to-br ${pack.color} rounded-2xl p-6 text-center relative overflow-hidden`}
          >
            {/* Decorative glow */}
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />

            <div className="text-6xl mb-4">{pack.icon}</div>
            <h3 className="text-2xl font-bold mb-2">{pack.name}</h3>
            <p className="text-white/80 mb-2">{pack.cardCount} Cards</p>
            <p className="text-sm text-white/70 mb-4">Guaranteed: {pack.guarantee}</p>

            <button
              onClick={() => handleBuyPack(pack)}
              disabled={coins < pack.cost}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                coins >= pack.cost
                  ? 'bg-white text-gray-900 hover:bg-white/90'
                  : 'bg-white/30 text-white/50 cursor-not-allowed'
              }`}
            >
              <span className="mr-2">🪙</span>
              {pack.cost}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Pack Opening Modal */}
      <AnimatePresence>
        {openingPack && (
          <PackOpening
            packType={openingPack}
            cardIds={newCards}
            onClose={handleCloseOpening}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
