import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface PlayMode {
  id: string
  title: string
  description: string
  icon: string
  image?: string
  path: string
  color: string
  features: string[]
}

const playModes: PlayMode[] = [
  {
    id: 'battle',
    title: 'Quick Battle',
    description: 'Battle against AI opponents with your decks. Win battles to earn coins and XP, and complete daily missions.',
    icon: '⚔️',
    path: '/battle',
    color: '#ef4444',
    features: ['Use your custom decks', 'Earn coins & XP', 'Track your stats']
  },
  {
    id: 'boss-rush',
    title: 'Boss Rush',
    description: 'Fight through 10 increasingly powerful bosses in a gauntlet. Your HP persists between fights, so manage your resources carefully!',
    icon: '👑',
    path: '/boss-rush',
    color: '#f59e0b',
    features: ['Progressive difficulty', 'Persistent HP between fights', 'Big rewards for completion']
  },
  {
    id: 'draft',
    title: 'Draft Mode',
    description: 'Draft 15 cards from random offerings, then battle 3 AI opponents. Rewards scale with your wins!',
    icon: '🎴',
    path: '/draft',
    color: '#8b5cf6',
    features: ['Pick from random cards', 'Win 3 battles to win', 'Rewards scale with wins']
  },
  {
    id: 'challenge',
    title: 'Challenge Mode',
    description: 'Take on 50 challenging levels with increasing difficulty. Every 10 levels features a boss fight with exclusive card rewards!',
    icon: '🏰',
    image: '/boss-icon.png',
    path: '/challenge',
    color: '#3b82f6',
    features: ['50 unique levels', 'Earn stars for performance', 'Exclusive boss card rewards']
  }
]

export default function PlayPage() {
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState<PlayMode | null>(null)

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <span className="text-5xl">&#9876;&#65039;</span>
          Play
        </h1>
        <p className="text-white/60">Choose your game mode</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {playModes.map((mode, index) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedMode(mode)}
            className="block bg-white/5 hover:bg-white/10 rounded-xl p-6 transition-all border-2 border-transparent hover:border-white/20 text-left"
            style={{ borderLeftColor: mode.color, borderLeftWidth: 4 }}
          >
            <div className="flex items-center gap-4">
              <div
                className="text-4xl rounded-xl flex items-center justify-center w-16 h-16 overflow-hidden"
                style={{ backgroundColor: `${mode.color}20` }}
              >
                {mode.image ? (
                  <img src={mode.image} alt={mode.title} className="w-[200%] h-[200%] object-cover object-top" />
                ) : (
                  mode.icon
                )}
              </div>
              <h2 className="text-xl font-bold">{mode.title}</h2>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Mode Details Modal */}
      <AnimatePresence>
        {selectedMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMode(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border-2"
              style={{ borderColor: selectedMode.color }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div
                  className="text-5xl rounded-xl inline-flex items-center justify-center mb-3 w-24 h-24 overflow-hidden"
                  style={{ backgroundColor: `${selectedMode.color}20` }}
                >
                  {selectedMode.image ? (
                    <img src={selectedMode.image} alt={selectedMode.title} className="w-[200%] h-[200%] object-cover object-top" />
                  ) : (
                    selectedMode.icon
                  )}
                </div>
                <h2 className="text-2xl font-bold">{selectedMode.title}</h2>
              </div>

              {/* Description */}
              <p className="text-white/70 text-center mb-6">
                {selectedMode.description}
              </p>

              {/* Features */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <ul className="space-y-2">
                  {selectedMode.features.map((feature, i) => (
                    <li key={i} className="text-sm text-white/70 flex items-center gap-3">
                      <span className="text-green-400 text-lg">&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMode(null)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
                >
                  Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(selectedMode.path)}
                  className="flex-1 py-3 rounded-xl font-bold text-white"
                  style={{ backgroundColor: selectedMode.color }}
                >
                  Play!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
