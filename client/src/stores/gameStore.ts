import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cards, getCardById } from '../data/cards'
import { Deck, Rarity } from '../types'

interface GameState {
  // Player info
  playerName: string
  level: number
  xp: number

  // Currency
  coins: number
  dust: number

  // Collection: cardId -> quantity
  collection: Record<string, number>

  // Decks
  decks: Deck[]

  // Pity counter for legendary
  pityCounter: number

  // Actions
  setPlayerName: (name: string) => void
  addXp: (amount: number) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  addDust: (amount: number) => void
  spendDust: (amount: number) => boolean
  addCard: (cardId: string, quantity?: number) => void
  removeCard: (cardId: string, quantity?: number) => void
  buyPack: (packType: string) => string[]
  saveDeck: (id: string, name: string, cardIds: string[]) => void
  deleteDeck: (id: string) => void
  craftCard: (cardId: string) => boolean
  disenchantCard: (cardId: string) => number
}

// Drop rates by rarity
const dropRates: Record<Rarity, number> = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.04,
  legendary: 0.01
}

// Dust values
const dustValues: Record<Rarity, { disenchant: number; craft: number }> = {
  common: { disenchant: 5, craft: 40 },
  uncommon: { disenchant: 20, craft: 100 },
  rare: { disenchant: 100, craft: 400 },
  epic: { disenchant: 400, craft: 1600 },
  legendary: { disenchant: 1600, craft: 3200 }
}

// Pack configurations
const packConfigs: Record<string, { cost: number; cardCount: number; minRarity: Rarity }> = {
  basic: { cost: 100, cardCount: 3, minRarity: 'uncommon' },
  premium: { cost: 300, cardCount: 5, minRarity: 'rare' },
  legendary: { cost: 1000, cardCount: 5, minRarity: 'epic' }
}

function rollRarity(minRarity?: Rarity, isPityGuaranteed?: boolean): Rarity {
  if (isPityGuaranteed) return 'legendary'

  const roll = Math.random()
  let cumulative = 0

  const rarities: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common']
  const minIndex = minRarity ? rarities.indexOf(minRarity) : rarities.length - 1

  for (let i = 0; i <= minIndex; i++) {
    const rarity = rarities[i]
    cumulative += dropRates[rarity]
    if (roll < cumulative) {
      return rarity
    }
  }

  // If minimum rarity specified, return it as fallback
  return minRarity || 'common'
}

function getRandomCardOfRarity(rarity: Rarity): string {
  const cardsOfRarity = cards.filter(c => c.rarity === rarity)
  if (cardsOfRarity.length === 0) {
    // Fallback to common if no cards of rarity exist
    const commonCards = cards.filter(c => c.rarity === 'common')
    return commonCards[Math.floor(Math.random() * commonCards.length)].id
  }
  return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)].id
}

// Generate starter collection
function getStarterCollection(): Record<string, number> {
  const collection: Record<string, number> = {}
  const commonCards = cards.filter(c => c.rarity === 'common')

  // Give 2 copies of each common card
  commonCards.forEach(card => {
    collection[card.id] = 2
  })

  return collection
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: 'Hero',
      level: 1,
      xp: 0,
      coins: 500,
      dust: 0,
      collection: getStarterCollection(),
      decks: [],
      pityCounter: 0,

      setPlayerName: (name) => set({ playerName: name }),

      addXp: (amount) => {
        const state = get()
        let newXp = state.xp + amount
        let newLevel = state.level
        let newCoins = state.coins

        // Level up check
        const xpNeeded = newLevel * 100
        while (newXp >= xpNeeded) {
          newXp -= xpNeeded
          newLevel++
          newCoins += 100 // Level up reward
        }

        set({ xp: newXp, level: newLevel, coins: newCoins })
      },

      addCoins: (amount) => set(state => ({ coins: state.coins + amount })),

      spendCoins: (amount) => {
        const state = get()
        if (state.coins < amount) return false
        set({ coins: state.coins - amount })
        return true
      },

      addDust: (amount) => set(state => ({ dust: state.dust + amount })),

      spendDust: (amount) => {
        const state = get()
        if (state.dust < amount) return false
        set({ dust: state.dust - amount })
        return true
      },

      addCard: (cardId, quantity = 1) => {
        set(state => ({
          collection: {
            ...state.collection,
            [cardId]: (state.collection[cardId] || 0) + quantity
          }
        }))
      },

      removeCard: (cardId, quantity = 1) => {
        const state = get()
        const current = state.collection[cardId] || 0
        if (current < quantity) return

        set({
          collection: {
            ...state.collection,
            [cardId]: current - quantity
          }
        })
      },

      buyPack: (packType) => {
        const state = get()
        const config = packConfigs[packType]
        if (!config || state.coins < config.cost) return []

        // Spend coins
        set({ coins: state.coins - config.cost })

        const newCards: string[] = []

        // Check pity
        let pity = state.pityCounter
        const isPityTriggered = pity >= 49

        // Roll cards
        for (let i = 0; i < config.cardCount; i++) {
          const isGuaranteed = i === 0 // First card is guaranteed minimum rarity
          const isPityCard = i === 0 && isPityTriggered

          let rarity: Rarity
          if (isPityCard) {
            rarity = 'legendary'
          } else if (isGuaranteed) {
            rarity = rollRarity(config.minRarity)
          } else {
            rarity = rollRarity()
          }

          const cardId = getRandomCardOfRarity(rarity)
          newCards.push(cardId)

          // Update pity counter
          if (rarity === 'legendary') {
            pity = 0
          } else {
            pity++
          }
        }

        // Add cards to collection
        const newCollection = { ...state.collection }
        newCards.forEach(cardId => {
          newCollection[cardId] = (newCollection[cardId] || 0) + 1
        })

        set({ collection: newCollection, pityCounter: pity })

        return newCards
      },

      saveDeck: (id, name, cardIds) => {
        set(state => {
          const existingIndex = state.decks.findIndex(d => d.id === id)
          const newDeck: Deck = { id, name, cards: cardIds }

          if (existingIndex >= 0) {
            const newDecks = [...state.decks]
            newDecks[existingIndex] = newDeck
            return { decks: newDecks }
          } else {
            return { decks: [...state.decks, newDeck] }
          }
        })
      },

      deleteDeck: (id) => {
        set(state => ({
          decks: state.decks.filter(d => d.id !== id)
        }))
      },

      craftCard: (cardId) => {
        const card = getCardById(cardId)
        if (!card) return false

        const cost = dustValues[card.rarity].craft
        const state = get()

        if (state.dust < cost) return false

        set({
          dust: state.dust - cost,
          collection: {
            ...state.collection,
            [cardId]: (state.collection[cardId] || 0) + 1
          }
        })

        return true
      },

      disenchantCard: (cardId) => {
        const state = get()
        const card = getCardById(cardId)
        if (!card) return 0

        const current = state.collection[cardId] || 0
        if (current < 1) return 0

        const dustGain = dustValues[card.rarity].disenchant

        set({
          collection: {
            ...state.collection,
            [cardId]: current - 1
          },
          dust: state.dust + dustGain
        })

        return dustGain
      }
    }),
    {
      name: 'fantasy-cards-game'
    }
  )
)
