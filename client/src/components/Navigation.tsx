import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'

export default function Navigation() {
  const location = useLocation()
  const { coins, dust, freePacksAvailable, freePackTimer, missions } = useGameStore()

  // Check for notifications
  const canClaimFreePack = freePacksAvailable > 0 || Date.now() >= freePackTimer
  const unclaimedMissions = missions.filter(m => m.completed && !m.claimed).length

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠', badge: unclaimedMissions > 0 ? unclaimedMissions : null },
    { path: '/collection', label: 'Collection', icon: '📚', badge: null },
    { path: '/decks', label: 'Decks', icon: '🃏', badge: null },
    { path: '/shop', label: 'Shop', icon: '🛒', badge: canClaimFreePack ? 'FREE' : null },
    { path: '/crafting', label: 'Craft', icon: '🔨', badge: null },
    { path: '/battle', label: 'Battle', icon: '⚔️', badge: null },
  ]

  return (
    <nav className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              🐉
            </motion.span>
            <span className="font-['Cinzel'] text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent hidden sm:inline">
              Fantasy Cards
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3 py-2 rounded-lg transition-all ${
                  location.pathname === item.path
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>

                {/* Notification Badge */}
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badge === 'FREE'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </Link>
            ))}
          </div>

          {/* Currency Display */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 bg-yellow-500/20 px-2 sm:px-3 py-1.5 rounded-lg">
              <span className="text-yellow-400">🪙</span>
              <span className="font-semibold text-yellow-400 text-sm sm:text-base">{coins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-purple-500/20 px-2 sm:px-3 py-1.5 rounded-lg">
              <span className="text-purple-400">✨</span>
              <span className="font-semibold text-purple-400 text-sm sm:text-base">{dust.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
