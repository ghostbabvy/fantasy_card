import { Achievement } from '../types'

export const achievements: Achievement[] = [
  // Collection achievements
  {
    id: 'card_collector',
    title: 'Card Collector',
    description: 'Collect unique cards',
    category: 'collection',
    tiers: {
      bronze: { target: 20, reward: { coins: 100 } },
      silver: { target: 50, reward: { coins: 300, title: 'Collector' } },
      gold: { target: 100, reward: { coins: 500, dust: 200, title: 'Master Collector' } }
    }
  },
  {
    id: 'pack_opener',
    title: 'Pack Enthusiast',
    description: 'Open card packs',
    category: 'collection',
    tiers: {
      bronze: { target: 10, reward: { coins: 50 } },
      silver: { target: 50, reward: { coins: 200 } },
      gold: { target: 100, reward: { coins: 500, title: 'Pack Rat' } }
    }
  },

  // Battle achievements
  {
    id: 'battle_champion',
    title: 'Battle Champion',
    description: 'Win battles',
    category: 'battle',
    tiers: {
      bronze: { target: 10, reward: { coins: 100 } },
      silver: { target: 50, reward: { coins: 300, title: 'Warrior' } },
      gold: { target: 100, reward: { coins: 500, dust: 300, title: 'Champion' } }
    }
  },
  {
    id: 'damage_dealer',
    title: 'Damage Dealer',
    description: 'Deal total damage in battles',
    category: 'battle',
    tiers: {
      bronze: { target: 5000, reward: { coins: 100 } },
      silver: { target: 25000, reward: { coins: 300, title: 'Destroyer' } },
      gold: { target: 100000, reward: { coins: 500, dust: 200, title: 'Annihilator' } }
    }
  },
  {
    id: 'creature_slayer',
    title: 'Creature Slayer',
    description: 'Defeat enemy creatures',
    category: 'battle',
    tiers: {
      bronze: { target: 25, reward: { coins: 100 } },
      silver: { target: 100, reward: { coins: 300 } },
      gold: { target: 500, reward: { coins: 500, title: 'Slayer' } }
    }
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Achieve a win streak',
    category: 'battle',
    tiers: {
      bronze: { target: 3, reward: { coins: 50 } },
      silver: { target: 5, reward: { coins: 150, title: 'On Fire' } },
      gold: { target: 10, reward: { coins: 300, dust: 150, title: 'Unstoppable' } }
    }
  },

  // Challenge mode achievements
  {
    id: 'challenge_master',
    title: 'Challenge Master',
    description: 'Complete challenge levels',
    category: 'challenge',
    tiers: {
      bronze: { target: 10, reward: { coins: 200 } },
      silver: { target: 30, reward: { coins: 500, title: 'Challenger' } },
      gold: { target: 50, reward: { coins: 1000, dust: 500, title: 'Legend' } }
    }
  },

  // Economy achievements
  {
    id: 'big_spender',
    title: 'Big Spender',
    description: 'Spend coins',
    category: 'economy',
    tiers: {
      bronze: { target: 1000, reward: { dust: 50 } },
      silver: { target: 5000, reward: { dust: 150, title: 'Spender' } },
      gold: { target: 20000, reward: { dust: 400, title: 'Whale' } }
    }
  }
]

// Get achievement by ID
export const getAchievementById = (id: string): Achievement | undefined => {
  return achievements.find(a => a.id === id)
}
