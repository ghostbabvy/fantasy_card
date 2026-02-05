import { Card, Element } from '../types'
import { getCardById } from '../data/cards'

export interface DeckWarning {
  type: 'element' | 'cost' | 'balance' | 'healing'
  severity: 'low' | 'medium' | 'high'
  message: string
  suggestion: string
}

export interface DeckAnalysis {
  warnings: DeckWarning[]
  score: number  // 0-100 deck quality score
  summary: string
}

// Element matchups - what each element is weak to
const elementWeaknesses: Record<Element, Element> = {
  fire: 'water',
  water: 'lightning',
  nature: 'fire',
  earth: 'nature',
  lightning: 'earth',
  shadow: 'light',
  light: 'shadow',
  ice: 'fire',
  normal: 'shadow'
}

export function analyzeDeck(cardIds: string[]): DeckAnalysis {
  const warnings: DeckWarning[] = []
  let score = 100

  if (cardIds.length === 0) {
    return {
      warnings: [{ type: 'balance', severity: 'high', message: 'Empty deck', suggestion: 'Add some cards to your deck' }],
      score: 0,
      summary: 'Add cards to begin analysis'
    }
  }

  const cards = cardIds.map(id => getCardById(id)).filter(Boolean) as Card[]

  // Calculate stats
  const elements: Record<Element, number> = {
    fire: 0, water: 0, nature: 0, earth: 0, lightning: 0, shadow: 0, light: 0, ice: 0, normal: 0
  }
  let creatures = 0
  let spells = 0
  let totalCost = 0
  let hasHealing = false
  let lowCostCards = 0
  let highCostCards = 0

  for (const card of cards) {
    elements[card.element]++
    totalCost += card.cost

    if (card.type === 'creature') {
      creatures++
      // Check for healing attacks
      if (card.attacks?.some(a => a.effect?.toLowerCase().includes('heal'))) {
        hasHealing = true
      }
    } else if (card.type === 'spell') {
      spells++
      // Check for healing spells
      if (card.effect?.toLowerCase().includes('heal')) {
        hasHealing = true
      }
    }

    if (card.cost <= 2) lowCostCards++
    if (card.cost >= 5) highCostCards++
  }

  const avgCost = totalCost / cards.length
  const presentElements = Object.entries(elements).filter(([_, count]) => count > 0)

  // Check 1: Element coverage - identify missing elements that counter what we have
  const coveredElements = presentElements.map(([el]) => el as Element)
  for (const [element, count] of presentElements) {
    const el = element as Element
    const weakness = elementWeaknesses[el]

    // If we have cards of this element but no counter to its weakness
    if (count >= 3 && weakness && !coveredElements.includes(weakness)) {
      // Find what element is strong against our weakness
      const counterElement = Object.entries(elementWeaknesses).find(([_, weak]) => weak === weakness)?.[0]
      if (counterElement && !coveredElements.includes(counterElement as Element)) {
        warnings.push({
          type: 'element',
          severity: 'medium',
          message: `Heavy in ${el} cards - weak to ${weakness}`,
          suggestion: `Consider adding ${counterElement} cards for coverage`
        })
        score -= 10
      }
    }
  }

  // Check 2: Cost curve analysis
  if (avgCost > 4) {
    warnings.push({
      type: 'cost',
      severity: 'high',
      message: `Average cost too high (${avgCost.toFixed(1)})`,
      suggestion: 'Add more low-cost cards (1-2 cost) for early game'
    })
    score -= 15
  } else if (avgCost < 2) {
    warnings.push({
      type: 'cost',
      severity: 'medium',
      message: `Average cost very low (${avgCost.toFixed(1)})`,
      suggestion: 'Consider adding some high-impact cards'
    })
    score -= 5
  }

  if (lowCostCards < 4 && cards.length >= 15) {
    warnings.push({
      type: 'cost',
      severity: 'medium',
      message: `Only ${lowCostCards} low-cost cards`,
      suggestion: 'Add more 1-2 cost cards for consistent early plays'
    })
    score -= 10
  }

  if (highCostCards > cards.length / 3) {
    warnings.push({
      type: 'cost',
      severity: 'medium',
      message: `Too many expensive cards (${highCostCards})`,
      suggestion: 'Reduce high-cost cards to avoid slow starts'
    })
    score -= 10
  }

  // Check 3: Card type balance
  if (creatures < 10 && cards.length >= 15) {
    warnings.push({
      type: 'balance',
      severity: 'high',
      message: `Only ${creatures} creatures - may struggle in battle`,
      suggestion: 'Add more creatures for consistent board presence'
    })
    score -= 20
  }

  if (spells < 2 && cards.length >= 15) {
    warnings.push({
      type: 'balance',
      severity: 'low',
      message: `Only ${spells} spells - limited flexibility`,
      suggestion: 'Consider adding utility spells for versatility'
    })
    score -= 5
  } else if (spells > cards.length / 2) {
    warnings.push({
      type: 'balance',
      severity: 'medium',
      message: `Too many spells (${spells}) - not enough creatures`,
      suggestion: 'Balance with more creatures'
    })
    score -= 10
  }

  // Check 4: Healing presence
  if (!hasHealing && cards.length >= 15) {
    warnings.push({
      type: 'healing',
      severity: 'low',
      message: 'No healing cards',
      suggestion: 'Consider adding healing spells or creatures with heal abilities'
    })
    score -= 5
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score)

  // Generate summary
  let summary = ''
  if (score >= 90) {
    summary = 'Excellent deck! Well balanced and ready for battle.'
  } else if (score >= 70) {
    summary = 'Good deck with room for minor improvements.'
  } else if (score >= 50) {
    summary = 'Decent deck but has some notable weaknesses.'
  } else {
    summary = 'This deck needs work. Review the warnings below.'
  }

  return { warnings, score, summary }
}
