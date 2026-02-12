import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { cards } from '../data/cards'
import Card from '../components/Card'
import { Element, Rarity, Card as CardType, dustValues, rarityColors, sellValues } from '../types'
import { calculateAdjustedSellValue, calculateAdjustedDustValue, getRestorationCost, getPurificationCost } from '../data/cardSystems'

export default function CraftingPage() {
  const { collection, dust, coins, craftCard, disenchantCard, sellCard, restoreCardCondition, purifyCard } = useGameStore()
  const [elementFilter, setElementFilter] = useState<Element | 'all'>('all')
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all')
  const [showOwned, setShowOwned] = useState<'all' | 'owned' | 'missing'>('all')
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [craftAnimation, setCraftAnimation] = useState(false)
  const [disenchantAnimation, setDisenchantAnimation] = useState(false)
  const [sellAnimation, setSellAnimation] = useState(false)

  const elements: Element[] = ['fire', 'water', 'nature', 'earth', 'lightning', 'shadow', 'light', 'ice']
  const rarities: Rarity[] = ['basic', 'uncommon', 'mythical', 'legendary', 'celestial']

  // Filter cards
  const filteredCards = cards.filter(card => {
    const owned = collection[card.id]
    const quantity = owned?.quantity || 0

    if (showOwned === 'owned' && quantity === 0) return false
    if (showOwned === 'missing' && quantity > 0) return false
    if (elementFilter !== 'all' && card.element !== elementFilter) return false
    if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false
    return true
  })

  const handleCraft = () => {
    if (!selectedCard) return
    const cost = dustValues[selectedCard.rarity].craft
    if (dust < cost) return

    setCraftAnimation(true)
    setTimeout(() => {
      craftCard(selectedCard.id)
      setCraftAnimation(false)
    }, 1000)
  }

  const handleDisenchant = () => {
    if (!selectedCard) return
    const owned = collection[selectedCard.id]
    if (!owned || owned.quantity < 1) return

    setDisenchantAnimation(true)
    setTimeout(() => {
      disenchantCard(selectedCard.id)
      setDisenchantAnimation(false)
      // Close if no more cards
      const newQuantity = (owned.quantity || 0) - 1
      if (newQuantity <= 0) {
        setSelectedCard(null)
      }
    }, 1000)
  }

  const handleSell = () => {
    if (!selectedCard) return
    const owned = collection[selectedCard.id]
    if (!owned || owned.quantity < 1) return

    setSellAnimation(true)
    setTimeout(() => {
      sellCard(selectedCard.id)
      setSellAnimation(false)
      // Close if no more cards
      const newQuantity = (owned.quantity || 0) - 1
      if (newQuantity <= 0) {
        setSelectedCard(null)
      }
    }, 1000)
  }

  const getSelectedCardInfo = () => {
    if (!selectedCard) return null
    const owned = collection[selectedCard.id]
    const quantity = owned?.quantity || 0
    const craftCost = dustValues[selectedCard.rarity].craft
    const condition = owned?.condition ?? 100
    const corruption = owned?.corruption ?? 0
    const acquiredAt = owned?.acquiredAt ?? Date.now()
    const disenchantValue = calculateAdjustedDustValue(dustValues[selectedCard.rarity].disenchant, condition, acquiredAt)
    const sellValue = calculateAdjustedSellValue(sellValues[selectedCard.rarity], condition, acquiredAt)
    const canCraft = dust >= craftCost
    const canDisenchant = quantity > 0
    const canSell = quantity > 0
    const needsRestore = quantity > 0 && condition < 90
    const needsPurify = quantity > 0 && corruption > 0
    const restoreCost = needsRestore ? getRestorationCost(condition, selectedCard.rarity) : 0
    const purifyCost = needsPurify ? getPurificationCost(corruption, selectedCard.rarity) : 0
    const canRestore = needsRestore && dust >= restoreCost
    const canPurify = needsPurify && dust >= purifyCost

    return { quantity, craftCost, disenchantValue, sellValue, canCraft, canDisenchant, canSell, needsRestore, needsPurify, restoreCost, purifyCost, canRestore, canPurify, condition, corruption }
  }

  const info = getSelectedCardInfo()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Crafting</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-lg">
            <span className="text-yellow-300">🪙</span>
            <span className="font-bold text-xl">{coins.toLocaleString()}</span>
            <span className="text-white/60">Coins</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg">
            <span className="text-purple-300">✨</span>
            <span className="font-bold text-xl">{dust.toLocaleString()}</span>
            <span className="text-white/60">Dust</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <h2 className="font-bold mb-2">How Crafting Works</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          {rarities.map(rarity => (
            <div key={rarity} className="text-center">
              <div
                className="font-bold capitalize mb-1"
                style={{ color: rarityColors[rarity] }}
              >
                {rarity}
              </div>
              <div className="text-white/60">
                Craft: <span className="text-purple-300">{dustValues[rarity].craft}</span>
              </div>
              <div className="text-white/60">
                Dust: <span className="text-green-300">{dustValues[rarity].disenchant}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
        {/* Show Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOwned('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              showOwned === 'all' ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setShowOwned('owned')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              showOwned === 'owned' ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
            }`}
          >
            Owned
          </button>
          <button
            onClick={() => setShowOwned('missing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              showOwned === 'missing' ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
            }`}
          >
            Missing
          </button>
        </div>

        <div className="h-6 w-px bg-white/20" />

        {/* Element Filter */}
        <div className="flex items-center gap-2">
          <span className="text-white/70">Element:</span>
          <select
            value={elementFilter}
            onChange={e => setElementFilter(e.target.value as Element | 'all')}
            className="bg-white/20 rounded-lg px-3 py-1.5 text-white border border-white/20"
          >
            <option value="all">All</option>
            {elements.map(el => (
              <option key={el} value={el}>{el.charAt(0).toUpperCase() + el.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Rarity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-white/70">Rarity:</span>
          <select
            value={rarityFilter}
            onChange={e => setRarityFilter(e.target.value as Rarity | 'all')}
            className="bg-white/20 rounded-lg px-3 py-1.5 text-white border border-white/20"
          >
            <option value="all">All</option>
            {rarities.map(r => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredCards.map(card => {
          const owned = collection[card.id]
          const quantity = owned?.quantity || 0
          const isSelected = selectedCard?.id === card.id

          return (
            <motion.div
              key={card.id}
              className={`relative ${isSelected ? 'ring-4 ring-purple-400 rounded-xl' : ''}`}
              whileHover={{ scale: 1.02 }}
            >
              <div className={quantity === 0 ? 'opacity-60 grayscale' : ''}>
                <Card
                  card={card}
                  onClick={() => setSelectedCard(card)}
                  condition={collection[card.id]?.condition}
                  corruption={collection[card.id]?.corruption}
                  acquiredAt={collection[card.id]?.acquiredAt}
                />
              </div>

              {/* Quantity Badge */}
              <div className="absolute top-2 right-2 bg-black/70 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {quantity}
              </div>

              {/* Craft Cost Indicator */}
              {quantity === 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-purple-600/90 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                  <span>✨</span> {dustValues[card.rarity].craft}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Crafting Panel */}
      <AnimatePresence>
        {selectedCard && info && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-white/20 p-4 z-40"
          >
            <div className="container mx-auto flex items-center justify-between gap-6">
              {/* Selected Card Preview */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-22 rounded-lg overflow-hidden relative flex-shrink-0 border"
                  style={{ borderColor: rarityColors[selectedCard.rarity] }}
                >
                  {selectedCard.artwork ? (
                    <img src={selectedCard.artwork} alt={selectedCard.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-2xl"
                      style={{ background: `linear-gradient(135deg, ${rarityColors[selectedCard.rarity]}40, #1a1a2e)` }}
                    >
                      {selectedCard.element === 'fire' ? '🔥' : selectedCard.element === 'water' ? '💧' : selectedCard.element === 'nature' ? '🌿' : selectedCard.element === 'earth' ? '🪨' : selectedCard.element === 'lightning' ? '⚡' : selectedCard.element === 'shadow' ? '🌑' : selectedCard.element === 'light' ? '✨' : '❄️'}
                    </div>
                  )}
                  {(craftAnimation || disenchantAnimation || sellAnimation) && (
                    <motion.div
                      className="absolute inset-0 bg-purple-500/50"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1 }}
                    />
                  )}
                </div>
                <div>
                  <div className="font-bold text-lg">{selectedCard.name}</div>
                  <div
                    className="text-sm capitalize"
                    style={{ color: rarityColors[selectedCard.rarity] }}
                  >
                    {selectedCard.rarity}
                  </div>
                  <div className="text-white/60 text-sm">
                    Owned: {info.quantity}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Sell for Coins */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!info.canSell || sellAnimation}
                  onClick={handleSell}
                  className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
                    info.canSell
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  {sellAnimation ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      🪙
                    </motion.span>
                  ) : (
                    <>
                      <span>🪙</span>
                      Sell
                      <span className="text-yellow-200">+{info.sellValue}</span>
                    </>
                  )}
                </motion.button>

                {/* Restore Condition */}
                {info.needsRestore && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!info.canRestore}
                    onClick={() => selectedCard && restoreCardCondition(selectedCard.id)}
                    className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
                      info.canRestore
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>🔧</span>
                    Restore
                    <span className="text-emerald-200">-{info.restoreCost}✨</span>
                  </motion.button>
                )}

                {/* Purify Corruption */}
                {info.needsPurify && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!info.canPurify}
                    onClick={() => selectedCard && purifyCard(selectedCard.id)}
                    className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
                      info.canPurify
                        ? 'bg-violet-500 hover:bg-violet-600'
                        : 'bg-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>🌟</span>
                    Purify
                    <span className="text-violet-200">-{info.purifyCost}✨</span>
                  </motion.button>
                )}

                {/* Disenchant for Dust */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!info.canDisenchant || disenchantAnimation}
                  onClick={handleDisenchant}
                  className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
                    info.canDisenchant
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gray-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  {disenchantAnimation ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      ✨
                    </motion.span>
                  ) : (
                    <>
                      <span>🔥</span>
                      Dust
                      <span className="text-green-300">+{info.disenchantValue}</span>
                    </>
                  )}
                </motion.button>

                {/* Craft */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!info.canCraft || craftAnimation}
                  onClick={handleCraft}
                  className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
                    info.canCraft
                      ? 'bg-purple-500 hover:bg-purple-600'
                      : 'bg-gray-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  {craftAnimation ? (
                    <motion.span
                      animate={{ rotate: 360, scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      ✨
                    </motion.span>
                  ) : (
                    <>
                      <span>🔨</span>
                      Craft
                      <span className="text-purple-200">-{info.craftCost}</span>
                    </>
                  )}
                </motion.button>

                {/* Close */}
                <button
                  onClick={() => setSelectedCard(null)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for bottom panel */}
      {selectedCard && <div className="h-24" />}
    </div>
  )
}
