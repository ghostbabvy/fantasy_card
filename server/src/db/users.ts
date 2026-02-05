import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const usersPath = path.join(__dirname, '..', '..', 'data', 'users.json')
const friendsPath = path.join(__dirname, '..', '..', 'data', 'friends.json')

// Ensure data directory exists
const dataDir = path.dirname(usersPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export interface User {
  id: string
  username: string
  passwordHash: string
  displayName: string
  bio: string
  profilePicture: string  // Base64 or URL
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

interface UsersData {
  users: User[]
  nextId: number
}

interface FriendsData {
  requests: FriendRequest[]
  relations: FriendRelation[]
}

function loadUsers(): UsersData {
  try {
    if (fs.existsSync(usersPath)) {
      return JSON.parse(fs.readFileSync(usersPath, 'utf-8'))
    }
  } catch (e) {
    console.log('Creating new users database...')
  }
  return { users: [], nextId: 1 }
}

function saveUsers(data: UsersData) {
  fs.writeFileSync(usersPath, JSON.stringify(data, null, 2))
}

function loadFriends(): FriendsData {
  try {
    if (fs.existsSync(friendsPath)) {
      return JSON.parse(fs.readFileSync(friendsPath, 'utf-8'))
    }
  } catch (e) {
    console.log('Creating new friends database...')
  }
  return { requests: [], relations: [] }
}

function saveFriends(data: FriendsData) {
  fs.writeFileSync(friendsPath, JSON.stringify(data, null, 2))
}

let usersData = loadUsers()
let friendsData = loadFriends()

// Hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Generate session token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// User functions
export function createUser(username: string, password: string, displayName?: string): User | null {
  // Check if username exists
  if (usersData.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return null
  }

  const user: User = {
    id: `user_${usersData.nextId++}`,
    username,
    passwordHash: hashPassword(password),
    displayName: displayName || username,
    bio: '',
    profilePicture: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    stats: {
      battlesWon: 0,
      battlesPlayed: 0,
      totalDamageDealt: 0,
      cardsCollected: 0,
      achievementPoints: 0
    }
  }

  usersData.users.push(user)
  saveUsers(usersData)
  return user
}

export function authenticateUser(username: string, password: string): User | null {
  const user = usersData.users.find(
    u => u.username.toLowerCase() === username.toLowerCase() &&
         u.passwordHash === hashPassword(password)
  )

  if (user) {
    user.lastLoginAt = new Date().toISOString()
    saveUsers(usersData)
  }

  return user || null
}

export function getUserById(id: string): User | undefined {
  return usersData.users.find(u => u.id === id)
}

export function getUserByUsername(username: string): User | undefined {
  return usersData.users.find(u => u.username.toLowerCase() === username.toLowerCase())
}

export function updateUserProfile(userId: string, updates: { displayName?: string; bio?: string; profilePicture?: string }): User | null {
  const user = usersData.users.find(u => u.id === userId)
  if (!user) return null

  if (updates.displayName !== undefined) user.displayName = updates.displayName
  if (updates.bio !== undefined) user.bio = updates.bio
  if (updates.profilePicture !== undefined) user.profilePicture = updates.profilePicture

  saveUsers(usersData)
  return user
}

export function updateUserStats(userId: string, stats: Partial<User['stats']>): void {
  const user = usersData.users.find(u => u.id === userId)
  if (!user) return

  Object.assign(user.stats, stats)
  saveUsers(usersData)
}

// Search users
export function searchUsers(query: string, limit: number = 20): User[] {
  const lowerQuery = query.toLowerCase()
  return usersData.users
    .filter(u => u.username.toLowerCase().includes(lowerQuery) ||
                 u.displayName.toLowerCase().includes(lowerQuery))
    .slice(0, limit)
}

// Friend functions
export function sendFriendRequest(fromUserId: string, toUserId: string): FriendRequest | null {
  // Check if already friends
  const existingRelation = friendsData.relations.find(
    r => (r.userId1 === fromUserId && r.userId2 === toUserId) ||
         (r.userId1 === toUserId && r.userId2 === fromUserId)
  )
  if (existingRelation) return null

  // Check if request already exists
  const existingRequest = friendsData.requests.find(
    r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending'
  )
  if (existingRequest) return existingRequest

  const request: FriendRequest = {
    id: `fr_${Date.now()}`,
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  friendsData.requests.push(request)
  saveFriends(friendsData)
  return request
}

export function acceptFriendRequest(requestId: string, userId: string): boolean {
  const request = friendsData.requests.find(
    r => r.id === requestId && r.toUserId === userId && r.status === 'pending'
  )
  if (!request) return false

  request.status = 'accepted'

  // Create friend relation
  const relation: FriendRelation = {
    id: `rel_${Date.now()}`,
    userId1: request.fromUserId,
    userId2: request.toUserId,
    createdAt: new Date().toISOString()
  }
  friendsData.relations.push(relation)

  saveFriends(friendsData)
  return true
}

export function rejectFriendRequest(requestId: string, userId: string): boolean {
  const request = friendsData.requests.find(
    r => r.id === requestId && r.toUserId === userId && r.status === 'pending'
  )
  if (!request) return false

  request.status = 'rejected'
  saveFriends(friendsData)
  return true
}

export function removeFriend(userId: string, friendId: string): boolean {
  const index = friendsData.relations.findIndex(
    r => (r.userId1 === userId && r.userId2 === friendId) ||
         (r.userId1 === friendId && r.userId2 === userId)
  )
  if (index === -1) return false

  friendsData.relations.splice(index, 1)
  saveFriends(friendsData)
  return true
}

export function getFriends(userId: string): User[] {
  const friendIds = friendsData.relations
    .filter(r => r.userId1 === userId || r.userId2 === userId)
    .map(r => r.userId1 === userId ? r.userId2 : r.userId1)

  return friendIds
    .map(id => getUserById(id))
    .filter((u): u is User => u !== undefined)
}

export function getPendingRequests(userId: string): (FriendRequest & { fromUser?: User })[] {
  return friendsData.requests
    .filter(r => r.toUserId === userId && r.status === 'pending')
    .map(r => ({
      ...r,
      fromUser: getUserById(r.fromUserId)
    }))
}

export function getSentRequests(userId: string): FriendRequest[] {
  return friendsData.requests.filter(
    r => r.fromUserId === userId && r.status === 'pending'
  )
}

// Leaderboard functions
export function getLeaderboard(sortBy: 'battlesWon' | 'totalDamageDealt' | 'achievementPoints' = 'battlesWon', limit: number = 50): User[] {
  return [...usersData.users]
    .sort((a, b) => b.stats[sortBy] - a.stats[sortBy])
    .slice(0, limit)
}

export function getUserRank(userId: string, sortBy: 'battlesWon' | 'totalDamageDealt' | 'achievementPoints' = 'battlesWon'): number {
  const sorted = [...usersData.users].sort((a, b) => b.stats[sortBy] - a.stats[sortBy])
  return sorted.findIndex(u => u.id === userId) + 1
}

// Get public user info (without password hash)
export function getPublicUserInfo(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...publicInfo } = user
  return publicInfo
}
