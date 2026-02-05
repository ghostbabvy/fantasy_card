import { motion } from 'framer-motion'
import { analyzeDeck } from '../utils/deckAnalyzer'

interface Props {
  cardIds: string[]
}

const severityColors = {
  low: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  medium: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  high: 'bg-red-500/20 border-red-500/40 text-red-300'
}


export default function DeckAnalysisPanel({ cardIds }: Props) {
  const analysis = analyzeDeck(cardIds)

  if (cardIds.length === 0) {
    return null
  }

  const scoreColor = analysis.score >= 70 ? 'text-green-400' : analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-xl p-4 mt-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          Deck Analysis
        </h3>
        <div className={`font-bold ${scoreColor}`}>
          Score: {analysis.score}/100
        </div>
      </div>

      {/* Score bar */}
      <div className="bg-black/30 rounded-full h-2 mb-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${analysis.score}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${
            analysis.score >= 70 ? 'bg-green-500' : analysis.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
      </div>

      <p className="text-sm text-white/70 mb-3">{analysis.summary}</p>

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="space-y-2">
          {analysis.warnings.map((warning, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-2 ${severityColors[warning.severity]}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {warning.severity === 'high' ? '!' : warning.severity === 'medium' ? '?' : 'i'}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{warning.message}</div>
                  <div className="text-xs opacity-80">{warning.suggestion}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {analysis.warnings.length === 0 && analysis.score >= 70 && (
        <div className="text-center py-2">
          <span className="text-green-400 text-lg">No issues found!</span>
        </div>
      )}
    </motion.div>
  )
}
