import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { bossRushBosses, getTotalBossRushRewards } from '../data/bossRush'
import { cards as allCards } from '../data/cards'
import { ElementIcon } from '../components/ElementIcon'
import Card from '../components/Card'
import { Card as CardType, elementColors } from '../types'

type BossRushState = 'select' | 'battle' | 'victory' | 'defeat' | 'complete'

export default function BossRushPage() {
  const { collection, decks, addCoins, addDust, addXp, incrementStat, recordBattleResult, updateMissionProgress } = useGameStore()

  const [gameState, setGameState] = useState<BossRushState>('select')
  const [currentBossIndex, setCurrentBossIndex] = useState(0)
  const [playerHP, setPlayerHP] = useState(100)
  const [maxPlayerHP] = useState(100)
  const [bossHP, setBossHP] = useState(0)
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [battleDeck, setBattleDeck] = useState<CardType[]>([])
  const [hand, setHand] = useState<CardType[]>([])
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const [turn, setTurn] = useState(1)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [earnedRewards, setEarnedRewards] = useState({ coins: 0, dust: 0, xp: 0 })
  const [showRewardPopup, setShowRewardPopup] = useState(false)

  const currentBoss = bossRushBosses[currentBossIndex]
  const totalRewards = getTotalBossRushRewards()

  // Get owned cards for deck
  const ownedCards = useMemo(() => {
    return allCards.filter(card => {
      const owned = collection[card.id]
      return owned && owned.quantity > 0
    })
  }, [collection])

  // Start boss rush with selected deck
  const startBossRush = () => {
    if (!selectedDeckId) return

    const deck = decks.find(d => d.id === selectedDeckId)
    if (!deck) return

    const deckCards = deck.cards
      .map((id: string) => ownedCards.find(c => c.id === id))
      .filter((c): c is CardType => c !== undefined)

    if (deckCards.length < 10) {
      alert('Deck must have at least 10 cards!')
      return
    }

    // Shuffle deck
    const shuffled = [...deckCards].sort(() => Math.random() - 0.5)
    setBattleDeck(shuffled.slice(5))
    setHand(shuffled.slice(0, 5))
    setActiveCard(null)
    setPlayerHP(100)
    setBossHP(currentBoss.hp)
    setCurrentBossIndex(0)
    setTurn(1)
    setBattleLog([`Boss Rush begins! Face ${bossRushBosses.length} bosses!`])
    setEarnedRewards({ coins: 0, dust: 0, xp: 0 })
    setGameState('battle')
    setIsPlayerTurn(true)
  }

  // Draw a card
  const drawCard = () => {
    if (battleDeck.length === 0 || hand.length >= 7) return
    const [drawn, ...rest] = battleDeck
    setHand([...hand, drawn])
    setBattleDeck(rest)
  }

  // Play card from hand to active
  const playCard = (card: CardType) => {
    if (!isPlayerTurn) return
    if (card.type !== 'creature') return

    setActiveCard(card)
    setHand(hand.filter(c => c.id !== card.id))
    setBattleLog(prev => [...prev, `You played ${card.name}!`])
  }

  // Attack boss
  const attackBoss = () => {
    if (!activeCard || !isPlayerTurn) return

    const attack = activeCard.attacks?.[0]
    if (!attack) return

    const damage = attack.damage
    const newBossHP = Math.max(0, bossHP - damage)
    setBossHP(newBossHP)
    setBattleLog(prev => [...prev, `${activeCard.name} deals ${damage} damage to ${currentBoss.name}!`])

    if (newBossHP <= 0) {
      // Boss defeated
      handleBossDefeated()
    } else {
      // Boss turn
      setIsPlayerTurn(false)
    }
  }

  // Handle boss defeated
  const handleBossDefeated = () => {
    const rewards = currentBoss.rewards
    setEarnedRewards(prev => ({
      coins: prev.coins + rewards.coins,
      dust: prev.dust + rewards.dust,
      xp: prev.xp + rewards.xp
    }))

    addCoins(rewards.coins)
    addDust(rewards.dust)
    addXp(rewards.xp)

    // Update battle stats
    incrementStat('battlesWon')
    incrementStat('battlesPlayed')
    recordBattleResult(true)
    updateMissionProgress('battle_win', 1)

    setShowRewardPopup(true)
    setBattleLog(prev => [...prev, `${currentBoss.name} defeated! Earned ${rewards.coins} coins, ${rewards.dust} dust, ${rewards.xp} XP!`])
  }

  // Continue to next boss
  const continueToNextBoss = () => {
    setShowRewardPopup(false)

    if (currentBossIndex >= bossRushBosses.length - 1) {
      // All bosses defeated!
      setGameState('complete')
    } else {
      // Next boss
      const nextIndex = currentBossIndex + 1
      setCurrentBossIndex(nextIndex)
      setBossHP(bossRushBosses[nextIndex].hp)
      setTurn(1)
      setIsPlayerTurn(true)
      setBattleLog(prev => [...prev, `--- Next Boss: ${bossRushBosses[nextIndex].name} ---`])

      // Draw a card as reward for beating boss
      drawCard()
    }
  }

  // Boss attacks
  useEffect(() => {
    if (isPlayerTurn || gameState !== 'battle' || bossHP <= 0) return

    const timeout = setTimeout(() => {
      // Boss attack
      let damage = currentBoss.attackPower

      // Apply special ability effects
      if (currentBoss.id === 'boss_1') {
        // Goblin Chief steals coins
        setBattleLog(prev => [...prev, `${currentBoss.name} steals 10 coins!`])
      } else if (currentBoss.id === 'boss_2') {
        // Flame Wraith burn
        damage += 15
        setBattleLog(prev => [...prev, `${currentBoss.name}'s burn deals extra damage!`])
      } else if (currentBoss.id === 'boss_6') {
        // Nature Titan regenerates
        setBossHP(prev => Math.min(currentBoss.hp, prev + 30))
        setBattleLog(prev => [...prev, `${currentBoss.name} regenerates 30 HP!`])
      }

      if (activeCard) {
        // Damage goes to active card first
        const cardHP = activeCard.hp || 0
        if (damage >= cardHP) {
          setBattleLog(prev => [...prev, `${currentBoss.name} destroys ${activeCard.name}!`])
          setActiveCard(null)
          const overflow = damage - cardHP
          if (overflow > 0) {
            setPlayerHP(prev => Math.max(0, prev - overflow))
            setBattleLog(prev => [...prev, `Overflow damage: ${overflow} to you!`])
          }
        } else {
          // Card takes damage (simplified - just show message)
          setBattleLog(prev => [...prev, `${currentBoss.name} attacks ${activeCard.name} for ${damage}!`])
        }
      } else {
        // Direct damage to player
        setPlayerHP(prev => Math.max(0, prev - damage))
        setBattleLog(prev => [...prev, `${currentBoss.name} attacks you for ${damage}!`])
      }

      setTurn(prev => prev + 1)
      setIsPlayerTurn(true)
    }, 1500)

    return () => clearTimeout(timeout)
  }, [isPlayerTurn, gameState, bossHP, currentBoss, activeCard])

  // Check for player defeat
  useEffect(() => {
    if (playerHP <= 0 && gameState === 'battle') {
      setGameState('defeat')
      setBattleLog(prev => [...prev, 'You have been defeated!'])
      // Track the loss
      incrementStat('battlesPlayed')
      recordBattleResult(false)
    }
  }, [playerHP, gameState])

  // Reset for new run
  const resetRun = () => {
    setGameState('select')
    setCurrentBossIndex(0)
    setPlayerHP(100)
    setBossHP(0)
    setHand([])
    setBattleDeck([])
    setActiveCard(null)
    setTurn(1)
    setBattleLog([])
    setEarnedRewards({ coins: 0, dust: 0, xp: 0 })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <span className="text-5xl">&#128081;</span>
          Boss Rush
        </h1>
        <p className="text-white/60">
          Fight through {bossRushBosses.length} increasingly powerful bosses. Your HP persists between fights!
        </p>
      </motion.div>

      {/* Deck Selection */}
      {gameState === 'select' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Boss Preview */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Bosses to Face</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {bossRushBosses.map((boss) => (
                <div
                  key={boss.id}
                  className="bg-black/30 rounded-lg p-3 text-center"
                  style={{ borderLeft: `3px solid ${elementColors[boss.element]}` }}
                >
                  <div className="text-2xl mb-1">
                    <ElementIcon element={boss.element} size={32} />
                  </div>
                  <div className="font-bold text-sm">{boss.name}</div>
                  <div className="text-xs text-white/50">{boss.title}</div>
                  <div className="text-xs text-red-400 mt-1">HP: {boss.hp}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Rewards */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-purple-500/20 rounded-xl p-4">
            <h3 className="font-bold mb-2">Total Possible Rewards</h3>
            <div className="flex gap-6">
              <span className="text-yellow-400">&#129689; {totalRewards.coins} Coins</span>
              <span className="text-purple-400">&#10024; {totalRewards.dust} Dust</span>
              <span className="text-green-400">&#11088; {totalRewards.xp} XP</span>
            </div>
          </div>

          {/* Deck Selection */}
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Select Your Deck</h2>
            {decks.length === 0 ? (
              <p className="text-white/50">No decks available. Create a deck first!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {decks.map(deck => (
                  <button
                    key={deck.id}
                    onClick={() => setSelectedDeckId(deck.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedDeckId === deck.id
                        ? 'bg-purple-500/30 ring-2 ring-purple-400'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold">{deck.name}</div>
                    <div className="text-sm text-white/50">{deck.cards.length} cards</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={startBossRush}
            disabled={!selectedDeckId}
            className={`w-full py-4 rounded-xl font-bold text-xl ${
              selectedDeckId
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            Start Boss Rush!
          </button>
        </motion.div>
      )}

      {/* Battle State */}
      {gameState === 'battle' && (
        <div className="space-y-4">
          {/* Boss Area */}
          <div
            className="bg-gradient-to-b from-red-900/30 to-black/30 rounded-xl p-4"
            style={{ borderColor: elementColors[currentBoss.element], borderWidth: 2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ElementIcon element={currentBoss.element} size={28} />
                  {currentBoss.name}
                </h2>
                <p className="text-white/60 text-sm">{currentBoss.title}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60">Boss {currentBossIndex + 1}/{bossRushBosses.length}</div>
                <div className="text-red-400 font-bold">ATK: {currentBoss.attackPower}</div>
              </div>
            </div>

            {/* Boss HP Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>HP</span>
                <span>{bossHP} / {currentBoss.hp}</span>
              </div>
              <div className="h-4 bg-black/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(bossHP / currentBoss.hp) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-sm text-yellow-400/80 italic">
              Special: {currentBoss.specialAbility}
            </div>
          </div>

          {/* Turn Indicator */}
          <div className="text-center">
            <span className={`px-4 py-2 rounded-full font-bold ${
              isPlayerTurn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isPlayerTurn ? 'Your Turn' : 'Boss Turn'}
            </span>
            <span className="ml-4 text-white/50">Turn {turn}</span>
          </div>

          {/* Player Area */}
          <div className="bg-white/5 rounded-xl p-4">
            {/* Player HP */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Your HP</span>
                <span>{playerHP} / {maxPlayerHP}</span>
              </div>
              <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400"
                  animate={{ width: `${(playerHP / maxPlayerHP) * 100}%` }}
                />
              </div>
            </div>

            {/* Active Card */}
            <div className="mb-4">
              <h3 className="text-sm font-bold mb-2">Active Card</h3>
              <div className="flex justify-center">
                {activeCard ? (
                  <div className="relative">
                    <Card card={activeCard} size="md" />
                    {isPlayerTurn && (
                      <button
                        onClick={attackBoss}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 hover:bg-red-400 rounded-lg text-sm font-bold whitespace-nowrap"
                      >
                        Attack!
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-44 h-64 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/40">
                    Play a creature
                  </div>
                )}
              </div>
            </div>

            {/* Hand */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold">Hand ({hand.length}/7)</h3>
                <button
                  onClick={drawCard}
                  disabled={battleDeck.length === 0 || hand.length >= 7}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-sm disabled:opacity-50"
                >
                  Draw ({battleDeck.length} left)
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {hand.map((card, i) => (
                  <div key={`${card.id}-${i}`} className="flex-shrink-0">
                    <Card
                      card={card}
                      size="sm"
                      onClick={() => playCard(card)}
                      isPlayable={isPlayerTurn && card.type === 'creature' && !activeCard}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Battle Log */}
          <div className="bg-black/30 rounded-xl p-4 max-h-32 overflow-y-auto">
            <h3 className="text-sm font-bold mb-2">Battle Log</h3>
            <div className="space-y-1 text-sm">
              {battleLog.slice(-5).map((log, i) => (
                <div key={i} className="text-white/70">{log}</div>
              ))}
            </div>
          </div>

          {/* Rewards Earned */}
          <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
            <span className="text-white/60">Rewards Earned:</span>
            <div className="flex gap-4">
              <span className="text-yellow-400">&#129689; {earnedRewards.coins}</span>
              <span className="text-purple-400">&#10024; {earnedRewards.dust}</span>
              <span className="text-green-400">&#11088; {earnedRewards.xp}</span>
            </div>
          </div>
        </div>
      )}

      {/* Boss Defeated Popup */}
      <AnimatePresence>
        {showRewardPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-center max-w-md mx-4"
            >
              <div className="text-6xl mb-4">&#127942;</div>
              <h2 className="text-3xl font-bold mb-2">Boss Defeated!</h2>
              <p className="text-white/60 mb-4">{currentBoss.name} has fallen!</p>

              <div className="bg-black/30 rounded-xl p-4 mb-6">
                <h3 className="font-bold mb-2">Rewards</h3>
                <div className="flex justify-center gap-6">
                  <span className="text-yellow-400">&#129689; {currentBoss.rewards.coins}</span>
                  <span className="text-purple-400">&#10024; {currentBoss.rewards.dust}</span>
                  <span className="text-green-400">&#11088; {currentBoss.rewards.xp}</span>
                </div>
              </div>

              <button
                onClick={continueToNextBoss}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold"
              >
                {currentBossIndex >= bossRushBosses.length - 1 ? 'Complete!' : 'Next Boss'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Defeat State */}
      {gameState === 'defeat' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-8xl mb-6">&#128128;</div>
          <h2 className="text-4xl font-bold mb-4 text-red-400">Defeated!</h2>
          <p className="text-white/60 mb-4">
            You were defeated by {currentBoss.name} at boss {currentBossIndex + 1}/{bossRushBosses.length}
          </p>

          <div className="bg-white/5 rounded-xl p-6 max-w-md mx-auto mb-6">
            <h3 className="font-bold mb-2">Total Rewards Earned</h3>
            <div className="flex justify-center gap-6">
              <span className="text-yellow-400">&#129689; {earnedRewards.coins}</span>
              <span className="text-purple-400">&#10024; {earnedRewards.dust}</span>
              <span className="text-green-400">&#11088; {earnedRewards.xp}</span>
            </div>
          </div>

          <button
            onClick={resetRun}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl font-bold"
          >
            Try Again
          </button>
        </motion.div>
      )}

      {/* Complete State */}
      {gameState === 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-8xl mb-6"
          >
            &#127942;
          </motion.div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Boss Rush Complete!
          </h2>
          <p className="text-white/60 mb-6">
            You defeated all {bossRushBosses.length} bosses!
          </p>

          <div className="bg-gradient-to-r from-yellow-500/20 to-purple-500/20 rounded-xl p-6 max-w-md mx-auto mb-6">
            <h3 className="font-bold mb-4 text-xl">Total Rewards</h3>
            <div className="flex justify-center gap-8 text-lg">
              <span className="text-yellow-400">&#129689; {earnedRewards.coins}</span>
              <span className="text-purple-400">&#10024; {earnedRewards.dust}</span>
              <span className="text-green-400">&#11088; {earnedRewards.xp}</span>
            </div>
          </div>

          <button
            onClick={resetRun}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl font-bold"
          >
            Play Again
          </button>
        </motion.div>
      )}
    </div>
  )
}
