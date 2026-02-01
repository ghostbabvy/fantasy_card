import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import { cards } from '../data/cards'

export default function Home() {
  const navigate = useNavigate()
  const {
    playerName,
    level,
    xp,
    coins,
    dust,
    collection,
    loginStreak,
    dailyRewards,
    hasClaimedTodayLogin,
    missions,
    freePacksAvailable,
    freePackTimer,
    checkDailyLogin,
    claimDailyReward,
    claimMissionReward,
    resetDailyMissions
  } = useGameStore()

  const [showLoginReward, setShowLoginReward] = useState(false)
  const [claimedReward, setClaimedReward] = useState<{ coins?: number; dust?: number; packs?: string } | null>(null)

  // Check for daily login on mount
  useEffect(() => {
    const isNewDay = checkDailyLogin()
    resetDailyMissions()
    if (isNewDay && !hasClaimedTodayLogin) {
      setShowLoginReward(true)
    }
  }, [])

  // Calculate collection stats
  const totalCards = cards.length
  const ownedCards = Object.values(collection).filter(c => c.quantity > 0).length
  const collectionPercent = Math.round((ownedCards / totalCards) * 100)

  // Calculate XP for next level
  const xpForNextLevel = level * 100
  const xpPercent = Math.round((xp / xpForNextLevel) * 100)

  // Get unclaimed mission count
  const unclaimedMissions = missions.filter(m => m.completed && !m.claimed).length
  const activeMissions = missions.filter(m => !m.claimed)

  // Check if free pack available
  const canClaimFreePack = freePacksAvailable > 0 || Date.now() >= freePackTimer

  const handleClaimLoginReward = () => {
    const reward = claimDailyReward()
    if (reward) {
      setClaimedReward(reward)
      setTimeout(() => {
        setShowLoginReward(false)
        setClaimedReward(null)
      }, 2000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Player Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{playerName}</h1>
            <div className="text-white/80">Level {level}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="text-yellow-300 mr-1">🪙</span>
              <span className="font-bold">{coins.toLocaleString()}</span>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="text-purple-300 mr-1">✨</span>
              <span className="font-bold">{dust.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="bg-black/30 rounded-full h-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="text-sm text-white/70 mt-1">
          {xp} / {xpForNextLevel} XP
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/battle')}
          className="bg-gradient-to-br from-red-500 to-orange-600 p-4 rounded-xl text-center"
        >
          <div className="text-3xl mb-1">⚔️</div>
          <div className="font-bold">Battle</div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/shop')}
          className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl text-center relative"
        >
          {canClaimFreePack && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full"
            >
              FREE!
            </motion.div>
          )}
          <div className="text-3xl mb-1">🎁</div>
          <div className="font-bold">Shop</div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/collection')}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl text-center"
        >
          <div className="text-3xl mb-1">📚</div>
          <div className="font-bold">Collection</div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/crafting')}
          className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-xl text-center"
        >
          <div className="text-3xl mb-1">🔨</div>
          <div className="font-bold">Crafting</div>
        </motion.button>
      </div>

      {/* Daily Login Streak */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span>📅</span> Daily Login
          </h2>
          <div className="text-amber-400 font-bold">
            Day {loginStreak} / 7
          </div>
        </div>

        <div className="flex gap-2 justify-between">
          {dailyRewards.map((reward, index) => {
            const isToday = index + 1 === loginStreak
            const isPast = index + 1 < loginStreak
            const isClaimed = reward.claimed

            return (
              <motion.div
                key={index}
                whileHover={isToday && !isClaimed ? { scale: 1.1 } : undefined}
                onClick={isToday && !isClaimed ? handleClaimLoginReward : undefined}
                className={`
                  flex-1 p-2 rounded-lg text-center cursor-pointer transition-all
                  ${isToday && !isClaimed ? 'bg-amber-500 ring-2 ring-amber-300 ring-offset-2 ring-offset-gray-900' : ''}
                  ${isClaimed ? 'bg-green-500/30' : ''}
                  ${!isToday && !isClaimed ? 'bg-white/10' : ''}
                  ${isPast && !isClaimed ? 'opacity-50' : ''}
                `}
              >
                <div className="text-xs text-white/60">Day {index + 1}</div>
                <div className="text-lg">
                  {isClaimed ? '✅' : reward.reward.coins ? '🪙' : reward.reward.dust ? '✨' : '🎁'}
                </div>
                <div className="text-xs font-bold">
                  {reward.reward.coins && `${reward.reward.coins}`}
                  {reward.reward.dust && `${reward.reward.dust}`}
                  {reward.reward.packs && 'Pack'}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Collection Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 rounded-xl p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span>📊</span> Collection Progress
          </h2>
          <div className="text-white/70">
            {ownedCards} / {totalCards} cards
          </div>
        </div>
        <div className="bg-black/30 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${collectionPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        <div className="text-sm text-white/50 mt-1">{collectionPercent}% Complete</div>
      </motion.div>

      {/* Missions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/5 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span>📋</span> Missions
            {unclaimedMissions > 0 && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unclaimedMissions} ready!
              </span>
            )}
          </h2>
        </div>

        <div className="space-y-3">
          {activeMissions.slice(0, 5).map((mission) => {
            const progressPercent = Math.round((mission.progress / mission.target) * 100)

            return (
              <motion.div
                key={mission.id}
                className={`
                  bg-black/30 rounded-lg p-3 transition-all
                  ${mission.completed && !mission.claimed ? 'ring-2 ring-green-400' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {mission.title}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        mission.type === 'daily' ? 'bg-blue-500/30 text-blue-300' : 'bg-purple-500/30 text-purple-300'
                      }`}>
                        {mission.type}
                      </span>
                    </div>
                    <div className="text-sm text-white/60">{mission.description}</div>
                  </div>
                  <div className="text-right">
                    {mission.completed && !mission.claimed ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => claimMissionReward(mission.id)}
                        className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg font-bold text-sm"
                      >
                        Claim!
                      </motion.button>
                    ) : (
                      <div className="text-white/50 text-sm">
                        {mission.progress} / {mission.target}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-black/40 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full ${mission.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Reward preview */}
                <div className="flex items-center gap-2 mt-2 text-sm text-white/50">
                  <span>Reward:</span>
                  {mission.reward.coins && (
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-400">🪙</span> {mission.reward.coins}
                    </span>
                  )}
                  {mission.reward.dust && (
                    <span className="flex items-center gap-1">
                      <span className="text-purple-400">✨</span> {mission.reward.dust}
                    </span>
                  )}
                  {mission.reward.packs && (
                    <span className="flex items-center gap-1">
                      <span>🎁</span> {mission.reward.packs} pack
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Daily Login Reward Modal */}
      <AnimatePresence>
        {showLoginReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 text-center max-w-sm"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-7xl mb-4"
              >
                🎉
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">Daily Login!</h2>
              <p className="text-white/80 mb-4">Day {loginStreak} streak!</p>

              {claimedReward ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-white/20 rounded-xl p-4 mb-4"
                >
                  <div className="text-lg font-bold">You received:</div>
                  <div className="text-3xl mt-2">
                    {claimedReward.coins && `🪙 ${claimedReward.coins} coins`}
                    {claimedReward.dust && `✨ ${claimedReward.dust} dust`}
                    {claimedReward.packs && `🎁 ${claimedReward.packs} pack`}
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClaimLoginReward}
                  className="bg-white text-orange-600 px-8 py-3 rounded-xl font-bold text-lg"
                >
                  Claim Reward!
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
