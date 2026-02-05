// Card Mastery System
// Cards gain mastery XP from battle usage

export interface MasteryLevel {
  level: number
  xpRequired: number  // Total XP needed to reach this level
  title: string
  bonus: {
    attackBonus?: number      // Flat damage bonus
    hpBonus?: number          // Flat HP bonus
    costReduction?: number    // Reduce cost by this amount (min 1)
  }
  borderColor: string  // Visual indicator
}

export const masteryLevels: MasteryLevel[] = [
  {
    level: 0,
    xpRequired: 0,
    title: 'Unranked',
    bonus: {},
    borderColor: '#6b7280'  // Gray
  },
  {
    level: 1,
    xpRequired: 5,
    title: 'Trained',
    bonus: { attackBonus: 2 },
    borderColor: '#22c55e'  // Green
  },
  {
    level: 2,
    xpRequired: 15,
    title: 'Seasoned',
    bonus: { attackBonus: 3, hpBonus: 5 },
    borderColor: '#3b82f6'  // Blue
  },
  {
    level: 3,
    xpRequired: 30,
    title: 'Veteran',
    bonus: { attackBonus: 5, hpBonus: 10 },
    borderColor: '#8b5cf6'  // Purple
  },
  {
    level: 4,
    xpRequired: 50,
    title: 'Elite',
    bonus: { attackBonus: 7, hpBonus: 15, costReduction: 1 },
    borderColor: '#f59e0b'  // Orange
  },
  {
    level: 5,
    xpRequired: 100,
    title: 'Master',
    bonus: { attackBonus: 10, hpBonus: 20, costReduction: 1 },
    borderColor: '#ef4444'  // Red
  }
]

// XP per battle action
export const MASTERY_XP_PER_USE = 1
export const MASTERY_XP_PER_KILL = 2
export const MASTERY_XP_WIN_BONUS = 1

// Get mastery level from XP
export function getMasteryLevel(xp: number): MasteryLevel {
  for (let i = masteryLevels.length - 1; i >= 0; i--) {
    if (xp >= masteryLevels[i].xpRequired) {
      return masteryLevels[i]
    }
  }
  return masteryLevels[0]
}

// Get next mastery level (or null if at max)
export function getNextMasteryLevel(xp: number): MasteryLevel | null {
  const currentLevel = getMasteryLevel(xp)
  const nextLevelIndex = masteryLevels.findIndex(l => l.level === currentLevel.level + 1)
  return nextLevelIndex >= 0 ? masteryLevels[nextLevelIndex] : null
}

// Get progress to next level as percentage
export function getMasteryProgress(xp: number): number {
  const currentLevel = getMasteryLevel(xp)
  const nextLevel = getNextMasteryLevel(xp)

  if (!nextLevel) return 100 // Max level

  const xpIntoCurrentLevel = xp - currentLevel.xpRequired
  const xpForNextLevel = nextLevel.xpRequired - currentLevel.xpRequired

  return Math.min(100, Math.round((xpIntoCurrentLevel / xpForNextLevel) * 100))
}

// Format bonus text for display
export function formatMasteryBonus(bonus: MasteryLevel['bonus']): string[] {
  const parts: string[] = []

  if (bonus.attackBonus) {
    parts.push(`+${bonus.attackBonus} Attack`)
  }
  if (bonus.hpBonus) {
    parts.push(`+${bonus.hpBonus} HP`)
  }
  if (bonus.costReduction) {
    parts.push(`-${bonus.costReduction} Cost`)
  }

  return parts
}
