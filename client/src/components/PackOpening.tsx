import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCardById } from '../data/cards'
import Card from './Card'

interface PackOpeningProps {
  packType: {
    id: string
    name: string
    color: string
    icon: string
  }
  cardIds: string[]
  onClose: () => void
}

export default function PackOpening({ packType, cardIds, onClose }: PackOpeningProps) {
  const [stage, setStage] = useState<'pack' | 'opening' | 'reveal'>('pack')
  const [revealedIndex, setRevealedIndex] = useState(-1)
  const [allRevealed, setAllRevealed] = useState(false)

  const cards = cardIds.map(id => getCardById(id)).filter(Boolean)

  useEffect(() => {
    if (stage === 'reveal' && revealedIndex < cards.length - 1) {
      const timer = setTimeout(() => {
        setRevealedIndex(prev => prev + 1)
      }, 600)
      return () => clearTimeout(timer)
    } else if (stage === 'reveal' && revealedIndex === cards.length - 1) {
      setTimeout(() => setAllRevealed(true), 500)
    }
  }, [stage, revealedIndex, cards.length])

  const handlePackClick = () => {
    if (stage === 'pack') {
      setStage('opening')
      setTimeout(() => {
        setStage('reveal')
        setRevealedIndex(0)
      }, 1000)
    }
  }

  const hasRare = cards.some(c => c && ['rare', 'epic', 'legendary'].includes(c.rarity))
  const hasLegendary = cards.some(c => c?.rarity === 'legendary')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        {/* Pack Stage */}
        {stage === 'pack' && (
          <motion.div
            key="pack"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
            onClick={handlePackClick}
            className={`
              w-64 h-80 rounded-2xl cursor-pointer
              bg-gradient-to-br ${packType.color}
              flex flex-col items-center justify-center
              hover:scale-105 transition-transform
              shadow-2xl
            `}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-8xl mb-4"
            >
              {packType.icon}
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">{packType.name}</h3>
            <p className="text-white/70">Click to open!</p>

            {/* Sparkle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  initial={{
                    x: Math.random() * 256,
                    y: Math.random() * 320,
                    opacity: 0
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Opening Stage */}
        {stage === 'opening' && (
          <motion.div
            key="opening"
            className="relative"
          >
            <motion.div
              animate={{
                scale: [1, 1.5, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 1 }}
              className="w-64 h-80 rounded-2xl bg-white flex items-center justify-center"
            >
              <span className="text-6xl">✨</span>
            </motion.div>

            {/* Explosion particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  background: hasLegendary ? '#f59e0b' : hasRare ? '#3b82f6' : '#9ca3af',
                  left: '50%',
                  top: '50%'
                }}
                initial={{ x: 0, y: 0, scale: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  scale: 0,
                  opacity: [1, 0]
                }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            ))}
          </motion.div>
        )}

        {/* Reveal Stage */}
        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            {/* Cards */}
            <div className="flex gap-4 mb-8 flex-wrap justify-center max-w-4xl">
              {cards.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ rotateY: 180, scale: 0 }}
                  animate={
                    index <= revealedIndex
                      ? { rotateY: 0, scale: 1 }
                      : { rotateY: 180, scale: 0.8 }
                  }
                  transition={{
                    type: 'spring',
                    duration: 0.6,
                    delay: index === revealedIndex ? 0 : 0
                  }}
                  style={{ perspective: 1000 }}
                >
                  {card && (
                    <div className="relative">
                      <Card card={card} size="lg" />

                      {/* Special effects for rare+ cards */}
                      {index <= revealedIndex && card.rarity === 'legendary' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 pointer-events-none"
                        >
                          {/* Golden particles */}
                          {[...Array(15)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                              style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`
                              }}
                              animate={{
                                y: [0, -50],
                                opacity: [1, 0],
                                scale: [1, 0]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                delay: Math.random() * 1.5
                              }}
                            />
                          ))}
                        </motion.div>
                      )}

                      {/* New badge */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full"
                      >
                        NEW!
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Close button */}
            {allRevealed && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onClose}
                className="px-8 py-3 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-white/90 transition-colors"
              >
                Collect Cards
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
