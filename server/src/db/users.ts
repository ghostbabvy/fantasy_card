import crypto from 'crypto'
import pg from 'pg'

const { Pool } = pg

// Database connection
let dbAvailable = false

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000
})

// Prevent unhandled pool errors from crashing the process
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message)
  dbAvailable = false
})

export function isDatabaseAvailable(): boolean {
  return dbAvailable
}

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

// Chat message interface
export interface Message {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  createdAt: string
  readAt?: string
}

// Trade interfaces
export interface TradeCard {
  cardId: string
  quantity: number
}

export interface Trade {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  offerCards: TradeCard[]
  requestCards: TradeCard[]
  createdAt: string
  resolvedAt?: string
  fromUser?: Omit<User, 'passwordHash'>
  toUser?: Omit<User, 'passwordHash'>
}

export interface TradeLock {
  id: string
  tradeId: string
  userId: string
  cardId: string
  quantity: number
}

// Gift interfaces
export interface Gift {
  id: string
  fromUserId: string
  toUserId: string
  rewardType: 'coins' | 'dust' | 'card'
  rewardAmount: number
  rewardCardId?: string
  createdAt: string
  claimedAt?: string
  fromUser?: Omit<User, 'passwordHash'>
}

export interface GiftCooldown {
  fromUserId: string
  toUserId: string
  lastSentAt: string
}

// Collection sync interface
export interface CollectionItem {
  cardId: string
  quantity: number
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

    // Chat messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        read_at TIMESTAMP DEFAULT NULL
      )
    `)

    // Trade proposals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        status TEXT DEFAULT 'pending',
        offer_cards JSONB NOT NULL,
        request_cards JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP DEFAULT NULL
      )
    `)

    // Cards locked in pending trades
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trade_locks (
        id TEXT PRIMARY KEY,
        trade_id TEXT REFERENCES trades(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id),
        card_id TEXT NOT NULL,
        quantity INTEGER NOT NULL
      )
    `)

    // Daily gifts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_gifts (
        id TEXT PRIMARY KEY,
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        reward_type TEXT NOT NULL,
        reward_amount INTEGER NOT NULL,
        reward_card_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        claimed_at TIMESTAMP DEFAULT NULL
      )
    `)

    // Gift cooldowns (24hr per friend)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gift_cooldowns (
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        last_sent_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (from_user_id, to_user_id)
      )
    `)

    // User collections for trading
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_collections (
        user_id TEXT REFERENCES users(id),
        card_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        PRIMARY KEY (user_id, card_id)
      )
    `)

    // Add game_state column for full state persistence
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS game_state JSONB DEFAULT NULL
    `)

    dbAvailable = true
    console.log('✅ Database tables initialized')
  } catch (error) {
    dbAvailable = false
    console.error('⚠️ Database not available:', (error as Error).message)
    console.error('Server will continue without database features')
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

// Check if two users are friends
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT * FROM friend_relations
     WHERE (user_id1 = $1 AND user_id2 = $2) OR (user_id1 = $2 AND user_id2 = $1)`,
    [userId1, userId2]
  )
  return result.rows.length > 0
}

// ========== CHAT FUNCTIONS ==========

