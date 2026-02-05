import crypto from 'crypto'
import pg from 'pg'

const { Pool } = pg

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
})

export interface User {
  id: string
  username: string
  passwordHash: string
  displayName: string
  bio: string
  profilePicture: string
  createdAt: string
  lastLoginAt: string
  stats: {
    battlesWon: number
    battlesPlayed: number
    totalDamageDealt: number
    cardsCollected: number
    achievementPoints: number
  }
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface FriendRelation {
  id: string
  userId1: string
  userId2: string
  createdAt: string
}

// Initialize database tables
export async function initUsersDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        bio TEXT DEFAULT '',
        profile_picture TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP DEFAULT NOW(),
        battles_won INTEGER DEFAULT 0,
        battles_played INTEGER DEFAULT 0,
        total_damage_dealt INTEGER DEFAULT 0,
        cards_collected INTEGER DEFAULT 0,
        achievement_points INTEGER DEFAULT 0
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id TEXT PRIMARY KEY,
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS friend_relations (
        id TEXT PRIMARY KEY,
        user_id1 TEXT REFERENCES users(id),
        user_id2 TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    console.log('✅ Database tables initialized')
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }
}

// Hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Generate session token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Convert DB row to User object
function rowToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    bio: row.bio || '',
    profilePicture: row.profile_picture || '',
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    lastLoginAt: row.last_login_at?.toISOString() || new Date().toISOString(),
    stats: {
      battlesWon: row.battles_won || 0,
      battlesPlayed: row.battles_played || 0,
      totalDamageDealt: row.total_damage_dealt || 0,
      cardsCollected: row.cards_collected || 0,
      achievementPoints: row.achievement_points || 0
    }
  }
}

// User functions
export async function createUser(username: string, password: string, displayName?: string): Promise<User | null> {
  try {
    const id = `user_${Date.now()}`
    const result = await pool.query(
      `INSERT INTO users (id, username, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, username, hashPassword(password), displayName || username]
    )
    return rowToUser(result.rows[0])
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return null
    }
    throw error
  }
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const result = await pool.query(
    `UPDATE users SET last_login_at = NOW()
     WHERE LOWER(username) = LOWER($1) AND password_hash = $2
     RETURNING *`,
    [username, hashPassword(password)]
  )
  return result.rows[0] ? rowToUser(result.rows[0]) : null
}

export async function getUserById(id: string): Promise<User | undefined> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  return result.rows[0] ? rowToUser(result.rows[0]) : undefined
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username])
  return result.rows[0] ? rowToUser(result.rows[0]) : undefined
}

export async function updateUserProfile(userId: string, updates: { displayName?: string; bio?: string; profilePicture?: string }): Promise<User | null> {
  const setClauses: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.displayName !== undefined) {
    setClauses.push(`display_name = $${paramIndex++}`)
    values.push(updates.displayName)
  }
  if (updates.bio !== undefined) {
    setClauses.push(`bio = $${paramIndex++}`)
    values.push(updates.bio)
  }
  if (updates.profilePicture !== undefined) {
    setClauses.push(`profile_picture = $${paramIndex++}`)
    values.push(updates.profilePicture)
  }

  if (setClauses.length === 0) return null

  values.push(userId)
  const result = await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  )
  return result.rows[0] ? rowToUser(result.rows[0]) : null
}

export async function updateUserStats(userId: string, stats: Partial<User['stats']>): Promise<void> {
  const setClauses: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (stats.battlesWon !== undefined) {
    setClauses.push(`battles_won = $${paramIndex++}`)
    values.push(stats.battlesWon)
  }
  if (stats.battlesPlayed !== undefined) {
    setClauses.push(`battles_played = $${paramIndex++}`)
    values.push(stats.battlesPlayed)
  }
  if (stats.totalDamageDealt !== undefined) {
    setClauses.push(`total_damage_dealt = $${paramIndex++}`)
    values.push(stats.totalDamageDealt)
  }
  if (stats.cardsCollected !== undefined) {
    setClauses.push(`cards_collected = $${paramIndex++}`)
    values.push(stats.cardsCollected)
  }
  if (stats.achievementPoints !== undefined) {
    setClauses.push(`achievement_points = $${paramIndex++}`)
    values.push(stats.achievementPoints)
  }

  if (setClauses.length === 0) return

  values.push(userId)
  await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  )
}

// Search users
export async function searchUsers(query: string, limit: number = 20): Promise<User[]> {
  const result = await pool.query(
    `SELECT * FROM users
     WHERE LOWER(username) LIKE LOWER($1) OR LOWER(display_name) LIKE LOWER($1)
     LIMIT $2`,
    [`%${query}%`, limit]
  )
  return result.rows.map(rowToUser)
}

// Friend functions
export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest | null> {
  // Check if already friends
  const existingRelation = await pool.query(
    `SELECT * FROM friend_relations
     WHERE (user_id1 = $1 AND user_id2 = $2) OR (user_id1 = $2 AND user_id2 = $1)`,
    [fromUserId, toUserId]
  )
  if (existingRelation.rows.length > 0) return null

  // Check if request already exists
  const existingRequest = await pool.query(
    `SELECT * FROM friend_requests
     WHERE from_user_id = $1 AND to_user_id = $2 AND status = 'pending'`,
    [fromUserId, toUserId]
  )
  if (existingRequest.rows.length > 0) {
    return {
      id: existingRequest.rows[0].id,
      fromUserId: existingRequest.rows[0].from_user_id,
      toUserId: existingRequest.rows[0].to_user_id,
      status: existingRequest.rows[0].status,
      createdAt: existingRequest.rows[0].created_at?.toISOString()
    }
  }

  const id = `fr_${Date.now()}`
  const result = await pool.query(
    `INSERT INTO friend_requests (id, from_user_id, to_user_id) VALUES ($1, $2, $3) RETURNING *`,
    [id, fromUserId, toUserId]
  )

  return {
    id: result.rows[0].id,
    fromUserId: result.rows[0].from_user_id,
    toUserId: result.rows[0].to_user_id,
    status: result.rows[0].status,
    createdAt: result.rows[0].created_at?.toISOString()
  }
}

export async function acceptFriendRequest(requestId: string, userId: string): Promise<boolean> {
  const request = await pool.query(
    `SELECT * FROM friend_requests WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
    [requestId, userId]
  )
  if (request.rows.length === 0) return false

  await pool.query(`UPDATE friend_requests SET status = 'accepted' WHERE id = $1`, [requestId])

  const relId = `rel_${Date.now()}`
  await pool.query(
    `INSERT INTO friend_relations (id, user_id1, user_id2) VALUES ($1, $2, $3)`,
    [relId, request.rows[0].from_user_id, request.rows[0].to_user_id]
  )

  return true
}

export async function rejectFriendRequest(requestId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE friend_requests SET status = 'rejected'
     WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
    [requestId, userId]
  )
  return (result.rowCount ?? 0) > 0
}

