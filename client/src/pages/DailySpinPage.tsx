import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'

interface SpinReward {
  id: string
  label: string
  value: number
  type: 'coins' | 'dust' | 'pack' | 'xp'
  icon: string
  rarity: 'basic' | 'uncommon' | 'mythical' | 'legendary' | 'celestial'
}

// Rarity colors for the wheel segments
const rarityColors: Record<string, string> = {
  basic: '#6b7280',      // Gray
  uncommon: '#22c55e',   // Green
  mythical: '#a855f7',   // Purple
  legendary: '#f59e0b',  // Gold/Orange
  celestial: '#ec4899',  // Pink
}

const spinRewards: SpinReward[] = [
  { id: '1', label: '50 Coins', value: 50, type: 'coins', icon: '🪙', rarity: 'basic' },
  { id: '2', label: '25 Dust', value: 25, type: 'dust', icon: '✨', rarity: 'basic' },
  { id: '3', label: '100 Coins', value: 100, type: 'coins', icon: '🪙', rarity: 'uncommon' },
  { id: '4', label: '50 Dust', value: 50, type: 'dust', icon: '✨', rarity: 'uncommon' },
  { id: '5', label: '200 Coins', value: 200, type: 'coins', icon: '🪙', rarity: 'mythical' },
  { id: '6', label: 'Basic Pack', value: 1, type: 'pack', icon: '📦', rarity: 'mythical' },
  { id: '7', label: '100 Dust', value: 100, type: 'dust', icon: '✨', rarity: 'mythical' },
  { id: '8', label: '500 Coins', value: 500, type: 'coins', icon: '💰', rarity: 'legendary' },
  { id: '9', label: 'Premium Pack', value: 2, type: 'pack', icon: '🎁', rarity: 'legendary' },
  { id: '10', label: '250 Dust', value: 250, type: 'dust', icon: '💎', rarity: 'legendary' },
  { id: '11', label: '1000 Coins', value: 1000, type: 'coins', icon: '👑', rarity: 'celestial' },
  { id: '12', label: 'Mega Pack', value: 3, type: 'pack', icon: '🌟', rarity: 'celestial' },
]

const SPIN_COOLDOWN = 24 * 60 * 60 * 1000 // 24 hours

