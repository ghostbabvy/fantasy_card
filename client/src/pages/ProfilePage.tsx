import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { achievements as achievementDefinitions } from '../data/achievements'
import { getCurrentRank, getNextRank, getRankProgress, calculateAchievementPoints } from '../data/ranks'
import { getMasteryLevel } from '../data/mastery'
import { AchievementTier } from '../types'

type ProfileTab = 'stats' | 'achievements' | 'titles'

export default function ProfilePage() {
  const {
    playerName,
    playerBio,
    profilePicture,
    level,
    stats,
    achievements,
    unlockedTitles,
    selectedTitle,
    setSelectedTitle,
    setPlayerName,
    setPlayerBio,
    setProfilePicture,
    getAchievementProgress,
    claimAchievementReward
  } = useGameStore()

  const [activeTab, setActiveTab] = useState<ProfileTab>('stats')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(playerName)
  const [editBio, setEditBio] = useState(playerBio)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSaveProfile = () => {
    setPlayerName(editName)
    setPlayerBio(editBio)
    setIsEditing(false)
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 500KB)
    if (file.size > 500000) {
      alert('Image too large. Please use an image under 500KB.')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setProfilePicture(base64)
    }
    reader.readAsDataURL(file)
  }

  const achievementPoints = calculateAchievementPoints(achievements)
  const currentRank = getCurrentRank(achievementPoints)
  const nextRank = getNextRank(achievementPoints)
  const rankProgress = getRankProgress(achievementPoints)

  // Get top used cards
  const topCards = Object.entries(stats.cardUsageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const winRate = stats.battlesPlayed > 0
    ? Math.round((stats.battlesWon / stats.battlesPlayed) * 100)
    : 0

  const tierColors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700'
  }

  const tabs = [
    { id: 'stats' as ProfileTab, label: 'Statistics', icon: '&#128202;' },
    { id: 'achievements' as ProfileTab, label: 'Achievements', icon: '&#127942;' },
    { id: 'titles' as ProfileTab, label: 'Titles', icon: '&#127775;' }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 mb-6"
      >
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>&#128100;</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-sm hover:bg-purple-400"
              title="Change picture"
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
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 text-lg font-bold"
                  placeholder="Your name"
                  maxLength={20}
                />
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 resize-none text-sm"
                  placeholder="Tell us about yourself..."
                  maxLength={200}
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg text-sm font-bold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditName(playerName)
                      setEditBio(playerBio)
                    }}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">{playerName || 'Player'}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-white/40 hover:text-white/60 text-sm"
                    title="Edit profile"
                  >
                    &#9998;
                  </button>
                  {selectedTitle && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-sm">
                      {selectedTitle}
                </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-white/60">Level {level}</span>
                  <span style={{ color: currentRank.badge === '&#128081;' ? '#ffd700' : currentRank.badge === '&#127942;' ? '#c0c0c0' : '#cd7f32' }}>
                    <span dangerouslySetInnerHTML={{ __html: currentRank.badge }} /> {currentRank.name}
                  </span>
                </div>
                {playerBio && (
                  <p className="text-white/70 text-sm mt-2">{playerBio}</p>
                )}
              </>
            )}

            {/* Rank Progress */}
            {nextRank && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span>{currentRank.name}</span>
                  <span>{nextRank.name}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${rankProgress}%` }}
                  />
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {achievementPoints} / {nextRank.pointsRequired} points
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

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

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Battle Stats */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Battle Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{stats.battlesWon}</div>
                <div className="text-sm text-white/60">Victories</div>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{stats.battlesPlayed - stats.battlesWon}</div>
                <div className="text-sm text-white/60">Defeats</div>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{winRate}%</div>
                <div className="text-sm text-white/60">Win Rate</div>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.bestWinStreak}</div>
                <div className="text-sm text-white/60">Best Streak</div>
              </div>
            </div>
          </div>

          {/* Gameplay Stats */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Gameplay Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-lg font-bold">{stats.cardsPlayed}</div>
                <div className="text-sm text-white/60">Cards Played</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-lg font-bold">{stats.damageDealt.toLocaleString()}</div>
                <div className="text-sm text-white/60">Damage Dealt</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-lg font-bold">{stats.creaturesDefeated}</div>
                <div className="text-sm text-white/60">Creatures Defeated</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-lg font-bold">{stats.packsOpened}</div>
                <div className="text-sm text-white/60">Packs Opened</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-lg font-bold">{stats.totalCoinsSpent.toLocaleString()}</div>
                <div className="text-sm text-white/60">Coins Spent</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-lg font-bold">{stats.winStreak}</div>
                <div className="text-sm text-white/60">Current Streak</div>
              </div>
            </div>
          </div>

          {/* Most Used Cards */}
          {topCards.length > 0 && (
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Most Used Cards</h2>
              <div className="space-y-2">
                {topCards.map(([cardId, uses], index) => {
                  const masteryLevel = getMasteryLevel(uses)
                  return (
                    <div key={cardId} className="flex items-center gap-3 bg-black/20 rounded-lg p-3">
                      <span className="text-xl font-bold text-white/30">#{index + 1}</span>
                      <div className="flex-1">
                        <span className="font-medium">{cardId}</span>
                        <span
                          className="ml-2 text-xs px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${masteryLevel.borderColor}30`, color: masteryLevel.borderColor }}
                        >
                          {masteryLevel.title}
                        </span>
                      </div>
                      <span className="text-white/60">{uses} uses</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {achievementDefinitions.map(achievement => {
            const progress = getAchievementProgress(achievement.id)
            const claimedTiers = achievements.find(a => a.id === achievement.id)?.claimedTiers || []

            return (
              <div key={achievement.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{achievement.title}</h3>
                    <p className="text-sm text-white/60">{achievement.description}</p>
                  </div>
                  <span className="text-xs text-white/40 capitalize">{achievement.category}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(['bronze', 'silver', 'gold'] as AchievementTier[]).map(tier => {
                    const tierData = achievement.tiers[tier]
                    const isClaimed = claimedTiers.includes(tier)
                    const canClaim = progress >= tierData.target && !isClaimed
                    const tierProgress = Math.min(100, (progress / tierData.target) * 100)

                    return (
                      <div
                        key={tier}
                        className={`rounded-lg p-3 ${
                          isClaimed ? 'bg-black/40' : 'bg-black/20'
                        }`}
                        style={{ borderColor: tierColors[tier], borderWidth: isClaimed ? 2 : 0 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tierColors[tier] }}
                          />
                          <span className="text-sm font-medium capitalize">{tier}</span>
                        </div>
                        <div className="text-xs text-white/60 mb-2">
                          {progress} / {tierData.target}
                        </div>
                        <div className="h-1 bg-black/30 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full"
                            style={{ width: `${tierProgress}%`, backgroundColor: tierColors[tier] }}
                          />
                        </div>
                        {canClaim ? (
                          <button
                            onClick={() => claimAchievementReward(achievement.id, tier)}
                            className="w-full py-1 bg-green-500 hover:bg-green-400 rounded text-xs font-bold"
                          >
                            Claim!
                          </button>
                        ) : isClaimed ? (
                          <div className="text-center text-xs text-green-400">&#10003; Claimed</div>
                        ) : (
                          <div className="text-center text-xs text-white/30">Locked</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Titles Tab */}
      {activeTab === 'titles' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Your Titles</h2>
            {unlockedTitles.length === 0 ? (
              <p className="text-white/60">No titles unlocked yet. Complete achievements to earn titles!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {unlockedTitles.map(title => (
                  <button
                    key={title}
                    onClick={() => setSelectedTitle(selectedTitle === title ? null : title)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      selectedTitle === title
                        ? 'bg-yellow-500/20 ring-2 ring-yellow-400'
                        : 'bg-black/20 hover:bg-black/30'
                    }`}
                  >
                    <div className="font-bold">{title}</div>
                    {selectedTitle === title && (
                      <div className="text-xs text-yellow-400 mt-1">Equipped</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Locked Titles</h2>
            <p className="text-white/60 text-sm mb-4">Complete gold tier achievements to unlock these titles.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievementDefinitions
                .filter(a => a.tiers.gold.reward.title && !unlockedTitles.includes(a.tiers.gold.reward.title))
                .map(achievement => (
                  <div
                    key={achievement.id}
                    className="p-3 rounded-lg bg-black/20 text-center opacity-50"
                  >
                    <div className="font-bold text-white/50">{achievement.tiers.gold.reward.title}</div>
                    <div className="text-xs text-white/30 mt-1">
                      {achievement.title} (Gold)
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
