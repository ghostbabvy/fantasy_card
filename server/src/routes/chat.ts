import { Router, Request, Response } from 'express'
import { authMiddleware } from './auth.js'
import {
  sendMessage,
  getMessages,
  markMessagesRead,
  getUnreadCounts,
  areFriends
} from '../db/users.js'

const router = Router()

// Get messages with a friend
router.get('/:friendId', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { friendId } = req.params
  const limit = parseInt(req.query.limit as string) || 50
  const before = req.query.before as string | undefined

  try {
    // Verify they are friends
    const friends = await areFriends(userId, friendId)
    if (!friends) {
      return res.status(403).json({ error: 'Not friends with this user' })
    }

    const result = await getMessages(userId, friendId, limit, before)
    res.json(result)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

// Send a message to a friend
router.post('/:friendId', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { friendId } = req.params
  const { content } = req.body

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required' })
  }

  if (content.length > 1000) {
    return res.status(400).json({ error: 'Message too long (max 1000 characters)' })
  }

  try {
    const message = await sendMessage(userId, friendId, content.trim())

    if (!message) {
      return res.status(403).json({ error: 'Not friends with this user' })
    }

    res.status(201).json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Mark messages from a friend as read
router.post('/:friendId/read', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { friendId } = req.params

  try {
    await markMessagesRead(userId, friendId)
    res.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// Get unread message counts per friend
router.get('/unread/counts', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId

  try {
    const unread = await getUnreadCounts(userId)
    res.json({ unread })
  } catch (error) {
    console.error('Get unread counts error:', error)
    res.status(500).json({ error: 'Failed to get unread counts' })
  }
})

export default router
