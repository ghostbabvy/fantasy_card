import { motion } from 'framer-motion'
import { useBattleStore } from '../../stores/battleStore'
import { useGameStore } from '../../stores/gameStore'
import Hand from './Hand'
import Field from './Field'

export default function BattleArena() {
  const {
    player,
    enemy,
    turnNumber,
    isOver,
    winner,
    endTurn,
    endBattle,
    battleLog
  } = useBattleStore()

  const { addCoins, addXp } = useGameStore()

  if (!player || !enemy) return null

  const handleEndBattle = () => {
    if (winner === 'player') {
      addCoins(50)
      addXp(50)
    } else {
      addXp(20)
    }
    endBattle()
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Battle UI */}
      <div className="flex flex-col h-full gap-4">
        {/* Enemy Area */}
        <div className="bg-red-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg">Enemy</div>
              <div className="flex items-center gap-2">
                <div className="bg-red-600 px-3 py-1 rounded text-sm font-bold">
                  ❤️ {enemy.hp}/{enemy.maxHp}
                </div>
                <div className="bg-blue-600 px-3 py-1 rounded text-sm font-bold">
                  💧 {enemy.mana}/{enemy.maxMana}
                </div>
              </div>
            </div>
            <div className="text-white/50 text-sm">
              Hand: {enemy.hand.length} | Deck: {enemy.deck.length}
            </div>
          </div>

          {/* Enemy Field */}
          <Field cards={enemy.field} isEnemy />
        </div>

        {/* Battle Info */}
        <div className="flex items-center justify-center gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            Turn {turnNumber}
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

        {/* Player Area */}
        <div className="bg-blue-900/20 rounded-xl p-4">
          {/* Player Field */}
          <Field cards={player.field} isEnemy={false} />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg">You</div>
              <div className="flex items-center gap-2">
                <div className="bg-red-600 px-3 py-1 rounded text-sm font-bold">
                  ❤️ {player.hp}/{player.maxHp}
                </div>
                <div className="bg-blue-600 px-3 py-1 rounded text-sm font-bold">
                  💧 {player.mana}/{player.maxMana}
                </div>
              </div>
            </div>
            <div className="text-white/50 text-sm">
              Deck: {player.deck.length}
            </div>
          </div>
        </div>

        {/* Player Hand */}
        <Hand cards={player.hand} mana={player.mana} />
      </div>

      {/* Battle Log */}
      <div className="fixed right-4 top-24 w-64 bg-black/50 backdrop-blur-sm rounded-lg p-4 max-h-64 overflow-y-auto">
        <h3 className="font-bold mb-2 text-sm">Battle Log</h3>
        <div className="space-y-1 text-xs text-white/70">
          {battleLog.slice(-10).map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      {/* Game Over Modal */}
      {isOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-center"
          >
            <div className="text-6xl mb-4">
              {winner === 'player' ? '🏆' : '💀'}
            </div>
            <h2 className="text-3xl font-bold mb-2">
              {winner === 'player' ? 'Victory!' : 'Defeat'}
            </h2>
            <p className="text-white/70 mb-6">
              {winner === 'player'
                ? 'You earned 50 coins and 50 XP!'
                : 'Better luck next time! (+20 XP)'}
            </p>
            <button
              onClick={handleEndBattle}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
