export type Element = 'fire' | 'water' | 'nature' | 'earth' | 'lightning' | 'shadow' | 'light' | 'ice'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type CardType = 'creature' | 'spell' | 'equipment'

export interface Attack {
  name: string
  damage: number
  cost: number  // Energy/mana cost to use this attack
  effect?: string  // Optional special effect description
}

export interface Card {
  id: string
  name: string
  type: CardType
  element: Element
  rarity: Rarity
  cost: number        // Mana cost to play the card
  hp?: number         // Creatures only
  attacks?: Attack[]  // Creatures only - their attack moves
  effect?: string     // Spell effect description
  description: string // Flavor text
  artwork: string
}

export interface Deck {
  id: string
  name: string
  cards: string[] // Card IDs
}

export interface BattleCard extends Card {
  instanceId: string
  currentHp: number
  currentAttack: number
  canAttack: boolean
  hasAttackedThisTurn: boolean
}

export interface Player {
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  deck: string[]
  hand: BattleCard[]
  field: BattleCard[]
  graveyard: string[]
}

export interface BattleState {
  player: Player
  enemy: Player
  turn: 'player' | 'enemy'
  turnNumber: number
  phase: 'draw' | 'main' | 'attack' | 'end'
  isOver: boolean
  winner: 'player' | 'enemy' | null
}

// Element advantages
export const elementAdvantages: Record<Element, Element> = {
  fire: 'nature',
  water: 'fire',
  nature: 'earth',
  earth: 'lightning',
  lightning: 'water',
  shadow: 'light',
  light: 'shadow',
  ice: 'nature'  // Ice is strong against nature
}

// Rarity colors
export const rarityColors: Record<Rarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b'
}

// Element colors
export const elementColors: Record<Element, string> = {
  fire: '#ef4444',
  water: '#3b82f6',
  nature: '#22c55e',
  earth: '#a16207',
  lightning: '#eab308',
  shadow: '#6b21a8',
  light: '#fbbf24',
  ice: '#67e8f9'  // Cyan/ice blue
}

// Dust values
export const dustValues: Record<Rarity, { disenchant: number; craft: number }> = {
  common: { disenchant: 5, craft: 40 },
  uncommon: { disenchant: 20, craft: 100 },
  rare: { disenchant: 100, craft: 400 },
  epic: { disenchant: 400, craft: 1600 },
  legendary: { disenchant: 1600, craft: 3200 }
}
