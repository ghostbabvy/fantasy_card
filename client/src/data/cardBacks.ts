// Card Back System
// Players can collect and equip different card backs

export interface CardBack {
  id: string
  name: string
  description: string
  image: string
  unlockCondition: 'default' | 'achievement' | 'purchase' | 'event'
  unlockRequirement?: string  // Achievement ID, or description of how to unlock
  cost?: { coins?: number; dust?: number }
}

export const cardBacks: CardBack[] = [
  {
    id: 'default',
    name: 'Classic',
    description: 'The standard Fantasy Cards back design.',
    image: '/cards/card_back.png',
    unlockCondition: 'default'
  },
  {
    id: 'flame',
    name: 'Inferno',
    description: 'A fiery design for those who play with fire.',
    image: '/cards/card_back.png', // Would be different image in real app
    unlockCondition: 'purchase',
    cost: { coins: 500 }
  },
  {
    id: 'frost',
    name: 'Frozen Heart',
    description: 'Cold as ice, sharp as crystal.',
    image: '/cards/card_back.png',
    unlockCondition: 'purchase',
    cost: { coins: 500 }
  },
  {
    id: 'nature',
    name: 'Forest Spirit',
    description: 'The essence of the ancient woods.',
    image: '/cards/card_back.png',
    unlockCondition: 'purchase',
    cost: { coins: 500 }
  },
  {
    id: 'shadow',
    name: 'Void Walker',
    description: 'Darkness conceals all secrets.',
    image: '/cards/card_back.png',
    unlockCondition: 'purchase',
    cost: { coins: 500 }
  },
  {
    id: 'champion',
    name: 'Champion\'s Glory',
    description: 'For those who have proven themselves in battle.',
    image: '/cards/card_back.png',
    unlockCondition: 'achievement',
    unlockRequirement: 'battle_champion' // Win 100 battles
  },
  {
    id: 'collector',
    name: 'Collector\'s Pride',
    description: 'A testament to your collection.',
    image: '/cards/card_back.png',
    unlockCondition: 'achievement',
    unlockRequirement: 'card_collector' // Collect 100 cards
  },
  {
    id: 'legendary',
    name: 'Legendary Frame',
    description: 'The rarest and most prestigious card back.',
    image: '/cards/card_back.png',
    unlockCondition: 'purchase',
    cost: { dust: 500 }
  }
]

export const getCardBackById = (id: string): CardBack => {
  return cardBacks.find(cb => cb.id === id) || cardBacks[0]
}
