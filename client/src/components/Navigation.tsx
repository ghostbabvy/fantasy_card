import { Link, useLocation } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'

export default function Navigation() {
  const location = useLocation()
  const { coins, dust } = useGameStore()

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/collection', label: 'Collection', icon: '📚' },
    { path: '/shop', label: 'Shop', icon: '🛒' },
    { path: '/battle', label: 'Battle', icon: '⚔️' },
  ]

  return (
    <nav className="bg-black/30 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐉</span>
            <span className="font-['Cinzel'] text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Fantasy Cards
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg transition-all ${
                  location.pathname === item.path
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Currency Display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-lg">
              <span className="text-yellow-400">🪙</span>
              <span className="font-semibold text-yellow-400">{coins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-lg">
              <span className="text-purple-400">✨</span>
              <span className="font-semibold text-purple-400">{dust.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
