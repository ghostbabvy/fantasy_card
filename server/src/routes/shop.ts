import { Router } from 'express'
import {
  getPlayer,
  updatePlayerCoins,
  addCardToCollection,
  recordPackOpening
} from '../db/database.js'
import { cards } from '../game/cards.js'

const router = Router()

// Pack configurations
const packConfigs: Record<string, { cost: number; cardCount: number; minRarity: string }> = {
  basic: { cost: 100, cardCount: 3, minRarity: 'uncommon' },
  premium: { cost: 300, cardCount: 5, minRarity: 'rare' },
  legendary: { cost: 1000, cardCount: 5, minRarity: 'epic' }
}

// Drop rates
const dropRates: Record<string, number> = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.04,
  legendary: 0.01
}

function rollRarity(minRarity?: string): string {
  const roll = Math.random()
  let cumulative = 0

  const rarities = ['legendary', 'epic', 'rare', 'uncommon', 'common']
  const minIndex = minRarity ? rarities.indexOf(minRarity) : rarities.length - 1

  for (let i = 0; i <= minIndex; i++) {
    const rarity = rarities[i]
    cumulative += dropRates[rarity]
    if (roll < cumulative) {
      return rarity
    }
  }

  return minRarity || 'common'
}

function getRandomCardOfRarity(rarity: string): string {
  const cardsOfRarity = cards.filter(c => c.rarity === rarity)
  if (cardsOfRarity.length === 0) {
    const commonCards = cards.filter(c => c.rarity === 'common')
    return commonCards[Math.floor(Math.random() * commonCards.length)].id
  }
  return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)].id
}

// Buy pack
router.post('/buy/:playerId/:packType', (req, res) => {
  const playerId = parseInt(req.params.playerId)
  const packType = req.params.packType

  const config = packConfigs[packType]
  if (!config) {
    return res.status(400).json({ error: 'Invalid pack type' })
  }

  const player = getPlayer(playerId) as any
  if (!player) {
    return res.status(404).json({ error: 'Player not found' })
  }

  if (player.coins < config.cost) {
    return res.status(400).json({ error: 'Not enough coins' })
  }

  // Deduct coins
  updatePlayerCoins(playerId, player.coins - config.cost)

  // Roll cards
  const newCards: string[] = []
  for (let i = 0; i < config.cardCount; i++) {
    const isGuaranteed = i === 0
    const rarity = isGuaranteed ? rollRarity(config.minRarity) : rollRarity()
    const cardId = getRandomCardOfRarity(rarity)
    newCards.push(cardId)

    // Add to collection
    addCardToCollection(playerId, cardId, 1)
  }

  // Record pack opening
  recordPackOpening(playerId, packType, newCards)

  res.json({
    success: true,
    cards: newCards,
    newCoins: player.coins - config.cost
  })
})

export default router
