import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { authApi, friendsApi, leaderboardApi, User, FriendRequest } from '../services/api'
import { useGameStore } from '../stores/gameStore'

type SocialTab = 'profile' | 'friends' | 'leaderboard'

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

  // Check if logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Load friends when tab changes
  useEffect(() => {
    if (user && activeTab === 'friends') {
      loadFriends()
    }
    if (activeTab === 'leaderboard') {
      loadLeaderboard()
    }
  }, [activeTab, user, leaderboardSort])

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      const currentUser = await authApi.getMe()
      setUser(currentUser)
      if (currentUser) {
        setEditDisplayName(currentUser.displayName || '')
        setEditBio(currentUser.bio || '')
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
      const [friendsList, requests] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingRequests(),
      ])
      setFriends(friendsList)
      setPendingRequests(requests)
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

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      await friendsApi.sendFriendRequest(targetUserId)
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId))
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
    { id: 'profile' as SocialTab, label: 'Profile', icon: '&#128100;' },
    { id: 'friends' as SocialTab, label: 'Friends', icon: '&#128101;' },
    { id: 'leaderboard' as SocialTab, label: 'Leaderboard', icon: '&#127942;' },
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
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: tab.icon }} />
                {tab.label}
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
              {/* Search */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-3">Find Players</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-4 py-2 bg-black/30 rounded-lg border border-white/10"
                    placeholder="Search by username..."
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || searchQuery.length < 2}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-400 rounded-lg font-bold disabled:opacity-50"
                  >
                    Search
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {searchResults.map(result => (
                      <div key={result.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                            {result.profilePicture ? (
                              <img src={result.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              '&#128100;'
                            )}
                          </div>
                          <div>
                            <div className="font-bold">{result.displayName}</div>
                            <div className="text-sm text-white/60">@{result.username}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendFriendRequest(result.id)}
                          className="px-3 py-1 bg-green-500 hover:bg-green-400 rounded text-sm font-bold"
                        >
                          Add Friend
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="font-bold mb-3">Friend Requests ({pendingRequests.length})</h3>
                  <div className="space-y-2">
                    {pendingRequests.map(request => (
                      <div key={request.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                            {request.fromUser?.profilePicture ? (
                              <img src={request.fromUser.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              '&#128100;'
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
                            className="px-3 py-1 bg-green-500 hover:bg-green-400 rounded text-sm font-bold"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-3">Friends ({friends.length})</h3>
                {friends.length === 0 ? (
                  <p className="text-white/60 text-center py-8">No friends yet. Search for players to add!</p>
                ) : (
                  <div className="space-y-2">
                    {friends.map(friend => (
                      <div key={friend.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                            {friend.profilePicture ? (
                              <img src={friend.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              '&#128100;'
                            )}
                          </div>
                          <div>
                            <div className="font-bold">{friend.displayName}</div>
                            <div className="text-sm text-white/60">{friend.stats.battlesWon} wins</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