export async function removeFriend(userId: string, friendId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM friend_relations
     WHERE (user_id1 = $1 AND user_id2 = $2) OR (user_id1 = $2 AND user_id2 = $1)`,
    [userId, friendId]
  )
  return (result.rowCount ?? 0) > 0
}

export async function getFriends(userId: string): Promise<User[]> {
  const result = await pool.query(
    `SELECT u.* FROM users u
     JOIN friend_relations fr ON (fr.user_id1 = u.id OR fr.user_id2 = u.id)
     WHERE (fr.user_id1 = $1 OR fr.user_id2 = $1) AND u.id != $1`,
    [userId]
  )
  return result.rows.map(rowToUser)
}

export async function getPendingRequests(userId: string): Promise<(FriendRequest & { fromUser?: User })[]> {
  const result = await pool.query(
    `SELECT fr.*, u.* FROM friend_requests fr
     JOIN users u ON fr.from_user_id = u.id
     WHERE fr.to_user_id = $1 AND fr.status = 'pending'`,
    [userId]
  )

  return result.rows.map(row => ({
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    status: row.status,
    createdAt: row.created_at?.toISOString(),
    fromUser: rowToUser(row)
  }))
}

export async function getSentRequests(userId: string): Promise<FriendRequest[]> {
  const result = await pool.query(
    `SELECT * FROM friend_requests WHERE from_user_id = $1 AND status = 'pending'`,
    [userId]
  )
  return result.rows.map(row => ({
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    status: row.status,
    createdAt: row.created_at?.toISOString()
  }))
}

// Leaderboard functions
export async function getLeaderboard(sortBy: 'battlesWon' | 'totalDamageDealt' | 'achievementPoints' = 'battlesWon', limit: number = 50): Promise<User[]> {
  const columnMap = {
    battlesWon: 'battles_won',
    totalDamageDealt: 'total_damage_dealt',
    achievementPoints: 'achievement_points'
  }
  const result = await pool.query(
    `SELECT * FROM users ORDER BY ${columnMap[sortBy]} DESC LIMIT $1`,
    [limit]
  )
  return result.rows.map(rowToUser)
}

export async function getUserRank(userId: string, sortBy: 'battlesWon' | 'totalDamageDealt' | 'achievementPoints' = 'battlesWon'): Promise<number> {
  const columnMap = {
    battlesWon: 'battles_won',
    totalDamageDealt: 'total_damage_dealt',
    achievementPoints: 'achievement_points'
  }
  const result = await pool.query(
    `SELECT COUNT(*) + 1 as rank FROM users u1
     WHERE ${columnMap[sortBy]} > (SELECT ${columnMap[sortBy]} FROM users WHERE id = $1)`,
    [userId]
  )
  return parseInt(result.rows[0]?.rank) || 0
}

// Get public user info (without password hash)
export function getPublicUserInfo(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...publicInfo } = user
  return publicInfo
}
