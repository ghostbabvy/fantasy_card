import { Router, Request, Response } from 'express'
import {
  createUser,
  authenticateUser,
  getUserById,
  updateUserProfile,
  getPublicUserInfo,
  generateToken
} from '../db/users.js'

const router = Router()

// In-memory session store (in production, use Redis or database)
const sessions: Map<string, { userId: string; expiresAt: Date }> = new Map()

// Middleware to check authentication
export function authMiddleware(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const session = sessions.get(token)
  if (!session || session.expiresAt < new Date()) {
    sessions.delete(token)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  // Attach user ID to request
  (req as any).userId = session.userId
  next()
}

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  const { username, password, displayName } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 characters' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  try {
    const user = await createUser(username, password, displayName)

    if (!user) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    // Create session
    const token = generateToken()
    sessions.set(token, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })

    res.status(201).json({
      token,
      user: getPublicUserInfo(user)
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }

  try {
    const user = await authenticateUser(username, password)

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    // Create session
    const token = generateToken()
    sessions.set(token, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })

    res.json({
      token,
      user: getPublicUserInfo(user)
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Logout
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    sessions.delete(token)
  }
  res.json({ success: true })
})

// Get current user
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId

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

// Update profile
router.patch('/profile', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { displayName, bio, profilePicture } = req.body

  // Validate
  if (displayName && (displayName.length < 1 || displayName.length > 30)) {
    return res.status(400).json({ error: 'Display name must be 1-30 characters' })
  }

  if (bio && bio.length > 200) {
    return res.status(400).json({ error: 'Bio must be under 200 characters' })
  }

  // Limit profile picture size (base64)
  if (profilePicture && profilePicture.length > 500000) {
    return res.status(400).json({ error: 'Profile picture too large' })
  }

  try {
    const user = await updateUserProfile(userId, { displayName, bio, profilePicture })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: getPublicUserInfo(user) })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

export default router
