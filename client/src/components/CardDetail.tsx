import { motion } from 'framer-motion'
import { Card as CardType, rarityColors, elementColors, sellValues, dustValues } from '../types'
import { ElementIcon } from './ElementIcon'
import {
  getConditionTier,
  getConditionLabel,
  getConditionColor,
  getRestorationCost,
  getAgeTier,
  getAgeLabel,
  getAgeColor,
  getAgeDays,
  getAgeValueBonus,
  getCorruptionTier,
  getCorruptionLabel,
  getCorruptionColor,
  getPurificationCost,
  canEmbraceVoid,
  getCorruptionBattleEffects,
  calculateAdjustedSellValue,
  calculateAdjustedDustValue
} from '../data/cardSystems'

interface CardDetailProps {
  card: CardType
  quantity: number
  onClose: () => void
  condition?: number
  corruption?: number
  acquiredAt?: number
  isVoidTransformed?: boolean
  onRestore?: () => void
  onPurify?: () => void
  onEmbraceVoid?: () => void
  dust?: number
}

export default function CardDetail({
  card, quantity, onClose,
  condition, corruption, acquiredAt, isVoidTransformed,
  onRestore, onPurify, onEmbraceVoid, dust = 0
}: CardDetailProps) {
  const rarityColor = rarityColors[card.rarity]
  const elementColor = elementColors[card.element]

  const condTier = condition !== undefined ? getConditionTier(condition) : null
  const ageTier = acquiredAt !== undefined ? getAgeTier(acquiredAt) : null
  const corrTier = corruption !== undefined ? getCorruptionTier(corruption) : null

  const baseSell = sellValues[card.rarity]
  const baseDust = dustValues[card.rarity].disenchant
  const adjustedSell = condition !== undefined && acquiredAt !== undefined
    ? calculateAdjustedSellValue(baseSell, condition, acquiredAt) : baseSell
  const adjustedDust = condition !== undefined && acquiredAt !== undefined
    ? calculateAdjustedDustValue(baseDust, condition, acquiredAt) : baseDust

  const restoreCost = condition !== undefined ? getRestorationCost(condition, card.rarity) : 0
  const purifyCost = corruption !== undefined ? getPurificationCost(corruption, card.rarity) : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button - Top Left */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
        >
          ✕
        </button>

        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {card.name}
              {isVoidTransformed && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900 text-purple-300 font-bold">VOID</span>
              )}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2 py-0.5 rounded text-sm font-medium capitalize"
                style={{ backgroundColor: elementColor + '40', color: elementColor }}
              >
                {card.element}
              </span>
              <span
                className="px-2 py-0.5 rounded text-sm font-medium capitalize"
                style={{ backgroundColor: rarityColor + '40', color: rarityColor }}
              >
                {card.rarity}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">{card.cost}</div>
            <div className="text-xs text-white/50">Mana</div>
          </div>
        </div>

        {/* Card Art */}
        <div
          className="h-48 rounded-xl mb-4 overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${elementColor}40 0%, ${elementColor}20 100%)` }}
        >
          {card.artwork ? (
            <img
              src={card.artwork}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ElementIcon element={card.element} size={80} />
            </div>
          )}
          {/* Condition overlay on art */}
          {condition !== undefined && condition < 55 && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: `rgba(0,0,0,${0.1 + (1 - condition / 55) * 0.15})`,
                mixBlendMode: 'multiply'
              }}
            />
          )}
          {/* Corruption overlay on art */}
          {corruption !== undefined && corruption > 30 && (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, transparent 50%, ${getCorruptionColor(getCorruptionTier(corruption))}40 100%)`
              }}
            />
          )}
        </div>

        {/* Card Type & HP */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70 capitalize">{card.type}</span>
          {card.type === 'creature' && card.hp && (
            <div className="flex items-center gap-1 text-lg">
              <span className="text-red-400">❤️</span>
              <span className="font-bold">{card.hp} HP</span>
            </div>
          )}
        </div>

        {/* Condition / Age / Corruption Status */}
        {(condTier || ageTier || corrTier) && (
          <div className="space-y-3 mb-4 bg-white/5 rounded-xl p-3">
            {/* Condition */}
            {condTier && condition !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/70">Condition</span>
                  <span className="text-sm font-bold" style={{ color: getConditionColor(condTier) }}>
                    {getConditionLabel(condTier)} ({Math.round(condition)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${condition}%`,
                      backgroundColor: getConditionColor(condTier)
                    }}
                  />
                </div>
                {onRestore && condition < 90 && restoreCost > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRestore() }}
                    disabled={dust < restoreCost}
                    className={`mt-2 w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      dust >= restoreCost
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Restore (+25%) — {restoreCost} dust
                  </button>
                )}
              </div>
            )}

            {/* Age */}
            {ageTier && acquiredAt !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Age</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">{getAgeDays(acquiredAt)}d old</span>
                  <span
                    className="text-sm font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: getAgeColor(ageTier) + '30', color: getAgeColor(ageTier) }}
                  >
                    {getAgeLabel(ageTier)}
                  </span>
                  {condition !== undefined && getAgeValueBonus(acquiredAt, condition) > 1 && (
                    <span className="text-xs text-green-400">
                      +{Math.round((getAgeValueBonus(acquiredAt, condition) - 1) * 100)}% value
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Corruption */}
            {corrTier && corruption !== undefined && corruption > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/70">Corruption</span>
                  <span className="text-sm font-bold" style={{ color: getCorruptionColor(corrTier) }}>
                    {getCorruptionLabel(corrTier)} ({Math.round(corruption)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${corruption}%`,
                      backgroundColor: getCorruptionColor(corrTier)
                    }}
                  />
                </div>
                {/* Corruption battle effects info */}
                {corruption > 10 && (() => {
                  const effects = getCorruptionBattleEffects(corruption)
                  return (
                    <div className="mt-1 text-[10px] text-white/40">
                      +{effects.bonusDamagePercent}% dmg | {Math.round(effects.selfDamageChance * 100)}% self-hit | {Math.round(effects.randomTargetChance * 100)}% random target
                    </div>
                  )
                })()}
                <div className="flex gap-2 mt-2">
                  {onPurify && corruption > 0 && purifyCost > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onPurify() }}
                      disabled={dust < purifyCost}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        dust >= purifyCost
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      Purify (-20) — {purifyCost} dust
                    </button>
                  )}
                  {onEmbraceVoid && canEmbraceVoid(corruption) && !isVoidTransformed && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEmbraceVoid() }}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-900 to-violet-800 hover:from-purple-800 hover:to-violet-700 text-purple-200 transition-colors"
                    >
                      Embrace the Void
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attacks (for creatures) */}
        {card.type === 'creature' && card.attacks && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white/80">Attacks</h3>
              <ElementIcon element={card.element} size={20} />
            </div>
            {card.attacks.map((attack, index) => (
              <div
                key={index}
                className="bg-white/10 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: elementColor }}
                    >
                      {attack.cost}
                    </span>
                    <span className="font-bold text-lg">{attack.name}</span>
                  </div>
                  <span className="font-bold text-xl text-red-400">{attack.damage}</span>
                </div>
                {attack.effect && (
                  <div className="text-white/60 text-sm mt-1">
                    {attack.effect}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Spell Effect */}
        {card.type === 'spell' && card.effect && (
          <div className="bg-purple-500/20 rounded-lg p-3 mb-4">
            <div className="font-bold text-purple-300 mb-1">Effect</div>
            <div className="text-white/80">{card.effect}</div>
          </div>
        )}

        {/* Flavor Text */}
        <p className="text-white/50 italic text-sm mb-4">"{card.description}"</p>

        {/* Quantity & Value */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/70">Owned</span>
            <span className="text-xl font-bold">x{quantity}</span>
          </div>
          {condition !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Sell value</span>
              <span className={adjustedSell < baseSell ? 'text-red-400' : adjustedSell > baseSell ? 'text-green-400' : 'text-white/70'}>
                {adjustedSell} coins
                {adjustedSell !== baseSell && (
                  <span className="text-white/30 ml-1 text-xs">(base: {baseSell})</span>
                )}
              </span>
            </div>
          )}
          {condition !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Dust value</span>
              <span className={adjustedDust < baseDust ? 'text-red-400' : adjustedDust > baseDust ? 'text-green-400' : 'text-white/70'}>
                {adjustedDust} dust
                {adjustedDust !== baseDust && (
                  <span className="text-white/30 ml-1 text-xs">(base: {baseDust})</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}
