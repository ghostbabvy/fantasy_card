import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { authApi, friendsApi, leaderboardApi, giftsApi, chatApi, tradingApi, User, FriendRequest, Gift, Message, Trade, TradeCard } from '../services/api'
import { useGameStore } from '../stores/gameStore'
import { getCardById } from '../data/cards'
import { loadServerState, saveNow, startAutoSave, stopAutoSave } from '../services/gameStateSync'

type SocialTab = 'profile' | 'friends' | 'chat' | 'gifts' | 'trading' | 'leaderboard'

export default function SocialPage() {
  const { stats, collection, setProfilePicture, setPlayerName, setPlayerBio } = useGameStore()

  const [activeTab, setActiveTab] = useState<SocialTab>('profile')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Auth state
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  // Profile editing
  const [isEditing, setIsEditing] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editBio, setEditBio] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Friends state
  const [friends, setFriends] = useState<User[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<{ rank: number; user: User }[]>([])
  const [leaderboardSort, setLeaderboardSort] = useState<'battlesWon' | 'totalDamageDealt' | 'achievementPoints'>('battlesWon')
  const [userRank, setUserRank] = useState<number | null>(null)

  // Chat state
  const [selectedChatFriend, setSelectedChatFriend] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Gifts state
  const [pendingGifts, setPendingGifts] = useState<Gift[]>([])
  const [giftCooldowns, setGiftCooldowns] = useState<Record<string, string>>({})
  const [claimingGift, setClaimingGift] = useState<string | null>(null)
  const [lastClaimedReward, setLastClaimedReward] = useState<{ type: string; amount: number; cardId?: string } | null>(null)

  // Trading state
  const [trades, setTrades] = useState<{ pending: Trade[]; sent: Trade[]; history: Trade[] }>({ pending: [], sent: [], history: [] })
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [tradeTarget, setTradeTarget] = useState<User | null>(null)
  const [tradeOffer, setTradeOffer] = useState<TradeCard[]>([])
  const [tradeRequest, setTradeRequest] = useState<TradeCard[]>([])
  const [selectedTradeView, setSelectedTradeView] = useState<'pending' | 'sent' | 'history'>('pending')

  // Check if logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Load data when tab changes
  useEffect(() => {
    if (user && activeTab === 'friends') {
      loadFriends()
    }
    if (activeTab === 'leaderboard') {
      loadLeaderboard()
    }
    if (user && activeTab === 'chat') {
      loadUnreadCounts()
      loadFriends()
    }
    if (user && activeTab === 'gifts') {
      loadGifts()
      loadFriends()
    }
    if (user && activeTab === 'trading') {
      loadTrades()
      loadFriends()
    }
  }, [activeTab, user, leaderboardSort])

  // Auto-refresh friends tab every 15 seconds
  useEffect(() => {
    if (!user || activeTab !== 'friends') return
    const interval = setInterval(() => {
      loadFriends()
    }, 15000)
    return () => clearInterval(interval)
  }, [user, activeTab])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      const currentUser = await authApi.getMe()
      setUser(currentUser)
      if (currentUser) {
        setEditDisplayName(currentUser.displayName || '')
        setEditBio(currentUser.bio || '')
        // Load saved game state from server and start auto-saving
        await loadServerState()
        startAutoSave()
      }
    } catch (e) {
      console.error('Auth check failed:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      let result
      if (isLoginMode) {
        result = await authApi.login(username, password)
      } else {
        result = await authApi.register(username, password, displayName)
      }

      setUser(result.user)
      setEditDisplayName(result.user.displayName || '')
      setEditBio(result.user.bio || '')

      // Sync to local game store
      setPlayerName(result.user.displayName)
      setPlayerBio(result.user.bio)
      if (result.user.profilePicture) {
        setProfilePicture(result.user.profilePicture)
      }

      if (isLoginMode) {
        // Login: load saved game state from server
        await loadServerState()
      } else {
        // Register: save current local state to server for the new account
        await saveNow()
      }
      startAutoSave()

      setUsername('')
      setPassword('')
      setDisplayName('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await saveNow()
    stopAutoSave()
    await authApi.logout()
    setUser(null)
    setFriends([])
    setPendingRequests([])
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    setError('')

    try {
      const updated = await authApi.updateProfile({
        displayName: editDisplayName,
        bio: editBio,
      })
      setUser(updated)
      // Also save to local game store
      setPlayerName(editDisplayName)
      setPlayerBio(editBio)
      setIsEditing(false)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 500KB)
    if (file.size > 500000) {
      setError('Image too large. Please use an image under 500KB.')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string
        // Save to local game store (for nav display)
        setProfilePicture(base64)
        // Also save to server
        const updated = await authApi.updateProfile({ profilePicture: base64 })
        setUser(updated)
        setError('')
      } catch (e: any) {
        setError(e.message)
      }
    }
    reader.readAsDataURL(file)
  }

  const loadFriends = async () => {
    try {
      const [friendsList, requests, sent] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingRequests(),
        friendsApi.getSentRequests(),
      ])
      setFriends(friendsList)
      setPendingRequests(requests)
      setSentRequests(sent)
    } catch (e) {
      console.error('Failed to load friends:', e)
    }
  }

  const handleSearch = async () => {
    if (searchQuery.length < 2) return
    setIsSearching(true)

    try {
      const results = await friendsApi.searchUsers(searchQuery)
      setSearchResults(results)
    } catch (e) {
      console.error('Search failed:', e)
    } finally {
      setIsSearching(false)
    }
  }

  // Sent friend requests state
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [successMessage, setSuccessMessage] = useState('')

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      await friendsApi.sendFriendRequest(targetUserId)
      // Add to local state for immediate feedback
      setSentRequests(prev => [...prev, { id: `temp_${Date.now()}`, fromUserId: user?.id || '', toUserId: targetUserId, status: 'pending' as const, createdAt: new Date().toISOString() }])
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId))
      setSuccessMessage('Friend request sent! They must accept to become friends.')
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsApi.acceptFriendRequest(requestId)
      loadFriends()
    } catch (e) {
      console.error('Failed to accept request:', e)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendsApi.rejectFriendRequest(requestId)
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (e) {
      console.error('Failed to reject request:', e)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendsApi.removeFriend(friendId)
      setFriends(prev => prev.filter(f => f.id !== friendId))
    } catch (e) {
      console.error('Failed to remove friend:', e)
    }
  }

  // Chat functions
  const loadUnreadCounts = async () => {
    try {
      const counts = await chatApi.getUnreadCounts()
      setUnreadCounts(counts)
    } catch (e) {
      console.error('Failed to load unread counts:', e)
    }
  }

  const loadMessages = async (friendId: string) => {
    try {
      const result = await chatApi.getMessages(friendId)
      setMessages(result.messages)
      await chatApi.markRead(friendId)
      setUnreadCounts(prev => ({ ...prev, [friendId]: 0 }))
    } catch (e) {
      console.error('Failed to load messages:', e)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedChatFriend || !messageInput.trim()) return
    try {
      const message = await chatApi.sendMessage(selectedChatFriend.id, messageInput.trim())
      setMessages(prev => [...prev, message])
      setMessageInput('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const selectChatFriend = async (friend: User) => {
    setSelectedChatFriend(friend)
    await loadMessages(friend.id)
  }

  // Gift functions
  const loadGifts = async () => {
    try {
      const [gifts, cooldowns] = await Promise.all([
        giftsApi.getPendingGifts(),
        giftsApi.getCooldowns()
      ])
      setPendingGifts(gifts)
      setGiftCooldowns(cooldowns)
    } catch (e) {
      console.error('Failed to load gifts:', e)
    }
  }

  const handleSendGift = async (friendId: string) => {
    try {
      await giftsApi.sendGift(friendId)
      loadGifts()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleClaimGift = async (giftId: string) => {
    setClaimingGift(giftId)
    try {
      const result = await giftsApi.claimGift(giftId)
      setLastClaimedReward(result.reward)
      setPendingGifts(prev => prev.filter(g => g.id !== giftId))
      // Add reward to local store
      if (result.reward.type === 'coins') {
        useGameStore.getState().addCoins(result.reward.amount)
      } else if (result.reward.type === 'dust') {
        useGameStore.getState().addDust(result.reward.amount)
      } else if (result.reward.type === 'card' && result.reward.cardId) {
        useGameStore.getState().addCard(result.reward.cardId)
      }
      // Show reward for 2 seconds then clear
      setTimeout(() => setLastClaimedReward(null), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setClaimingGift(null)
    }
  }

  const canSendGiftTo = (friendId: string): boolean => {
    const lastSent = giftCooldowns[friendId]
    if (!lastSent) return true
    const hoursSince = (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60)
    return hoursSince >= 24
  }

  const getGiftCooldownRemaining = (friendId: string): string => {
    const lastSent = giftCooldowns[friendId]
    if (!lastSent) return ''
    const hoursRemaining = 24 - (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60)
    if (hoursRemaining <= 0) return ''
    if (hoursRemaining < 1) return `${Math.ceil(hoursRemaining * 60)}m`
    return `${Math.ceil(hoursRemaining)}h`
  }

  // Trading functions
  const loadTrades = async () => {
    try {
      const result = await tradingApi.getTrades()
      setTrades(result)
    } catch (e) {
      console.error('Failed to load trades:', e)
    }
  }

  const handleCreateTrade = async () => {
    if (!tradeTarget || (tradeOffer.length === 0 && tradeRequest.length === 0)) return
    try {
      await tradingApi.createTrade(tradeTarget.id, tradeOffer, tradeRequest)
      setShowTradeModal(false)
      setTradeOffer([])
      setTradeRequest([])
      setTradeTarget(null)
      loadTrades()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleAcceptTrade = async (tradeId: string) => {
    try {
      await tradingApi.acceptTrade(tradeId)
      loadTrades()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleRejectTrade = async (tradeId: string) => {
    try {
      await tradingApi.rejectTrade(tradeId)
      loadTrades()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleCancelTrade = async (tradeId: string) => {
    try {
      await tradingApi.cancelTrade(tradeId)
      loadTrades()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const openTradeWith = (friend: User) => {
    setTradeTarget(friend)
    setTradeOffer([])
    setTradeRequest([])
    setShowTradeModal(true)
  }

  // Calculate total unread for badge
  const totalUnread = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0)

  const loadLeaderboard = async () => {
    try {
      const data = await leaderboardApi.getLeaderboard(leaderboardSort, 50)
      setLeaderboard(data)

      if (user) {
        const rank = await leaderboardApi.getUserRank(user.id, leaderboardSort)
        setUserRank(rank)
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e)
    }
  }

  // Sync local stats to server
  const syncStats = async () => {
    if (!user) return

    try {
      await leaderboardApi.syncStats({
        battlesWon: stats.battlesWon,
        battlesPlayed: stats.battlesPlayed,
        totalDamageDealt: stats.damageDealt,
        cardsCollected: Object.values(collection).filter(c => c.quantity > 0).length,
      })
      loadLeaderboard()
    } catch (e) {
      console.error('Failed to sync stats:', e)
    }
  }

  const tabs = [
    { id: 'profile' as SocialTab, label: 'Profile', icon: '&#128100;', badge: 0 },
    { id: 'friends' as SocialTab, label: 'Friends', icon: '&#128101;', badge: pendingRequests.length },
    { id: 'chat' as SocialTab, label: 'Chat', icon: '&#128172;', badge: totalUnread },
    { id: 'gifts' as SocialTab, label: 'Gifts', icon: '&#127873;', badge: pendingGifts.length },
    { id: 'trading' as SocialTab, label: 'Trading', icon: '&#128259;', badge: trades.pending.length },
    { id: 'leaderboard' as SocialTab, label: 'Leaderboard', icon: '&#127942;', badge: 0 },
  ]

  if (isLoading && !user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-4xl animate-spin mb-4">&#9881;</div>
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <span className="text-5xl">&#127760;</span>
          Social
        </h1>
        <p className="text-white/60">Connect with other players</p>
      </motion.div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-white/60">&#10005;</button>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4 text-green-400">
          {successMessage}
        </div>
      )}

      {/* Not logged in - show auth form */}
      {!user ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 rounded-xl p-6 max-w-md mx-auto"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">
            {isLoginMode ? 'Sign In' : 'Create Account'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                placeholder="Enter password"
                required
              />
            </div>

            {!isLoginMode && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Display Name (optional)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                  placeholder="How others will see you"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-lg font-bold disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : isLoginMode ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-purple-400 hover:text-purple-300"
            >
              {isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition-all relative ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: tab.icon }} />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-start gap-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl overflow-hidden cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        '&#128100;'
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm hover:bg-purple-400"
                    >
                      &#128247;
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={e => setEditDisplayName(e.target.value)}
                          className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none text-white"
                          placeholder="Display Name"
                        />
                        <textarea
                          value={editBio}
                          onChange={e => setEditBio(e.target.value)}
                          className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none resize-none text-white"
                          placeholder="Bio (max 200 characters)"
                          maxLength={200}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateProfile}
                            className="px-4 py-2 bg-green-500 hover:bg-green-400 rounded-lg text-sm font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false)
                              setEditDisplayName(user.displayName || '')
                              setEditBio(user.bio || '')
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold">{user.displayName}</h2>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-white/40 hover:text-white/60"
                          >
                            &#9998;
                          </button>
                        </div>
                        <p className="text-white/60 text-sm mb-2">@{user.username}</p>
                        <p className="text-white/80">{user.bio || 'No bio yet'}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Your Stats</h3>
                  <button
                    onClick={syncStats}
                    className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded text-sm"
                  >
                    Sync to Leaderboard
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-black/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{user.stats.battlesWon}</div>
                    <div className="text-xs text-white/60">Battles Won</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{user.stats.battlesPlayed}</div>
                    <div className="text-xs text-white/60">Battles Played</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-400">{user.stats.totalDamageDealt.toLocaleString()}</div>
                    <div className="text-xs text-white/60">Total Damage</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{user.stats.cardsCollected}</div>
                    <div className="text-xs text-white/60">Cards Collected</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-bold"
              >
                Sign Out
              </button>
            </motion.div>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Friends List - First */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span dangerouslySetInnerHTML={{ __html: '&#128101;' }} />
                  My Friends ({friends.length})
                </h3>
                {friends.length === 0 ? (
                  <p className="text-white/60 text-center py-8">No friends yet. Use the search below to add friends!</p>
                ) : (
                  <div className="space-y-2">
                    {friends.map(friend => {
                      const canGift = canSendGiftTo(friend.id)
                      const unread = unreadCounts[friend.id] || 0
                      return (
                        <div key={friend.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                              {friend.profilePicture ? (
                                <img src={friend.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span dangerouslySetInnerHTML={{ __html: '&#128100;' }} />
                              )}
                            </div>
                            <div>
                              <div className="font-bold">{friend.displayName}</div>
                              <div className="text-sm text-white/60">{friend.stats.battlesWon} wins</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Chat Button */}
                            <button
                              onClick={() => { setActiveTab('chat'); selectChatFriend(friend) }}
                              className="relative w-10 h-10 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg flex items-center justify-center text-lg transition-colors"
                              title="Chat"
                            >
                              <span dangerouslySetInnerHTML={{ __html: '&#128172;' }} />
                              {unread > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                  {unread}
                                </span>
                              )}
                            </button>
                            {/* Gift Button */}
                            <button
                              onClick={() => { setActiveTab('gifts'); handleSendGift(friend.id) }}
                              disabled={!canGift}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
                                canGift
                                  ? 'bg-yellow-500/20 hover:bg-yellow-500/40'
                                  : 'bg-gray-500/20 opacity-50 cursor-not-allowed'
                              }`}
                              title={canGift ? "Send Gift" : `Gift on cooldown`}
                            >
                              <span dangerouslySetInnerHTML={{ __html: '&#127873;' }} />
                            </button>
                            {/* Trade Button */}
                            <button
                              onClick={() => { setActiveTab('trading'); openTradeWith(friend) }}
                              className="w-10 h-10 bg-green-500/20 hover:bg-green-500/40 rounded-lg flex items-center justify-center text-lg transition-colors"
                              title="Trade"
                            >
                              <span dangerouslySetInnerHTML={{ __html: '&#128259;' }} />
                            </button>
                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveFriend(friend.id)}
                              className="w-10 h-10 bg-red-500/20 hover:bg-red-500/40 rounded-lg flex items-center justify-center text-lg transition-colors"
                              title="Remove Friend"
                            >
                              <span dangerouslySetInnerHTML={{ __html: '&#10005;' }} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Pending Friend Requests (incoming) */}
              {pendingRequests.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <span dangerouslySetInnerHTML={{ __html: '&#128140;' }} />
                    Incoming Requests ({pendingRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingRequests.map(request => (
                      <div key={request.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                            {request.fromUser?.profilePicture ? (
                              <img src={request.fromUser.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span dangerouslySetInnerHTML={{ __html: '&#128100;' }} />
                            )}
                          </div>
                          <div>
                            <div className="font-bold">{request.fromUser?.displayName}</div>
                            <div className="text-sm text-white/60">@{request.fromUser?.username}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-400 rounded-lg text-sm font-bold"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sent Friend Requests (outgoing) */}
              {sentRequests.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <span dangerouslySetInnerHTML={{ __html: '&#128228;' }} />
                    Sent Requests ({sentRequests.length})
                  </h3>
                  <p className="text-sm text-white/60 mb-3">Waiting for these players to accept your request</p>
                  <div className="space-y-2">
                    {sentRequests.map(request => (
                      <div key={request.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center">
                            <span dangerouslySetInnerHTML={{ __html: '&#8987;' }} />
                          </div>
                          <div>
                            <div className="font-bold text-yellow-300">Pending...</div>
                            <div className="text-sm text-white/60">Request sent {new Date(request.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <span className="px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                          Awaiting Response
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search for New Friends - At Bottom */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span dangerouslySetInnerHTML={{ __html: '&#128269;' }} />
                  Add New Friends
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-4 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                    placeholder="Search by username..."
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || searchQuery.length < 2}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-400 rounded-lg font-bold disabled:opacity-50"
                  >
                    {isSearching ? '...' : 'Search'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-white/60">Search Results:</p>
                    {searchResults.map(result => {
                      const alreadySent = sentRequests.some(r => r.toUserId === result.id)
                      const alreadyFriend = friends.some(f => f.id === result.id)
                      return (
                        <div key={result.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                              {result.profilePicture ? (
                                <img src={result.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span dangerouslySetInnerHTML={{ __html: '&#128100;' }} />
                              )}
                            </div>
                            <div>
                              <div className="font-bold">{result.displayName}</div>
                              <div className="text-sm text-white/60">@{result.username}</div>
                            </div>
                          </div>
                          {alreadyFriend ? (
                            <span className="px-4 py-2 bg-purple-500/30 rounded-lg text-sm text-purple-300">
                              Already Friends
                            </span>
                          ) : alreadySent ? (
                            <span className="px-4 py-2 bg-yellow-500/30 rounded-lg text-sm text-yellow-300">
                              Request Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(result.id)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-400 rounded-lg text-sm font-bold"
                            >
                              + Add Friend
                            </button>
                          )}
                        </div>
                      )
                    })}
                    <p className="text-xs text-white/40 mt-2">
                      Friend requests must be accepted by the other player before you become friends.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 h-[500px]"
            >
              {/* Friends list for chat */}
              <div className="w-1/3 bg-white/5 rounded-xl p-4 overflow-y-auto">
                <h3 className="font-bold mb-3">Chats</h3>
                {friends.length === 0 ? (
                  <p className="text-white/60 text-sm">Add friends to start chatting!</p>
                ) : (
                  <div className="space-y-2">
                    {friends.map(friend => (
                      <button
                        key={friend.id}
                        onClick={() => selectChatFriend(friend)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left ${
                          selectedChatFriend?.id === friend.id ? 'bg-purple-500/30' : 'bg-black/20 hover:bg-black/30'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                          {friend.profilePicture ? (
                            <img src={friend.profilePicture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span dangerouslySetInnerHTML={{ __html: '&#128100;' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">{friend.displayName}</div>
                        </div>
                        {unreadCounts[friend.id] > 0 && (
                          <span className="w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                            {unreadCounts[friend.id]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat messages */}
              <div className="flex-1 bg-white/5 rounded-xl p-4 flex flex-col">
                {selectedChatFriend ? (
                  <>
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                        {selectedChatFriend.profilePicture ? (
                          <img src={selectedChatFriend.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span dangerouslySetInnerHTML={{ __html: '&#128100;' }} />
                        )}
                      </div>
                      <span className="font-bold">{selectedChatFriend.displayName}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.fromUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-3 py-2 rounded-lg ${
                              msg.fromUserId === user?.id
                                ? 'bg-purple-500 text-white'
                                : 'bg-black/30 text-white'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className="text-[10px] opacity-60 mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 px-4 py-2 bg-black/30 rounded-lg border border-white/10"
                        placeholder="Type a message..."
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-400 rounded-lg font-bold disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-white/60">
                    Select a friend to start chatting
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Gifts Tab */}
          {activeTab === 'gifts' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Claimed reward animation */}
              {lastClaimedReward && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: 2, duration: 0.3 }}
                      className="text-6xl mb-4"
                    >
                      {lastClaimedReward.type === 'coins' ? '🪙' : lastClaimedReward.type === 'dust' ? '✨' : '🃏'}
                    </motion.div>
                    <p className="text-2xl font-bold">
                      +{lastClaimedReward.amount} {lastClaimedReward.type === 'card' ? 'Card' : lastClaimedReward.type}!
                    </p>
                    {lastClaimedReward.cardId && (
                      <p className="text-white/60">{getCardById(lastClaimedReward.cardId)?.name}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Pending Gifts */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span dangerouslySetInnerHTML={{ __html: '&#127873;' }} />
                  Gifts to Claim ({pendingGifts.length})
                </h3>
                {pendingGifts.length === 0 ? (
                  <p className="text-white/60 text-center py-8">No pending gifts. Check back later!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pendingGifts.map(gift => (
                      <div key={gift.id} className="bg-black/20 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                            {gift.fromUser?.profilePicture ? (
                              <img src={gift.fromUser.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span dangerouslySetInnerHTML={{ __html: '&#128100;' }} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold">{gift.fromUser?.displayName}</p>
                            <p className="text-xs text-white/60">Sent you a gift!</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleClaimGift(gift.id)}
                          disabled={claimingGift === gift.id}
                          className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg font-bold disabled:opacity-50"
                        >
                          {claimingGift === gift.id ? '...' : 'Claim!'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Gifts */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-3">Send Daily Gifts</h3>
                {friends.length === 0 ? (
                  <p className="text-white/60 text-center py-8">Add friends to send gifts!</p>
                ) : (
                  <div className="space-y-2">
                    {friends.map(friend => {
                      const canSend = canSendGiftTo(friend.id)
                      const cooldown = getGiftCooldownRemaining(friend.id)
                      return (
                        <div key={friend.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                              {friend.profilePicture ? (
                                <img src={friend.profilePicture} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span dangerouslySetInnerHTML={{ __html: '&#128100;' }} />
                              )}
                            </div>
                            <span className="font-bold">{friend.displayName}</span>
                          </div>
                          <button
                            onClick={() => handleSendGift(friend.id)}
                            disabled={!canSend}
                            className={`px-4 py-2 rounded-lg font-bold ${
                              canSend
                                ? 'bg-green-500 hover:bg-green-400'
                                : 'bg-gray-600 cursor-not-allowed'
                            }`}
                          >
                            {canSend ? 'Send Gift' : `Wait ${cooldown}`}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Trading Tab */}
          {activeTab === 'trading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Trade view selector */}
              <div className="flex gap-2">
                {[
                  { id: 'pending' as const, label: 'Incoming', count: trades.pending.length },
                  { id: 'sent' as const, label: 'Sent', count: trades.sent.length },
                  { id: 'history' as const, label: 'History', count: trades.history.length },
                ].map(view => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedTradeView(view.id)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      selectedTradeView === view.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {view.label} ({view.count})
                  </button>
                ))}
              </div>

              {/* Trades list */}
              <div className="bg-white/5 rounded-xl p-4">
                {selectedTradeView === 'pending' && trades.pending.length === 0 && (
                  <p className="text-white/60 text-center py-8">No incoming trade requests.</p>
                )}
                {selectedTradeView === 'sent' && trades.sent.length === 0 && (
                  <p className="text-white/60 text-center py-8">No pending trade offers.</p>
                )}
                {selectedTradeView === 'history' && trades.history.length === 0 && (
                  <p className="text-white/60 text-center py-8">No trade history yet.</p>
                )}

                <div className="space-y-3">
                  {(selectedTradeView === 'pending' ? trades.pending :
                    selectedTradeView === 'sent' ? trades.sent : trades.history).map(trade => (
                    <div key={trade.id} className="bg-black/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                            {(selectedTradeView === 'pending' ? trade.fromUser : trade.toUser)?.profilePicture ? (
                              <img src={(selectedTradeView === 'pending' ? trade.fromUser : trade.toUser)?.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span dangerouslySetInnerHTML={{ __html: '&#128100;' }} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold">
                              {selectedTradeView === 'pending' ? trade.fromUser?.displayName : trade.toUser?.displayName}
                            </p>
                            <p className="text-xs text-white/60">
                              {selectedTradeView === 'history' && <span className={trade.status === 'accepted' ? 'text-green-400' : 'text-red-400'}>{trade.status}</span>}
                            </p>
                          </div>
                        </div>
                        {selectedTradeView === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptTrade(trade.id)}
                              className="px-3 py-1 bg-green-500 hover:bg-green-400 rounded text-sm font-bold"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectTrade(trade.id)}
                              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {selectedTradeView === 'sent' && (
                          <button
                            onClick={() => handleCancelTrade(trade.id)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/60 mb-1">They offer:</p>
                          <div className="space-y-1">
                            {trade.offerCards.map((card, i) => (
                              <div key={i} className="bg-black/30 px-2 py-1 rounded">
                                {getCardById(card.cardId)?.name || card.cardId} x{card.quantity}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-white/60 mb-1">They want:</p>
                          <div className="space-y-1">
                            {trade.requestCards.map((card, i) => (
                              <div key={i} className="bg-black/30 px-2 py-1 rounded">
                                {getCardById(card.cardId)?.name || card.cardId} x{card.quantity}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start new trade */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-3">Start a Trade</h3>
                {friends.length === 0 ? (
                  <p className="text-white/60 text-center py-8">Add friends to start trading!</p>
                ) : (
                  <div className="space-y-2">
                    {friends.map(friend => (
                      <div key={friend.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                            {friend.profilePicture ? (
                              <img src={friend.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span dangerouslySetInnerHTML={{ __html: '&#128100;' }} />
                            )}
                          </div>
                          <span className="font-bold">{friend.displayName}</span>
                        </div>
                        <button
                          onClick={() => openTradeWith(friend)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg font-bold"
                        >
                          Trade
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trade modal - simplified for now */}
              {showTradeModal && tradeTarget && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">Trade with {tradeTarget.displayName}</h3>
                    <p className="text-white/60 mb-4 text-sm">
                      Trading feature coming soon! You'll be able to select cards to offer and request.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowTradeModal(false)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                      >
                        Close
                      </button>
                      <button
                        onClick={handleCreateTrade}
                        disabled={tradeOffer.length === 0 && tradeRequest.length === 0}
                        className="px-4 py-2 bg-green-500 hover:bg-green-400 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Propose Trade
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Sort options */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'battlesWon', label: 'Battles Won' },
                  { id: 'totalDamageDealt', label: 'Total Damage' },
                  { id: 'achievementPoints', label: 'Achievement Points' },
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setLeaderboardSort(option.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      leaderboardSort === option.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Your rank */}
              {userRank && (
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Your Rank</span>
                    <span className="text-2xl font-bold text-yellow-400">#{userRank}</span>
                  </div>
                </div>
              )}

              {/* Leaderboard list */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-4">Top Players</h3>
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.user.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        entry.user.id === user.id ? 'bg-purple-500/20' : 'bg-black/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-300 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {entry.rank}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                        {entry.user.profilePicture ? (
                          <img src={entry.user.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          '&#128100;'
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{entry.user.displayName}</div>
                        <div className="text-sm text-white/60">@{entry.user.username}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {leaderboardSort === 'battlesWon' && entry.user.stats.battlesWon}
                          {leaderboardSort === 'totalDamageDealt' && entry.user.stats.totalDamageDealt.toLocaleString()}
                          {leaderboardSort === 'achievementPoints' && entry.user.stats.achievementPoints}
                        </div>
                        <div className="text-xs text-white/40">
                          {leaderboardSort === 'battlesWon' && 'wins'}
                          {leaderboardSort === 'totalDamageDealt' && 'damage'}
                          {leaderboardSort === 'achievementPoints' && 'points'}
                        </div>
                      </div>
                    </div>
                  ))}

                  {leaderboard.length === 0 && (
                    <p className="text-white/60 text-center py-8">No players on the leaderboard yet. Be the first!</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
