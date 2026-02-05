import { motion } from 'framer-motion'
import { getMasteryLevel, getMasteryProgress, getNextMasteryLevel, formatMasteryBonus } from '../data/mastery'

interface MasteryBadgeProps {
  xp: number
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  showTooltip?: boolean
}

export default function MasteryBadge({ xp, size = 'md', showProgress = false, showTooltip = false }: MasteryBadgeProps) {
  const level = getMasteryLevel(xp)
  const progress = getMasteryProgress(xp)
  const nextLevel = getNextMasteryLevel(xp)

  if (level.level === 0 && !showProgress) {
    return null // Don't show badge for unranked unless showing progress
  }

  const sizeClasses = {
    sm: 'w-4 h-4 text-[8px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm'
  }

  return (
    <div className="relative group">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center
          font-bold text-white shadow-lg
          border-2 border-white/30
        `}
        style={{ backgroundColor: level.borderColor }}
      >
        {level.level > 0 ? level.level : '-'}
      </motion.div>

      {/* Progress bar */}
      {showProgress && nextLevel && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/50 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: level.borderColor
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-2 text-xs whitespace-nowrap shadow-xl">
            <div className="font-bold mb-1" style={{ color: level.borderColor }}>
              {level.title}
            </div>
            <div className="text-white/60 mb-1">
              {xp} XP {nextLevel && `/ ${nextLevel.xpRequired}`}
            </div>
            {level.level > 0 && (
              <div className="text-white/80">
                {formatMasteryBonus(level.bonus).map((b, i) => (
                  <div key={i} className="text-green-400">{b}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
