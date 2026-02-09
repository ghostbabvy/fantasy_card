import { Router, Request, Response } from 'express'
import { authMiddleware } from './auth.js'
import {
  sendGift,
  getPendingGifts,
  claimGift,
  getGiftCooldowns,
  canSendGift,
  addToCollection
} from '../db/users.js'

const router = Router()

// Send a daily gift to a friend
router.post('/:friendId', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { friendId } = req.params

  if (userId === friendId) {
    return res.status(400).json({ error: 'Cannot send gift to yourself' })
  }

  try {
    const gift = await sendGift(userId, friendId)

    if (!gift) {
      return res.status(400).json({ error: 'Cannot send gift - not friends or still on cooldown' })
    }

    res.status(201).json({ gift })
  } catch (error) {
    console.error('Send gift error:', error)
    res.status(500).json({ error: 'Failed to send gift' })
  }
})

// Get pending (unclaimed) gifts
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const gifts = await getPendingGifts(userId)
    res.json({ gifts })
  } catch (error) {
    console.error('Get pending gifts error:', error)
    res.status(500).json({ error: 'Failed to get gifts' })
  }
})

// Claim a gift
router.post('/:giftId/claim', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { giftId } = req.params

  try {
    const gift = await claimGift(giftId, userId)

    if (!gift) {
      return res.status(400).json({ error: 'Gift not found or already claimed' })
    }

    // If reward is a card, add it to collection
    if (gift.rewardType === 'card' && gift.rewardCardId) {
      await addToCollection(userId, gift.rewardCardId, 1)
    }

    res.json({
      gift,
      reward: {
        type: gift.rewardType,
        amount: gift.rewardAmount,
        cardId: gift.rewardCardId
      }
    })
  } catch (error) {
    console.error('Claim gift error:', error)
    res.status(500).json({ error: 'Failed to claim gift' })
  }
})

// Get gift cooldowns for all friends
router.get('/cooldowns', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const cooldowns = await getGiftCooldowns(userId)
    res.json({ cooldowns })
  } catch (error) {
    console.error('Get cooldowns error:', error)
    res.status(500).json({ error: 'Failed to get cooldowns' })
  }
})

// Check if can send gift to specific friend
router.get('/can-send/:friendId', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { friendId } = req.params

  try {
    const canSend = await canSendGift(userId, friendId)
    res.json({ canSend })
  } catch (error) {
    console.error('Check can send error:', error)
    res.status(500).json({ error: 'Failed to check' })
  }
})

export default router
