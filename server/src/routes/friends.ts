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
router.get('/search', authMiddleware, (req: Request, res: Response) => {
  const query = req.query.q as string
  const userId = (req as any).userId

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' })
  }

  const users = searchUsers(query)
    .filter(u => u.id !== userId) // Exclude self
    .map(u => getPublicUserInfo(u))

  res.json({ users })
})

// Get friends list
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const friends = getFriends(userId).map(u => getPublicUserInfo(u))
  res.json({ friends })
})

// Get pending friend requests
router.get('/requests', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const requests = getPendingRequests(userId).map(r => ({
    ...r,
    fromUser: r.fromUser ? getPublicUserInfo(r.fromUser) : undefined
  }))
  res.json({ requests })
})

// Get sent friend requests
router.get('/requests/sent', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const requests = getSentRequests(userId)
  res.json({ requests })
})

// Send friend request
router.post('/request/:targetUserId', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { targetUserId } = req.params

  if (userId === targetUserId) {
    return res.status(400).json({ error: 'Cannot send friend request to yourself' })
  }

  const targetUser = getUserById(targetUserId)
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' })
  }

  const request = sendFriendRequest(userId, targetUserId)

  if (!request) {
    return res.status(400).json({ error: 'Already friends or request pending' })
  }

  res.status(201).json({ request })
})

// Accept friend request
router.post('/request/:requestId/accept', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { requestId } = req.params

  const success = acceptFriendRequest(requestId, userId)

  if (!success) {
    return res.status(400).json({ error: 'Invalid request or not authorized' })
  }

  res.json({ success: true })
})

// Reject friend request
router.post('/request/:requestId/reject', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { requestId } = req.params

  const success = rejectFriendRequest(requestId, userId)

  if (!success) {
    return res.status(400).json({ error: 'Invalid request or not authorized' })
  }

  res.json({ success: true })
})

// Remove friend
router.delete('/:friendId', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { friendId } = req.params

  const success = removeFriend(userId, friendId)

  if (!success) {
    return res.status(400).json({ error: 'Not friends with this user' })
  }

  res.json({ success: true })
})

// Get user profile
router.get('/user/:userId', authMiddleware, (req: Request, res: Response) => {
  const { userId } = req.params
  const user = getUserById(userId)

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json({ user: getPublicUserInfo(user) })
})

export default router
