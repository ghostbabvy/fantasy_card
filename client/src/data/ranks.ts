import { RankTier, AchievementTier } from '../types'

export const ranks: RankTier[] = [
  { name: 'Novice', pointsRequired: 0, badge: '/icons/rank_novice.png' },
  { name: 'Apprentice', pointsRequired: 100, badge: '/icons/rank_apprentice.png' },
  { name: 'Adept', pointsRequired: 300, badge: '/icons/rank_adept.png' },
  { name: 'Master', pointsRequired: 600, badge: '/icons/rank_master.png' },
  { name: 'Legend', pointsRequired: 1000, badge: '/icons/rank_legend.png' },
  { name: 'Mythic', pointsRequired: 2000, badge: '/icons/rank_mythic.png' }
]

// Points awarded per achievement tier
export const tierPoints: Record<AchievementTier, number> = {
  bronze: 10,
  silver: 30,
  gold: 60
}

// Calculate total achievement points from claimed achievements
export const calculateAchievementPoints = (
  claimedAchievements: { id: string; claimedTiers: AchievementTier[] }[]
): number => {
  let total = 0
  for (const claimed of claimedAchievements) {
    for (const tier of claimed.claimedTiers) {
      total += tierPoints[tier]
    }
  }
  return total
}

// Get current rank based on points
export const getCurrentRank = (points: number): RankTier => {
  let currentRank = ranks[0]
  for (const rank of ranks) {
    if (points >= rank.pointsRequired) {
      currentRank = rank
    } else {
      break
    }
  }
  return currentRank
}

// Get next rank (or null if at max)
export const getNextRank = (points: number): RankTier | null => {
  for (const rank of ranks) {
    if (points < rank.pointsRequired) {
      return rank
    }
  }
  return null
}

// Get progress percentage to next rank
export const getRankProgress = (points: number): number => {
  const currentRank = getCurrentRank(points)
  const nextRank = getNextRank(points)

  if (!nextRank) return 100 // Max rank

  const pointsInCurrentRank = points - currentRank.pointsRequired
  const pointsNeededForNext = nextRank.pointsRequired - currentRank.pointsRequired

  return Math.round((pointsInCurrentRank / pointsNeededForNext) * 100)
}
