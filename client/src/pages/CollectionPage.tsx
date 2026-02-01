import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { cards } from '../data/cards'
import Card from '../components/Card'
import CardDetail from '../components/CardDetail'
import { Element, Rarity, Card as CardType } from '../types'

export default function CollectionPage() {
  const { collection } = useGameStore()
  const [elementFilter, setElementFilter] = useState<Element | 'all'>('all')
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all')
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)

  const elements: Element[] = ['fire', 'water', 'nature', 'earth', 'lightning', 'shadow', 'light']
  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

  // Only show owned cards
  const ownedCards = cards.filter(card => {
    const owned = collection[card.id] || 0
    if (owned === 0) return false
    if (elementFilter !== 'all' && card.element !== elementFilter) return false
    if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false
    return true
  })

  const totalOwned = Object.keys(collection).filter(id => collection[id] > 0).length
  const totalCards = cards.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Collection</h1>
        <span className="text-white/70">
          {totalOwned} / {totalCards} cards
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 flex flex-wrap gap-4">
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
      {ownedCards.length === 0 ? (
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
          {ownedCards.map(card => (
            <div key={card.id} className="relative">
              <Card
                card={card}
                onClick={() => setSelectedCard(card)}
              />
              <div className="absolute top-2 right-2 bg-black/70 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {collection[card.id]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetail
          card={selectedCard}
          quantity={collection[selectedCard.id] || 0}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  )
}
