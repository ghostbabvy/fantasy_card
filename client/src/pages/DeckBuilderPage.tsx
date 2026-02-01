import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { cards } from '../data/cards'
import Card from '../components/Card'
import { Element, Rarity, Card as CardType, elementColors, rarityColors } from '../types'

const DECK_SIZE = 20
const MAX_COPIES = 2

type AutoBuildStrategy = 'balanced' | 'aggressive' | 'defensive' | 'element-focus'

interface DeckStats {
  totalCards: number
  avgCost: number
  creatures: number
  spells: number
  elements: Record<Element, number>
  rarities: Record<Rarity, number>
}

export default function DeckBuilderPage() {
  const { collection, decks, saveDeck, deleteDeck } = useGameStore()

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [deckName, setDeckName] = useState('')
  const [deckCards, setDeckCards] = useState<string[]>([])
  const [elementFilter, setElementFilter] = useState<Element | 'all'>('all')
  const [showAutoBuildModal, setShowAutoBuildModal] = useState(false)
  const [autoBuildStrategy, setAutoBuildStrategy] = useState<AutoBuildStrategy>('balanced')
  const [focusElement, setFocusElement] = useState<Element>('fire')

  const elements: Element[] = ['fire', 'water', 'nature', 'earth', 'lightning', 'shadow', 'light', 'ice']

  // Get owned cards
  const ownedCards = useMemo(() => {
    return cards.filter(card => {
      const owned = collection[card.id]
      return owned && owned.quantity > 0
    })
  }, [collection])

  // Filter cards for display
  const filteredCards = useMemo(() => {
    return ownedCards.filter(card => {
      if (elementFilter !== 'all' && card.element !== elementFilter) return false
      return true
    })
  }, [ownedCards, elementFilter])

  // Calculate deck stats
  const deckStats = useMemo((): DeckStats => {
    const deckCardObjects = deckCards.map(id => cards.find(c => c.id === id)!).filter(Boolean)

    const stats: DeckStats = {
      totalCards: deckCards.length,
      avgCost: 0,
      creatures: 0,
      spells: 0,
      elements: {} as Record<Element, number>,
      rarities: {} as Record<Rarity, number>
    }

    elements.forEach(el => stats.elements[el] = 0)
    const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
    rarities.forEach(r => stats.rarities[r] = 0)

    if (deckCardObjects.length === 0) return stats

    let totalCost = 0
    deckCardObjects.forEach(card => {
      totalCost += card.cost
      if (card.type === 'creature') stats.creatures++
      if (card.type === 'spell') stats.spells++
      stats.elements[card.element]++
      stats.rarities[card.rarity]++
    })

    stats.avgCost = Math.round((totalCost / deckCardObjects.length) * 10) / 10

    return stats
  }, [deckCards])

  // Count how many of a card are in the deck
  const getCardCountInDeck = (cardId: string) => {
    return deckCards.filter(id => id === cardId).length
  }

  // Add card to deck
  const addCardToDeck = (cardId: string) => {
    const owned = collection[cardId]
    if (!owned) return

    const currentCount = getCardCountInDeck(cardId)
    const maxAllowed = Math.min(MAX_COPIES, owned.quantity)

    if (deckCards.length >= DECK_SIZE) return
    if (currentCount >= maxAllowed) return

    setDeckCards([...deckCards, cardId])
  }

  // Remove card from deck
  const removeCardFromDeck = (cardId: string) => {
    const index = deckCards.indexOf(cardId)
    if (index >= 0) {
      const newDeck = [...deckCards]
      newDeck.splice(index, 1)
      setDeckCards(newDeck)
    }
  }

  // Auto-build deck algorithm
  const autoBuildDeck = () => {
    const newDeck: string[] = []

    // Score cards based on strategy
    const scoreCard = (card: CardType): number => {
      let score = 0

      // Rarity score
      const rarityScores: Record<Rarity, number> = {
        legendary: 100,
        epic: 80,
        rare: 60,
        uncommon: 40,
        common: 20
      }
      score += rarityScores[card.rarity]

      // Strategy-specific scoring
      switch (autoBuildStrategy) {
        case 'aggressive':
          // Prefer low cost, high attack
          if (card.type === 'creature' && card.attacks) {
            const maxDamage = Math.max(...card.attacks.map(a => a.damage))
            score += maxDamage
          }
          score += (7 - card.cost) * 10 // Prefer lower cost
          break

        case 'defensive':
          // Prefer high HP creatures
          if (card.type === 'creature' && card.hp) {
            score += card.hp / 2
          }
          if (card.type === 'spell' && card.effect?.toLowerCase().includes('heal')) {
            score += 50
          }
          break

        case 'element-focus':
          // Heavily prefer chosen element
          if (card.element === focusElement) {
            score += 200
          }
          break

        case 'balanced':
        default:
          // Balanced curve scoring
          if (card.cost <= 2) score += 30
          else if (card.cost <= 4) score += 40
          else if (card.cost <= 6) score += 30
          else score += 15

          if (card.type === 'creature') score += 20
          break
      }

      return score
    }

    // Get all owned cards with scores
    const scoredCards = ownedCards.map(card => ({
      card,
      score: scoreCard(card),
      owned: collection[card.id]?.quantity || 0
    })).sort((a, b) => b.score - a.score)

    // For balanced strategy, try to include variety
    const elementCounts: Record<Element, number> = {} as Record<Element, number>
    elements.forEach(el => elementCounts[el] = 0)

    // Build deck
    for (const { card, owned } of scoredCards) {
      if (newDeck.length >= DECK_SIZE) break

      const currentCount = newDeck.filter(id => id === card.id).length
      const maxCopies = Math.min(MAX_COPIES, owned)

      // For balanced, limit element concentration
      if (autoBuildStrategy === 'balanced') {
        const elementLimit = Math.ceil(DECK_SIZE / 4) // ~5 per element max for balance
        if (elementCounts[card.element] >= elementLimit) continue
      }

      // Add copies
      while (currentCount + newDeck.filter(id => id === card.id).length < maxCopies && newDeck.length < DECK_SIZE) {
        newDeck.push(card.id)
        elementCounts[card.element]++

        // For non-focused strategies, only add 1 copy initially to ensure variety
        if (autoBuildStrategy !== 'element-focus' && autoBuildStrategy !== 'aggressive') {
          break
        }
      }
    }

    // If deck isn't full, fill with remaining best cards
    if (newDeck.length < DECK_SIZE) {
      for (const { card, owned } of scoredCards) {
        if (newDeck.length >= DECK_SIZE) break

        const currentCount = newDeck.filter(id => id === card.id).length
        const maxCopies = Math.min(MAX_COPIES, owned)

        while (currentCount + newDeck.filter(id => id === card.id).length - currentCount < maxCopies - currentCount && newDeck.length < DECK_SIZE) {
          if (newDeck.filter(id => id === card.id).length >= maxCopies) break
          newDeck.push(card.id)
        }
      }
    }

    setDeckCards(newDeck)
    setShowAutoBuildModal(false)
  }

  // Save current deck
  const handleSaveDeck = () => {
    if (!deckName.trim()) return
    if (deckCards.length === 0) return

    const id = selectedDeckId || `deck_${Date.now()}`
    saveDeck(id, deckName, deckCards)

    // Reset
    setSelectedDeckId(null)
    setDeckName('')
    setDeckCards([])
  }

  // Load a deck for editing
  const loadDeck = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId)
    if (!deck) return

    setSelectedDeckId(deckId)
    setDeckName(deck.name)
    setDeckCards([...deck.cards])
  }

  // Create new deck
  const newDeck = () => {
    setSelectedDeckId(null)
    setDeckName('')
    setDeckCards([])
  }

  // Handle delete
  const handleDeleteDeck = (deckId: string) => {
    deleteDeck(deckId)
    if (selectedDeckId === deckId) {
      newDeck()
    }
  }

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Deck Builder</h1>
        <div className="text-white/60">
          {ownedCards.length} cards available
        </div>
      </div>

      {/* Saved Decks */}
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Your Decks ({decks.length})</h2>
          <button
            onClick={newDeck}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg font-medium text-sm transition-colors"
          >
            + New Deck
          </button>
        </div>

        {decks.length === 0 ? (
          <div className="text-white/50 text-center py-4">
            No decks yet. Create one or use Auto-Build!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {decks.map(deck => (
              <motion.div
                key={deck.id}
                whileHover={{ scale: 1.02 }}
                className={`bg-white/10 rounded-lg p-3 cursor-pointer ${
                  selectedDeckId === deck.id ? 'ring-2 ring-yellow-400' : ''
                }`}
                onClick={() => loadDeck(deck.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold truncate">{deck.name}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteDeck(deck.id)
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    X
                  </button>
                </div>
                <div className="text-white/50 text-sm">{deck.cards.length} cards</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Current Deck Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deck Panel */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Current Deck</h2>
            <span className={`text-sm ${deckCards.length === DECK_SIZE ? 'text-green-400' : 'text-yellow-400'}`}>
              {deckCards.length}/{DECK_SIZE}
            </span>
          </div>

          {/* Deck Name Input */}
          <input
            type="text"
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            placeholder="Deck Name..."
            className="w-full bg-white/10 rounded-lg px-3 py-2 mb-4 border border-white/20 focus:border-purple-400 outline-none"
          />

          {/* Auto-Build Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAutoBuildModal(true)}
            className="w-full py-3 mb-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <span>🤖</span> Auto-Build Deck
          </motion.button>

          {/* Deck Stats */}
          {deckCards.length > 0 && (
            <div className="bg-black/20 rounded-lg p-3 mb-4 text-sm">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>Avg Cost: <span className="text-blue-400">{deckStats.avgCost}</span></div>
                <div>Creatures: <span className="text-green-400">{deckStats.creatures}</span></div>
                <div>Spells: <span className="text-purple-400">{deckStats.spells}</span></div>
              </div>
              <div className="flex flex-wrap gap-1">
                {elements.map(el => deckStats.elements[el] > 0 && (
                  <span
                    key={el}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: elementColors[el] + '40', color: elementColors[el] }}
                  >
                    {el}: {deckStats.elements[el]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Deck Cards List */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {deckCards.length === 0 ? (
              <div className="text-white/50 text-center py-8">
                Add cards from your collection or use Auto-Build
              </div>
            ) : (
              // Group by card and show count
              [...new Set(deckCards)].map(cardId => {
                const card = cards.find(c => c.id === cardId)
                if (!card) return null
                const count = getCardCountInDeck(cardId)

                return (
                  <motion.div
                    key={cardId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-2 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: elementColors[card.element] }}
                      >
                        {card.cost}
                      </span>
                      <span className="text-sm truncate">{card.name}</span>
                      {count > 1 && (
                        <span className="text-white/50 text-xs">x{count}</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeCardFromDeck(cardId)}
                      className="text-red-400 hover:text-red-300 text-sm px-2"
                    >
                      -
                    </button>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveDeck}
            disabled={!deckName.trim() || deckCards.length === 0}
            className={`w-full py-3 mt-4 rounded-xl font-bold ${
              deckName.trim() && deckCards.length > 0
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            {selectedDeckId ? 'Update Deck' : 'Save Deck'}
          </motion.button>

          {/* Clear Button */}
          {deckCards.length > 0 && (
            <button
              onClick={() => setDeckCards([])}
              className="w-full py-2 mt-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
            >
              Clear Deck
            </button>
          )}
        </div>

        {/* Card Collection */}
        <div className="lg:col-span-2">
          {/* Element Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setElementFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                elementFilter === 'all' ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
              }`}
            >
              All
            </button>
            {elements.map(el => (
              <button
                key={el}
                onClick={() => setElementFilter(el)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all capitalize ${
                  elementFilter === el ? 'bg-white text-gray-900' : 'bg-white/20 text-white'
                }`}
                style={elementFilter === el ? {} : { borderColor: elementColors[el], borderWidth: 1 }}
              >
                {el === 'fire' && '🔥'}
                {el === 'water' && '💧'}
                {el === 'nature' && '🌿'}
                {el === 'earth' && '🪨'}
                {el === 'lightning' && '⚡'}
                {el === 'shadow' && '🌑'}
                {el === 'light' && '✨'}
                {el === 'ice' && '❄️'}
              </button>
            ))}
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredCards.map(card => {
              const owned = collection[card.id]
              const inDeck = getCardCountInDeck(card.id)
              const maxAllowed = Math.min(MAX_COPIES, owned?.quantity || 0)
              const canAdd = deckCards.length < DECK_SIZE && inDeck < maxAllowed

              return (
                <motion.div
                  key={card.id}
                  className={`relative ${!canAdd ? 'opacity-50' : ''}`}
                  whileHover={canAdd ? { scale: 1.02 } : undefined}
                >
                  <Card
                    card={card}
                    size="sm"
                    onClick={canAdd ? () => addCardToDeck(card.id) : undefined}
                  />

                  {/* Owned Badge */}
                  <div className="absolute top-1 right-1 bg-black/70 rounded-full px-1.5 text-xs font-bold">
                    {owned?.quantity || 0}
                  </div>

                  {/* In Deck Badge */}
                  {inDeck > 0 && (
                    <div className="absolute top-1 left-1 bg-yellow-500 rounded-full px-1.5 text-xs font-bold text-black">
                      {inDeck}x
                    </div>
                  )}

                  {/* Add indicator */}
                  {canAdd && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-green-500/80 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold">
                        +
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold mb-2">No Cards Found</h2>
              <p className="text-white/70">
                Open some packs to get more cards!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Build Modal */}
      <AnimatePresence>
        {showAutoBuildModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAutoBuildModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>🤖</span> Auto-Build Deck
              </h2>

              <p className="text-white/70 mb-6">
                Choose a strategy and we'll build the best deck from your collection!
              </p>

              {/* Strategy Selection */}
              <div className="space-y-3 mb-6">
                {[
                  { id: 'balanced', label: 'Balanced', icon: '⚖️', desc: 'Mix of elements and costs' },
                  { id: 'aggressive', label: 'Aggressive', icon: '⚔️', desc: 'Fast, high damage cards' },
                  { id: 'defensive', label: 'Defensive', icon: '🛡️', desc: 'High HP and healing' },
                  { id: 'element-focus', label: 'Element Focus', icon: '🎯', desc: 'Specialize in one element' }
                ].map(strategy => (
                  <motion.button
                    key={strategy.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAutoBuildStrategy(strategy.id as AutoBuildStrategy)}
                    className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors ${
                      autoBuildStrategy === strategy.id
                        ? 'bg-purple-500/40 ring-2 ring-purple-400'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-2xl">{strategy.icon}</span>
                    <div>
                      <div className="font-bold">{strategy.label}</div>
                      <div className="text-sm text-white/60">{strategy.desc}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Element Selection for Focus Strategy */}
              {autoBuildStrategy === 'element-focus' && (
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Choose Element:</label>
                  <div className="flex flex-wrap gap-2">
                    {elements.map(el => (
                      <button
                        key={el}
                        onClick={() => setFocusElement(el)}
                        className={`px-3 py-2 rounded-lg transition-all ${
                          focusElement === el
                            ? 'ring-2 ring-white'
                            : ''
                        }`}
                        style={{ backgroundColor: elementColors[el] + '60' }}
                      >
                        {el === 'fire' && '🔥'}
                        {el === 'water' && '💧'}
                        {el === 'nature' && '🌿'}
                        {el === 'earth' && '🪨'}
                        {el === 'lightning' && '⚡'}
                        {el === 'shadow' && '🌑'}
                        {el === 'light' && '✨'}
                        {el === 'ice' && '❄️'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Build Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAutoBuildModal(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={autoBuildDeck}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold"
                >
                  Build Deck
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
