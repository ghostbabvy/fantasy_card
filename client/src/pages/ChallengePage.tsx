import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import { useBattleStore } from '../stores/battleStore'
import { challengeLevels, getChallengeLevel, getReplayRewards } from '../data/challengeLevels'
import { getCardById, cards, bossExclusiveCards } from '../data/cards'
import BattleArena from '../components/Battle/BattleArena'
import Card from '../components/Card'

const DECK_SIZE = 20

export default function ChallengePage() {
  const navigate = useNavigate()
  const { collection, decks, challengeProgress, completeChallengeLevel, addCard, incrementStat, recordBattleResult, updateMissionProgress } = useGameStore()
  const { isInBattle, startChallengeBattle, winner, challengeLevel, endBattle, battleStars, isOver } = useBattleStore()

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [showVictory, setShowVictory] = useState(false)
  const [earnedStars, setEarnedStars] = useState(0)
  const [rewardsProcessed, setRewardsProcessed] = useState(false)

  // Filter to valid decks
  const validDecks = useMemo(() => {
    return decks.filter(deck =>
      deck &&
      deck.cards &&
      Array.isArray(deck.cards) &&
      deck.cards.length === DECK_SIZE &&
      deck.cards.every(cardId => getCardById(cardId))
    )
  }, [decks])

  // Get owned cards for auto-build
  const ownedCards = cards.filter(card => {
    const owned = collection[card.id]
    return owned && owned.quantity > 0
  })

  // Auto-build deck function
  const autoBuildDeck = (): string[] => {
    const newDeck: string[] = []
    const rarityScores = { legendary: 100, epic: 80, rare: 60, uncommon: 40, common: 20 }

    const scoredCards = ownedCards.map(card => ({
      card,
      score: rarityScores[card.rarity] + (card.type === 'creature' ? 20 : 0),
      owned: collection[card.id]?.quantity || 0
    })).sort((a, b) => b.score - a.score)

    for (const { card, owned } of scoredCards) {
      if (newDeck.length >= DECK_SIZE) break
      const maxCopies = Math.min(2, owned)
      while (newDeck.filter(id => id === card.id).length < maxCopies && newDeck.length < DECK_SIZE) {
        newDeck.push(card.id)
      }
    }

    return newDeck
  }

  const handleStartChallenge = (level: number) => {
    const levelConfig = getChallengeLevel(level)
    if (!levelConfig) return

    let deckCards: string[]
    if (selectedDeckId) {
      const deck = validDecks.find(d => d.id === selectedDeckId)
      if (!deck) return
      deckCards = [...deck.cards]
    } else {
      // Auto-build
      deckCards = autoBuildDeck()
      if (deckCards.length < DECK_SIZE) {
        alert('You need at least 20 cards to play! Open more packs.')
        return
      }
    }

    startChallengeBattle(deckCards, levelConfig)
    setSelectedLevel(null)
    setSelectedDeckId(null)
    setRewardsProcessed(false)
  }

  // Handle battle end and rewards
  useEffect(() => {
    // When battle is over and there's a winner, handle rewards
    // Use isOver (not !isInBattle) to catch the win before endBattle clears state
    if (isOver && winner && challengeLevel && !rewardsProcessed) {
      // Update battle stats
      incrementStat('battlesPlayed')
      if (winner === 'player') {
        incrementStat('battlesWon')
        recordBattleResult(true)
        updateMissionProgress('battle_win', 1)

        const isReplay = challengeProgress.completedLevels.includes(challengeLevel.level)
        const rewards = isReplay ? getReplayRewards(challengeLevel) : challengeLevel.rewards

        // Award rewards with stars
        const stars = battleStars || 1
        completeChallengeLevel(challengeLevel.level, isReplay, rewards, stars)
        setEarnedStars(stars)

        // Add exclusive card to collection if not replay and has exclusive
        if (!isReplay && rewards.exclusiveCard) {
          const bossCard = bossExclusiveCards.find(c => c.id === rewards.exclusiveCard)
          if (bossCard) {
            addCard(bossCard.id)
          }
        }

        setRewardsProcessed(true)
        setShowVictory(true)
      } else {
        recordBattleResult(false)
      }
      endBattle()
    }
  }, [isOver, winner, challengeLevel, battleStars, rewardsProcessed])

  // If in battle, show arena
  if (isInBattle) {
    return <BattleArena />
  }

  // Show victory screen after winning
  if (showVictory && challengeLevel) {
    const isReplay = challengeProgress.completedLevels.includes(challengeLevel.level) &&
      challengeProgress.completedLevels.filter(l => l === challengeLevel.level).length > 1
    const rewards = isReplay ? getReplayRewards(challengeLevel) : challengeLevel.rewards
    const bossCard = challengeLevel.isBoss && rewards.exclusiveCard
      ? bossExclusiveCards.find(c => c.id === rewards.exclusiveCard)
      : null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="text-center max-w-xl"
        >
          {challengeLevel.isBoss ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="text-8xl mb-4"
              >
                {challengeLevel.level === 50 ? '👑' : '🏆'}
              </motion.div>
              <h1 className="text-4xl font-bold text-yellow-400 mb-2">
                {challengeLevel.level === 50 ? 'CHAMPION!' : 'BOSS DEFEATED!'}
              </h1>
              <p className="text-xl text-white/80 mb-2">{challengeLevel.bossName} has fallen!</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">⚔️</div>
              <h1 className="text-3xl font-bold text-green-400 mb-2">Victory!</h1>
              <p className="text-lg text-white/70 mb-2">Challenge {challengeLevel.level} Complete</p>
            </>
          )}

          {/* Stars earned */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
            className="flex justify-center mb-6"
          >
            <img
              src={`/stars-${earnedStars}.png`}
              alt={`${earnedStars} stars`}
              className="w-32 h-16 object-contain"
            />
          </motion.div>

          {/* Rewards */}
          <div className="bg-white/10 rounded-xl p-6 mb-6">
            <h2 className="font-bold mb-4 text-lg">
              {isReplay ? 'Replay Rewards (25%)' : 'Rewards'}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {rewards.coins > 0 && (
                <div className="bg-yellow-500/30 px-4 py-2 rounded-lg">
                  🪙 +{rewards.coins} Coins
                </div>
              )}
              {rewards.dust > 0 && (
                <div className="bg-purple-500/30 px-4 py-2 rounded-lg">
                  ✨ +{rewards.dust} Dust
                </div>
              )}
              {rewards.xp > 0 && (
                <div className="bg-blue-500/30 px-4 py-2 rounded-lg">
                  ⭐ +{rewards.xp} XP
                </div>
              )}
              {rewards.pack && !isReplay && (
                <div className="bg-green-500/30 px-4 py-2 rounded-lg">
                  📦 {rewards.pack.charAt(0).toUpperCase() + rewards.pack.slice(1)} Pack
                </div>
              )}
            </div>

            {/* Boss exclusive card */}
            {bossCard && !isReplay && (
              <div className="mt-6">
                <h3 className="font-bold text-yellow-400 mb-3">Exclusive Card Earned!</h3>
                <div className="flex justify-center">
                  <div className="w-32">
                    <Card card={bossCard as any} size="sm" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowVictory(false)}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-lg"
          >
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  const currentLevel = challengeProgress.highestLevel + 1
  const selectedLevelData = selectedLevel ? getChallengeLevel(selectedLevel) : null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Jump Up Challenge</h1>
        <button
          onClick={() => navigate('/battle')}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          Back to Battle
        </button>
      </div>

      {/* Progress Banner */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-4 mb-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/60">Current Progress</div>
            <div className="text-2xl font-bold">
              Level {challengeProgress.highestLevel} / 50
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/60">Boss Cards Earned</div>
            <div className="text-xl font-bold text-yellow-400">
              {challengeProgress.bossCardsOwned.length} / 5
            </div>
          </div>
        </div>
        <div className="mt-3 bg-black/30 rounded-full h-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(challengeProgress.highestLevel / 50) * 100}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          />
        </div>
      </div>

      {/* Tiered Level Layout - Hardest at top, easiest at bottom */}
      <div className="space-y-3 mb-6">
        {/* Define tiers from hardest to easiest */}
        {[
          { name: 'Master', levels: [41, 42, 43, 44, 45, 46, 47, 48, 49], boss: 50, color: 'amber', bgColor: 'bg-amber-400/40 hover:bg-amber-400/60', lockedColor: 'bg-amber-500/30', borderColor: 'border-amber-500/50' },
          { name: 'Expert', levels: [31, 32, 33, 34, 35, 36, 37, 38, 39], boss: 40, color: 'rose', bgColor: 'bg-rose-400/40 hover:bg-rose-400/60', lockedColor: 'bg-rose-500/30', borderColor: 'border-rose-500/50' },
          { name: 'Advanced', levels: [21, 22, 23, 24, 25, 26, 27, 28, 29], boss: 30, color: 'violet', bgColor: 'bg-violet-400/40 hover:bg-violet-400/60', lockedColor: 'bg-violet-500/30', borderColor: 'border-violet-500/50' },
          { name: 'Intermediate', levels: [11, 12, 13, 14, 15, 16, 17, 18, 19], boss: 20, color: 'sky', bgColor: 'bg-sky-400/40 hover:bg-sky-400/60', lockedColor: 'bg-sky-500/30', borderColor: 'border-sky-500/50' },
          { name: 'Beginner', levels: [1, 2, 3, 4, 5, 6, 7, 8, 9], boss: 10, color: 'slate', bgColor: 'bg-slate-400/40 hover:bg-slate-400/60', lockedColor: 'bg-slate-500/30', borderColor: 'border-slate-500/50' },
        ].map(tier => (
          <div key={tier.name} className={`bg-white/5 rounded-xl p-3 border ${tier.borderColor}`}>
            {/* Tier Header */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold text-${tier.color}-300`}>{tier.name}</span>
              <span className="text-xs text-white/50">Levels {tier.levels[0]}-{tier.boss}</span>
            </div>

            {/* Level buttons row */}
            <div className="flex gap-2 items-center">
              {/* Regular levels */}
              {tier.levels.map(levelNum => {
                const level = challengeLevels.find(l => l.level === levelNum)
                if (!level) return null
                const isCompleted = challengeProgress.completedLevels.includes(levelNum)
                const isLocked = levelNum > currentLevel
                const isCurrent = levelNum === currentLevel

                const stars = challengeProgress.levelStars[levelNum] || 0

                return (
                  <motion.button
                    key={levelNum}
                    whileHover={!isLocked ? { scale: 1.1 } : undefined}
                    whileTap={!isLocked ? { scale: 0.95 } : undefined}
                    onClick={() => !isLocked && setSelectedLevel(levelNum)}
                    disabled={isLocked}
                    className={`relative w-14 h-20 rounded-lg font-bold text-sm flex flex-col items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-600/80'
                        : isLocked
                          ? `${tier.lockedColor} opacity-50`
                          : isCurrent
                            ? `${tier.bgColor} ring-2 ring-white`
                            : tier.bgColor
                    }`}
                  >
                    {isCompleted && (
                      <img
                        src={`/stars-${stars}.png`}
                        alt={`${stars} stars`}
                        className="w-14 h-7 object-contain"
                      />
                    )}
                    <span className={isCompleted ? 'mt-0.5' : ''}>{levelNum}</span>
                  </motion.button>
                )
              })}

              {/* Connector line */}
              <div className="flex-1 h-0.5 bg-white/20 mx-1" />

              {/* Boss button */}
              {(() => {
                const bossLevel = challengeLevels.find(l => l.level === tier.boss)
                if (!bossLevel) return null
                const isCompleted = challengeProgress.completedLevels.includes(tier.boss)
                const isLocked = tier.boss > currentLevel
                const bossStars = challengeProgress.levelStars[tier.boss] || 0

                return (
                  <motion.button
                    whileHover={!isLocked ? { scale: 1.1 } : undefined}
                    whileTap={!isLocked ? { scale: 0.95 } : undefined}
                    onClick={() => !isLocked && setSelectedLevel(tier.boss)}
                    disabled={isLocked}
                    className={`relative w-16 h-20 rounded-xl font-bold flex flex-col items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-gradient-to-br from-green-700 to-green-900 ring-2 ring-yellow-300'
                        : isLocked
                          ? 'bg-gradient-to-br from-green-800 to-green-950 opacity-60'
                          : 'bg-gradient-to-br from-green-700 to-green-900 ring-2 ring-green-400 animate-pulse'
                    }`}
                  >
                    {isCompleted && (
                      <img
                        src={`/stars-${bossStars}.png`}
                        alt={`${bossStars} stars`}
                        className="w-14 h-7 object-contain"
                      />
                    )}
                    <img
                      src="/boss-icon.png"
                      alt="Boss"
                      className={`w-10 h-10 object-contain ${isCompleted ? 'drop-shadow-[0_0_6px_gold]' : ''}`}
                    />
                  </motion.button>
                )
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Level Selection Modal */}
      <AnimatePresence>
        {selectedLevel && selectedLevelData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLevel(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`bg-gray-900 rounded-2xl p-6 max-w-md w-full border-2 ${
                selectedLevelData.isBoss ? 'border-green-600' : 'border-white/20'
              }`}
            >
              {/* Header */}
              <div className="text-center mb-6">
                {selectedLevelData.isBoss && (
                  <div className="w-20 h-20 mx-auto mb-2 bg-gradient-to-br from-green-700 to-green-900 rounded-xl flex items-center justify-center">
                    <img src="/boss-icon.png" alt="Boss" className="w-16 h-16 object-contain" />
                  </div>
                )}
                <h2 className="text-2xl font-bold">
                  {selectedLevelData.isBoss ? selectedLevelData.bossName : `Challenge ${selectedLevel}`}
                </h2>
                {selectedLevelData.isBoss && (
                  <p className="text-green-400 text-sm">{selectedLevelData.bossTitle}</p>
                )}
                <p className="text-white/60 mt-2">{selectedLevelData.description}</p>
              </div>

              {/* Difficulty Info */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <h3 className="font-bold mb-2">Difficulty</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-white/60">AI Strength:</div>
                  <div>{Math.round(selectedLevelData.aiDamageModifier * 100)}%</div>
                  <div className="text-white/60">Your HP Bonus:</div>
                  <div className={selectedLevelData.playerHpBonus >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {selectedLevelData.playerHpBonus >= 0 ? '+' : ''}{selectedLevelData.playerHpBonus}
                  </div>
                  <div className="text-white/60">KOs to Win:</div>
                  <div>{selectedLevelData.knockoutsToWin}</div>
                </div>
              </div>

              {/* Rewards */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <h3 className="font-bold mb-2">
                  {challengeProgress.completedLevels.includes(selectedLevel) ? 'Replay Rewards (25%)' : 'Rewards'}
                </h3>
                {(() => {
                  const isReplay = challengeProgress.completedLevels.includes(selectedLevel)
                  const rewards = isReplay ? getReplayRewards(selectedLevelData) : selectedLevelData.rewards
                  return (
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="bg-yellow-500/30 px-2 py-1 rounded">🪙 {rewards.coins}</span>
                      {rewards.dust > 0 && <span className="bg-purple-500/30 px-2 py-1 rounded">✨ {rewards.dust}</span>}
                      <span className="bg-blue-500/30 px-2 py-1 rounded">⭐ {rewards.xp}</span>
                      {rewards.pack && !isReplay && (
                        <span className="bg-green-500/30 px-2 py-1 rounded">📦 {rewards.pack} pack</span>
                      )}
                      {rewards.exclusiveCard && !isReplay && (
                        <span className="bg-yellow-500/30 px-2 py-1 rounded">🌟 Exclusive Card!</span>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Deck Selection */}
              <div className="mb-6">
                <h3 className="font-bold mb-2">Select Deck</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedDeckId(null)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedDeckId === null
                        ? 'bg-blue-500/50 border-2 border-blue-400'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <div className="font-bold">Auto-Build Deck</div>
                    <div className="text-sm text-white/60">Use your best cards automatically</div>
                  </button>
                  {validDecks.map(deck => (
                    <button
                      key={deck.id}
                      onClick={() => setSelectedDeckId(deck.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedDeckId === deck.id
                          ? 'bg-blue-500/50 border-2 border-blue-400'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <div className="font-bold">{deck.name}</div>
                      <div className="text-sm text-white/60">{deck.cards.length} cards</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedLevel(null)}
                  className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStartChallenge(selectedLevel)}
                  disabled={ownedCards.length < DECK_SIZE && !selectedDeckId}
                  className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                    selectedLevelData.isBoss
                      ? 'bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                  }`}
                >
                  {selectedLevelData.isBoss ? '⚔️ Challenge Boss!' : '⚔️ Start Challenge'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
