// API Service for Fantasy Cards

const API_BASE = 'http://localhost:3001/api'

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
