import { Router } from 'express'
import {
  getPlayer,
  createPlayer,
  getCollection,
  getDecks,
  saveDeck,
  updateDeck,
  deleteDeck
} from '../db/database.js'

const router = Router()

// Get or create player
router.get('/:id?', (req, res) => {
  let playerId = req.params.id ? parseInt(req.params.id) : 1

  let player = getPlayer(playerId)

  if (!player) {
    // Create default player
    playerId = createPlayer() as number
    player = getPlayer(playerId)
  }

  const collection = getCollection(playerId)
  const decks = getDecks(playerId)

  res.json({
    player,
    collection: collection.reduce((acc: Record<string, number>, item: any) => {
      acc[item.card_id] = item.quantity
      return acc
    }, {}),
    decks: decks.map((d: any) => ({
      id: d.id.toString(),
      name: d.name,
      cards: JSON.parse(d.cards)
    }))
  })
})

// Update player name
router.put('/:id/name', (req, res) => {
  const { name } = req.body
  // Implementation would go here
  res.json({ success: true })
})

// Save deck
router.post('/:id/decks', (req, res) => {
  const playerId = parseInt(req.params.id)
  const { name, cards } = req.body

  if (!name || !cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Invalid deck data' })
  }

  const deckId = saveDeck(playerId, name, cards)
  res.json({ id: deckId.toString(), name, cards })
})

// Update deck
router.put('/:playerId/decks/:deckId', (req, res) => {
  const playerId = parseInt(req.params.playerId)
  const deckId = req.params.deckId
  const { name, cards } = req.body

  if (!name || !cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Invalid deck data' })
  }

  updateDeck(playerId, deckId, name, cards)
  res.json({ success: true })
})

// Delete deck
router.delete('/:playerId/decks/:deckId', (req, res) => {
  const playerId = parseInt(req.params.playerId)
  const deckId = req.params.deckId
  deleteDeck(playerId, deckId)
  res.json({ success: true })
})

export default router
