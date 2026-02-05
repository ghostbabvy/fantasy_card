// Battle Arena System
// Players can unlock and select different battle backgrounds

export interface Arena {
  id: string
  name: string
  description: string
  background: string  // CSS gradient or image URL
  unlockCondition: 'default' | 'purchase' | 'achievement' | 'level'
  unlockRequirement?: string | number
  cost?: { coins?: number; dust?: number }
  particleColor?: string  // For particle effects
}

export const arenas: Arena[] = [
  {
    id: 'default',
    name: 'Classic Arena',
    description: 'The standard battle arena.',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    unlockCondition: 'default',
    particleColor: '#ffffff'
  },
  {
    id: 'fire',
    name: 'Volcanic Pit',
    description: 'A fiery arena surrounded by molten lava.',
    background: 'linear-gradient(180deg, #1a0a00 0%, #4a1a00 50%, #8b2500 100%)',
    unlockCondition: 'purchase',
    cost: { coins: 1000 },
    particleColor: '#ff6b35'
  },
  {
    id: 'ice',
    name: 'Frozen Tundra',
    description: 'A frigid battlefield of eternal winter.',
    background: 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 50%, #4a90b8 100%)',
    unlockCondition: 'purchase',
    cost: { coins: 1000 },
    particleColor: '#88d4ff'
  },
  {
    id: 'forest',
    name: 'Ancient Forest',
    description: 'A mystical forest filled with ancient magic.',
    background: 'linear-gradient(180deg, #0a1a0a 0%, #1a3a1a 50%, #2d5a2d 100%)',
    unlockCondition: 'purchase',
    cost: { coins: 1000 },
    particleColor: '#88ff88'
  },
  {
    id: 'shadow',
    name: 'Shadow Realm',
    description: 'A dark dimension where shadows come alive.',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a2e 50%, #2e1a4e 100%)',
    unlockCondition: 'purchase',
    cost: { coins: 1500 },
    particleColor: '#9966ff'
  },
  {
    id: 'celestial',
    name: 'Celestial Heights',
    description: 'Battle among the stars and constellations.',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 30%, #2a2a5a 70%, #4a4a8a 100%)',
    unlockCondition: 'purchase',
    cost: { dust: 300 },
    particleColor: '#ffd700'
  },
  {
    id: 'storm',
    name: 'Thunder Peak',
    description: 'A mountain peak wracked by eternal storms.',
    background: 'linear-gradient(180deg, #1a1a2a 0%, #2a2a4a 40%, #4a4a6a 80%, #3a3a5a 100%)',
    unlockCondition: 'purchase',
    cost: { coins: 1500 },
    particleColor: '#ffff88'
  },
  {
    id: 'champion',
    name: 'Champion\'s Coliseum',
    description: 'The grand arena reserved for true champions.',
    background: 'linear-gradient(180deg, #2a1a00 0%, #4a3a1a 30%, #6a5a3a 60%, #8a7a5a 100%)',
    unlockCondition: 'achievement',
    unlockRequirement: 'battle_champion',
    particleColor: '#ffd700'
  },
  {
    id: 'void',
    name: 'The Void',
    description: 'An endless expanse of pure nothingness.',
    background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #1a0a1a 100%)',
    unlockCondition: 'level',
    unlockRequirement: 20,
    particleColor: '#ff00ff'
  }
]

export const getArenaById = (id: string): Arena => {
  return arenas.find(a => a.id === id) || arenas[0]
}
