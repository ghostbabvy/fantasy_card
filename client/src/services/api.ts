// API Service for Fantasy Cards

const API_BASE = 'https://fantasycard-production.up.railway.app/api'

// Get stored token
function getToken(): string | null {
  return localStorage.getItem('fantasy-cards-token')
}

// Set token
function setToken(token: string): void {
  localStorage.setItem('fantasy-cards-token', token)
}

// Clear token
function clearToken(): void {
  localStorage.removeItem('fantasy-cards-token')
}

// Fetch with auth
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  })
}

// User type
export interface User {
  id: string
  username: string
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
  fromUser?: User
}

// Chat message type
export interface Message {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  createdAt: string
  readAt?: string
}

// Trade types
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
  fromUser?: User
  toUser?: User
}

export interface TradeLock {
  id: string
  tradeId: string
  userId: string
  cardId: string
  quantity: number
}

// Gift types
export interface Gift {
  id: string
  fromUserId: string
  toUserId: string
  rewardType: 'coins' | 'dust' | 'card'
  rewardAmount: number
  rewardCardId?: string
  createdAt: string
  claimedAt?: string
  fromUser?: User
}

export interface GiftReward {
  type: 'coins' | 'dust' | 'card'
  amount: number
  cardId?: string
}

// Collection item for syncing
export interface CollectionSyncItem {
  cardId: string
  quantity: number
}

// Auth API
export const authApi = {
  async register(username: string, password: string, displayName?: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Registration failed')
    }

    const data = await res.json()
    setToken(data.token)
    return data
  },

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await res.json()
    setToken(data.token)
    return data
  },

  async logout(): Promise<void> {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' })
    } finally {
      clearToken()
    }
  },

  async getMe(): Promise<User | null> {
    if (!getToken()) return null

    const res = await fetchWithAuth('/auth/me')
    if (!res.ok) {
      if (res.status === 401) {
        clearToken()
      }
      return null
    }

    const data = await res.json()
    return data.user
  },

  async updateProfile(updates: { displayName?: string; bio?: string; profilePicture?: string }): Promise<User> {
    const res = await fetchWithAuth('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to update profile')
    }

    const data = await res.json()
    return data.user
  },

  isLoggedIn(): boolean {
    return !!getToken()
  },
}

// Friends API
export const friendsApi = {
  async searchUsers(query: string): Promise<User[]> {
    const res = await fetchWithAuth(`/friends/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Search failed')
    const data = await res.json()
    return data.users
  },

  async getFriends(): Promise<User[]> {
    const res = await fetchWithAuth('/friends')
    if (!res.ok) throw new Error('Failed to get friends')
    const data = await res.json()
    return data.friends
  },

  async getPendingRequests(): Promise<FriendRequest[]> {
    const res = await fetchWithAuth('/friends/requests')
    if (!res.ok) throw new Error('Failed to get requests')
    const data = await res.json()
    return data.requests
  },

  async sendFriendRequest(targetUserId: string): Promise<void> {
    const res = await fetchWithAuth(`/friends/request/${targetUserId}`, { method: 'POST' })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to send request')
    }
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    const res = await fetchWithAuth(`/friends/request/${requestId}/accept`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to accept request')
  },

  async rejectFriendRequest(requestId: string): Promise<void> {
    const res = await fetchWithAuth(`/friends/request/${requestId}/reject`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to reject request')
  },

  async removeFriend(friendId: string): Promise<void> {
    const res = await fetchWithAuth(`/friends/${friendId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to remove friend')
  },

  async getUserProfile(userId: string): Promise<User> {
    const res = await fetchWithAuth(`/friends/user/${userId}`)
    if (!res.ok) throw new Error('User not found')
    const data = await res.json()
    return data.user
  },

  async getSentRequests(): Promise<FriendRequest[]> {
    const res = await fetchWithAuth('/friends/requests/sent')
    if (!res.ok) throw new Error('Failed to get sent requests')
    const data = await res.json()
    return data.requests
  },
}

// Leaderboard API
export const leaderboardApi = {
  async getLeaderboard(sortBy: 'battlesWon' | 'totalDamageDealt' | 'achievementPoints' = 'battlesWon', limit: number = 50): Promise<{ rank: number; user: User }[]> {
    const res = await fetch(`${API_BASE}/leaderboard?sortBy=${sortBy}&limit=${limit}`)
    if (!res.ok) throw new Error('Failed to get leaderboard')
    const data = await res.json()
    return data.leaderboard
  },

  async getUserRank(userId: string, sortBy: 'battlesWon' | 'totalDamageDealt' | 'achievementPoints' = 'battlesWon'): Promise<number> {
    const res = await fetch(`${API_BASE}/leaderboard/rank/${userId}?sortBy=${sortBy}`)
    if (!res.ok) throw new Error('Failed to get rank')
    const data = await res.json()
    return data.rank
  },

  async syncStats(stats: Partial<User['stats']>): Promise<void> {
    const res = await fetchWithAuth('/leaderboard/stats', {
      method: 'POST',
      body: JSON.stringify(stats),
    })
    if (!res.ok) throw new Error('Failed to sync stats')
  },
}

// Gifts API
export const giftsApi = {
  async sendGift(friendId: string): Promise<Gift> {
    const res = await fetchWithAuth(`/gifts/${friendId}`, { method: 'POST' })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to send gift')
    }
    const data = await res.json()
    return data.gift
  },

  async getPendingGifts(): Promise<Gift[]> {
    const res = await fetchWithAuth('/gifts')
    if (!res.ok) throw new Error('Failed to get gifts')
    const data = await res.json()
    return data.gifts
  },

  async claimGift(giftId: string): Promise<{ gift: Gift; reward: GiftReward }> {
    const res = await fetchWithAuth(`/gifts/${giftId}/claim`, { method: 'POST' })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to claim gift')
    }
    return await res.json()
  },

  async getCooldowns(): Promise<Record<string, string>> {
    const res = await fetchWithAuth('/gifts/cooldowns')
    if (!res.ok) throw new Error('Failed to get cooldowns')
    const data = await res.json()
    return data.cooldowns
  },

  async canSendGift(friendId: string): Promise<boolean> {
    const res = await fetchWithAuth(`/gifts/can-send/${friendId}`)
    if (!res.ok) return false
    const data = await res.json()
    return data.canSend
  },
}

