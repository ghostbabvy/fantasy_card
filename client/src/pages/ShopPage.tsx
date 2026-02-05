import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, CardVariant } from '../stores/gameStore'
import PackOpening from '../components/PackOpening'
import { cards as allCards } from '../data/cards'
import { sellValues, Rarity } from '../types'
import Card from '../components/Card'

interface PackType {
  id: string
  name: string
  cost: number
  cardCount: number
  guarantee: string
  color: string
  icon: string
  image?: string
}

const packs: PackType[] = [
  {
    id: 'basic',
    name: 'Basic Pack',
    cost: 100,
    cardCount: 3,
    guarantee: '1 Uncommon+',
    color: 'from-green-600 to-emerald-800',
    icon: '📦',
    image: '/pack-basic.jpg'
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    cost: 300,
    cardCount: 5,
    guarantee: '1 Rare+',
    color: 'from-gray-700 to-gray-900',
    icon: '🎁',
    image: '/pack-premium.jpg'
  },
  {
    id: 'mega',
    name: 'Mega Pack',
    cost: 500,
    cardCount: 10,
    guarantee: '2 Rare+',
    color: 'from-blue-500 to-cyan-700',
    icon: '✨',
    image: '/pack-mega.jpg'
  },
  {
    id: 'legendary',
    name: 'Legendary Pack',
    cost: 1000,
    cardCount: 5,
    guarantee: '1 Epic+',
    color: 'from-amber-500 to-yellow-600',
    icon: '👑',
    image: '/pack-legendary.jpg'
  }
]

export default function ShopPage() {
  const { coins, buyPack, claimFreePack, freePackTimer, freePacksAvailable, collection, sellCard } = useGameStore()
  const [openingPack, setOpeningPack] = useState<PackType | null>(null)
  const [newCards, setNewCards] = useState<Array<{ cardId: string; variant: CardVariant; isNew: boolean }>>([])
  const [timeUntilFree, setTimeUntilFree] = useState('')
  const [showSellSection, setShowSellSection] = useState(false)
  const [sellAnimation, setSellAnimation] = useState<string | null>(null)

  // Get owned cards for selling
  const ownedCards = allCards.filter(card => {
    const owned = collection[card.id]
    return owned && owned.quantity > 0
  })

  const handleSellCard = (cardId: string) => {
    const card = allCards.find(c => c.id === cardId)
    if (!card) return

    sellCard(cardId)
    setSellAnimation(cardId)
    setTimeout(() => setSellAnimation(null), 500)
  }

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
    console.log('Attempting to buy pack:', pack.id, 'Coins:', coins, 'Cost:', pack.cost)
    if (coins < pack.cost) {
      console.log('Not enough coins!')
      return
    }

    const cards = buyPack(pack.id)
    console.log('Cards received:', cards)
    if (cards && cards.length > 0) {
      setNewCards(cards)
      setOpeningPack(pack)
    } else {
      console.log('No cards returned from buyPack!')
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl">
        {packs.map(pack => (
          <motion.div
            key={pack.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="relative cursor-pointer group"
            onClick={() => coins >= pack.cost && handleBuyPack(pack)}
          >
            {/* Pack Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[3/4]">
              {pack.image ? (
                <img
                  src={pack.image}
                  alt={pack.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`bg-gradient-to-br ${pack.color} w-full h-full flex items-center justify-center`}>
                  <span className="text-6xl">{pack.icon}</span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {coins >= pack.cost ? (
                    <div className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold text-lg shadow-lg">
                      Open Pack!
                    </div>
                  ) : (
                    <div className="bg-red-500/80 text-white px-4 py-2 rounded-xl font-bold text-sm">
                      Not enough coins
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            </div>

            {/* Pack Info */}
            <div className="mt-3 text-center">
              <h3 className="font-bold text-lg">{pack.name}</h3>
              <p className="text-white/60 text-sm">{pack.cardCount} Cards</p>
              <p className="text-white/50 text-xs mb-2">{pack.guarantee}</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
                coins >= pack.cost ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <span>🪙</span>
                {pack.cost}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sell Cards Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>💰</span> Sell Cards
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSellSection(!showSellSection)}
            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg font-bold transition-colors"
          >
            {showSellSection ? 'Hide' : 'Show'} Cards
          </motion.button>
        </div>

        {/* Sell Values Info */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="text-sm text-white/60 mb-2">Sell Values by Rarity:</div>
          <div className="flex flex-wrap gap-3">
            {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as Rarity[]).map(rarity => (
              <div key={rarity} className={`px-3 py-1 rounded-lg text-sm rarity-${rarity}`}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}: 🪙 {sellValues[rarity]}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showSellSection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {ownedCards.length === 0 ? (
                <div className="text-center py-8 bg-white/5 rounded-xl">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-white/60">No cards to sell. Open some packs!</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto p-2">
                  {ownedCards.map(card => {
                    const quantity = collection[card.id]?.quantity || 0
                    const isSelling = sellAnimation === card.id

                    return (
                      <motion.div
                        key={card.id}
                        animate={isSelling ? { scale: [1, 0.8, 1], opacity: [1, 0.5, 1] } : {}}
                        className="relative group"
                      >
                        <Card card={card} size="sm" />
                        <div className="absolute top-1 right-1 bg-black/80 rounded-full px-2 py-0.5 text-xs font-bold">
                          x{quantity}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSellCard(card.id)}
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          🪙 {sellValues[card.rarity]}
                        </motion.button>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
