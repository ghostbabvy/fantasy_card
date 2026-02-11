import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBattleStore } from '../../stores/battleStore'
import { useGameStore } from '../../stores/gameStore'
import { elementColors, Element, StatusEffect, elementAdvantages } from '../../types'
import { ElementIcon } from '../ElementIcon'

// Status effect icons component with animations
function StatusEffectIcons({ effects }: { effects: StatusEffect[] }) {
  if (!effects || effects.length === 0) return null

  const effectConfig: Record<string, { icon: string; color: string; animation: any }> = {
    stun: {
      icon: '⚡',
      color: 'bg-yellow-500',
      animation: { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
    },
    poison: {
      icon: '🧪',
      color: 'bg-green-600',
      animation: { scale: [1, 1.1, 1], y: [0, -2, 0] }
    },
    burn: {
      icon: '🔥',
      color: 'bg-orange-500',
      animation: { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }
    },
    shield: {
      icon: '🛡️',
      color: 'bg-blue-500',
      animation: { scale: [1, 1.05, 1] }
    },
    weaken: {
      icon: '💔',
      color: 'bg-purple-500',
      animation: { opacity: [1, 0.6, 1] }
    }
  }

  return (
    <div className="absolute top-1/2 -translate-y-1/2 -right-2 flex flex-col gap-1">
      {effects.map((effect, idx) => {
        const config = effectConfig[effect.type]
        if (!config) return null

        return (
          <motion.div
            key={`${effect.type}-${idx}`}
            initial={{ scale: 0 }}
            animate={{ ...config.animation, scale: config.animation.scale || [1, 1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className={`${config.color} rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg border-2 border-white/30`}
            title={`${effect.type}: ${effect.value}${effect.duration > 0 ? ` (${effect.duration} turns)` : ''}`}
          >
            {config.icon}
            {effect.value > 0 && effect.type !== 'stun' && (
              <span className="absolute -bottom-1 -right-1 text-[10px] bg-black/80 rounded-full px-1 font-bold">
                {effect.value}
              </span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export default function BattleArena() {
  const {
    player,
    enemy,
    turnNumber,
    isOver,
    winner,
    endTurn,
    endBattle,
    battleLog,
    showCoinFlip,
    coinFlipResult,
    completeCoinFlip,
    playCardToActive,
    playCardToBench,
    swapActive,
    promoteFromBench,
    needsToChooseActive,
    attack,
    useSpell,
    drawCard,
    retreatActive,
    playerKnockouts,
    enemyKnockouts,
    knockoutsToWin,
    isChallengeBattle,
    challengeLevel,
    selectingBenchTarget,
    pendingBenchAttack,
    attackBenchTarget,
    cancelBenchTarget
  } = useBattleStore()

  const { addCoins, addXp, updateMissionProgress, incrementStat, recordBattleResult, processBattleEnd } = useGameStore()

  // Coin flip animation state
  const [coinFlipping, setCoinFlipping] = useState(true)
  const [showResult, setShowResult] = useState(false)
  const [selectedHandCard, setSelectedHandCard] = useState<number | null>(null)
  const [retreatMode, setRetreatMode] = useState(false)

  useEffect(() => {
    if (showCoinFlip) {
      setCoinFlipping(true)
      setShowResult(false)
      const flipTimer = setTimeout(() => {
        setCoinFlipping(false)
        setShowResult(true)
      }, 1500)
      return () => clearTimeout(flipTimer)
    }
  }, [showCoinFlip])

  if (!player || !enemy) return null

  const handleEndBattle = () => {
    // For challenge battles, ChallengePage handles rewards and stats
    // This button will likely never be clicked since ChallengePage's useEffect
    // runs first and calls endBattle(), unmounting BattleArena
    if (isChallengeBattle) {
      return
    }

    // Collect all card IDs that were in this battle's deck
    const deckCardIds = [
      ...player.deck,
      ...player.hand.map(c => c.id),
      ...(player.active ? [player.active.id] : []),
      ...player.bench.map(c => c.id),
      ...player.graveyard
    ]

    // Regular battle rewards
    if (winner === 'player') {
      addCoins(50)
      addXp(50)
      updateMissionProgress('battle_win', 1)
      incrementStat('battlesWon')
      recordBattleResult(true)
    } else {
      addXp(20)
      recordBattleResult(false)
    }
    incrementStat('battlesPlayed')

    // Process condition degradation and corruption from battle
    processBattleEnd(deckCardIds, winner === 'player')

    endBattle()
  }

  const handleCardClick = (handIndex: number) => {
    const card = player.hand[handIndex]
    if (!card) return

    // If in retreat mode, swap active with this creature
    if (retreatMode && card.type === 'creature') {
      retreatActive(handIndex)
      setRetreatMode(false)
      setSelectedHandCard(null)
      return
    }

    if (card.type === 'spell') {
      // Use spell immediately
      useSpell(handIndex, 'self')
      setSelectedHandCard(null)
    } else if (card.type === 'creature') {
      setSelectedHandCard(handIndex)
    }
  }

  const handlePlaceActive = () => {
    if (selectedHandCard !== null) {
      playCardToActive(selectedHandCard)
      setSelectedHandCard(null)
    }
  }

  const handlePlaceBench = () => {
    if (selectedHandCard !== null) {
      playCardToBench(selectedHandCard)
      setSelectedHandCard(null)
    }
  }

  const renderActiveCard = (card: any, isEnemy: boolean) => {
    if (!card) {
      return (
        <div className={`w-44 h-64 rounded-xl border-2 border-dashed ${isEnemy ? 'border-red-500/30' : 'border-blue-500/30'} flex items-center justify-center`}>
          <span className="text-white/30 text-sm">No Active</span>
        </div>
      )
    }

    const hpPercent = (card.currentHp / (card.hp || 100)) * 100
    const elementColor = elementColors[card.element as Element] || '#666'

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`relative w-44 h-64 rounded-xl overflow-hidden border-2 ${
          !isEnemy && card.canAttack ? 'ring-4 ring-green-400 animate-pulse' : ''
        }`}
        style={{ borderColor: elementColor }}
      >
        {/* Full card artwork background - like collection */}
        {card.artwork ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${elementColor}40 0%, ${elementColor}20 50%, #1a1a2e 100%)`
              }}
            />
            <img
              src={card.artwork}
              alt={card.name}
              className={`absolute inset-0 w-full h-full ${card.artwork.includes('earth_dragon') ? 'object-contain' : 'object-cover'}`}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(180deg, ${elementColor}50 0%, ${elementColor}20 30%, #1a1a2e 100%)`
            }}
          >
            <ElementIcon element={card.element} size={80} />
          </div>
        )}

        {/* Top: Cost Badge + HP */}
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg border-2 border-white/30"
            style={{ backgroundColor: elementColor }}
          >
            {card.cost}
          </div>
          <div className="bg-red-600/90 px-2 py-1 rounded text-white font-bold text-xs flex items-center gap-1 shadow-lg">
            <span>❤️</span> {card.currentHp}/{card.hp}
          </div>
        </div>

        {/* HP Bar */}
        <div className="absolute top-12 left-2 right-2 bg-black/50 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${hpPercent}%`,
              backgroundColor: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#eab308' : '#ef4444'
            }}
          />
        </div>

        {/* Bottom: Name banner */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-2 py-2">
          <div className="font-bold text-center text-white text-sm leading-tight truncate">
            {card.name}
          </div>
          <div className="text-center text-white/60 capitalize text-[10px]">
            {card.type} • {card.element}
          </div>
        </div>

        {/* Can Attack indicator */}
        {!isEnemy && card.canAttack && (
          <div className="absolute top-16 left-0 right-0 text-center">
            <span className="bg-green-500/80 text-white text-xs font-bold px-2 py-1 rounded">READY!</span>
          </div>
        )}

        {/* Status Effects with animations */}
        {card.statusEffects && card.statusEffects.length > 0 && (
          <StatusEffectIcons effects={card.statusEffects} />
        )}

        {/* Status effect overlay animations */}
        {card.statusEffects?.some((e: StatusEffect) => e.type === 'poison') && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ background: 'linear-gradient(0deg, #22c55e20 0%, transparent 50%)' }}
          />
        )}
        {card.statusEffects?.some((e: StatusEffect) => e.type === 'burn') && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ background: 'linear-gradient(0deg, #f9731620 0%, transparent 50%)' }}
          />
        )}
        {card.statusEffects?.some((e: StatusEffect) => e.type === 'stun') && (
          <motion.div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            <span className="text-4xl">⚡</span>
          </motion.div>
        )}
      </motion.div>
    )
  }

  const renderBenchCard = (card: any, index: number, isEnemy: boolean) => {
    const hpPercent = (card.currentHp / (card.hp || 100)) * 100
    const elementColor = elementColors[card.element as Element] || '#666'
    const canTarget = isEnemy && selectingBenchTarget

    return (
      <motion.div
        key={card.instanceId}
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        whileHover={!isEnemy || canTarget ? { scale: 1.05, y: -5 } : undefined}
        onClick={!isEnemy ? () => swapActive(index) : canTarget ? () => attackBenchTarget(index) : undefined}
        className={`relative w-28 h-40 rounded-xl overflow-hidden cursor-pointer border-2 ${
          !isEnemy ? 'hover:ring-2 hover:ring-yellow-400' : ''
        } ${canTarget ? 'ring-4 ring-red-500 animate-pulse cursor-crosshair' : ''}`}
        style={{ borderColor: elementColor }}
      >
        {/* Full card artwork background - like collection */}
        {card.artwork ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${elementColor}40 0%, ${elementColor}20 50%, #1a1a2e 100%)`
              }}
            />
            <img
              src={card.artwork}
              alt={card.name}
              className={`absolute inset-0 w-full h-full ${card.artwork.includes('earth_dragon') ? 'object-contain' : 'object-cover'}`}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(180deg, ${elementColor}50 0%, ${elementColor}20 30%, #1a1a2e 100%)`
            }}
          >
            <ElementIcon element={card.element} size={48} />
          </div>
        )}

        {/* Top: Cost */}
        <div className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border border-white/30" style={{ backgroundColor: elementColor }}>
          {card.cost}
        </div>

        {/* HP Bar */}
        <div className="absolute top-1 right-1 left-8 bg-black/50 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${hpPercent}%`,
              backgroundColor: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#eab308' : '#ef4444'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
            {card.currentHp}/{card.hp}
          </div>
        </div>

        {/* Bottom: Name banner */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-1 py-1">
          <div className="font-bold text-center text-white text-[10px] leading-tight truncate">
            {card.name}
          </div>
        </div>

        {/* Swap overlay for player bench */}
        {!isEnemy && (
          <div className="absolute inset-0 bg-yellow-400/0 hover:bg-yellow-400/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
            <span className="text-xs font-bold bg-black/70 px-2 py-1 rounded">Swap In</span>
          </div>
        )}

        {/* Target overlay for enemy bench when in targeting mode */}
        {canTarget && (
          <div className="absolute inset-0 bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center transition-all">
            <span className="text-xs font-bold bg-red-600 px-2 py-1 rounded">🎯 TARGET</span>
          </div>
        )}
      </motion.div>
    )
  }

  // Check if the pending attack can also target active
  const canTargetActive = selectingBenchTarget && pendingBenchAttack?.target === 'any'

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Battle UI */}
      <div className="flex flex-col gap-4">
        {/* Enemy Side */}
        <div className="bg-red-900/20 rounded-xl p-4">
          {/* Enemy Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg">Enemy</span>
              <div className="flex gap-2">
                <div className="bg-red-600 px-3 py-1 rounded text-sm font-bold">
                  ❤️ {enemy.hp}/{enemy.maxHp}
                </div>
                <div className="bg-blue-600 px-3 py-1 rounded text-sm font-bold">
                  ⚡ {enemy.energy}/{enemy.maxEnergy}
                </div>
              </div>
            </div>
            {/* Enemy Deck */}
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs">Hand: {enemy.hand.length}</span>
              <div className="relative w-10 h-14">
                {enemy.deck.length > 1 && (
                  <div className="absolute top-0.5 left-0.5 w-full h-full rounded-md overflow-hidden border border-indigo-400/30">
                    <img src="/cards/card_back.png" alt="deck" className="w-full h-full object-cover opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-md overflow-hidden border border-indigo-400/50">
                  <img src="/cards/card_back.png" alt="deck" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white">
                  {enemy.deck.length}
                </div>
              </div>
            </div>
          </div>

          {/* Enemy Bench */}
          <div className="flex justify-center gap-2 mb-4">
            {enemy.bench.map((card, i) => renderBenchCard(card, i, true))}
            {[...Array(3 - enemy.bench.length)].map((_, i) => (
              <div key={`empty-${i}`} className="w-24 h-32 rounded-lg border border-dashed border-red-500/20" />
            ))}
          </div>

          {/* Enemy Active */}
          <div className="flex justify-center">
            <div
              className={`relative ${canTargetActive ? 'cursor-crosshair' : ''}`}
              onClick={canTargetActive ? () => attackBenchTarget(-1) : undefined}
            >
              {renderActiveCard(enemy.active, true)}
              {/* Target active overlay */}
              {canTargetActive && enemy.active && (
                <div className="absolute inset-0 bg-red-500/30 hover:bg-red-500/50 rounded-xl flex items-center justify-center transition-all ring-4 ring-red-500 animate-pulse">
                  <span className="text-sm font-bold bg-red-600 px-3 py-1 rounded">🎯 TARGET</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bench Targeting Mode Indicator */}
        {selectingBenchTarget && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-2"
          >
            <div className="bg-red-600/90 text-white px-6 py-2 rounded-full font-bold flex items-center gap-3">
              <span>🎯 SELECT A TARGET</span>
              <button
                onClick={cancelBenchTarget}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Element Matchup Indicator */}
        {player.active && enemy.active && !selectingBenchTarget && (
          <div className="flex justify-center mb-2">
            {(() => {
              const playerElement = player.active.element
              const enemyElement = enemy.active.element
              const playerHasAdvantage = elementAdvantages[playerElement] === enemyElement
              const enemyHasAdvantage = elementAdvantages[enemyElement] === playerElement

              if (playerHasAdvantage) {
                return (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-green-500/80 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                  >
                    <span>⚡</span> SUPER EFFECTIVE! (1.5x damage)
                  </motion.div>
                )
              } else if (enemyHasAdvantage) {
                return (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-red-500/80 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                  >
                    <span>⚠️</span> NOT VERY EFFECTIVE (0.5x damage)
                  </motion.div>
                )
              }
              return null
            })()}
          </div>
        )}

        {/* Battle Info */}
        <div className="flex items-center justify-center gap-4">
          {/* Challenge Mode indicator */}
          {isChallengeBattle && challengeLevel && (
            <div className={`rounded-lg px-4 py-2 font-bold ${
              challengeLevel.isBoss
                ? 'bg-gradient-to-r from-yellow-600 to-amber-600'
                : 'bg-gradient-to-r from-purple-600 to-blue-600'
            }`}>
              {challengeLevel.isBoss ? `BOSS: ${challengeLevel.bossName}` : `Challenge ${challengeLevel.level}`}
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            Turn {turnNumber}
          </div>

          {/* Knockout Score */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-4 py-2 font-bold">
            <span className="text-green-400">You: {playerKnockouts}</span>
            <span className="mx-2">vs</span>
            <span className="text-red-400">Enemy: {enemyKnockouts}</span>
            <span className="text-white/50 text-xs ml-2">(First to {knockoutsToWin})</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={endTurn}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold"
          >
            End Turn
          </motion.button>
        </div>

        {/* Player Side */}
        <div className="bg-blue-900/20 rounded-xl p-4">
          {/* Player Active */}
          <div className="flex justify-center mb-4">
            {renderActiveCard(player.active, false)}

            {/* Attack Buttons */}
            {player.active && player.active.canAttack && player.active.attacks && !selectingBenchTarget && (
              <div className="ml-4 flex flex-col justify-center gap-2">
                {player.active.attacks.map((atk, i) => {
                  const hasHeal = atk.effect?.toLowerCase().includes('heal')
                  const hasLifesteal = atk.effect?.toLowerCase().includes('steal') || atk.effect?.toLowerCase().includes('drain')
                  const hasDraw = atk.effect?.toLowerCase().includes('draw')
                  const target = atk.target || 'active'
                  const canTargetBench = target === 'bench' || target === 'any' || target === 'all-bench'

                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => attack(i)}
                      disabled={player.energy < atk.cost || (target === 'bench' && enemy.bench.length === 0)}
                      className={`px-4 py-2 rounded-lg font-bold text-sm flex flex-col items-start gap-1 ${
                        player.energy >= atk.cost && !(target === 'bench' && enemy.bench.length === 0)
                          ? hasHeal || hasLifesteal
                            ? 'bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600'
                            : canTargetBench
                              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                              : 'bg-red-500 hover:bg-red-600'
                          : 'bg-gray-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-500 px-2 rounded">{atk.cost}⚡</span>
                        <span>{atk.name}</span>
                        <span className="text-yellow-300">({atk.damage} dmg)</span>
                        {canTargetBench && (
                          <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {target === 'bench' ? '🎯 BENCH' : target === 'all-bench' ? '💥 ALL BENCH' : '🎯 ANY'}
                          </span>
                        )}
                      </div>
                      {atk.effect && (
                        <div className="text-[10px] text-white/80 flex items-center gap-1">
                          {hasHeal && <span className="text-green-300">💚</span>}
                          {hasLifesteal && <span className="text-purple-300">🧛</span>}
                          {hasDraw && <span className="text-blue-300">🃏</span>}
                          <span className="truncate max-w-32">{atk.effect}</span>
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Player Bench */}
          <div className="flex justify-center gap-2 mb-4">
            {player.bench.map((card, i) => renderBenchCard(card, i, false))}
            {[...Array(3 - player.bench.length)].map((_, i) => (
              <div key={`empty-${i}`} className="w-24 h-32 rounded-lg border border-dashed border-blue-500/20" />
            ))}
          </div>

          {/* Player Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg">You</span>
              <div className="flex gap-2">
                <div className="bg-red-600 px-3 py-1 rounded text-sm font-bold">
                  ❤️ {player.hp}/{player.maxHp}
                </div>
                <div className="bg-blue-600 px-3 py-1 rounded text-sm font-bold">
                  ⚡ {player.energy}/{player.maxEnergy}
                </div>
              </div>
            </div>
            {/* Deck - Click to Draw */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={drawCard}
              disabled={player.deck.length === 0 || player.hand.length >= 10}
              className={`relative flex items-center gap-3 ${
                player.deck.length === 0 || player.hand.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {/* Stacked card back effect */}
              <div className="relative w-16 h-24">
                {/* Card stack shadow */}
                {player.deck.length > 2 && (
                  <div className="absolute top-1 left-1 w-full h-full rounded-lg bg-black/30" />
                )}
                {player.deck.length > 1 && (
                  <div className="absolute top-0.5 left-0.5 w-full h-full rounded-lg overflow-hidden border-2 border-indigo-400/50">
                    <img src="/cards/card_back.png" alt="deck" className="w-full h-full object-cover opacity-70" />
                  </div>
                )}
                {/* Top card */}
                <div className="absolute inset-0 rounded-lg overflow-hidden border-2 border-indigo-400 shadow-lg shadow-indigo-500/30">
                  <img src="/cards/card_back.png" alt="deck" className="w-full h-full object-cover" />
                </div>
                {/* Card count badge */}
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  {player.deck.length}
                </div>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">Draw</div>
                <div className="text-[10px] text-white/70">Tap deck</div>
              </div>
            </motion.button>

            {/* Retreat Button */}
            {player.active && player.energy >= 2 && player.hand.some(c => c.type === 'creature') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRetreatMode(!retreatMode)}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${
                  retreatMode
                    ? 'bg-yellow-500 text-black'
                    : 'bg-orange-500/80 hover:bg-orange-500 text-white'
                }`}
              >
                <span>🔄</span>
                <div className="text-left">
                  <div>Retreat</div>
                  <div className="text-[10px] opacity-70">2 ⚡</div>
                </div>
              </motion.button>
            )}
          </div>

          {/* Retreat Mode Hint */}
          {retreatMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-yellow-400 text-sm font-bold"
            >
              Select a creature from your hand to swap with your active!
            </motion.div>
          )}
        </div>

        {/* Player Hand */}
        <div className="bg-black/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Your Hand ({player.hand.length}/10)</h3>
            {selectedHandCard !== null && (
              <div className="flex gap-2">
                {!player.active && (
                  <button
                    onClick={handlePlaceActive}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded font-bold text-sm"
                  >
                    Set as Active
                  </button>
                )}
                {player.bench.length < 3 && (
                  <button
                    onClick={handlePlaceBench}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded font-bold text-sm"
                  >
                    Place on Bench
                  </button>
                )}
                <button
                  onClick={() => setSelectedHandCard(null)}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 rounded font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {player.hand.map((card, index) => {
              const elementColor = elementColors[card.element as Element] || '#666'
              const isSelected = selectedHandCard === index
              const canUse = card.type === 'spell' ? player.energy >= card.cost : true

              return (
                <motion.div
                  key={card.instanceId}
                  whileHover={{ y: -10, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => canUse && handleCardClick(index)}
                  className={`relative flex-shrink-0 w-32 h-48 rounded-xl overflow-hidden cursor-pointer border-2 ${
                    isSelected ? 'ring-4 ring-yellow-400' : ''
                  } ${!canUse ? 'opacity-50' : ''}`}
                  style={{ borderColor: elementColor }}
                >
                  {/* Full card artwork background - like collection */}
                  {card.artwork ? (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(180deg, ${elementColor}40 0%, ${elementColor}20 50%, #1a1a2e 100%)`
                        }}
                      />
                      <img
                        src={card.artwork}
                        alt={card.name}
                        className={`absolute inset-0 w-full h-full ${
                          card.artwork.includes('earth_dragon') ? 'object-contain' : 'object-cover'
                        }`}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(180deg, ${elementColor}50 0%, ${elementColor}20 30%, #1a1a2e 100%)`
                      }}
                    >
                      <ElementIcon element={card.element} size={64} />
                    </div>
                  )}

                  {/* Top: Cost + HP/Type */}
                  <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg border-2 border-white/30"
                      style={{ backgroundColor: elementColor }}
                    >
                      {card.cost}
                    </div>
                    {card.type === 'creature' && card.hp && (
                      <div className="bg-red-600/90 px-2 py-0.5 rounded text-white font-bold text-xs flex items-center gap-1 shadow-lg">
                        <span>❤️</span> {card.hp}
                      </div>
                    )}
                    {card.type === 'spell' && (
                      <div className="bg-purple-600/90 px-2 py-0.5 rounded text-white font-bold text-xs shadow-lg">
                        ✨ Spell
                      </div>
                    )}
                  </div>

                  {/* Bottom: Name banner */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-2 py-1.5">
                    <div className="font-bold text-center text-white text-xs leading-tight truncate">
                      {card.name}
                    </div>
                    <div className="text-center text-white/60 capitalize text-[9px]">
                      {card.type} • {card.element}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <div className="fixed right-4 top-24 w-72 bg-black/70 backdrop-blur-sm rounded-lg p-4 max-h-80 overflow-y-auto">
        <h3 className="font-bold mb-2 text-sm border-b border-white/20 pb-2">Battle Log</h3>
        <div className="space-y-1 text-xs">
          {battleLog.slice(-15).map((log, i) => (
            <div key={i} className={log.includes('---') ? 'text-yellow-400 font-bold mt-2' : 'text-white/70'}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Coin Flip Modal */}
      <AnimatePresence>
        {showCoinFlip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <div className="text-center">
              <motion.div
                className="mb-8 relative"
                animate={coinFlipping ? {
                  rotateY: [0, 180, 360, 540, 720, 900, 1080],
                  scale: [1, 1.2, 1, 1.2, 1, 1.2, 1]
                } : {}}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {coinFlipping ? (
                  <div className="w-48 h-48 relative">
                    <img src="/coin-player.png" alt="Coin" className="w-48 h-48 object-contain" />
                  </div>
                ) : (
                  <motion.img
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    src={coinFlipResult === 'player' ? '/coin-player.png' : '/coin-enemy.png'}
                    alt={coinFlipResult === 'player' ? 'You go first!' : 'Enemy goes first!'}
                    className="w-48 h-48 object-contain"
                  />
                )}
              </motion.div>

              <AnimatePresence>
                {showResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-4xl font-bold mb-4">
                      {coinFlipResult === 'player' ? (
                        <span className="text-green-400">You go first!</span>
                      ) : (
                        <span className="text-red-400">Enemy goes first!</span>
                      )}
                    </h2>
                    <p className="text-white/70 mb-6">
                      {coinFlipResult === 'player'
                        ? 'Place a creature as your active to begin!'
                        : 'The enemy will set up first...'}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={completeCoinFlip}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-lg"
                    >
                      Start Battle!
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {coinFlipping && (
                <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-xl text-white/70">
                  Flipping coin...
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choose Replacement Modal */}
      {needsToChooseActive && player && player.bench.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-2xl"
          >
            <h2 className="text-3xl font-bold text-center mb-2">Your Pokemon fainted!</h2>
            <p className="text-white/70 text-center mb-6">Choose a replacement from your bench:</p>

            <div className="flex gap-4 justify-center">
              {player.bench.map((card, index) => {
                const hpPercent = (card.currentHp / (card.hp || 100)) * 100
                const elementColor = elementColors[card.element as Element] || '#666'

                return (
                  <motion.div
                    key={card.instanceId}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => promoteFromBench(index)}
                    className="cursor-pointer relative w-32 h-44 rounded-xl overflow-hidden ring-2 ring-yellow-400 hover:ring-4"
                    style={{
                      background: `linear-gradient(180deg, ${elementColor}50 0%, #1a1a2e 100%)`
                    }}
                  >
                    <div className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: elementColor }}>
                      {card.cost}
                    </div>
                    {/* Card artwork or element */}
                    {card.artwork ? (
                      <img
                        src={card.artwork}
                        alt={card.name}
                        className={`absolute inset-0 w-full h-full ${card.artwork.includes('earth_dragon') ? 'object-contain' : 'object-cover'}`}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div className="absolute top-2 right-2">
                        <ElementIcon element={card.element} size={24} />
                      </div>
                    )}
                    <div className="absolute top-12 left-0 right-0 text-center font-bold text-sm px-2 truncate bg-black/50">
                      {card.name}
                    </div>
                    <div className="absolute bottom-8 left-2 right-2">
                      <div className="bg-black/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${hpPercent}%`,
                            backgroundColor: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#eab308' : '#ef4444'
                          }}
                        />
                      </div>
                      <div className="text-center text-xs mt-1">
                        {card.currentHp}/{card.hp} HP
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-yellow-400 font-bold">
                      TAP TO SELECT
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Game Over Modal */}
      {isOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="text-center"
          >
            {/* Custom Win/Lose Image */}
            <motion.img
              src={winner === 'player' ? '/battle-win.png' : '/battle-lose.png'}
              alt={winner === 'player' ? 'You Won!' : 'You Lost'}
              className="w-72 h-auto mx-auto mb-6"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />

            {/* Reward Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              {winner === 'player' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-4 text-xl">
                    <span className="bg-yellow-500/30 px-4 py-2 rounded-lg">
                      🪙 +50 Coins
                    </span>
                    <span className="bg-purple-500/30 px-4 py-2 rounded-lg">
                      ⭐ +50 XP
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-white/70 text-lg">
                  Don't give up! <span className="bg-purple-500/30 px-3 py-1 rounded-lg">⭐ +20 XP</span>
                </div>
              )}
            </motion.div>

            {/* Continue Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEndBattle}
              className={`px-10 py-4 rounded-xl font-bold text-xl shadow-lg ${
                winner === 'player'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
              }`}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
