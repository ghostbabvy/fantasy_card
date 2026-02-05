import { Router, Request, Response } from 'express'
import { authMiddleware } from './auth.js'
import {
  getLeaderboard,
  getUserRank,
  getPublicUserInfo,
  updateUserStats
} from '../db/users.js'

const router = Router()

// Get leaderboard
router.get('/', async (req: Request, res: Response) => {
  const sortBy = (req.query.sortBy as 'battlesWon' | 'totalDamageDealt' | 'achievementPoints') || 'battlesWon'
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)

  try {
    const users = await getLeaderboard(sortBy, limit)
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      user: getPublicUserInfo(user)
    }))

    res.json({ leaderboard, sortBy })
  } catch (error) {
    console.error('Leaderboard error:', error)
    res.status(500).json({ error: 'Failed to get leaderboard' })
  }
})

// Get user's rank
router.get('/rank/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  const sortBy = (req.query.sortBy as 'battlesWon' | 'totalDamageDealt' | 'achievementPoints') || 'battlesWon'

  try {
    const rank = await getUserRank(userId, sortBy)

    if (rank === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ rank, sortBy })
  } catch (error) {
    console.error('Get rank error:', error)
    res.status(500).json({ error: 'Failed to get rank' })
  }
})

// Update user stats (authenticated)
router.post('/stats', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { battlesWon, battlesPlayed, totalDamageDealt, cardsCollected, achievementPoints } = req.body

  const updates: any = {}
  if (battlesWon !== undefined) updates.battlesWon = battlesWon
  if (battlesPlayed !== undefined) updates.battlesPlayed = battlesPlayed
  if (totalDamageDealt !== undefined) updates.totalDamageDealt = totalDamageDealt
  if (cardsCollected !== undefined) updates.cardsCollected = cardsCollected
  if (achievementPoints !== undefined) updates.achievementPoints = achievementPoints

  try {
    await updateUserStats(userId, updates)
    res.json({ success: true })
  } catch (error) {
    console.error('Update stats error:', error)
    res.status(500).json({ error: 'Failed to update stats' })
  }
})

export default router
