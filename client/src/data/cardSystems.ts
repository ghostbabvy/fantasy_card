import {
  Rarity,
  ConditionTier,
  AgeTier,
  CorruptionTier,
  conditionMultipliers,
  rarityDegradation,
  ageValueMultipliers
} from '../types'

// ==================== CONDITION SYSTEM ====================

export function getConditionTier(condition: number): ConditionTier {
  if (condition >= 90) return 'mint'
  if (condition >= 75) return 'near-mint'
  if (condition >= 55) return 'excellent'
  if (condition >= 35) return 'good'
  if (condition >= 15) return 'played'
  return 'poor'
}

export function getConditionLabel(tier: ConditionTier): string {
  const labels: Record<ConditionTier, string> = {
    'mint': 'Mint',
    'near-mint': 'Near Mint',
    'excellent': 'Excellent',
    'good': 'Good',
    'played': 'Played',
    'poor': 'Poor'
  }
  return labels[tier]
}

export function getConditionAbbr(tier: ConditionTier): string {
  const abbrs: Record<ConditionTier, string> = {
    'mint': 'MT',
    'near-mint': 'NM',
    'excellent': 'EX',
    'good': 'GD',
    'played': 'PL',
    'poor': 'PR'
  }
  return abbrs[tier]
}

export function getConditionColor(tier: ConditionTier): string {
  const colors: Record<ConditionTier, string> = {
    'mint': '#22c55e',
    'near-mint': '#86efac',
    'excellent': '#facc15',
    'good': '#f97316',
    'played': '#ef4444',
    'poor': '#991b1b'
  }
  return colors[tier]
}

export function degradeCondition(currentCondition: number, rarity: Rarity, uses: number = 1): number {
  const degradationPerUse = rarityDegradation[rarity]
  return Math.max(0, currentCondition - (degradationPerUse * uses))
}

export function getConditionSellMultiplier(condition: number): number {
  const tier = getConditionTier(condition)
  return conditionMultipliers[tier]
}

// Dust cost to restore condition. Higher rarity = more expensive.
const dustCostPerPoint: Record<Rarity, number> = {
  basic: 1,
  uncommon: 2,
  mythical: 5,
  legendary: 10,
  celestial: 20
}

export function getRestorationCost(currentCondition: number, rarity: Rarity): number {
  if (currentCondition >= 90) return 0 // Already at max restorable
  const pointsToRestore = Math.min(25, 90 - currentCondition)
  return Math.ceil(pointsToRestore * dustCostPerPoint[rarity])
}

export function getRestoredCondition(currentCondition: number): number {
  return Math.min(90, currentCondition + 25) // Restores up to 25 points, caps at 90 (never back to true Mint)
}

// ==================== AGING SYSTEM ====================

const DAY_MS = 24 * 60 * 60 * 1000

export function getAgeDays(acquiredAt: number): number {
  return Math.floor((Date.now() - acquiredAt) / DAY_MS)
}

export function getAgeTier(acquiredAt: number): AgeTier {
  const days = getAgeDays(acquiredAt)
  if (days >= 90) return 'ancient'
  if (days >= 30) return 'vintage'
  if (days >= 7) return 'settled'
  return 'fresh'
}

export function getAgeLabel(tier: AgeTier): string {
  const labels: Record<AgeTier, string> = {
    'fresh': 'Fresh',
    'settled': 'Settled',
    'vintage': 'Vintage',
    'ancient': 'Ancient'
  }
  return labels[tier]
}

export function getAgeColor(tier: AgeTier): string {
  const colors: Record<AgeTier, string> = {
    'fresh': '#94a3b8',
    'settled': '#38bdf8',
    'vintage': '#c084fc',
    'ancient': '#fbbf24'
  }
  return colors[tier]
}

// Age bonus only applies if card is in good condition (Mint or Near Mint)
export function getAgeValueBonus(acquiredAt: number, condition: number): number {
  if (condition < 75) return 1.0 // No age bonus for worn cards
  const tier = getAgeTier(acquiredAt)
  return ageValueMultipliers[tier]
}

// ==================== CORRUPTION SYSTEM ====================

export function getCorruptionTier(corruption: number): CorruptionTier {
  if (corruption <= 10) return 'pure'
  if (corruption <= 30) return 'tainted'
  if (corruption <= 60) return 'corrupted'
  return 'void'
}

export function getCorruptionLabel(tier: CorruptionTier): string {
  const labels: Record<CorruptionTier, string> = {
    'pure': 'Pure',
    'tainted': 'Tainted',
    'corrupted': 'Corrupted',
    'void': 'Void'
  }
  return labels[tier]
}

export function getCorruptionColor(tier: CorruptionTier): string {
  const colors: Record<CorruptionTier, string> = {
    'pure': '#22c55e',
    'tainted': '#a855f7',
    'corrupted': '#7c3aed',
    'void': '#3b0764'
  }
  return colors[tier]
}

const purifyMultiplier: Record<Rarity, number> = {
  basic: 1,
  uncommon: 2,
  mythical: 4,
  legendary: 8,
  celestial: 15
}

export function getPurificationCost(corruption: number, rarity: Rarity): number {
  if (corruption <= 0) return 0
  return Math.ceil(corruption * purifyMultiplier[rarity])
}

export function getPurifiedCorruption(corruption: number): number {
  return Math.max(0, corruption - 20)
}

export function canEmbraceVoid(corruption: number): boolean {
  return corruption >= 80
}

export interface CorruptionBattleEffects {
  bonusDamagePercent: number
  selfDamageChance: number
  randomTargetChance: number
}

export function getCorruptionBattleEffects(corruption: number): CorruptionBattleEffects {
  const tier = getCorruptionTier(corruption)
  switch (tier) {
    case 'pure':
      return { bonusDamagePercent: 0, selfDamageChance: 0, randomTargetChance: 0 }
    case 'tainted':
      return { bonusDamagePercent: 5, selfDamageChance: 0.05, randomTargetChance: 0.03 }
    case 'corrupted':
      return { bonusDamagePercent: 15, selfDamageChance: 0.12, randomTargetChance: 0.08 }
    case 'void':
      return { bonusDamagePercent: 30, selfDamageChance: 0.20, randomTargetChance: 0.15 }
  }
}

// How much corruption spreads per battle based on deck's average corruption
export function getCorruptionSpreadRate(avgCorruption: number): number {
  if (avgCorruption > 60) return 1.0
  if (avgCorruption > 30) return 0.5
  return 0
}

// ==================== COMBINED VALUE CALCULATIONS ====================

export function calculateAdjustedSellValue(baseValue: number, condition: number, acquiredAt: number): number {
  const condMult = getConditionSellMultiplier(condition)
  const ageBonus = getAgeValueBonus(acquiredAt, condition)
  return Math.max(1, Math.floor(baseValue * condMult * ageBonus))
}

export function calculateAdjustedDustValue(baseValue: number, condition: number, acquiredAt: number): number {
  const condMult = getConditionSellMultiplier(condition)
  const ageBonus = getAgeValueBonus(acquiredAt, condition)
  return Math.max(1, Math.floor(baseValue * condMult * ageBonus))
}
