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
router.get('/', (req: Request, res: Response) => {
  const sortBy = (req.query.sortBy as 'battlesWon' | 'totalDamageDealt' | 'achievementPoints') || 'battlesWon'
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)

  const leaderboard = getLeaderboard(sortBy, limit).map((user, index) => ({
    rank: index + 1,
    user: getPublicUserInfo(user)
  }))

  res.json({ leaderboard, sortBy })
})

// Get user's rank
router.get('/rank/:userId', (req: Request, res: Response) => {
  const { userId } = req.params
  const sortBy = (req.query.sortBy as 'battlesWon' | 'totalDamageDealt' | 'achievementPoints') || 'battlesWon'

  const rank = getUserRank(userId, sortBy)

  if (rank === 0) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json({ rank, sortBy })
})

// Update user stats (authenticated)
router.post('/stats', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { battlesWon, battlesPlayed, totalDamageDealt, cardsCollected, achievementPoints } = req.body

  const updates: any = {}
  if (battlesWon !== undefined) updates.battlesWon = battlesWon
  if (battlesPlayed !== undefined) updates.battlesPlayed = battlesPlayed
  if (totalDamageDealt !== undefined) updates.totalDamageDealt = totalDamageDealt
  if (cardsCollected !== undefined) updates.cardsCollected = cardsCollected
  if (achievementPoints !== undefined) updates.achievementPoints = achievementPoints

  updateUserStats(userId, updates)

  res.json({ success: true })
})

export default router
