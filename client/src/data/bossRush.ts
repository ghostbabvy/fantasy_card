import { Element } from '../types'

export interface BossRushBoss {
  id: string
  name: string
  title: string
  element: Element
  hp: number
  attackPower: number
  specialAbility: string
  artwork: string
  rewards: {
    coins: number
    dust: number
    xp: number
  }
}

export const bossRushBosses: BossRushBoss[] = [
  {
    id: 'boss_1',
    name: 'Goblin Chief',
    title: 'The Greedy',
    element: 'earth',
    hp: 150,
    attackPower: 40,
    specialAbility: 'Steals 10 coins on hit',
    artwork: '/bosses/goblin_chief.png',
    rewards: { coins: 50, dust: 10, xp: 25 }
  },
  {
    id: 'boss_2',
    name: 'Flame Wraith',
    title: 'Scorched Spirit',
    element: 'fire',
    hp: 200,
    attackPower: 50,
    specialAbility: 'Burns for 15 damage per turn',
    artwork: '/bosses/flame_wraith.png',
    rewards: { coins: 75, dust: 20, xp: 40 }
  },
  {
    id: 'boss_3',
    name: 'Frost Giant',
    title: 'Winter\'s Wrath',
    element: 'ice',
    hp: 280,
    attackPower: 55,
    specialAbility: 'Freezes one card each turn',
    artwork: '/bosses/frost_giant.png',
    rewards: { coins: 100, dust: 30, xp: 60 }
  },
  {
    id: 'boss_4',
    name: 'Storm Serpent',
    title: 'Lightning Coil',
    element: 'lightning',
    hp: 320,
    attackPower: 65,
    specialAbility: 'Chain lightning hits bench',
    artwork: '/bosses/storm_serpent.png',
    rewards: { coins: 150, dust: 50, xp: 80 }
  },
  {
    id: 'boss_5',
    name: 'Shadow Lord',
    title: 'The Void Walker',
    element: 'shadow',
    hp: 400,
    attackPower: 75,
    specialAbility: 'Drains 20 HP per hit',
    artwork: '/bosses/shadow_lord.png',
    rewards: { coins: 200, dust: 75, xp: 100 }
  },
  {
    id: 'boss_6',
    name: 'Nature Titan',
    title: 'Ancient Grove',
    element: 'nature',
    hp: 500,
    attackPower: 70,
    specialAbility: 'Regenerates 30 HP per turn',
    artwork: '/bosses/nature_titan.png',
    rewards: { coins: 250, dust: 100, xp: 120 }
  },
  {
    id: 'boss_7',
    name: 'Abyssal Hydra',
    title: 'The Endless',
    element: 'water',
    hp: 600,
    attackPower: 85,
    specialAbility: 'Grows stronger when damaged',
    artwork: '/bosses/abyssal_hydra.png',
    rewards: { coins: 350, dust: 150, xp: 150 }
  },
  {
    id: 'boss_8',
    name: 'Celestial Dragon',
    title: 'Light\'s Fury',
    element: 'light',
    hp: 750,
    attackPower: 100,
    specialAbility: 'Blinds cards reducing accuracy',
    artwork: '/bosses/celestial_dragon.png',
    rewards: { coins: 500, dust: 200, xp: 200 }
  },
  {
    id: 'boss_9',
    name: 'Elemental Chaos',
    title: 'The Primordial',
    element: 'normal',
    hp: 900,
    attackPower: 110,
    specialAbility: 'Changes element each turn',
    artwork: '/bosses/elemental_chaos.png',
    rewards: { coins: 750, dust: 300, xp: 300 }
  },
  {
    id: 'boss_10',
    name: 'World Eater',
    title: 'The Final Boss',
    element: 'shadow',
    hp: 1200,
    attackPower: 130,
    specialAbility: 'Devours one card per 3 turns',
    artwork: '/bosses/world_eater.png',
    rewards: { coins: 1000, dust: 500, xp: 500 }
  }
]

// Calculate total possible rewards
export const getTotalBossRushRewards = () => {
  return bossRushBosses.reduce(
    (acc, boss) => ({
      coins: acc.coins + boss.rewards.coins,
      dust: acc.dust + boss.rewards.dust,
      xp: acc.xp + boss.rewards.xp
    }),
    { coins: 0, dust: 0, xp: 0 }
  )
}