export async function sendMessage(fromUserId: string, toUserId: string, content: string): Promise<Message | null> {
  // Verify they are friends
  if (!await areFriends(fromUserId, toUserId)) {
    return null
  }

  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const result = await pool.query(
    `INSERT INTO messages (id, from_user_id, to_user_id, content)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, fromUserId, toUserId, content]
  )

  const row = result.rows[0]
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    content: row.content,
    createdAt: row.created_at?.toISOString(),
    readAt: row.read_at?.toISOString()
  }
}

export async function getMessages(userId: string, friendId: string, limit: number = 50, before?: string): Promise<{ messages: Message[]; hasMore: boolean }> {
  let query = `
    SELECT * FROM messages
    WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
  `
  const params: any[] = [userId, friendId]

  if (before) {
    query += ` AND created_at < (SELECT created_at FROM messages WHERE id = $3)`
    params.push(before)
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
  params.push(limit + 1)

  const result = await pool.query(query, params)
  const hasMore = result.rows.length > limit
  const messages = result.rows.slice(0, limit).map(row => ({
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    content: row.content,
    createdAt: row.created_at?.toISOString(),
    readAt: row.read_at?.toISOString()
  })).reverse()

  return { messages, hasMore }
}

export async function markMessagesRead(userId: string, friendId: string): Promise<void> {
  await pool.query(
    `UPDATE messages SET read_at = NOW()
     WHERE to_user_id = $1 AND from_user_id = $2 AND read_at IS NULL`,
    [userId, friendId]
  )
}

export async function getUnreadCounts(userId: string): Promise<Record<string, number>> {
  const result = await pool.query(
    `SELECT from_user_id, COUNT(*) as count FROM messages
     WHERE to_user_id = $1 AND read_at IS NULL
     GROUP BY from_user_id`,
    [userId]
  )

  const counts: Record<string, number> = {}
  for (const row of result.rows) {
    counts[row.from_user_id] = parseInt(row.count)
  }
  return counts
}

// ========== GIFT FUNCTIONS ==========

export async function canSendGift(fromUserId: string, toUserId: string): Promise<boolean> {
  // Check if they are friends
  if (!await areFriends(fromUserId, toUserId)) {
    return false
  }

  // Check cooldown (24 hours)
  const result = await pool.query(
    `SELECT last_sent_at FROM gift_cooldowns
     WHERE from_user_id = $1 AND to_user_id = $2`,
    [fromUserId, toUserId]
  )

  if (result.rows.length === 0) return true

  const lastSent = new Date(result.rows[0].last_sent_at)
  const now = new Date()
  const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
  return hoursSince >= 24
}

export async function sendGift(fromUserId: string, toUserId: string): Promise<Gift | null> {
  if (!await canSendGift(fromUserId, toUserId)) {
    return null
  }

  // Generate random reward
  const roll = Math.random()
  let rewardType: 'coins' | 'dust' | 'card'
  let rewardAmount: number
  let rewardCardId: string | null = null

  if (roll < 0.50) {
    // 50% chance: coins (10-50)
    rewardType = 'coins'
    rewardAmount = Math.floor(Math.random() * 41) + 10
  } else if (roll < 0.85) {
    // 35% chance: dust (5-20)
    rewardType = 'dust'
    rewardAmount = Math.floor(Math.random() * 16) + 5
  } else {
    // 15% chance: random common card
    rewardType = 'card'
    rewardAmount = 1
    // Common card IDs - you may want to import from cards data
    const commonCards = ['fire_imp', 'aqua_sprite', 'vine_crawler', 'rock_golem', 'spark_wisp',
                         'shadow_bat', 'light_moth', 'frost_sprite', 'dust_bunny']
    rewardCardId = commonCards[Math.floor(Math.random() * commonCards.length)]
  }

  const id = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Insert gift
  const result = await pool.query(
    `INSERT INTO daily_gifts (id, from_user_id, to_user_id, reward_type, reward_amount, reward_card_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, fromUserId, toUserId, rewardType, rewardAmount, rewardCardId]
  )

  // Update/insert cooldown
  await pool.query(
    `INSERT INTO gift_cooldowns (from_user_id, to_user_id, last_sent_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET last_sent_at = NOW()`,
    [fromUserId, toUserId]
  )

  const row = result.rows[0]
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    rewardType: row.reward_type,
    rewardAmount: row.reward_amount,
    rewardCardId: row.reward_card_id,
    createdAt: row.created_at?.toISOString()
  }
}

export async function getPendingGifts(userId: string): Promise<Gift[]> {
  const result = await pool.query(
    `SELECT g.*, u.id as u_id, u.username, u.display_name, u.bio, u.profile_picture,
            u.created_at as u_created_at, u.last_login_at, u.battles_won, u.battles_played,
            u.total_damage_dealt, u.cards_collected, u.achievement_points
     FROM daily_gifts g
     JOIN users u ON g.from_user_id = u.id
     WHERE g.to_user_id = $1 AND g.claimed_at IS NULL
     ORDER BY g.created_at DESC`,
    [userId]
  )

  return result.rows.map(row => ({
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    rewardType: row.reward_type,
    rewardAmount: row.reward_amount,
    rewardCardId: row.reward_card_id,
    createdAt: row.created_at?.toISOString(),
    fromUser: getPublicUserInfo(rowToUser({
      id: row.u_id,
      username: row.username,
      password_hash: '',
      display_name: row.display_name,
      bio: row.bio,
      profile_picture: row.profile_picture,
      created_at: row.u_created_at,
      last_login_at: row.last_login_at,
      battles_won: row.battles_won,
      battles_played: row.battles_played,
      total_damage_dealt: row.total_damage_dealt,
      cards_collected: row.cards_collected,
      achievement_points: row.achievement_points
    }))
  }))
}

export async function claimGift(giftId: string, userId: string): Promise<Gift | null> {
  const result = await pool.query(
    `UPDATE daily_gifts SET claimed_at = NOW()
     WHERE id = $1 AND to_user_id = $2 AND claimed_at IS NULL
     RETURNING *`,
    [giftId, userId]
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    rewardType: row.reward_type,
    rewardAmount: row.reward_amount,
    rewardCardId: row.reward_card_id,
    createdAt: row.created_at?.toISOString(),
    claimedAt: row.claimed_at?.toISOString()
  }
}

