import { Router, Request, Response } from 'express'
import { authMiddleware } from './auth.js'
import {
  createTrade,
  getTrades,
  acceptTrade,
  rejectTrade,
  cancelTrade,
  getLockedCards,
  syncCollection,
  getCollection,
  CollectionItem
} from '../db/users.js'

const router = Router()

// Get all trades (pending, sent, history)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const trades = await getTrades(userId)
    res.json(trades)
  } catch (error) {
    console.error('Get trades error:', error)
    res.status(500).json({ error: 'Failed to get trades' })
  }
})

// Create a trade proposal
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { toUserId, offerCards, requestCards } = req.body

  if (!toUserId || !offerCards || !requestCards) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (!Array.isArray(offerCards) || !Array.isArray(requestCards)) {
    return res.status(400).json({ error: 'offerCards and requestCards must be arrays' })
  }

  if (offerCards.length === 0 && requestCards.length === 0) {
    return res.status(400).json({ error: 'Trade must include at least one card' })
  }

  if (userId === toUserId) {
    return res.status(400).json({ error: 'Cannot trade with yourself' })
  }

  try {
    const trade = await createTrade(userId, toUserId, offerCards, requestCards)

    if (!trade) {
      return res.status(400).json({ error: 'Failed to create trade - not friends or insufficient cards' })
    }

    res.status(201).json({ trade })
  } catch (error) {
    console.error('Create trade error:', error)
    res.status(500).json({ error: 'Failed to create trade' })
  }
})

// Accept a trade
router.post('/:tradeId/accept', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { tradeId } = req.params

  try {
    const success = await acceptTrade(tradeId, userId)

    if (!success) {
      return res.status(400).json({ error: 'Failed to accept trade - not authorized or insufficient cards' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Accept trade error:', error)
    res.status(500).json({ error: 'Failed to accept trade' })
  }
})

// Reject a trade
router.post('/:tradeId/reject', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { tradeId } = req.params

  try {
    const success = await rejectTrade(tradeId, userId)

    if (!success) {
      return res.status(400).json({ error: 'Failed to reject trade - not found or not authorized' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Reject trade error:', error)
    res.status(500).json({ error: 'Failed to reject trade' })
  }
})

// Cancel your own trade
router.post('/:tradeId/cancel', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { tradeId } = req.params

  try {
    const success = await cancelTrade(tradeId, userId)

    if (!success) {
      return res.status(400).json({ error: 'Failed to cancel trade - not found or not authorized' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Cancel trade error:', error)
    res.status(500).json({ error: 'Failed to cancel trade' })
  }
})

// Get locked cards (cards in pending trades)
router.get('/locks', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const locks = await getLockedCards(userId)
    res.json({ locks })
  } catch (error) {
    console.error('Get locks error:', error)
    res.status(500).json({ error: 'Failed to get locked cards' })
  }
})

// Sync collection from client to server
router.post('/collection/sync', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { collection } = req.body

  if (!collection || !Array.isArray(collection)) {
    return res.status(400).json({ error: 'Collection must be an array' })
  }

  try {
    const items: CollectionItem[] = collection.map((item: any) => ({
      cardId: item.cardId,
      quantity: item.quantity || 1
    }))

    await syncCollection(userId, items)
    res.json({ success: true })
  } catch (error) {
    console.error('Sync collection error:', error)
    res.status(500).json({ error: 'Failed to sync collection' })
  }
})

// Get server-side collection
router.get('/collection', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const collection = await getCollection(userId)
    res.json({ collection })
  } catch (error) {
    console.error('Get collection error:', error)
    res.status(500).json({ error: 'Failed to get collection' })
  }
})

export default router
