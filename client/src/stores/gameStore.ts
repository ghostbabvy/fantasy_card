import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cards, getCardById } from '../data/cards'
import { Deck, Rarity, AchievementTier } from '../types'
import { achievements as achievementDefinitions } from '../data/achievements'

// Card variant types (for chase/collectibility)
export type CardVariant = 'normal' | 'holo' | 'fullart' | 'secret'

export interface OwnedCard {
  quantity: number
  variants: Record<CardVariant, number>
  isNew?: boolean
}

export interface Mission {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'achievement'
  target: number
  progress: number
  reward: { coins?: number; dust?: number; packs?: string }
  completed: boolean
  claimed: boolean
}

export interface DailyLoginReward {
  day: number
  reward: { coins?: number; dust?: number; packs?: string }
  claimed: boolean
}

interface GameState {
  // Player info
  playerName: string
  playerBio: string
  profilePicture: string  // Base64 data URL
  level: number
  xp: number

  // Currency
  coins: number
  dust: number

  // Collection: cardId -> OwnedCard data
  collection: Record<string, OwnedCard>

  // Decks
  decks: Deck[]

  // Pity counter for legendary
  pityCounter: number

  // Free pack timer (timestamp when next free pack is available)
  freePackTimer: number
  freePacksAvailable: number

  // Daily login system
  lastLoginDate: string
  loginStreak: number
  dailyRewards: DailyLoginReward[]
  hasClaimedTodayLogin: boolean

  // Missions
  missions: Mission[]
  lastMissionReset: string

  // Stats for missions
  stats: {
    battlesWon: number
    battlesPlayed: number
    cardsPlayed: number
    damageDealt: number
    packsOpened: number
    creaturesDefeated: number
    cardUsageCount: Record<string, number>  // cardId -> times used in battle
    winStreak: number
    bestWinStreak: number
    totalCoinsSpent: number
  }

  // Favorites
  favoriteCards: string[]

  // Achievements
  achievements: { id: string; claimedTiers: AchievementTier[] }[]
  unlockedTitles: string[]
  selectedTitle: string | null

  // Challenge mode progress
  challengeProgress: {
    highestLevel: number           // Highest level beaten
    completedLevels: number[]      // Array of completed level numbers
    bossCardsOwned: string[]       // IDs of boss exclusive cards earned
    levelStars: Record<number, number>  // Stars earned per level (1-3)
  }

  // Card Backs
  unlockedCardBacks: string[]
  selectedCardBack: string

  // Battle Arenas
  unlockedArenas: string[]
  selectedArena: string

  // Actions
  setPlayerName: (name: string) => void
  setPlayerBio: (bio: string) => void
  setProfilePicture: (picture: string) => void
  addXp: (amount: number) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  addDust: (amount: number) => void
  spendDust: (amount: number) => boolean
  addCard: (cardId: string, quantity?: number, variant?: CardVariant) => void
  removeCard: (cardId: string, quantity?: number) => void
  buyPack: (packType: string) => Array<{ cardId: string; variant: CardVariant; isNew: boolean }>
  claimFreePack: () => Array<{ cardId: string; variant: CardVariant; isNew: boolean }> | null
  saveDeck: (id: string, name: string, cardIds: string[]) => void
  deleteDeck: (id: string) => void
  craftCard: (cardId: string) => boolean
  disenchantCard: (cardId: string) => number
  sellCard: (cardId: string) => number
  markCardSeen: (cardId: string) => void

  // Daily login
  checkDailyLogin: () => boolean
  claimDailyReward: () => { coins?: number; dust?: number; packs?: string } | null

  // Missions
  updateMissionProgress: (type: string, amount?: number) => void
  claimMissionReward: (missionId: string) => boolean
  resetDailyMissions: () => void

  // Stats
  incrementStat: (stat: keyof GameState['stats'], amount?: number) => void

  // Challenge mode
  completeChallengeLevel: (level: number, isReplay: boolean, rewards: {
    coins: number
    dust: number
    xp: number
    pack?: string
    exclusiveCard?: string
  }, stars: number) => void
  hasBossCard: (cardId: string) => boolean

  // Favorites
  toggleFavorite: (cardId: string) => void
  isFavorite: (cardId: string) => boolean

  // Achievements
  checkAchievements: () => void
  claimAchievementReward: (achievementId: string, tier: AchievementTier) => boolean
  getAchievementProgress: (achievementId: string) => number
  setSelectedTitle: (title: string | null) => void