export default function DailySpinPage() {
  const { addCoins, addDust, addXp } = useGameStore()
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [wonReward, setWonReward] = useState<SpinReward | null>(null)
  const [lastSpinTime, setLastSpinTime] = useState<number>(() => {
    const saved = localStorage.getItem('lastSpinTime')
    return saved ? parseInt(saved) : 0
  })
  const [timeUntilSpin, setTimeUntilSpin] = useState('')

  const canSpin = Date.now() - lastSpinTime >= SPIN_COOLDOWN

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const remaining = SPIN_COOLDOWN - (Date.now() - lastSpinTime)
      if (remaining <= 0) {
        setTimeUntilSpin('')
        return
      }
      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
      setTimeUntilSpin(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [lastSpinTime])

  const getWeightedReward = (): SpinReward => {
    // Weighted random selection - basic more likely
    const weights = {
      basic: 40,
      uncommon: 30,
      mythical: 20,
      legendary: 8,
      celestial: 2
    }

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight

    let selectedRarity: SpinReward['rarity'] = 'basic'
    for (const [rarity, weight] of Object.entries(weights)) {
      random -= weight
      if (random <= 0) {
        selectedRarity = rarity as SpinReward['rarity']
        break
      }
    }

    const rewardsOfRarity = spinRewards.filter(r => r.rarity === selectedRarity)
    return rewardsOfRarity[Math.floor(Math.random() * rewardsOfRarity.length)]
  }

  const handleSpin = () => {
    if (isSpinning || !canSpin) return

    setIsSpinning(true)
    setWonReward(null)

    const reward = getWeightedReward()
    const rewardIndex = spinRewards.findIndex(r => r.id === reward.id)
    const segmentAngle = 360 / spinRewards.length
    const targetAngle = rewardIndex * segmentAngle

    // Spin multiple rotations plus land on target
    const spins = 5 + Math.random() * 3 // 5-8 full rotations
    const finalRotation = rotation + (spins * 360) + (360 - targetAngle) + (segmentAngle / 2)

    setRotation(finalRotation)

    setTimeout(() => {
      setIsSpinning(false)
      setWonReward(reward)

      // Apply reward
      switch (reward.type) {
        case 'coins':
          addCoins(reward.value)
          break
        case 'dust':
          addDust(reward.value)
          break
        case 'xp':
          addXp(reward.value)
          break
        case 'pack':
          // Give coins equivalent for now (packs would need special handling)
          addCoins(reward.value * 100)
          break
      }

      // Save spin time
      const now = Date.now()
      setLastSpinTime(now)
      localStorage.setItem('lastSpinTime', now.toString())
    }, 5000)
  }

  const segmentAngle = 360 / spinRewards.length

  // Create SVG path for a pie segment
  const createSegmentPath = (index: number) => {
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180)
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180)
    const radius = 150
    const x1 = 150 + radius * Math.cos(startAngle)
    const y1 = 150 + radius * Math.sin(startAngle)
    const x2 = 150 + radius * Math.cos(endAngle)
    const y2 = 150 + radius * Math.sin(endAngle)
    const largeArc = segmentAngle > 180 ? 1 : 0

    return `M 150 150 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">Daily Spin</h1>
        <p className="text-white/60">Spin the wheel once every 24 hours for free rewards!</p>
      </motion.div>

      {/* Wheel Container */}
      <div className="relative w-80 h-80 mx-auto mb-8">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <motion.div
          className="w-full h-full"
          animate={{ rotate: rotation }}
          transition={{ duration: 5, ease: "easeOut" }}
        >
          <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
            {/* Outer ring */}
            <circle cx="150" cy="150" r="148" fill="none" stroke="#eab308" strokeWidth="6" />

            {/* Segments */}
            {spinRewards.map((reward, index) => (
              <path
                key={reward.id}
                d={createSegmentPath(index)}
                fill={rarityColors[reward.rarity]}
                stroke="#1a1a2e"
                strokeWidth="2"
                className="transition-opacity"
              />
            ))}

            {/* Inner decorative ring */}
            <circle cx="150" cy="150" r="45" fill="#1a1a2e" stroke="#eab308" strokeWidth="3" />

            {/* Center icon */}
            <text x="150" y="160" textAnchor="middle" fontSize="36">🎰</text>
          </svg>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        {(['basic', 'uncommon', 'mythical', 'legendary', 'celestial'] as const).map(rarity => (
          <div key={rarity} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: rarityColors[rarity] }}
            />
            <span className="text-xs text-white/60 capitalize">{rarity}</span>
          </div>
        ))}
      </div>

      {/* Spin Button */}
      {canSpin ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSpin}
          disabled={isSpinning}
          className={`px-12 py-4 rounded-xl font-bold text-xl ${
            isSpinning
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500'
          }`}
        >
          {isSpinning ? 'Spinning...' : 'SPIN!'}
        </motion.button>
      ) : (
        <div className="bg-white/10 rounded-xl p-6">
          <p className="text-white/60 mb-2">Next spin available in:</p>
          <p className="text-3xl font-bold text-yellow-400">{timeUntilSpin}</p>
        </div>
      )}

      {/* Won Reward Display */}
      <AnimatePresence>
        {wonReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            onClick={() => setWonReward(null)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-center max-w-sm mx-4 border-4"
              style={{ borderColor: rarityColors[wonReward.rarity] }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: 3, duration: 0.5 }}
                className="text-7xl mb-4"
              >
                {wonReward.icon}
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
              <p className="text-white/60 mb-2">You won:</p>
              <div
                className="text-3xl font-bold mb-2"
                style={{ color: rarityColors[wonReward.rarity] }}
              >
                {wonReward.label}
              </div>
              <div className="text-sm text-white/50 capitalize mb-6">
                {wonReward.rarity} Reward
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setWonReward(null)}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold"
              >
                Collect!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rewards Preview */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Possible Rewards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {spinRewards.map(reward => (
            <div
              key={reward.id}
              className="bg-white/5 rounded-lg p-3 flex items-center gap-3"
              style={{ borderLeft: `4px solid ${rarityColors[reward.rarity]}` }}
            >
              <span className="text-2xl">{reward.icon}</span>
              <div className="text-left">
                <div className="text-sm font-medium">{reward.label}</div>
                <div className="text-xs text-white/40 capitalize">{reward.rarity}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
