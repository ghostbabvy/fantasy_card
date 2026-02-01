import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '..', '..', 'data', 'game.json')

// Ensure data directory exists
const dataDir = path.dirname(dataPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

interface Player {
  id: number
  name: string
  coins: number
  dust: number
  xp: number
  level: number
  pityCounter: number
}

interface CollectionItem {
  cardId: string
  quantity: number
}

interface Deck {
  id: string
  name: string
  cards: string[]
}

interface GameData {
  players: Player[]
  collections: Record<number, CollectionItem[]>
  decks: Record<number, Deck[]>
  battles: any[]
  nextPlayerId: number
}

function loadData(): GameData {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.log('Creating new database...')
  }

  // Default data
  return {
    players: [],
    collections: {},
    decks: {},
    battles: [],
    nextPlayerId: 1
  }
}

function saveData(data: GameData) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

let data = loadData()

export function initDatabase() {
  console.log('📦 Database initialized (JSON file storage)')
}

export function getPlayer(id: number): Player | undefined {
  return data.players.find(p => p.id === id)
}

export function createPlayer(name: string = 'Hero'): number {
  const id = data.nextPlayerId++
  const player: Player = {
    id,
    name,
    coins: 500,
    dust: 0,
    xp: 0,
    level: 1,
    pityCounter: 0
  }
  data.players.push(player)
  data.collections[id] = []
  data.decks[id] = []
  saveData(data)
  return id
}

export function updatePlayerCoins(id: number, coins: number) {
  const player = data.players.find(p => p.id === id)
  if (player) {
    player.coins = coins
    saveData(data)
  }
}

export function updatePlayerDust(id: number, dust: number) {
  const player = data.players.find(p => p.id === id)
  if (player) {
    player.dust = dust
    saveData(data)
  }
}

export function getCollection(playerId: number): CollectionItem[] {
  return data.collections[playerId] || []
}

export function addCardToCollection(playerId: number, cardId: string, quantity: number = 1) {
  if (!data.collections[playerId]) {
    data.collections[playerId] = []
  }

  const existing = data.collections[playerId].find(c => c.cardId === cardId)
  if (existing) {
    existing.quantity += quantity
  } else {
    data.collections[playerId].push({ cardId, quantity })
  }
  saveData(data)
}

export function removeCardFromCollection(playerId: number, cardId: string, quantity: number = 1): boolean {
  const collection = data.collections[playerId]
  if (!collection) return false

  const item = collection.find(c => c.cardId === cardId)
  if (!item || item.quantity < quantity) return false

  item.quantity -= quantity
  if (item.quantity === 0) {
    data.collections[playerId] = collection.filter(c => c.cardId !== cardId)
  }
  saveData(data)
  return true
}

export function getDecks(playerId: number): Deck[] {
  return data.decks[playerId] || []
}

export function saveDeck(playerId: number, name: string, cards: string[]): string {
  if (!data.decks[playerId]) {
    data.decks[playerId] = []
  }

  const id = Date.now().toString()
  data.decks[playerId].push({ id, name, cards })
  saveData(data)
  return id
}

export function updateDeck(playerId: number, deckId: string, name: string, cards: string[]) {
  const decks = data.decks[playerId]
  if (!decks) return

  const deck = decks.find(d => d.id === deckId)
  if (deck) {
    deck.name = name
    deck.cards = cards
    saveData(data)
  }
}

export function deleteDeck(playerId: number, deckId: string) {
  if (data.decks[playerId]) {
    data.decks[playerId] = data.decks[playerId].filter(d => d.id !== deckId)
    saveData(data)
  }
}

export function recordBattle(playerId: number, result: 'win' | 'loss', xpEarned: number, coinsEarned: number) {
  data.battles.push({
    playerId,
    result,
    xpEarned,
    coinsEarned,
    timestamp: new Date().toISOString()
  })
  saveData(data)
}

export function recordPackOpening(playerId: number, packType: string, cards: string[]) {
  // Just log for now
  console.log(`Player ${playerId} opened ${packType} pack, got: ${cards.join(', ')}`)
}
