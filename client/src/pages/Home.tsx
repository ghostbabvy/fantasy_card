import { Link } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'

export default function Home() {
  const { playerName, level, xp } = useGameStore()
  const xpForNextLevel = level * 100
  const xpProgress = (xp / xpForNextLevel) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          Fantasy Cards
        </h1>
        <p className="text-xl text-white/70">
          Collect powerful cards, build decks, and battle your way to victory!
        </p>
      </div>

      {/* Player Stats Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-3xl">
            ⚔️
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{playerName}</h2>
            <div className="flex items-center gap-4">
              <span className="text-white/70">Level {level}</span>
              <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <span className="text-white/70 text-sm">{xp}/{xpForNextLevel} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-6">
        <Link
          to="/battle"
          className="group bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl p-6 hover:scale-105 transition-transform text-center"
        >
          <div className="text-5xl mb-4">⚔️</div>
          <h3 className="text-2xl font-bold mb-2">Battle</h3>
          <p className="text-white/80">Build a deck and fight!</p>
        </Link>

        <Link
          to="/shop"
          className="group bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 hover:scale-105 transition-transform text-center"
        >
          <div className="text-5xl mb-4">🎁</div>
          <h3 className="text-2xl font-bold mb-2">Open Packs</h3>
          <p className="text-white/80">Get new cards!</p>
        </Link>

        <Link
          to="/collection"
          className="group bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-6 hover:scale-105 transition-transform text-center"
        >
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-2xl font-bold mb-2">Collection</h3>
          <p className="text-white/80">View your cards</p>
        </Link>
      </div>
    </div>
  )
}
