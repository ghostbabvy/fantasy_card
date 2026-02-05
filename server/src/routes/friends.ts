import { Router, Request, Response } from 'express'
import { authMiddleware } from './auth.js'
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getSentRequests,
  searchUsers,
  getUserById,
  getPublicUserInfo
} from '../db/users.js'

const router = Router()

// Search users
router.get('/search', authMiddleware, async (req: Request, res: Response) => {
  const query = req.query.q as string
  const userId = (req as any).userId

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' })
  }

  try {
    const users = await searchUsers(query)
    const filtered = users
      .filter(u => u.id !== userId)
      .map(u => getPublicUserInfo(u))
    res.json({ users: filtered })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Get friends list
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  try {
    const friends = await getFriends(userId)
    res.json({ friends: friends.map(u => getPublicUserInfo(u)) })
  } catch (error) {
    console.error('Get friends error:', error)
    res.status(500).json({ error: 'Failed to get friends' })
  }
})

// Get pending friend requests
router.get('/requests', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  try {
    const requests = await getPendingRequests(userId)
    res.json({
      requests: requests.map(r => ({
        ...r,
        fromUser: r.fromUser ? getPublicUserInfo(r.fromUser) : undefined
      }))
    })
  } catch (error) {
    console.error('Get requests error:', error)
    res.status(500).json({ error: 'Failed to get requests' })
  }
})

// Get sent friend requests
router.get('/requests/sent', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  try {
    const requests = await getSentRequests(userId)
    res.json({ requests })
  } catch (error) {
    console.error('Get sent requests error:', error)
    res.status(500).json({ error: 'Failed to get sent requests' })
  }
})

// Send friend request
router.post('/request/:targetUserId', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { targetUserId } = req.params

  if (userId === targetUserId) {
    return res.status(400).json({ error: 'Cannot send friend request to yourself' })
  }

  try {
    const targetUser = await getUserById(targetUserId)
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const request = await sendFriendRequest(userId, targetUserId)

    if (!request) {
      return res.status(400).json({ error: 'Already friends or request pending' })
    }

    res.status(201).json({ request })
  } catch (error) {
    console.error('Send request error:', error)
    res.status(500).json({ error: 'Failed to send request' })
  }
})

// Accept friend request
router.post('/request/:requestId/accept', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { requestId } = req.params

  try {
    const success = await acceptFriendRequest(requestId, userId)

    if (!success) {
      return res.status(400).json({ error: 'Invalid request or not authorized' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Accept request error:', error)
    res.status(500).json({ error: 'Failed to accept request' })
  }
})

// Reject friend request
router.post('/request/:requestId/reject', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { requestId } = req.params

  try {
    const success = await rejectFriendRequest(requestId, userId)

    if (!success) {
      return res.status(400).json({ error: 'Invalid request or not authorized' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Reject request error:', error)
    res.status(500).json({ error: 'Failed to reject request' })
  }
})

// Remove friend
router.delete('/:friendId', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { friendId } = req.params

  try {
    const success = await removeFriend(userId, friendId)

    if (!success) {
      return res.status(400).json({ error: 'Not friends with this user' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Remove friend error:', error)
    res.status(500).json({ error: 'Failed to remove friend' })
  }
})

// Get user profile
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const user = await getUserById(userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: getPublicUserInfo(user) })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

export default router
