import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { cards as allCards } from '../data/cards'
import Card from '../components/Card'
import { Card as CardType, Rarity } from '../types'

type DraftState = 'intro' | 'drafting' | 'deckReview' | 'battle' | 'victory' | 'defeat'

const DRAFT_PICKS = 15 // Number of picks to make a deck
const CARDS_PER_PICK = 3 // Number of cards to choose from each pick

interface DraftBattleOpponent {
  name: string
  difficulty: number
  deck: CardType[]
}

export default function DraftModePage() {
  const { addCoins, addDust, incrementStat, recordBattleResult, updateMissionProgress } = useGameStore()

  const [gameState, setGameState] = useState<DraftState>('intro')
  const [pickNumber, setPickNumber] = useState(1)
  const [currentOptions, setCurrentOptions] = useState<CardType[]>([])
  const [draftedCards, setDraftedCards] = useState<CardType[]>([])
  const [availablePool, setAvailablePool] = useState<CardType[]>([])

  // Battle state
  const [opponent, setOpponent] = useState<DraftBattleOpponent | null>(null)
  const [playerHP, setPlayerHP] = useState(30)
  const [opponentHP, setOpponentHP] = useState(30)
  const [battleDeck, setBattleDeck] = useState<CardType[]>([])
  const [hand, setHand] = useState<CardType[]>([])
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const [opponentActiveCard, setOpponentActiveCard] = useState<CardType | null>(null)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [wins, setWins] = useState(0)

  // Get weighted random card from pool
  const getWeightedRandomCards = (pool: CardType[], count: number): CardType[] => {
    const weights: Record<Rarity, number> = {
      common: 50,
      uncommon: 30,
      rare: 15,
      epic: 4,
      legendary: 1
    }

    const selected: CardType[] = []
    const poolCopy = [...pool]

    for (let i = 0; i < count && poolCopy.length > 0; i++) {
      const totalWeight = poolCopy.reduce((sum, card) => sum + weights[card.rarity], 0)
      let random = Math.random() * totalWeight

      for (let j = 0; j < poolCopy.length; j++) {
        random -= weights[poolCopy[j].rarity]
        if (random <= 0) {
          selected.push(poolCopy[j])
          poolCopy.splice(j, 1)
          break
        }
      }
    }

    return selected
  }

  // Start draft
  const startDraft = () => {
    // Reset state
    const pool = [...allCards]
    setAvailablePool(pool)
    setDraftedCards([])
    setPickNumber(1)
    setWins(0)

    // Generate first options
    const options = getWeightedRandomCards(pool, CARDS_PER_PICK)
    setCurrentOptions(options)
    setAvailablePool(pool.filter(c => !options.includes(c)))

    setGameState('drafting')
  }

  // Pick a card
  const pickCard = (card: CardType) => {
    const newDrafted = [...draftedCards, card]
    setDraftedCards(newDrafted)

    // Remove picked card from pool permanently
    const newPool = availablePool.filter(c => c.id !== card.id)

    if (newDrafted.length >= DRAFT_PICKS) {
      // Done drafting
      setGameState('deckReview')
    } else {
      // Next pick
      setPickNumber(pickNumber + 1)
      const options = getWeightedRandomCards(newPool, CARDS_PER_PICK)
      setCurrentOptions(options)
      setAvailablePool(newPool.filter(c => !options.includes(c)))
    }
  }

  // Start battle with drafted deck
  const startBattle = () => {
    // Create opponent
    const opponentDeck = getWeightedRandomCards([...allCards], 15)
    const newOpponent: DraftBattleOpponent = {
      name: ['Goblin Trickster', 'Forest Sage', 'Stone Warden', 'Flame Dancer', 'Shadow Weaver'][Math.floor(Math.random() * 5)],
      difficulty: wins + 1,
      deck: opponentDeck
    }
    setOpponent(newOpponent)

    // Setup battle
    const shuffled = [...draftedCards].sort(() => Math.random() - 0.5)
    setBattleDeck(shuffled.slice(5))
    setHand(shuffled.slice(0, 5))
    setActiveCard(null)

    const opponentShuffled = [...opponentDeck].sort(() => Math.random() - 0.5)
    setOpponentActiveCard(opponentShuffled[0])

    setPlayerHP(30)
    setOpponentHP(30)
    setIsPlayerTurn(true)
    setBattleLog([`Battle ${wins + 1} begins! Face ${newOpponent.name}!`])

    setGameState('battle')
  }

  // Draw a card
  const drawCard = () => {
    if (battleDeck.length === 0 || hand.length >= 7) return
    const [drawn, ...rest] = battleDeck
    setHand([...hand, drawn])
    setBattleDeck(rest)
  }

  // Play card
  const playCard = (card: CardType) => {
    if (!isPlayerTurn || card.type !== 'creature') return
    setActiveCard(card)
    setHand(hand.filter(c => c.id !== card.id))
    setBattleLog(prev => [...prev, `You played ${card.name}!`])
  }

  // Attack opponent
  const attackOpponent = () => {
    if (!activeCard || !isPlayerTurn) return

    const attack = activeCard.attacks?.[0]
    if (!attack) return

    const damage = attack.damage
    const newOpponentHP = Math.max(0, opponentHP - damage)
    setOpponentHP(newOpponentHP)
    setBattleLog(prev => [...prev, `${activeCard.name} deals ${damage} damage!`])

    if (newOpponentHP <= 0) {
      // Won this battle
      const newWins = wins + 1
      setWins(newWins)

      // Rewards scale with wins
      const coinReward = 50 * newWins
      const dustReward = 10 * newWins
      addCoins(coinReward)
      addDust(dustReward)

      // Update battle stats
      incrementStat('battlesWon')
      incrementStat('battlesPlayed')
      recordBattleResult(true)
      updateMissionProgress('battle_win', 1)

      setBattleLog(prev => [...prev, `Victory! Earned ${coinReward} coins and ${dustReward} dust!`])

      if (newWins >= 3) {
        // Won draft run
        setGameState('victory')
      } else {
        // Continue to next battle after delay
        setTimeout(() => {
          startBattle()
        }, 2000)
      }
    } else {
      setIsPlayerTurn(false)
    }
  }

  // Opponent turn
  useEffect(() => {
    if (isPlayerTurn || gameState !== 'battle' || opponentHP <= 0) return

    const timeout = setTimeout(() => {
      if (opponentActiveCard) {
        const attack = opponentActiveCard.attacks?.[0]
        const damage = attack?.damage || 20

        if (activeCard) {
          const cardHP = activeCard.hp || 0
          if (damage >= cardHP) {
            setBattleLog(prev => [...prev, `${opponentActiveCard.name} destroys ${activeCard.name}!`])
            setActiveCard(null)
            const overflow = damage - cardHP
            if (overflow > 0) {
              setPlayerHP(prev => Math.max(0, prev - overflow))
            }
          } else {
            setBattleLog(prev => [...prev, `${opponentActiveCard.name} attacks for ${damage}!`])
          }
        } else {
          setPlayerHP(prev => Math.max(0, prev - damage))
          setBattleLog(prev => [...prev, `${opponentActiveCard.name} attacks you for ${damage}!`])
        }
      }

      setIsPlayerTurn(true)
    }, 1500)

    return () => clearTimeout(timeout)
  }, [isPlayerTurn, gameState, opponentHP, opponentActiveCard, activeCard])

  // Check for player defeat
  useEffect(() => {
    if (playerHP <= 0 && gameState === 'battle') {
      setGameState('defeat')
      // Track the loss
      incrementStat('battlesPlayed')
      recordBattleResult(false)
    }
  }, [playerHP, gameState])

  // Get card stats summary
  const getCardStats = () => {
    const stats = {
      creatures: draftedCards.filter(c => c.type === 'creature').length,
      spells: draftedCards.filter(c => c.type === 'spell').length,
      avgCost: draftedCards.length > 0
        ? (draftedCards.reduce((sum, c) => sum + c.cost, 0) / draftedCards.length).toFixed(1)
        : '0',
      rarities: {
        legendary: draftedCards.filter(c => c.rarity === 'legendary').length,
        epic: draftedCards.filter(c => c.rarity === 'epic').length,
        rare: draftedCards.filter(c => c.rarity === 'rare').length,
        uncommon: draftedCards.filter(c => c.rarity === 'uncommon').length,
        common: draftedCards.filter(c => c.rarity === 'common').length
      }
    }
    return stats
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <span className="text-5xl">&#127183;</span>
          Draft Mode
        </h1>
        <p className="text-white/60">
          Draft {DRAFT_PICKS} cards, then battle with your drafted deck!
        </p>
      </motion.div>

      {/* Intro State */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="bg-white/5 rounded-xl p-8 max-w-lg mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-4">How Draft Works</h2>
            <ul className="text-left space-y-3 text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-green-400">1.</span>
                Pick 1 card from 3 options, {DRAFT_PICKS} times
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">2.</span>
                Battle against 3 AI opponents with your drafted deck
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">3.</span>
                Earn rewards based on your wins!
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-purple-500/20 rounded-xl p-4 max-w-lg mx-auto mb-8">
            <h3 className="font-bold mb-2">Rewards</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-white/60">1 Win</div>
                <div className="text-yellow-400">50 Coins</div>
              </div>
              <div>
                <div className="text-white/60">2 Wins</div>
                <div className="text-yellow-400">150 Coins</div>
              </div>
              <div>
                <div className="text-white/60">3 Wins</div>
                <div className="text-yellow-400">300 Coins</div>
              </div>
            </div>
          </div>

          <button
            onClick={startDraft}
            className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold text-xl"
          >
            Start Draft
          </button>
        </motion.div>
      )}

      {/* Drafting State */}
      {gameState === 'drafting' && (
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span>Pick {pickNumber} of {DRAFT_PICKS}</span>
              <span className="text-white/60">{draftedCards.length} cards drafted</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${(pickNumber / DRAFT_PICKS) * 100}%` }}
              />
            </div>
          </div>

          {/* Card Options */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">Choose a Card</h2>
          </div>
          <div className="flex justify-center gap-6 flex-wrap">
            {currentOptions.map((card) => (
              <motion.div
                key={card.id}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
                onClick={() => pickCard(card)}
              >
                <Card card={card} size="lg" />
              </motion.div>
            ))}
          </div>

          {/* Drafted Cards Preview */}
          {draftedCards.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-bold mb-3">Drafted Cards ({draftedCards.length})</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {draftedCards.map((card, i) => (
                  <div key={`${card.id}-${i}`} className="flex-shrink-0">
                    <Card card={card} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deck Review State */}
      {gameState === 'deckReview' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Draft Complete!</h2>
            <p className="text-white/60">Review your deck before battle</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{getCardStats().creatures}</div>
              <div className="text-white/60 text-sm">Creatures</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{getCardStats().spells}</div>
              <div className="text-white/60 text-sm">Spells</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{getCardStats().avgCost}</div>
              <div className="text-white/60 text-sm">Avg Cost</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{getCardStats().rarities.legendary + getCardStats().rarities.epic}</div>
              <div className="text-white/60 text-sm">Epic+</div>
            </div>
          </div>

          {/* All Cards */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="font-bold mb-3">Your Drafted Deck</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {draftedCards.map((card, i) => (
                <Card key={`${card.id}-${i}`} card={card} size="sm" />
              ))}
            </div>
          </div>

          <button
            onClick={startBattle}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 rounded-xl font-bold text-xl"
          >
            Start Battles!
          </button>
        </div>
      )}

      {/* Battle State */}
      {gameState === 'battle' && opponent && (
        <div className="space-y-4">
          {/* Opponent Area */}
          <div className="bg-gradient-to-b from-red-900/30 to-black/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold">{opponent.name}</h2>
                <p className="text-white/60 text-sm">Battle {wins + 1} of 3</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full ${
                        i <= wins ? 'bg-green-500' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Opponent HP */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>HP</span>
                <span>{opponentHP} / 30</span>
              </div>
              <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400"
                  animate={{ width: `${(opponentHP / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* Opponent Card */}
            {opponentActiveCard && (
              <div className="flex justify-center">
                <Card card={opponentActiveCard} size="sm" />
              </div>
            )}
          </div>

          {/* Turn Indicator */}
          <div className="text-center">
            <span className={`px-4 py-2 rounded-full font-bold ${
              isPlayerTurn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isPlayerTurn ? 'Your Turn' : 'Opponent Turn'}
            </span>
          </div>

          {/* Player Area */}
          <div className="bg-white/5 rounded-xl p-4">
            {/* Player HP */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Your HP</span>
                <span>{playerHP} / 30</span>
              </div>
              <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400"
                  animate={{ width: `${(playerHP / 30) * 100}%` }}
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
                        onClick={attackOpponent}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 hover:bg-red-400 rounded-lg text-sm font-bold"
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
                  Draw ({battleDeck.length})
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
          <div className="bg-black/30 rounded-xl p-4 max-h-24 overflow-y-auto">
            <div className="space-y-1 text-sm">
              {battleLog.slice(-4).map((log, i) => (
                <div key={i} className="text-white/70">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Victory State */}
      {gameState === 'victory' && (
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
            Draft Champion!
          </h2>
          <p className="text-white/60 mb-6">You won all 3 battles!</p>

          <div className="bg-gradient-to-r from-yellow-500/20 to-purple-500/20 rounded-xl p-6 max-w-md mx-auto mb-6">
            <h3 className="font-bold mb-4 text-xl">Total Rewards</h3>
            <div className="flex justify-center gap-8 text-lg">
              <span className="text-yellow-400">&#129689; 300 Coins</span>
              <span className="text-purple-400">&#10024; 60 Dust</span>
            </div>
          </div>

          <button
            onClick={() => setGameState('intro')}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl font-bold"
          >
            Play Again
          </button>
        </motion.div>
      )}

      {/* Defeat State */}
      {gameState === 'defeat' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-8xl mb-6">&#128128;</div>
          <h2 className="text-4xl font-bold mb-4 text-red-400">Defeated!</h2>
          <p className="text-white/60 mb-4">You won {wins} battle{wins !== 1 ? 's' : ''}</p>

          {wins > 0 && (
            <div className="bg-white/5 rounded-xl p-6 max-w-md mx-auto mb-6">
              <h3 className="font-bold mb-2">Rewards Earned</h3>
              <div className="flex justify-center gap-6">
                <span className="text-yellow-400">&#129689; {50 + (wins > 1 ? 100 : 0)} Coins</span>
                <span className="text-purple-400">&#10024; {10 + (wins > 1 ? 20 : 0)} Dust</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setGameState('intro')}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl font-bold"
          >
            Try Again
          </button>
        </motion.div>
      )}
    </div>
  )
}
