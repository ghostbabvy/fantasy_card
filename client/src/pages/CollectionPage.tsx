import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { cards } from '../data/cards'
import Card from '../components/Card'
import CardDetail from '../components/CardDetail'
import { Element, Rarity, Card as CardType, elementColors } from '../types'
import { ElementIcon } from '../components/ElementIcon'

export default function CollectionPage() {
  const { collection, markCardSeen, favoriteCards, toggleFavorite, stats, restoreCardCondition, purifyCard, embraceVoid, dust } = useGameStore()
  const [elementFilter, setElementFilter] = useState<Element | 'all'>('all')
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all')
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [showOwned, setShowOwned] = useState(true)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const elements: Element[] = ['fire', 'water', 'nature', 'earth', 'lightning', 'shadow', 'light', 'ice']
  const rarities: Rarity[] = ['basic', 'uncommon', 'mythical', 'legendary', 'celestial']

  // Filter cards
  const filteredCards = cards.filter(card => {
    const owned = collection[card.id]
    const isOwned = owned && owned.quantity > 0

    if (showOwned && !isOwned) return false
    if (showFavoritesOnly && !favoriteCards.includes(card.id)) return false
    if (elementFilter !== 'all' && card.element !== elementFilter) return false
    if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false
    return true
  })

  // Calculate stats
  const totalOwned = Object.values(collection).filter(c => c && c.quantity > 0).length
  const totalCards = cards.length

  // Stats by element
  const elementStats = elements.map(el => {
    const total = cards.filter(c => c.element === el).length
    const owned = cards.filter(c => c.element === el && collection[c.id]?.quantity > 0).length
    return { element: el, total, owned, percent: Math.round((owned / total) * 100) }
  })

  const handleCardClick = (card: CardType) => {
    const owned = collection[card.id]
    if (owned?.isNew) {
      markCardSeen(card.id)
    }
    setSelectedCard(card)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Collection</h1>
        <div className="flex items-center gap-4">
          <span className="text-white/70">
            {totalOwned} / {totalCards} cards ({Math.round((totalOwned / totalCards) * 100)}%)
          </span>
        </div>
      </div>

      {/* Element Progress Bars */}
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <h2 className="font-bold mb-3 text-sm text-white/70">Collection Progress by Element</h2>
        <div className="grid grid-cols-8 gap-3">
          {elementStats.map(stat => (
            <div key={stat.element} className="text-center">
              <div
                className="flex justify-center items-center h-10 mb-1 cursor-pointer"
                onClick={() => setElementFilter(stat.element === elementFilter ? 'all' : stat.element)}
              >
                <ElementIcon element={stat.element} size={32} />
              </div>
              <div className="bg-black/40 rounded-full h-2 overflow-hidden mb-1">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: elementColors[stat.element] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percent}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
              </div>
              <div className="text-xs text-white/50">
                {stat.owned}/{stat.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
        {/* Show All / Owned Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOwned(true)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              showOwned ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
            }`}
          >
            Owned
          </button>
          <button
            onClick={() => setShowOwned(false)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              !showOwned ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
            }`}
          >
            All Cards
          </button>
        </div>

        {/* Favorites Filter */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
            showFavoritesOnly ? 'bg-pink-500 text-white' : 'bg-white/20 text-white'
          }`}
        >
          <span className={showFavoritesOnly ? 'text-white' : 'text-pink-400'}>&#9829;</span>
          Favorites {favoriteCards.length > 0 && `(${favoriteCards.length})`}
        </button>

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
      {filteredCards.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold mb-2">No Cards Found</h2>
          <p className="text-white/70">
            {totalOwned === 0
              ? "Open some packs to start your collection!"
              : "No cards match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCards.map(card => {
            const owned = collection[card.id]
            const quantity = owned?.quantity || 0
            const isNew = owned?.isNew

            return (
              <motion.div
                key={card.id}
                className={`relative ${quantity === 0 ? 'opacity-40 grayscale' : ''}`}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  card={card}
                  onClick={() => handleCardClick(card)}
                  isFavorite={favoriteCards.includes(card.id)}
                  onFavoriteToggle={quantity > 0 ? () => toggleFavorite(card.id) : undefined}
                  masteryXp={stats.cardUsageCount[card.id] || 0}
                  condition={owned?.condition}
                  corruption={owned?.corruption}
                  acquiredAt={owned?.acquiredAt}
                  isVoidTransformed={owned?.isVoidTransformed}
                />

                {/* Quantity Badge */}
                {quantity > 0 && (
                  <div className="absolute top-2 right-2 bg-black/70 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {quantity}
                  </div>
                )}

                {/* NEW Badge */}
                {isNew && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                  >
                    NEW!
                  </motion.div>
                )}


                {/* Variant Indicators */}
                {owned && (owned.variants.holo > 0 || owned.variants.fullart > 0 || owned.variants.secret > 0) && (
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {owned.variants.holo > 0 && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-[8px] flex items-center justify-center font-bold">
                        H
                      </div>
                    )}
                    {owned.variants.fullart > 0 && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 text-[8px] flex items-center justify-center font-bold">
                        F
                      </div>
                    )}
                    {owned.variants.secret > 0 && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[8px] flex items-center justify-center font-bold">
                        S
                      </div>
                    )}
                  </div>
                )}

                {/* Not Owned Overlay */}
                {quantity === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-lg px-3 py-1 text-sm font-bold">
                      Not Owned
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetail
          card={selectedCard}
          quantity={collection[selectedCard.id]?.quantity || 0}
          onClose={() => setSelectedCard(null)}
          condition={collection[selectedCard.id]?.condition}
          corruption={collection[selectedCard.id]?.corruption}
          acquiredAt={collection[selectedCard.id]?.acquiredAt}
          isVoidTransformed={collection[selectedCard.id]?.isVoidTransformed}
          dust={dust}
          onRestore={() => restoreCardCondition(selectedCard.id)}
          onPurify={() => purifyCard(selectedCard.id)}
          onEmbraceVoid={() => embraceVoid(selectedCard.id)}
        />
      )}
    </div>
  )
}