  // Track card usage
  trackCardUsage: (cardId: string) => void
  recordBattleResult: (won: boolean) => void

  // Card Backs
  purchaseCardBack: (cardBackId: string) => boolean
  setSelectedCardBack: (cardBackId: string) => void
  hasCardBack: (cardBackId: string) => boolean

  // Battle Arenas
  purchaseArena: (arenaId: string) => boolean
  setSelectedArena: (arenaId: string) => void
  hasArena: (arenaId: string) => boolean
}

// Drop rates by rarity
const dropRates: Record<Rarity, number> = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.04,
  legendary: 0.01
}

// Variant drop rates (applied after rarity is determined)
const variantRates: Record<CardVariant, number> = {
  normal: 0.85,
  holo: 0.10,
  fullart: 0.04,
  secret: 0.01
}

// Dust values
const dustValues: Record<Rarity, { disenchant: number; craft: number }> = {
  common: { disenchant: 5, craft: 40 },
  uncommon: { disenchant: 20, craft: 100 },
  rare: { disenchant: 100, craft: 400 },
  epic: { disenchant: 400, craft: 1600 },
  legendary: { disenchant: 1600, craft: 3200 }
}

// Variant dust multipliers (for future use)
export const variantMultipliers: Record<CardVariant, number> = {
  normal: 1,
  holo: 2,
  fullart: 4,
  secret: 8
}

// Sell values (coins)
const sellValues: Record<Rarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 75,
  epic: 200,
  legendary: 500
}

// Pack configurations
const packConfigs: Record<string, { cost: number; cardCount: number; minRarity: Rarity; guaranteedCount?: number }> = {
  basic: { cost: 100, cardCount: 3, minRarity: 'uncommon' },
  premium: { cost: 300, cardCount: 5, minRarity: 'rare' },
  mega: { cost: 500, cardCount: 10, minRarity: 'rare', guaranteedCount: 2 },
  legendary: { cost: 1000, cardCount: 5, minRarity: 'epic' },
  free: { cost: 0, cardCount: 3, minRarity: 'common' }
}

// Free pack interval (12 hours in ms)
const FREE_PACK_INTERVAL = 12 * 60 * 60 * 1000

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

  return minRarity || 'common'
}

function rollVariant(): CardVariant {
  const roll = Math.random()
  let cumulative = 0

  const variants: CardVariant[] = ['secret', 'fullart', 'holo', 'normal']
  for (const variant of variants) {
    cumulative += variantRates[variant]
    if (roll < cumulative) {
      return variant
    }
  }
  return 'normal'
}

function getRandomCardOfRarity(rarity: Rarity): string {
  const cardsOfRarity = cards.filter(c => c.rarity === rarity)
  if (cardsOfRarity.length === 0) {
    const commonCards = cards.filter(c => c.rarity === 'common')
    return commonCards[Math.floor(Math.random() * commonCards.length)].id
  }
  return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)].id
}

// Generate starter collection
function getStarterCollection(): Record<string, OwnedCard> {
  const collection: Record<string, OwnedCard> = {}
  const commonCards = cards.filter(c => c.rarity === 'common')

  commonCards.forEach(card => {
    collection[card.id] = {
      quantity: 2,
      variants: { normal: 2, holo: 0, fullart: 0, secret: 0 },
      isNew: false
    }
  })

  return collection
}

// Generate daily missions
function generateDailyMissions(): Mission[] {
  return [
    {
      id: 'daily_battle_1',
      title: 'Battle Ready',
      description: 'Win 1 battle',
      type: 'daily',
      target: 1,
      progress: 0,
      reward: { coins: 30 },
      completed: false,
      claimed: false
    },
    {
      id: 'daily_battle_3',
      title: 'Warrior',
      description: 'Win 3 battles',
      type: 'daily',
      target: 3,
      progress: 0,
      reward: { coins: 80 },
      completed: false,
      claimed: false
    },
    {
      id: 'daily_damage',
      title: 'Damage Dealer',
      description: 'Deal 500 damage in battles',
      type: 'daily',
      target: 500,
      progress: 0,
      reward: { coins: 50 },
      completed: false,
      claimed: false
    },
    {
      id: 'daily_cards',
      title: 'Card Slinger',
      description: 'Play 10 cards in battles',
      type: 'daily',
      target: 10,
      progress: 0,
      reward: { dust: 30 },
      completed: false,
      claimed: false
    },
    {
      id: 'daily_pack',
      title: 'Pack Hunter',
      description: 'Open 1 pack',
      type: 'daily',
      target: 1,
      progress: 0,
      reward: { coins: 50 },
      completed: false,
      claimed: false
    }
  ]
}