// Chat API
export const chatApi = {
  async getMessages(friendId: string, limit: number = 50, before?: string): Promise<{ messages: Message[]; hasMore: boolean }> {
    let url = `/chat/${friendId}?limit=${limit}`
    if (before) url += `&before=${before}`
    const res = await fetchWithAuth(url)
    if (!res.ok) throw new Error('Failed to get messages')
    return await res.json()
  },

  async sendMessage(friendId: string, content: string): Promise<Message> {
    const res = await fetchWithAuth(`/chat/${friendId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to send message')
    }
    const data = await res.json()
    return data.message
  },

  async markRead(friendId: string): Promise<void> {
    const res = await fetchWithAuth(`/chat/${friendId}/read`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to mark as read')
  },

  async getUnreadCounts(): Promise<Record<string, number>> {
    const res = await fetchWithAuth('/chat/unread/counts')
    if (!res.ok) throw new Error('Failed to get unread counts')
    const data = await res.json()
    return data.unread
  },
}

// Trading API
export const tradingApi = {
  async getTrades(): Promise<{ pending: Trade[]; sent: Trade[]; history: Trade[] }> {
    const res = await fetchWithAuth('/trading')
    if (!res.ok) throw new Error('Failed to get trades')
    return await res.json()
  },

  async createTrade(toUserId: string, offerCards: TradeCard[], requestCards: TradeCard[]): Promise<Trade> {
    const res = await fetchWithAuth('/trading', {
      method: 'POST',
      body: JSON.stringify({ toUserId, offerCards, requestCards }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create trade')
    }
    const data = await res.json()
    return data.trade
  },

  async acceptTrade(tradeId: string): Promise<void> {
    const res = await fetchWithAuth(`/trading/${tradeId}/accept`, { method: 'POST' })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to accept trade')
    }
  },

  async rejectTrade(tradeId: string): Promise<void> {
    const res = await fetchWithAuth(`/trading/${tradeId}/reject`, { method: 'POST' })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to reject trade')
    }
  },

  async cancelTrade(tradeId: string): Promise<void> {
    const res = await fetchWithAuth(`/trading/${tradeId}/cancel`, { method: 'POST' })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to cancel trade')
    }
  },

  async getLockedCards(): Promise<TradeLock[]> {
    const res = await fetchWithAuth('/trading/locks')
    if (!res.ok) throw new Error('Failed to get locked cards')
    const data = await res.json()
    return data.locks
  },

  async syncCollection(collection: CollectionSyncItem[]): Promise<void> {
    const res = await fetchWithAuth('/trading/collection/sync', {
      method: 'POST',
      body: JSON.stringify({ collection }),
    })
    if (!res.ok) throw new Error('Failed to sync collection')
  },

  async getServerCollection(): Promise<CollectionSyncItem[]> {
    const res = await fetchWithAuth('/trading/collection')
    if (!res.ok) throw new Error('Failed to get collection')
    const data = await res.json()
    return data.collection
  },
}