export async function getGiftCooldowns(userId: string): Promise<Record<string, string>> {
  const result = await pool.query(
    `SELECT to_user_id, last_sent_at FROM gift_cooldowns WHERE from_user_id = $1`,
    [userId]
  )

  const cooldowns: Record<string, string> = {}
  for (const row of result.rows) {
    cooldowns[row.to_user_id] = row.last_sent_at?.toISOString()
  }
  return cooldowns
}

// ========== TRADING FUNCTIONS ==========

export async function createTrade(
  fromUserId: string,
  toUserId: string,
  offerCards: TradeCard[],
  requestCards: TradeCard[]
): Promise<Trade | null> {
  // Verify they are friends
  if (!await areFriends(fromUserId, toUserId)) {
    return null
  }

  // Verify user has the cards they're offering (check user_collections)
  for (const card of offerCards) {
    const available = await getAvailableCardQuantity(fromUserId, card.cardId)
    if (available < card.quantity) {
      return null
    }
  }

  const id = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Create trade
  const result = await pool.query(
    `INSERT INTO trades (id, from_user_id, to_user_id, offer_cards, request_cards)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, fromUserId, toUserId, JSON.stringify(offerCards), JSON.stringify(requestCards)]
  )

  // Lock the offered cards
  for (const card of offerCards) {
    const lockId = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await pool.query(
      `INSERT INTO trade_locks (id, trade_id, user_id, card_id, quantity)
       VALUES ($1, $2, $3, $4, $5)`,
      [lockId, id, fromUserId, card.cardId, card.quantity]
    )
  }

  const row = result.rows[0]
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    status: row.status,
    offerCards: row.offer_cards,
    requestCards: row.request_cards,
    createdAt: row.created_at?.toISOString()
  }
}

export async function getTrades(userId: string): Promise<{ pending: Trade[]; sent: Trade[]; history: Trade[] }> {
  // Get all trades involving this user
  const result = await pool.query(
    `SELECT t.*,
            fu.id as fu_id, fu.username as fu_username, fu.display_name as fu_display_name,
            fu.profile_picture as fu_profile_picture,
            tu.id as tu_id, tu.username as tu_username, tu.display_name as tu_display_name,
            tu.profile_picture as tu_profile_picture
     FROM trades t
     JOIN users fu ON t.from_user_id = fu.id
     JOIN users tu ON t.to_user_id = tu.id
     WHERE t.from_user_id = $1 OR t.to_user_id = $1
     ORDER BY t.created_at DESC`,
    [userId]
  )

  const pending: Trade[] = []
  const sent: Trade[] = []
  const history: Trade[] = []

  for (const row of result.rows) {
    const trade: Trade = {
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      status: row.status,
      offerCards: row.offer_cards,
      requestCards: row.request_cards,
      createdAt: row.created_at?.toISOString(),
      resolvedAt: row.resolved_at?.toISOString(),
      fromUser: {
        id: row.fu_id,
        username: row.fu_username,
        displayName: row.fu_display_name,
        profilePicture: row.fu_profile_picture,
        bio: '',
        createdAt: '',
        lastLoginAt: '',
        stats: { battlesWon: 0, battlesPlayed: 0, totalDamageDealt: 0, cardsCollected: 0, achievementPoints: 0 }
      },
      toUser: {
        id: row.tu_id,
        username: row.tu_username,
        displayName: row.tu_display_name,
        profilePicture: row.tu_profile_picture,
        bio: '',
        createdAt: '',
        lastLoginAt: '',
        stats: { battlesWon: 0, battlesPlayed: 0, totalDamageDealt: 0, cardsCollected: 0, achievementPoints: 0 }
      }
    }

    if (row.status === 'pending') {
      if (row.to_user_id === userId) {
        pending.push(trade)
      } else {
        sent.push(trade)
      }
    } else {
      history.push(trade)
    }
  }

  return { pending, sent, history }
}

export async function acceptTrade(tradeId: string, userId: string): Promise<boolean> {
  // Get trade details
  const tradeResult = await pool.query(
    `SELECT * FROM trades WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
    [tradeId, userId]
  )
  if (tradeResult.rows.length === 0) return false

  const trade = tradeResult.rows[0]
  const offerCards: TradeCard[] = trade.offer_cards
  const requestCards: TradeCard[] = trade.request_cards

  // Verify recipient has the requested cards
  for (const card of requestCards) {
    const available = await getAvailableCardQuantity(userId, card.cardId)
    if (available < card.quantity) {
      return false
    }
  }

  // Execute the trade - transfer cards
  // Remove offered cards from sender, add to recipient
  for (const card of offerCards) {
    await removeFromCollection(trade.from_user_id, card.cardId, card.quantity)
    await addToCollection(userId, card.cardId, card.quantity)
  }

  // Remove requested cards from recipient, add to sender
  for (const card of requestCards) {
    await removeFromCollection(userId, card.cardId, card.quantity)
    await addToCollection(trade.from_user_id, card.cardId, card.quantity)
  }

  // Update trade status
  await pool.query(
    `UPDATE trades SET status = 'accepted', resolved_at = NOW() WHERE id = $1`,
    [tradeId]
  )

  // Remove locks (CASCADE should handle this, but be explicit)
  await pool.query(`DELETE FROM trade_locks WHERE trade_id = $1`, [tradeId])

  return true
}