// Generate weekly missions
function generateWeeklyMissions(): Mission[] {
  return [
    {
      id: 'weekly_battles',
      title: 'Weekly Champion',
      description: 'Win 15 battles this week',
      type: 'weekly',
      target: 15,
      progress: 0,
      reward: { packs: 'premium' },
      completed: false,
      claimed: false
    },
    {
      id: 'weekly_packs',
      title: 'Pack Collector',
      description: 'Open 10 packs this week',
      type: 'weekly',
      target: 10,
      progress: 0,
      reward: { coins: 500 },
      completed: false,
      claimed: false
    }
  ]
}

// Generate daily login rewards
function generateDailyRewards(): DailyLoginReward[] {
  return [
    { day: 1, reward: { coins: 50 }, claimed: false },
    { day: 2, reward: { coins: 75 }, claimed: false },
    { day: 3, reward: { dust: 50 }, claimed: false },
    { day: 4, reward: { coins: 100 }, claimed: false },
    { day: 5, reward: { packs: 'basic' }, claimed: false },
    { day: 6, reward: { coins: 150 }, claimed: false },
    { day: 7, reward: { packs: 'premium' }, claimed: false }
  ]
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

// Version for Zustand persist migrations
const CURRENT_VERSION = 5

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: 'Hero',
      playerBio: '',
      profilePicture: '',
      level: 1,
      xp: 0,
      coins: 500,
      dust: 0,
      collection: getStarterCollection(),
      decks: [],
      pityCounter: 0,
      freePackTimer: Date.now(),
      freePacksAvailable: 2, // Start with 2 free packs!
      lastLoginDate: '',
      loginStreak: 0,
      dailyRewards: generateDailyRewards(),
      hasClaimedTodayLogin: false,
      missions: [...generateDailyMissions(), ...generateWeeklyMissions()],
      lastMissionReset: getTodayDateString(),
      stats: {
        battlesWon: 0,
        battlesPlayed: 0,
        cardsPlayed: 0,
        damageDealt: 0,
        packsOpened: 0,
        creaturesDefeated: 0,
        cardUsageCount: {},
        winStreak: 0,
        bestWinStreak: 0,
        totalCoinsSpent: 0
      },
      favoriteCards: [],
      achievements: [],
      unlockedTitles: [],
      selectedTitle: null,
      challengeProgress: {
        highestLevel: 0,
        completedLevels: [],
        bossCardsOwned: [],
        levelStars: {}
      },

      // Card Backs
      unlockedCardBacks: ['default'],
      selectedCardBack: 'default',

      // Battle Arenas
      unlockedArenas: ['default'],
      selectedArena: 'default',

      setPlayerName: (name) => set({ playerName: name }),
      setPlayerBio: (bio) => set({ playerBio: bio }),
      setProfilePicture: (picture) => set({ profilePicture: picture }),

      addXp: (amount) => {
        const state = get()
        let newXp = state.xp + amount
        let newLevel = state.level
        let newCoins = state.coins

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
        set({
          coins: state.coins - amount,
          stats: {
            ...state.stats,
            totalCoinsSpent: state.stats.totalCoinsSpent + amount
          }
        })
        return true
      },

      addDust: (amount) => set(state => ({ dust: state.dust + amount })),

      spendDust: (amount) => {
        const state = get()
        if (state.dust < amount) return false
        set({ dust: state.dust - amount })
        return true
      },

      addCard: (cardId, quantity = 1, variant: CardVariant = 'normal') => {
        set(state => {
          const existing = state.collection[cardId] || {
            quantity: 0,
            variants: { normal: 0, holo: 0, fullart: 0, secret: 0 },
            isNew: true
          }
          return {
            collection: {
              ...state.collection,
              [cardId]: {
                ...existing,
                quantity: existing.quantity + quantity,
                variants: {
                  ...existing.variants,
                  [variant]: (existing.variants[variant] || 0) + quantity
                },
                isNew: true
              }
            }
          }
        })
      },

      removeCard: (cardId, quantity = 1) => {
        const state = get()
        const current = state.collection[cardId]
        if (!current || current.quantity < quantity) return

        set({
          collection: {
            ...state.collection,
            [cardId]: {
              ...current,
              quantity: current.quantity - quantity
            }
          }
        })
      },

      markCardSeen: (cardId) => {
        set(state => {
          const card = state.collection[cardId]
          if (!card) return state
          return {
            collection: {
              ...state.collection,
              [cardId]: { ...card, isNew: false }
            }
          }
        })
      },

      buyPack: (packType) => {
        const state = get()
        const config = packConfigs[packType]
        console.log('buyPack called:', packType, 'config:', config, 'coins:', state.coins)
        if (!config) {
          console.log('No config for pack type:', packType)
          return []
        }
        if (state.coins < config.cost) {
          console.log('Not enough coins:', state.coins, '<', config.cost)
          return []
        }

        // Spend coins
        set({ coins: state.coins - config.cost })

        const newCards: Array<{ cardId: string; variant: CardVariant; isNew: boolean }> = []

        // Check pity
        let pity = state.pityCounter || 0
        const isPityTriggered = pity >= 49

        // Roll cards
        const guaranteedCount = config.guaranteedCount || 1
        for (let i = 0; i < config.cardCount; i++) {
          const isGuaranteed = i < guaranteedCount
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
          const variant = rollVariant()
          const existing = state.collection[cardId]
          // Handle both old (number) and new (OwnedCard) formats
          const existingQty = typeof existing === 'number' ? existing : (existing?.quantity || 0)
          const isNew = existingQty === 0

          newCards.push({ cardId, variant, isNew })
          console.log('Rolled card:', cardId, rarity, variant)

          if (rarity === 'legendary') {
            pity = 0
          } else {
            pity++
          }
        }

        // Add cards to collection
        const newCollection = { ...state.collection }
        newCards.forEach(({ cardId, variant }) => {
          const existing = newCollection[cardId]
          // Handle both old (number) and new (OwnedCard) formats
          let currentCard: OwnedCard
          if (!existing) {
            currentCard = {
              quantity: 0,
              variants: { normal: 0, holo: 0, fullart: 0, secret: 0 },
              isNew: true
            }
          } else if (typeof existing === 'number') {
            // Old format - migrate it
            currentCard = {
              quantity: existing,
              variants: { normal: existing, holo: 0, fullart: 0, secret: 0 },
              isNew: false
            }
          } else {
            currentCard = existing
          }

          newCollection[cardId] = {
            ...currentCard,
            quantity: currentCard.quantity + 1,
            variants: {
              ...currentCard.variants,
              [variant]: (currentCard.variants[variant] || 0) + 1
            },
            isNew: true
          }
        })

        console.log('Cards added to collection, returning:', newCards)

        // Update missions
        const updatedMissions = state.missions.map(m => {
          if (m.id.includes('pack') && !m.completed) {
            const newProgress = m.progress + 1
            return { ...m, progress: newProgress, completed: newProgress >= m.target }
          }
          return m
        })

        set({
          collection: newCollection,
          pityCounter: pity,
          missions: updatedMissions,
          stats: { ...state.stats, packsOpened: state.stats.packsOpened + 1 }
        })

        return newCards
      },

      claimFreePack: () => {
        const state = get()
        const now = Date.now()

        // Check if free pack is available
        if (state.freePacksAvailable <= 0) {
          if (now < state.freePackTimer) return null
        }

        // Generate pack like a basic pack
        const config = packConfigs.free
        const newCards: Array<{ cardId: string; variant: CardVariant; isNew: boolean }> = []

        let pity = state.pityCounter
        const isPityTriggered = pity >= 49

        for (let i = 0; i < config.cardCount; i++) {
          const isPityCard = i === 0 && isPityTriggered
          let rarity: Rarity = isPityCard ? 'legendary' : rollRarity()

          const cardId = getRandomCardOfRarity(rarity)
          const variant = rollVariant()
          const existing = state.collection[cardId]
          const isNew = !existing || existing.quantity === 0

          newCards.push({ cardId, variant, isNew })

          if (rarity === 'legendary') pity = 0
          else pity++
        }

        // Add cards
        const newCollection = { ...state.collection }
        newCards.forEach(({ cardId, variant }) => {
          const existing = newCollection[cardId] || {
            quantity: 0,
            variants: { normal: 0, holo: 0, fullart: 0, secret: 0 },
            isNew: true
          }
          newCollection[cardId] = {
            ...existing,
            quantity: existing.quantity + 1,
            variants: {
              ...existing.variants,
              [variant]: (existing.variants[variant] || 0) + 1
            },
            isNew: true
          }
        })

        // Update free pack timer
        const newFreePacksAvailable = state.freePacksAvailable > 0 ? state.freePacksAvailable - 1 : 0

        set({
          collection: newCollection,
          pityCounter: pity,
          freePackTimer: now + FREE_PACK_INTERVAL,
          freePacksAvailable: newFreePacksAvailable,
          stats: { ...state.stats, packsOpened: state.stats.packsOpened + 1 }
        })

        return newCards
      },

      saveDeck: (id, name, cardIds) => {
        if (!cardIds || cardIds.length === 0) return

        set(state => {
          const existingIndex = state.decks.findIndex(d => d.id === id)
          const newDeck: Deck = { id, name, cards: [...cardIds] }

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

        const existing = state.collection[cardId] || {
          quantity: 0,
          variants: { normal: 0, holo: 0, fullart: 0, secret: 0 },
          isNew: true
        }

        set({
          dust: state.dust - cost,
          collection: {
            ...state.collection,
            [cardId]: {
              ...existing,
              quantity: existing.quantity + 1,
              variants: { ...existing.variants, normal: existing.variants.normal + 1 },
              isNew: true
            }
          }
        })

        return true
      },

      disenchantCard: (cardId) => {
        const state = get()
        const card = getCardById(cardId)
        if (!card) return 0

        const current = state.collection[cardId]
        if (!current || current.quantity < 1) return 0

        const dustGain = dustValues[card.rarity].disenchant

        // Remove from the most common variant first
        const variants = { ...current.variants }
        for (const v of ['normal', 'holo', 'fullart', 'secret'] as CardVariant[]) {
          if (variants[v] > 0) {
            variants[v]--
            break
          }
        }

        set({
          collection: {
            ...state.collection,
            [cardId]: {
              ...current,
              quantity: current.quantity - 1,
              variants
            }
          },
          dust: state.dust + dustGain
        })

        return dustGain
      },

      sellCard: (cardId) => {
        const state = get()
        const card = getCardById(cardId)
        if (!card) return 0

        const current = state.collection[cardId]
        if (!current || current.quantity < 1) return 0

        const coinGain = sellValues[card.rarity]

        // Remove from the most common variant first
        const variants = { ...current.variants }
        for (const v of ['normal', 'holo', 'fullart', 'secret'] as CardVariant[]) {
          if (variants[v] > 0) {
            variants[v]--
            break
          }
        }

        set({
          collection: {
            ...state.collection,
            [cardId]: {
              ...current,
              quantity: current.quantity - 1,
              variants
            }
          },
          coins: state.coins + coinGain
        })

        return coinGain
      },

      checkDailyLogin: () => {
        const state = get()
        const today = getTodayDateString()

        if (state.lastLoginDate === today) {
          return false // Already logged in today
        }

        // Check if streak continues
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        let newStreak = state.loginStreak
        if (state.lastLoginDate === yesterdayStr) {
          newStreak = Math.min(state.loginStreak + 1, 7)
        } else if (state.lastLoginDate !== '') {
          newStreak = 1 // Reset streak
        } else {
          newStreak = 1 // First login
        }

        // Reset daily rewards if completing week or starting fresh
        let newDailyRewards = state.dailyRewards
        if (newStreak === 1 || state.loginStreak === 7) {
          newDailyRewards = generateDailyRewards()
        }

        set({
          lastLoginDate: today,
          loginStreak: newStreak,
          dailyRewards: newDailyRewards,
          hasClaimedTodayLogin: false
        })

        return true
      },

      claimDailyReward: () => {
        const state = get()
        if (state.hasClaimedTodayLogin) return null

        const currentDay = state.loginStreak
        const reward = state.dailyRewards.find(r => r.day === currentDay && !r.claimed)

        if (!reward) return null

        // Apply reward
        let newCoins = state.coins
        let newDust = state.dust

        if (reward.reward.coins) newCoins += reward.reward.coins
        if (reward.reward.dust) newDust += reward.reward.dust

        // Mark as claimed
        const updatedRewards = state.dailyRewards.map(r =>
          r.day === currentDay ? { ...r, claimed: true } : r
        )

        set({
          coins: newCoins,
          dust: newDust,
          dailyRewards: updatedRewards,
          hasClaimedTodayLogin: true
        })

        return reward.reward
      },

      updateMissionProgress: (type, amount = 1) => {
        set(state => {
          const updatedMissions = state.missions.map(m => {
            if (m.completed || m.claimed) return m

            let shouldUpdate = false
            if (type === 'battle_win' && m.id.includes('battle')) shouldUpdate = true
            if (type === 'damage' && m.id.includes('damage')) shouldUpdate = true
            if (type === 'cards_played' && m.id.includes('cards')) shouldUpdate = true
            if (type === 'pack_opened' && m.id.includes('pack')) shouldUpdate = true

            if (shouldUpdate) {
              const newProgress = Math.min(m.progress + amount, m.target)
              return {
                ...m,
                progress: newProgress,
                completed: newProgress >= m.target
              }
            }
            return m
          })

          return { missions: updatedMissions }
        })
      },

      claimMissionReward: (missionId) => {
        const state = get()
        const mission = state.missions.find(m => m.id === missionId)

        if (!mission || !mission.completed || mission.claimed) return false

        let newCoins = state.coins
        let newDust = state.dust

        if (mission.reward.coins) newCoins += mission.reward.coins
        if (mission.reward.dust) newDust += mission.reward.dust

        const updatedMissions = state.missions.map(m =>
          m.id === missionId ? { ...m, claimed: true } : m
        )

        set({
          coins: newCoins,
          dust: newDust,
          missions: updatedMissions
        })

        return true
      },

      resetDailyMissions: () => {
        const state = get()
        const today = getTodayDateString()

        if (state.lastMissionReset === today) return

        // Keep weekly missions, reset daily
        const weeklyMissions = state.missions.filter(m => m.type === 'weekly')
        const newDailyMissions = generateDailyMissions()

        set({
          missions: [...newDailyMissions, ...weeklyMissions],
          lastMissionReset: today
        })
      },

      incrementStat: (stat, amount = 1) => {
        set(state => {
          const currentValue = state.stats[stat]
          // Only increment numeric stats
          if (typeof currentValue === 'number') {
            return {
              stats: {
                ...state.stats,
                [stat]: currentValue + amount
              }
            }
          }
          return state
        })
      },

      completeChallengeLevel: (level, isReplay, rewards, stars) => {
        const state = get()

        // Add rewards
        let newCoins = state.coins + rewards.coins
        let newDust = state.dust + rewards.dust

        // Add XP
        let newXp = state.xp + rewards.xp
        let newLevel = state.level
        const xpNeeded = newLevel * 100
        while (newXp >= xpNeeded) {
          newXp -= xpNeeded
          newLevel++
          newCoins += 100 // Level up reward
        }

        // Update challenge progress
        const newProgress = { ...state.challengeProgress }
        if (!isReplay) {
          if (!newProgress.completedLevels.includes(level)) {
            newProgress.completedLevels = [...newProgress.completedLevels, level]
          }
          if (level > newProgress.highestLevel) {
            newProgress.highestLevel = level
          }
          // Add exclusive card if earned
          if (rewards.exclusiveCard && !newProgress.bossCardsOwned.includes(rewards.exclusiveCard)) {
            newProgress.bossCardsOwned = [...newProgress.bossCardsOwned, rewards.exclusiveCard]
          }
        }

        // Update stars (keep highest)
        const currentStars = newProgress.levelStars[level] || 0
        if (stars > currentStars) {
          newProgress.levelStars = { ...newProgress.levelStars, [level]: stars }
        }

        set({
          coins: newCoins,
          dust: newDust,
          xp: newXp,
          level: newLevel,
          challengeProgress: newProgress
        })
      },

      hasBossCard: (cardId) => {
        return get().challengeProgress.bossCardsOwned.includes(cardId)
      },

      // Favorites
      toggleFavorite: (cardId) => {
        const state = get()
        const isFav = state.favoriteCards.includes(cardId)
        if (isFav) {
          set({ favoriteCards: state.favoriteCards.filter(id => id !== cardId) })
        } else {
          set({ favoriteCards: [...state.favoriteCards, cardId] })
        }
      },

      isFavorite: (cardId) => {
        return get().favoriteCards.includes(cardId)
      },

      // Track card usage in battle
      trackCardUsage: (cardId) => {
        const state = get()
        const currentCount = state.stats.cardUsageCount[cardId] || 0
        set({
          stats: {
            ...state.stats,
            cardUsageCount: {
              ...state.stats.cardUsageCount,
              [cardId]: currentCount + 1
            }
          }
        })
      },

      // Record battle result for win streak tracking
      recordBattleResult: (won) => {
        const state = get()
        if (won) {
          const newStreak = state.stats.winStreak + 1
          const newBestStreak = Math.max(newStreak, state.stats.bestWinStreak)
          set({
            stats: {
              ...state.stats,
              winStreak: newStreak,
              bestWinStreak: newBestStreak
            }
          })
        } else {
          set({
            stats: {
              ...state.stats,
              winStreak: 0
            }
          })
        }
      },

      // Achievement progress calculation
      getAchievementProgress: (achievementId) => {
        const state = get()
        switch (achievementId) {
          case 'card_collector':
            return Object.values(state.collection).filter(c => c && c.quantity > 0).length
          case 'battle_champion':
            return state.stats.battlesWon
          case 'challenge_master':
            return state.challengeProgress.highestLevel
          case 'big_spender':
            return state.stats.totalCoinsSpent
          case 'pack_opener':
            return state.stats.packsOpened
          case 'damage_dealer':
            return state.stats.damageDealt
          case 'creature_slayer':
            return state.stats.creaturesDefeated
          case 'streak_master':
            return state.stats.bestWinStreak
          default:
            return 0
        }
      },

      // Check and update achievements
      checkAchievements: () => {
        // Achievement checking happens automatically when progress is made
        // This function can be called to force a re-check if needed
      },

      // Claim achievement reward
      claimAchievementReward: (achievementId, tier) => {
        const state = get()

        // Find achievement
        const existingEntry = state.achievements.find(a => a.id === achievementId)
        if (existingEntry?.claimedTiers.includes(tier)) {
          return false // Already claimed
        }

        const achievement = achievementDefinitions.find(a => a.id === achievementId)
        if (!achievement) return false

        const tierData = achievement.tiers[tier]
        if (!tierData) return false

        // Check if progress meets requirement
        const progress = state.getAchievementProgress(achievementId)
        if (progress < tierData.target) return false

        // Apply rewards
        let newCoins = state.coins
        let newDust = state.dust
        let newTitles = [...state.unlockedTitles]

        if (tierData.reward.coins) newCoins += tierData.reward.coins
        if (tierData.reward.dust) newDust += tierData.reward.dust
        if (tierData.reward.title && !newTitles.includes(tierData.reward.title)) {
          newTitles.push(tierData.reward.title)
        }

        // Update claimed achievements
        const newAchievements = existingEntry
          ? state.achievements.map(a =>
              a.id === achievementId
                ? { ...a, claimedTiers: [...a.claimedTiers, tier] }
                : a
            )
          : [...state.achievements, { id: achievementId, claimedTiers: [tier] }]

        set({
          coins: newCoins,
          dust: newDust,
          unlockedTitles: newTitles,
          achievements: newAchievements
        })

        return true
      },

      setSelectedTitle: (title) => {
        set({ selectedTitle: title })
      },

      // Card Backs
      purchaseCardBack: (cardBackId) => {
        const state = get()

        // Check if already owned
        if (state.unlockedCardBacks.includes(cardBackId)) {
          return false
        }

        // Import card backs data dynamically to avoid circular deps
        // For now, we'll define the costs inline
        const cardBackCosts: Record<string, { coins?: number; dust?: number }> = {
          'flame': { coins: 500 },
          'frost': { coins: 500 },
          'nature': { coins: 500 },
          'shadow': { coins: 500 },
          'legendary': { dust: 500 }
        }

        const cost = cardBackCosts[cardBackId]
        if (!cost) return false

        // Check if can afford
        if (cost.coins && state.coins < cost.coins) return false
        if (cost.dust && state.dust < cost.dust) return false

        // Deduct cost and add card back
        set({
          coins: cost.coins ? state.coins - cost.coins : state.coins,
          dust: cost.dust ? state.dust - cost.dust : state.dust,
          unlockedCardBacks: [...state.unlockedCardBacks, cardBackId]
        })

        return true
      },

      setSelectedCardBack: (cardBackId) => {
        const state = get()
        if (state.unlockedCardBacks.includes(cardBackId)) {
          set({ selectedCardBack: cardBackId })
        }
      },

      hasCardBack: (cardBackId) => {
        return get().unlockedCardBacks.includes(cardBackId)
      },

      // Battle Arenas
      purchaseArena: (arenaId) => {
        const state = get()

        // Check if already owned
        if (state.unlockedArenas.includes(arenaId)) {
          return false
        }

        // Arena costs
        const arenaCosts: Record<string, { coins?: number; dust?: number }> = {
          'fire': { coins: 1000 },
          'ice': { coins: 1000 },
          'forest': { coins: 1000 },
          'shadow': { coins: 1500 },
          'celestial': { dust: 300 },
          'storm': { coins: 1500 }
        }

        const cost = arenaCosts[arenaId]
        if (!cost) return false

        // Check if can afford
        if (cost.coins && state.coins < cost.coins) return false
        if (cost.dust && state.dust < cost.dust) return false

        // Deduct cost and add arena
        set({
          coins: cost.coins ? state.coins - cost.coins : state.coins,
          dust: cost.dust ? state.dust - cost.dust : state.dust,
          unlockedArenas: [...state.unlockedArenas, arenaId]
        })

        return true
      },

      setSelectedArena: (arenaId) => {
        const state = get()
        if (state.unlockedArenas.includes(arenaId)) {
          set({ selectedArena: arenaId })
        }
      },

      hasArena: (arenaId) => {
        return get().unlockedArenas.includes(arenaId)
      }
    }),
    {
      name: 'fantasy-cards-game',
      version: CURRENT_VERSION,
      migrate: (persistedState: any, version: number) => {
        // Handle all migrations - add missing fields with sensible defaults
        let state = { ...persistedState }

        // Migrate collection format if needed (versions 0-1)
        if (version <= 1) {
          const oldCollection = state.collection || {}
          const newCollection: Record<string, OwnedCard> = {}

          for (const [cardId, value] of Object.entries(oldCollection)) {
            if (typeof value === 'number') {
              newCollection[cardId] = {
                quantity: value,
                variants: { normal: value, holo: 0, fullart: 0, secret: 0 },
                isNew: false
              }
            } else if (value && typeof value === 'object' && 'quantity' in value) {
              newCollection[cardId] = value as OwnedCard
            }
          }

          state.collection = Object.keys(newCollection).length > 0 ? newCollection : getStarterCollection()
        }

        // Ensure all fields exist with defaults
        state = {
          ...state,
          decks: Array.isArray(state.decks) ? state.decks : [],
          freePackTimer: state.freePackTimer || Date.now(),
          freePacksAvailable: state.freePacksAvailable ?? 2,
          lastLoginDate: state.lastLoginDate || '',
          loginStreak: state.loginStreak || 0,
          dailyRewards: state.dailyRewards || generateDailyRewards(),
          hasClaimedTodayLogin: state.hasClaimedTodayLogin || false,
          missions: state.missions || [...generateDailyMissions(), ...generateWeeklyMissions()],
          lastMissionReset: state.lastMissionReset || getTodayDateString(),
          stats: {
            battlesWon: state.stats?.battlesWon || 0,
            battlesPlayed: state.stats?.battlesPlayed || 0,
            cardsPlayed: state.stats?.cardsPlayed || 0,
            damageDealt: state.stats?.damageDealt || 0,
            packsOpened: state.stats?.packsOpened || 0,
            creaturesDefeated: state.stats?.creaturesDefeated || 0,
            cardUsageCount: state.stats?.cardUsageCount || {},
            winStreak: state.stats?.winStreak || 0,
            bestWinStreak: state.stats?.bestWinStreak || 0,
            totalCoinsSpent: state.stats?.totalCoinsSpent || 0
          },
          favoriteCards: state.favoriteCards || [],
          achievements: state.achievements || [],
          unlockedTitles: state.unlockedTitles || [],
          selectedTitle: state.selectedTitle || null,
          challengeProgress: state.challengeProgress || {
            highestLevel: 0,
            completedLevels: [],
            bossCardsOwned: [],
            levelStars: {}
          },
          // New in version 5: card backs, arenas, profile
          unlockedCardBacks: state.unlockedCardBacks || ['default'],
          selectedCardBack: state.selectedCardBack || 'default',
          unlockedArenas: state.unlockedArenas || ['default'],
          selectedArena: state.selectedArena || 'default',
          playerBio: state.playerBio || '',
          profilePicture: state.profilePicture || ''
        }

        return state
      },
      onRehydrateStorage: () => (state) => {
        // Validate decks after rehydration - ensure cards arrays are valid
        if (state && state.decks) {
          const validDecks = state.decks.filter(deck =>
            deck &&
            deck.cards &&
            Array.isArray(deck.cards) &&
            deck.cards.length > 0 &&
            deck.cards.every(cardId => typeof cardId === 'string' && getCardById(cardId))
          )
          if (validDecks.length !== state.decks.length) {
            console.log('Fixed invalid decks during rehydration')
            state.decks = validDecks
          }
        }
      }
    }
  )
)
