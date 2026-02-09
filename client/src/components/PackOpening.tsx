import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCardById } from '../data/cards'
import { CardVariant } from '../stores/gameStore'
import Card from './Card'

interface PackOpeningProps {
  packType: {
    id: string
    name: string
    color: string
    icon: string
    image?: string
  }
  cards: Array<{ cardId: string; variant: CardVariant; isNew: boolean }>
  onClose: () => void
}

const variantLabels: Record<CardVariant, string> = {
  normal: '',
  holo: 'HOLO',
  fullart: 'FULL ART',
  secret: 'SECRET RARE'
}

const variantColors: Record<CardVariant, string> = {
  normal: '',
  holo: 'from-cyan-400 to-blue-500',
  fullart: 'from-purple-400 to-pink-500',
  secret: 'from-yellow-400 to-amber-500'
}

export default function PackOpening({ packType, cards, onClose }: PackOpeningProps) {
  const [stage, setStage] = useState<'pack' | 'opening' | 'reveal'>('pack')
  const [revealedIndex, setRevealedIndex] = useState(-1)
  const [allRevealed, setAllRevealed] = useState(false)

  const cardData = cards.map(c => ({
    ...c,
    card: getCardById(c.cardId)
  })).filter(c => c.card)

  // Check for special pulls
  const hasRare = cardData.some(c => c.card && ['mythical', 'legendary', 'celestial'].includes(c.card.rarity))
  const hasLegendary = cardData.some(c => c.card?.rarity === 'celestial')
  const hasSpecialVariant = cardData.some(c => c.variant !== 'normal')

  useEffect(() => {
    if (stage === 'reveal' && revealedIndex < cardData.length - 1) {
      const timer = setTimeout(() => {
        setRevealedIndex(prev => prev + 1)
      }, 800) // Slower reveal for suspense
      return () => clearTimeout(timer)
    } else if (stage === 'reveal' && revealedIndex === cardData.length - 1) {
      setTimeout(() => setAllRevealed(true), 600)
    }
  }, [stage, revealedIndex, cardData.length])

  const handlePackClick = () => {
    if (stage === 'pack') {
      setStage('opening')
      setTimeout(() => {
        setStage('reveal')
        setRevealedIndex(0)
      }, 1200)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        {/* Pack Stage */}
        {stage === 'pack' && (
          <motion.div
            key="pack"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0, rotate: 180 }}
            transition={{ type: 'spring', duration: 0.8 }}
            onClick={handlePackClick}
            className="cursor-pointer hover:scale-105 transition-transform relative"
          >
            {/* Pack Image or Fallback */}
            {packType.image ? (
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="relative"
              >
                <img
                  src={packType.image}
                  alt={packType.name}
                  className="w-72 h-auto rounded-2xl shadow-2xl"
                />

                {/* Animated glow overlay */}
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-2xl"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />

                {/* Sparkle effects */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2 + Math.random(),
                        delay: Math.random() * 2
                      }}
                    />
                  ))}
                </div>

                {/* Shine sweep effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', repeatDelay: 1 }}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <div
                className={`
                  w-72 h-96 rounded-2xl
                  bg-gradient-to-br ${packType.color}
                  flex flex-col items-center justify-center
                  shadow-2xl relative overflow-hidden
                `}
              >
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="text-8xl mb-6"
                >
                  {packType.icon}
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">{packType.name}</h3>
              </div>
            )}

            {/* Tap to open text */}
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-white/80 text-center mt-4 text-lg font-bold"
            >
              Tap to open!
            </motion.p>
          </motion.div>
        )}

        {/* Opening Stage - Epic burst effect */}
        {stage === 'opening' && (
          <motion.div
            key="opening"
            className="relative flex items-center justify-center"
          >
            {/* Center explosion with pack image */}
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: [1, 1.5, 0], opacity: [1, 1, 0], rotateY: [0, 180, 360] }}
              transition={{ duration: 1.2 }}
              className="relative"
            >
              {packType.image ? (
                <img
                  src={packType.image}
                  alt={packType.name}
                  className="w-64 h-auto rounded-2xl"
                />
              ) : (
                <div className="w-64 h-80 rounded-2xl bg-white flex items-center justify-center">
                  <span className="text-8xl">{packType.icon}</span>
                </div>
              )}

              {/* Bright flash overlay */}
              <motion.div
                className="absolute inset-0 bg-white rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1] }}
                transition={{ duration: 0.8 }}
              />
            </motion.div>

            {/* Burst particles */}
            {[...Array(30)].map((_, i) => {
              const angle = (i / 30) * Math.PI * 2
              const distance = 200 + Math.random() * 100
              return (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 rounded-full"
                  style={{
                    background: hasLegendary
                      ? `hsl(${45 + Math.random() * 20}, 100%, 50%)`
                      : hasRare
                      ? `hsl(${200 + Math.random() * 40}, 100%, 50%)`
                      : `hsl(${Math.random() * 360}, 70%, 50%)`
                  }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                />
              )
            })}

            {/* Screen flash for legendary */}
            {hasLegendary && (
              <motion.div
                className="fixed inset-0 bg-yellow-400 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.5 }}
              />
            )}
          </motion.div>
        )}

        {/* Reveal Stage - Cards one by one */}
        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center max-w-5xl w-full px-4"
          >
            {/* Cards */}
            <div className="flex gap-4 mb-8 flex-wrap justify-center">
              {cardData.map((item, index) => {
                const isRevealed = index <= revealedIndex
                const isCurrentReveal = index === revealedIndex
                const { card, variant, isNew } = item

                return (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ rotateY: 180, scale: 0.5, opacity: 0 }}
                    animate={
                      isRevealed
                        ? {
                            rotateY: 0,
                            scale: isCurrentReveal ? 1.1 : 1,
                            opacity: 1
                          }
                        : { rotateY: 180, scale: 0.5, opacity: 0.3 }
                    }
                    transition={{
                      type: 'spring',
                      duration: 0.8,
                      bounce: 0.3
                    }}
                    style={{ perspective: 1000 }}
                  >
                    {card && (
                      <div className="relative">
                        {/* Card with variant effect overlay */}
                        <div className="relative">
                          <Card card={card} size="lg" />

                          {/* Holo shimmer effect */}
                          {variant === 'holo' && isRevealed && (
                            <motion.div
                              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                              />
                            </motion.div>
                          )}

                          {/* Full art rainbow effect */}
                          {variant === 'fullart' && isRevealed && (
                            <motion.div
                              className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.4 }}
                            >
                              <motion.div
                                className="absolute inset-0"
                                style={{
                                  background: 'linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ff0080)',
                                  backgroundSize: '400% 400%'
                                }}
                                animate={{
                                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                                }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                              />
                            </motion.div>
                          )}

                          {/* Secret rare golden glow */}
                          {variant === 'secret' && isRevealed && (
                            <>
                              <motion.div
                                className="absolute -inset-2 rounded-2xl pointer-events-none"
                                style={{
                                  background: 'linear-gradient(45deg, #ffd700, #ffaa00, #ffd700)',
                                  filter: 'blur(8px)'
                                }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              />
                              <motion.div
                                className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
                              >
                                {[...Array(10)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`
                                    }}
                                    animate={{
                                      y: [-20, -60],
                                      opacity: [1, 0],
                                      scale: [1, 0]
                                    }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 1 + Math.random(),
                                      delay: Math.random()
                                    }}
                                  />
                                ))}
                              </motion.div>
                            </>
                          )}

                          {/* Legendary card effects */}
                          {card.rarity === 'legendary' && isRevealed && (
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {[...Array(20)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                  style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`
                                  }}
                                  animate={{
                                    y: [0, -80],
                                    opacity: [1, 0],
                                    scale: [1, 0]
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    delay: Math.random() * 2
                                  }}
                                />
                              ))}
                            </motion.div>
                          )}
                        </div>

                        {/* Variant badge */}
                        {variant !== 'normal' && isRevealed && (
                          <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className={`
                              absolute -top-3 -left-3 px-2 py-1 rounded-lg
                              bg-gradient-to-r ${variantColors[variant]}
                              text-white text-xs font-bold shadow-lg
                            `}
                          >
                            {variantLabels[variant]}
                          </motion.div>
                        )}

                        {/* New badge */}
                        {isNew && isRevealed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
                          >
                            NEW!
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Summary */}
            {allRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
              >
                {hasLegendary && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-2xl font-bold text-yellow-400 mb-2"
                  >
                    LEGENDARY PULL!
                  </motion.div>
                )}
                {hasSpecialVariant && !hasLegendary && (
                  <div className="text-xl font-bold text-purple-400 mb-2">
                    Special Variant Found!
                  </div>
                )}
              </motion.div>
            )}

            {/* Close button */}
            {allRevealed && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-10 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-xl shadow-lg"
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
