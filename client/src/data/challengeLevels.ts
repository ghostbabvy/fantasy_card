import { Rarity } from '../types'

export type AIBehavior = 'weakest' | 'strongest' | 'smart'

export interface ChallengeLevel {
  level: number
  name: string
  description: string
  isBoss: boolean

  // AI Configuration
  aiDeckRarities: Rarity[]       // What rarities the AI can use
  aiDamageModifier: number       // Multiplier for AI damage (1.0 = 100%)
  playerHpBonus: number          // Extra HP for player's cards (can be negative)
  aiBehavior: AIBehavior         // How AI picks attacks
  aiUsesSpells: boolean          // Whether AI will use spell cards
  knockoutsToWin: number         // How many KOs needed (default 3, final boss 4)

  // Rewards
  rewards: {
    coins: number
    dust: number
    xp: number
    pack?: 'basic' | 'premium' | 'mega' | 'legendary'
    exclusiveCard?: string       // Card ID of exclusive boss reward
  }

  // Boss specific
  bossName?: string
  bossTitle?: string
}

// Generate all 50 challenge levels
export const challengeLevels: ChallengeLevel[] = [
  // Levels 1-9: Beginner Tier
  ...Array.from({ length: 9 }, (_, i): ChallengeLevel => ({
    level: i + 1,
    name: `Trial ${i + 1}`,
    description: 'Face novice opponents to hone your skills.',
    isBoss: false,
    aiDeckRarities: ['common', 'uncommon'],
    aiDamageModifier: 0.8 + (i * 0.02), // 80-96%
    playerHpBonus: 10 - (i * 1), // +10 to +2
    aiBehavior: i < 5 ? 'weakest' : 'strongest',
    aiUsesSpells: false,
    knockoutsToWin: 3,
    rewards: {
      coins: 50 + (i * 5),
      dust: 0,
      xp: 25 + (i * 3)
    }
  })),

  // Level 10: BOSS - Mountain King
  {
    level: 10,
    name: 'Mountain King',
    description: 'The ruler of the stone realm challenges you!',
    isBoss: true,
    bossName: 'Mountain King',
    bossTitle: 'Guardian of the Earth',
    aiDeckRarities: ['uncommon', 'rare'],
    aiDamageModifier: 1.0,
    playerHpBonus: 0,
    aiBehavior: 'strongest',
    aiUsesSpells: true,
    knockoutsToWin: 3,
    rewards: {
      coins: 300,
      dust: 50,
      xp: 150,
      pack: 'basic',
      exclusiveCard: 'boss_iron_guardian'
    }
  },

  // Levels 11-19: Intermediate Tier
  ...Array.from({ length: 9 }, (_, i): ChallengeLevel => ({
    level: i + 11,
    name: `Challenge ${i + 11}`,
    description: 'Intermediate opponents with mixed decks.',
    isBoss: false,
    aiDeckRarities: ['uncommon', 'rare'],
    aiDamageModifier: 0.9 + (i * 0.02), // 90-106%
    playerHpBonus: 5 - (i * 1), // +5 to -3
    aiBehavior: 'strongest',
    aiUsesSpells: i >= 5,
    knockoutsToWin: 3,
    rewards: {
      coins: 100 + (i * 5),
      dust: 25,
      xp: 50 + (i * 3)
    }
  })),

  // Level 20: BOSS - Void Master
  {
    level: 20,
    name: 'Void Master',
    description: 'The shadow lord emerges from the abyss!',
    isBoss: true,
    bossName: 'Void Master',
    bossTitle: 'Lord of Shadows',
    aiDeckRarities: ['rare', 'epic'],
    aiDamageModifier: 1.1,
    playerHpBonus: -5,
    aiBehavior: 'smart',
    aiUsesSpells: true,
    knockoutsToWin: 3,
    rewards: {
      coins: 500,
      dust: 100,
      xp: 250,
      pack: 'premium',
      exclusiveCard: 'boss_shadow_reaper'
    }
  },

  // Levels 21-29: Advanced Tier
  ...Array.from({ length: 9 }, (_, i): ChallengeLevel => ({
    level: i + 21,
    name: `Gauntlet ${i + 21}`,
    description: 'Advanced opponents with powerful decks.',
    isBoss: false,
    aiDeckRarities: ['rare', 'epic'],
    aiDamageModifier: 1.0 + (i * 0.02), // 100-116%
    playerHpBonus: -5 - i, // -5 to -13
    aiBehavior: 'strongest',
    aiUsesSpells: true,
    knockoutsToWin: 3,
    rewards: {
      coins: 150 + (i * 5),
      dust: 50,
      xp: 75 + (i * 3)
    }
  })),

  // Level 30: BOSS - Storm Tyrant
  {
    level: 30,
    name: 'Storm Tyrant',
    description: 'The master of lightning descends!',
    isBoss: true,
    bossName: 'Storm Tyrant',
    bossTitle: 'Emperor of Thunder',
    aiDeckRarities: ['epic', 'legendary'],
    aiDamageModifier: 1.2,
    playerHpBonus: -15,
    aiBehavior: 'smart',
    aiUsesSpells: true,
    knockoutsToWin: 3,
    rewards: {
      coins: 750,
      dust: 200,
      xp: 400,
      pack: 'premium',
      exclusiveCard: 'boss_storm_herald'
    }
  },

  // Levels 31-39: Expert Tier
  ...Array.from({ length: 9 }, (_, i): ChallengeLevel => ({
    level: i + 31,
    name: `Elite ${i + 31}`,
    description: 'Expert opponents with elite strategies.',
    isBoss: false,
    aiDeckRarities: ['epic', 'legendary'],
    aiDamageModifier: 1.1 + (i * 0.02), // 110-126%
    playerHpBonus: -15 - Math.floor(i / 2), // -15 to -19
    aiBehavior: 'smart',
    aiUsesSpells: true,
    knockoutsToWin: 3,
    rewards: {
      coins: 200 + (i * 10),
      dust: 75,
      xp: 100 + (i * 5)
    }
  })),

  // Level 40: BOSS - Flame Emperor
  {
    level: 40,
    name: 'Flame Emperor',
    description: 'The ancient fire god awakens!',
    isBoss: true,
    bossName: 'Flame Emperor',
    bossTitle: 'Ruler of the Inferno',
    aiDeckRarities: ['legendary'],
    aiDamageModifier: 1.3,
    playerHpBonus: -20,
    aiBehavior: 'smart',
    aiUsesSpells: true,
    knockoutsToWin: 4,
    rewards: {
      coins: 1000,
      dust: 300,
      xp: 600,
      pack: 'mega',
      exclusiveCard: 'boss_phoenix_lord'
    }
  },

  // Levels 41-49: Master Tier
  ...Array.from({ length: 9 }, (_, i): ChallengeLevel => ({
    level: i + 41,
    name: `Master ${i + 41}`,
    description: 'Master-level opponents push your limits.',
    isBoss: false,
    aiDeckRarities: ['epic', 'legendary'],
    aiDamageModifier: 1.2 + (i * 0.02), // 120-136%
    playerHpBonus: -20 - Math.floor(i / 2), // -20 to -24
    aiBehavior: 'smart',
    aiUsesSpells: true,
    knockoutsToWin: 3,
    rewards: {
      coins: 300 + (i * 10),
      dust: 100,
      xp: 150 + (i * 5)
    }
  })),

  // Level 50: FINAL BOSS - World Champion
  {
    level: 50,
    name: 'World Champion',
    description: 'The ultimate challenge awaits. Defeat the champion to become legend!',
    isBoss: true,
    bossName: 'World Champion',
    bossTitle: 'The Undefeated Legend',
    aiDeckRarities: ['legendary'],
    aiDamageModifier: 1.5,
    playerHpBonus: -30,
    aiBehavior: 'smart',
    aiUsesSpells: true,
    knockoutsToWin: 4, // Need 4 KOs to win final boss!
    rewards: {
      coins: 2000,
      dust: 500,
      xp: 1000,
      pack: 'legendary',
      exclusiveCard: 'boss_world_serpent'
    }
  }
]

// Helper to get level by number
export const getChallengeLevel = (level: number): ChallengeLevel | undefined => {
  return challengeLevels.find(l => l.level === level)
}

// Helper to get boss levels
export const getBossLevels = (): ChallengeLevel[] => {
  return challengeLevels.filter(l => l.isBoss)
}

// Calculate replay rewards (25% of original)
export const getReplayRewards = (level: ChallengeLevel): ChallengeLevel['rewards'] => {
  return {
    coins: Math.floor(level.rewards.coins * 0.25),
    dust: Math.floor(level.rewards.dust * 0.25),
    xp: Math.floor(level.rewards.xp * 0.25)
    // No pack or exclusive card on replay
  }
}