export async function rejectTrade(tradeId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE trades SET status = 'rejected', resolved_at = NOW()
     WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
     RETURNING *`,
    [tradeId, userId]
  )

  if ((result.rowCount ?? 0) === 0) return false

  // Remove locks
  await pool.query(`DELETE FROM trade_locks WHERE trade_id = $1`, [tradeId])
  return true
}

export async function cancelTrade(tradeId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE trades SET status = 'cancelled', resolved_at = NOW()
     WHERE id = $1 AND from_user_id = $2 AND status = 'pending'
     RETURNING *`,
    [tradeId, userId]
  )

  if ((result.rowCount ?? 0) === 0) return false

  // Remove locks
  await pool.query(`DELETE FROM trade_locks WHERE trade_id = $1`, [tradeId])
  return true
}

export async function getLockedCards(userId: string): Promise<TradeLock[]> {
  const result = await pool.query(
    `SELECT * FROM trade_locks WHERE user_id = $1`,
    [userId]
  )
  return result.rows.map(row => ({
    id: row.id,
    tradeId: row.trade_id,
    userId: row.user_id,
    cardId: row.card_id,
    quantity: row.quantity
  }))
}

// ========== COLLECTION SYNC FUNCTIONS ==========

export async function syncCollection(userId: string, collection: CollectionItem[]): Promise<void> {
  // Clear existing collection and insert new
  await pool.query(`DELETE FROM user_collections WHERE user_id = $1`, [userId])

  for (const item of collection) {
    if (item.quantity > 0) {
      await pool.query(
        `INSERT INTO user_collections (user_id, card_id, quantity) VALUES ($1, $2, $3)`,
        [userId, item.cardId, item.quantity]
      )
    }
  }
}

export async function getCollection(userId: string): Promise<CollectionItem[]> {
  const result = await pool.query(
    `SELECT card_id, quantity FROM user_collections WHERE user_id = $1`,
    [userId]
  )
  return result.rows.map(row => ({
    cardId: row.card_id,
    quantity: row.quantity
  }))
}

export async function addToCollection(userId: string, cardId: string, quantity: number = 1): Promise<void> {
  await pool.query(
    `INSERT INTO user_collections (user_id, card_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, card_id) DO UPDATE SET quantity = user_collections.quantity + $3`,
    [userId, cardId, quantity]
  )
}

export async function removeFromCollection(userId: string, cardId: string, quantity: number = 1): Promise<boolean> {
  const result = await pool.query(
    `UPDATE user_collections SET quantity = quantity - $3
     WHERE user_id = $1 AND card_id = $2 AND quantity >= $3
     RETURNING *`,
    [userId, cardId, quantity]
  )

  if ((result.rowCount ?? 0) === 0) return false

  // Remove if quantity is 0
  await pool.query(
    `DELETE FROM user_collections WHERE user_id = $1 AND card_id = $2 AND quantity <= 0`,
    [userId, cardId]
  )

  return true
}

export async function getAvailableCardQuantity(userId: string, cardId: string): Promise<number> {
  // Get total owned
  const ownedResult = await pool.query(
    `SELECT quantity FROM user_collections WHERE user_id = $1 AND card_id = $2`,
    [userId, cardId]
  )
  const owned = ownedResult.rows[0]?.quantity || 0

  // Get locked in trades
  const lockedResult = await pool.query(
    `SELECT COALESCE(SUM(quantity), 0) as locked FROM trade_locks WHERE user_id = $1 AND card_id = $2`,
    [userId, cardId]
  )
  const locked = parseInt(lockedResult.rows[0]?.locked) || 0

  return owned - locked
}

// ========== GAME STATE PERSISTENCE ==========

export async function saveGameState(userId: string, state: object): Promise<void> {
  await pool.query(
    `UPDATE users SET game_state = $2 WHERE id = $1`,
    [userId, JSON.stringify(state)]
  )
}

export async function loadGameState(userId: string): Promise<object | null> {
  const result = await pool.query(
    `SELECT game_state FROM users WHERE id = $1`,
    [userId]
  )
  return result.rows[0]?.game_state || null
}
