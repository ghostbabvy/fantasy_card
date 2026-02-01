import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useBattleStore } from '../stores/battleStore'
import { cards } from '../data/cards'
import Card from '../components/Card'
import BattleArena from '../components/Battle/BattleArena'
import { Rarity, Card as CardType } from '../types'

const DECK_SIZE = 20
const MAX_COPIES = 2

type View = 'menu' | 'deckBuilder' | 'battle'

export default function BattlePage() {
  const { collection, decks, saveDeck, deleteDeck } = useGameStore()
  const { isInBattle, startBattle } = useBattleStore()

  const [view, setView] = useState<View>('menu')
  const [currentDeck, setCurrentDeck] = useState<string[]>([])
  const [deckName, setDeckName] = useState('')
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)

  const ownedCards = cards.filter(card => {
    const owned = collection[card.id]
    return owned && owned.quantity > 0
  })

  const addToDeck = (cardId: string) => {
    if (currentDeck.length >= DECK_SIZE) return

    const countInDeck = currentDeck.filter(id => id === cardId).length
    const owned = collection[cardId]?.quantity || 0
    if (countInDeck >= owned) return

    setCurrentDeck([...currentDeck, cardId])
  }

  const removeFromDeck = (index: number) => {
    setCurrentDeck(currentDeck.filter((_, i) => i !== index))
  }

  const handleSaveDeck = () => {
    if (!deckName.trim() || currentDeck.length !== DECK_SIZE) return
    saveDeck(editingDeckId || Date.now().toString(), deckName, currentDeck)
    setView('menu')
    resetDeckBuilder()
  }

  const handleStartBattle = () => {
    if (currentDeck.length === DECK_SIZE) {
      startBattle(currentDeck)
    }
  }

  const handleSelectSavedDeck = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId)
    if (deck) {
      setCurrentDeck([...deck.cards])
      setDeckName(deck.name)
      setEditingDeckId(deckId)
      startBattle(deck.cards)
    }
  }

  const handleEditDeck = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId)
    if (deck) {
      setCurrentDeck([...deck.cards])
      setDeckName(deck.name)
      setEditingDeckId(deckId)
      setView('deckBuilder')
    }
  }

  const resetDeckBuilder = () => {
    setCurrentDeck([])
    setDeckName('')
    setEditingDeckId(null)
  }

  const handleNewDeck = () => {
    resetDeckBuilder()
    setView('deckBuilder')
  }

  // Auto-build a balanced deck
  const autoBuildDeck = () => {
    const newDeck: string[] = []

    // Score cards - prioritize rarity and balanced cost curve
    const scoreCard = (card: CardType): number => {
      let score = 0

      const rarityScores: Record<Rarity, number> = {
        legendary: 100,
        epic: 80,
        rare: 60,
        uncommon: 40,
        common: 20
      }
      score += rarityScores[card.rarity]

      // Balanced curve scoring
      if (card.cost <= 2) score += 30
      else if (card.cost <= 4) score += 40
      else if (card.cost <= 6) score += 30
      else score += 15

      if (card.type === 'creature') score += 20

      return score
    }

    // Get owned cards with scores
    const scoredCards = ownedCards.map(card => ({
      card,
      score: scoreCard(card),
      owned: collection[card.id]?.quantity || 0
    })).sort((a, b) => b.score - a.score)

    // Build deck
    for (const { card, owned } of scoredCards) {
      if (newDeck.length >= DECK_SIZE) break

      const currentCount = newDeck.filter(id => id === card.id).length
      const maxCopies = Math.min(MAX_COPIES, owned)

      while (newDeck.filter(id => id === card.id).length < maxCopies && newDeck.length < DECK_SIZE) {
        newDeck.push(card.id)
      }
    }

    setCurrentDeck(newDeck)
    setDeckName('Auto-Built Deck')
  }

  // If in battle, show the arena
  if (isInBattle) {
    return <BattleArena />
  }

  // Main Menu
  if (view === 'menu') {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Battle Arena</h1>

        {/* Main Battle Section - Shows Saved Decks */}
        <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-red-500/30">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl">⚔️</span>
            <div>
              <h2 className="text-2xl font-bold">New Battle</h2>
              <p className="text-white/80">Select a deck to battle with</p>
            </div>
          </div>

          {/* Saved Decks Grid */}
          {decks.length > 0 ? (
            <div className="space-y-3 mb-6">
              {decks.map(deck => (
                <motion.div
                  key={deck.id}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center gap-4 bg-black/30 hover:bg-black/40 rounded-xl p-4 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                    🃏
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{deck.name}</div>
                    <div className="text-white/50 text-sm">{deck.cards.length} cards</div>
                  </div>
                  <button
                    onClick={() => handleEditDeck(deck.id)}
                    className="px-3 py-2 bg-blue-500/50 hover:bg-blue-500/70 rounded-lg transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteDeck(deck.id)}
                    className="px-3 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors text-sm"
                  >
                    Delete
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectSavedDeck(deck.id)}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-bold transition-colors"
                  >
                    Battle!
                  </motion.button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 mb-6 bg-black/20 rounded-xl">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-white/60">No decks yet. Create one to start battling!</p>
            </div>
          )}

          {/* Build New Deck Button */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNewDeck}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>➕</span> Build New Deck
            </motion.button>
            <Link
              to="/decks"
              className="flex-1 py-3 bg-purple-500/30 hover:bg-purple-500/40 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>🤖</span> Auto-Build Deck
            </Link>
          </div>
        </div>

        {/* No cards warning */}
        {ownedCards.length < DECK_SIZE && (
          <div className="p-4 bg-yellow-500/20 rounded-xl text-center">
            <p className="text-yellow-300">
              You need at least {DECK_SIZE} cards to build a deck.
              Open more packs in the Shop!
            </p>
          </div>
        )}
      </div>
    )
  }

  // Deck Builder
  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* Left side - Card pool */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Cards</h2>
          <button
            onClick={() => setView('menu')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {ownedCards.map(card => {
              const countInDeck = currentDeck.filter(id => id === card.id).length
              const available = (collection[card.id]?.quantity || 0) - countInDeck

              return (
                <motion.div
                  key={card.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addToDeck(card.id)}
                  className={`cursor-pointer relative ${available === 0 ? 'opacity-40' : ''}`}
                >
                  <Card card={card} size="sm" />
                  <div className="absolute bottom-1 right-1 bg-black/80 rounded-full px-2 py-0.5 text-xs font-bold">
                    {available}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right side - Current deck */}
      <div className="w-80 bg-white/10 backdrop-blur-sm rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Deck</h2>
          <span className={`font-bold text-lg ${currentDeck.length === DECK_SIZE ? 'text-green-400' : 'text-white/70'}`}>
            {currentDeck.length}/{DECK_SIZE}
          </span>
        </div>

        <input
          type="text"
          value={deckName}
          onChange={e => setDeckName(e.target.value)}
          placeholder="Deck name..."
          className="w-full bg-white/20 rounded-lg px-3 py-2 mb-4 text-white placeholder-white/50 border border-white/20 focus:border-white/40 outline-none"
        />

        {/* Auto-Build Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={autoBuildDeck}
          className="w-full py-2 mb-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-bold flex items-center justify-center gap-2"
        >
          <span>🤖</span> Auto-Build
        </motion.button>

        {/* Deck cards list */}
        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {currentDeck.length === 0 ? (
            <div className="text-center text-white/50 py-8">
              Click cards to add them to your deck
            </div>
          ) : (
            currentDeck.map((cardId, index) => {
              const card = cards.find(c => c.id === cardId)
              if (!card) return null

              return (
                <motion.div
                  key={index}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  onClick={() => removeFromDeck(index)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-red-500/30 rounded-lg p-2 cursor-pointer transition-colors group"
                >
                  <div className={`w-7 h-7 rounded element-${card.element} flex items-center justify-center text-xs font-bold`}>
                    {card.cost}
                  </div>
                  <span className="flex-1 truncate text-sm">{card.name}</span>
                  <span className="text-white/30 group-hover:text-red-400 text-sm">✕</span>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={resetDeckBuilder}
            className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            Clear Deck
          </button>

          <button
            onClick={handleSaveDeck}
            disabled={currentDeck.length !== DECK_SIZE || !deckName.trim()}
            className={`w-full py-2 rounded-lg font-bold transition-all ${
              currentDeck.length === DECK_SIZE && deckName.trim()
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-white/20 text-white/50 cursor-not-allowed'
            }`}
          >
            Save Deck
          </button>

          <button
            onClick={handleStartBattle}
            disabled={currentDeck.length !== DECK_SIZE}
            className={`w-full py-3 rounded-xl text-lg font-bold transition-all ${
              currentDeck.length === DECK_SIZE
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:scale-105'
                : 'bg-white/20 text-white/50 cursor-not-allowed'
            }`}
          >
            ⚔️ Start Battle!
          </button>
        </div>
      </div>
    </div>
  )
}
