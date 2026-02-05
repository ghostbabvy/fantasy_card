import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { getCardById } from '../data/cards'
import Card from '../components/Card'

export default function StatsPage() {
  const { stats, challengeProgress } = useGameStore()

  // Calculate win rate
  const winRate = stats.battlesPlayed > 0
    ? Math.round((stats.battlesWon / stats.battlesPlayed) * 100)
    : 0

  // Get most used cards (top 10)
  const mostUsedCards = Object.entries(stats.cardUsageCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([cardId, count]) => ({
      card: getCardById(cardId),
      count
    }))
    .filter(item => item.card)

  // Calculate total stars
  const totalStars = Object.values(challengeProgress.levelStars).reduce((sum, stars) => sum + stars, 0)
  const maxPossibleStars = challengeProgress.highestLevel * 3


  const statCards = [
    { label: 'Battles Won', value: stats.battlesWon, icon: '/icons/trophy.png', color: 'from-yellow-500 to-amber-600' },
    { label: 'Battles Played', value: stats.battlesPlayed, icon: '/icons/battle.png', color: 'from-red-500 to-orange-600' },
    { label: 'Win Rate', value: `${winRate}%`, icon: '/icons/win_rate.png', color: 'from-green-500 to-emerald-600' },
    { label: 'Win Streak', value: stats.winStreak, icon: '/icons/streak.png', color: 'from-orange-500 to-red-600' },
    { label: 'Best Streak', value: stats.bestWinStreak, icon: '/icons/best_streak.png', color: 'from-purple-500 to-pink-600' },
    { label: 'Cards Played', value: stats.cardsPlayed.toLocaleString(), icon: '/icons/cards.png', color: 'from-blue-500 to-indigo-600' },
    { label: 'Damage Dealt', value: stats.damageDealt.toLocaleString(), icon: '/icons/damage.png', color: 'from-red-600 to-rose-700' },
    { label: 'Creatures Defeated', value: stats.creaturesDefeated.toLocaleString(), icon: '/icons/skull.png', color: 'from-gray-600 to-gray-800' },
    { label: 'Packs Opened', value: stats.packsOpened, icon: '/icons/pack.png', color: 'from-cyan-500 to-blue-600' },
    { label: 'Coins Spent', value: stats.totalCoinsSpent.toLocaleString(), icon: '/icons/coins.png', color: 'from-yellow-400 to-yellow-600' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-2">Battle Statistics</h1>
        <p className="text-white/60">Track your progress and achievements</p>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-center`}
          >
            <div className="text-3xl mb-1">{stat.label === 'Win Rate' ? '' : ''}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-white/80">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Challenge Mode Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/5 rounded-xl p-6 mb-8"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          Challenge Mode Progress
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{challengeProgress.highestLevel}</div>
            <div className="text-sm text-white/60">Highest Level</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{challengeProgress.completedLevels.length}</div>
            <div className="text-sm text-white/60">Levels Completed</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{totalStars}</div>
            <div className="text-sm text-white/60">Total Stars</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{challengeProgress.bossCardsOwned.length}</div>
            <div className="text-sm text-white/60">Boss Cards Earned</div>
          </div>
        </div>

        {/* Star Progress Bar */}
        {maxPossibleStars > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/60">Star Collection</span>
              <span className="text-amber-400">{totalStars} / {maxPossibleStars}</span>
            </div>
            <div className="bg-black/40 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(totalStars / maxPossibleStars) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Most Used Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 rounded-xl p-6"
      >
        <h2 className="text-xl font-bold mb-4">Most Used Cards</h2>

        {mostUsedCards.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <div className="text-4xl mb-2">?</div>
            <p>Play some battles to see your most used cards!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {mostUsedCards.map((item, index) => (
              <motion.div
                key={item.card!.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="relative"
              >
                <Card card={item.card!} size="sm" />
                <div className="absolute -bottom-2 -right-2 bg-purple-500 rounded-full px-2 py-0.5 text-xs font-bold">
                  {item.count}x
                </div>
                {index === 0 && (
                  <div className="absolute -top-2 -left-2 bg-yellow-500 rounded-full w-6 h-6 flex items-center justify-center text-black font-bold text-sm">
                    #1
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
