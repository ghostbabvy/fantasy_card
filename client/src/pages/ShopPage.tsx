import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, CardVariant } from '../stores/gameStore'
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
  const { coins, buyPack, claimFreePack, freePackTimer, freePacksAvailable } = useGameStore()
  const [openingPack, setOpeningPack] = useState<PackType | null>(null)
  const [newCards, setNewCards] = useState<Array<{ cardId: string; variant: CardVariant; isNew: boolean }>>([])
  const [timeUntilFree, setTimeUntilFree] = useState('')

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const diff = freePackTimer - now

      if (diff <= 0 || freePacksAvailable > 0) {
        setTimeUntilFree('')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeUntilFree(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [freePackTimer, freePacksAvailable])

  const handleBuyPack = (pack: PackType) => {
    if (coins < pack.cost) return

    const cards = buyPack(pack.id)
    if (cards.length > 0) {
      setNewCards(cards)
      setOpeningPack(pack)
    }
  }

  const handleClaimFreePack = () => {
    const cards = claimFreePack()
    if (cards && cards.length > 0) {
      setNewCards(cards)
      setOpeningPack({
        id: 'free',
        name: 'Free Pack',
        cost: 0,
        cardCount: 3,
        guarantee: 'Random cards',
        color: 'from-green-500 to-emerald-600',
        icon: '🎉'
      })
    }
  }

  const handleCloseOpening = () => {
    setOpeningPack(null)
    setNewCards([])
  }

  const canClaimFree = freePacksAvailable > 0 || Date.now() >= freePackTimer

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Shop</h1>

      {/* Free Pack Section - Hourglass */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>⏳</span> Free Pack
        </h2>
        <motion.div
          whileHover={canClaimFree ? { scale: 1.02 } : undefined}
          className={`
            bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6
            max-w-sm relative overflow-hidden
            ${canClaimFree ? 'cursor-pointer' : 'opacity-75'}
          `}
          onClick={canClaimFree ? handleClaimFreePack : undefined}
        >
          {/* Animated hourglass effect */}
          <div className="absolute inset-0 overflow-hidden">
            {canClaimFree && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="text-5xl"
                animate={canClaimFree ? { rotate: [0, 10, -10, 0] } : undefined}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {canClaimFree ? '🎁' : '⏳'}
              </motion.div>
              <div>
                <div className="font-bold text-lg">
                  {canClaimFree ? 'Pack Ready!' : 'Next Pack In'}
                </div>
                {canClaimFree ? (
                  <div className="text-white/80">
                    {freePacksAvailable > 0 ? `${freePacksAvailable} pack${freePacksAvailable > 1 ? 's' : ''} available!` : 'Click to claim!'}
                  </div>
                ) : (
                  <div className="text-2xl font-mono font-bold">{timeUntilFree}</div>
                )}
              </div>
            </div>
            {canClaimFree && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="bg-white text-green-600 px-4 py-2 rounded-xl font-bold"
              >
                CLAIM!
              </motion.div>
            )}
          </div>

          {/* Progress bar */}
          {!canClaimFree && (
            <div className="mt-4 bg-black/30 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-white/50"
                style={{
                  width: `${Math.max(0, 100 - ((freePackTimer - Date.now()) / (12 * 60 * 60 * 1000)) * 100)}%`
                }}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Pack Grid */}
      <h2 className="text-xl font-bold mb-4">Buy Packs</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
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

      {/* Ways to Earn Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Ways to Earn Coins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-2xl mb-2">⚔️</div>
            <div className="font-bold">Win Battles</div>
            <div className="text-white/60 text-sm">+50 coins per win</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-bold">Complete Missions</div>
            <div className="text-white/60 text-sm">Daily & Weekly rewards</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-2xl mb-2">📅</div>
            <div className="font-bold">Daily Login</div>
            <div className="text-white/60 text-sm">Streak rewards up to 7 days</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-2xl mb-2">⬆️</div>
            <div className="font-bold">Level Up</div>
            <div className="text-white/60 text-sm">+100 coins per level</div>
          </div>
        </div>
      </div>

      {/* Pack Opening Modal */}
      <AnimatePresence>
        {openingPack && (
          <PackOpening
            packType={openingPack}
            cards={newCards}
            onClose={handleCloseOpening}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
