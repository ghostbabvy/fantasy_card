import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { achievements } from '../data/achievements'
import { calculateAchievementPoints, getCurrentRank, getNextRank, getRankProgress } from '../data/ranks'
import { AchievementTier, AchievementCategory } from '../types'
import { useState } from 'react'

const categoryColors: Record<AchievementCategory, string> = {
  collection: 'from-blue-500 to-indigo-600',
  battle: 'from-red-500 to-orange-600',
  challenge: 'from-purple-500 to-pink-600',
  economy: 'from-yellow-500 to-amber-600'
}

const categoryIcons: Record<AchievementCategory, string> = {
  collection: '',
  battle: '',
  challenge: '',
  economy: ''
}

const tierColors: Record<AchievementTier, string> = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-amber-500'
}

const tierBgColors: Record<AchievementTier, string> = {
  bronze: 'bg-amber-800/30 border-amber-600',
  silver: 'bg-gray-400/20 border-gray-400',
  gold: 'bg-yellow-500/20 border-yellow-500'
}

export default function AchievementsPage() {
  const {
    achievements: claimedAchievements,
    getAchievementProgress,
    claimAchievementReward,
    unlockedTitles,
    selectedTitle,
    setSelectedTitle
  } = useGameStore()

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')
  const [showTitleModal, setShowTitleModal] = useState(false)

  // Calculate achievement points
  const achievementPoints = calculateAchievementPoints(claimedAchievements)
  const currentRank = getCurrentRank(achievementPoints)
  const nextRank = getNextRank(achievementPoints)
  const rankProgress = getRankProgress(achievementPoints)

  // Filter achievements by category
  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory)

  // Check if a tier is claimed
  const isTierClaimed = (achievementId: string, tier: AchievementTier): boolean => {
    const claimed = claimedAchievements.find(a => a.id === achievementId)
    return claimed?.claimedTiers.includes(tier) || false
  }

  // Handle claim
  const handleClaim = (achievementId: string, tier: AchievementTier) => {
    claimAchievementReward(achievementId, tier)
  }

  const categories: (AchievementCategory | 'all')[] = ['all', 'collection', 'battle', 'challenge', 'economy']

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Rank */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Achievements</h1>
            <p className="text-white/80">Earn points and unlock titles</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-yellow-300">{achievementPoints}</div>
            <div className="text-sm text-white/70">Achievement Points</div>
          </div>
        </div>

        {/* Rank Display */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{currentRank.name === 'Mythic' ? '' : ''}</div>
              <div>
                <div className="font-bold text-lg">{currentRank.name}</div>
                {selectedTitle && (
                  <div className="text-sm text-purple-300">"{selectedTitle}"</div>
                )}
              </div>
            </div>
            {nextRank && (
              <div className="text-right text-sm text-white/60">
                <div>Next: {nextRank.name}</div>
                <div>{nextRank.pointsRequired - achievementPoints} points needed</div>
              </div>
            )}
          </div>

          {nextRank && (
            <div className="bg-black/30 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rankProgress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
              />
            </div>
          )}
        </div>

        {/* Title Selection Button */}
        {unlockedTitles.length > 0 && (
          <button
            onClick={() => setShowTitleModal(true)}
            className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            Change Title ({unlockedTitles.length} unlocked)
          </button>
        )}
      </motion.div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              selectedCategory === cat
                ? 'bg-white text-gray-900'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {cat === 'all' ? 'All' : `${categoryIcons[cat]} ${cat}`}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="space-y-4">
        {filteredAchievements.map((achievement, index) => {
          const progress = getAchievementProgress(achievement.id)

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{achievement.title}</h3>
                  <p className="text-white/60 text-sm">{achievement.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium bg-gradient-to-r ${categoryColors[achievement.category]} capitalize`}>
                  {achievement.category}
                </span>
              </div>

              {/* Tiers */}
              <div className="grid grid-cols-3 gap-3">
                {(['bronze', 'silver', 'gold'] as AchievementTier[]).map(tier => {
                  const tierData = achievement.tiers[tier]
                  const isClaimed = isTierClaimed(achievement.id, tier)
                  const canClaim = progress >= tierData.target && !isClaimed
                  const tierProgress = Math.min(100, (progress / tierData.target) * 100)

                  return (
                    <div
                      key={tier}
                      className={`border rounded-lg p-3 ${tierBgColors[tier]} ${isClaimed ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold capitalize bg-gradient-to-r ${tierColors[tier]} bg-clip-text text-transparent`}>
                          {tier}
                        </span>
                        <span className="text-xs text-white/60">
                          {progress}/{tierData.target}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="bg-black/40 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${tierColors[tier]}`}
                          style={{ width: `${tierProgress}%` }}
                        />
                      </div>

                      {/* Reward preview */}
                      <div className="text-xs text-white/60 mb-2">
                        {tierData.reward.coins && <span className="mr-2">+{tierData.reward.coins}</span>}
                        {tierData.reward.dust && <span className="mr-2">+{tierData.reward.dust}</span>}
                        {tierData.reward.title && <span className="text-purple-300">"{tierData.reward.title}"</span>}
                      </div>

                      {/* Claim button */}
                      {isClaimed ? (
                        <div className="text-center text-xs text-green-400 font-medium">Claimed</div>
                      ) : canClaim ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleClaim(achievement.id, tier)}
                          className="w-full py-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-xs font-bold"
                        >
                          Claim!
                        </motion.button>
                      ) : (
                        <div className="text-center text-xs text-white/40">
                          {tierData.target - progress} more
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Title Selection Modal */}
      {showTitleModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTitleModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Select Title</h2>
            <p className="text-white/60 mb-4">Choose a title to display with your rank</p>

            <div className="space-y-2 mb-4">
              {/* No title option */}
              <button
                onClick={() => {
                  setSelectedTitle(null)
                  setShowTitleModal(false)
                }}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedTitle === null
                    ? 'bg-purple-500/40 ring-2 ring-purple-400'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="font-medium text-white/60">No Title</div>
              </button>

              {/* Unlocked titles */}
              {unlockedTitles.map(title => (
                <button
                  key={title}
                  onClick={() => {
                    setSelectedTitle(title)
                    setShowTitleModal(false)
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedTitle === title
                      ? 'bg-purple-500/40 ring-2 ring-purple-400'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="font-bold">"{title}"</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTitleModal(false)}
              className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
