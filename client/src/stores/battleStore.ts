import { create } from 'zustand'
import { cards, getCardById } from '../data/cards'
import { BattleCard, Player, Card, elementAdvantages } from '../types'

interface BattleState {
  isInBattle: boolean
  player: Player | null
  enemy: Player | null
  turn: 'player' | 'enemy'
  turnNumber: number
  phase: 'draw' | 'main' | 'attack' | 'end'
  isOver: boolean
  winner: 'player' | 'enemy' | null
  selectedCardIndex: number | null
  targetIndex: number | null
  battleLog: string[]

  // Coin flip
  showCoinFlip: boolean
  coinFlipResult: 'player' | 'enemy' | null
  coinFlipComplete: boolean

  // Actions
  startBattle: (deckCardIds: string[]) => void
  endBattle: () => void
  playCard: (handIndex: number) => void
  attack: (attackerIndex: number, targetIndex: number | 'player') => void
  endTurn: () => void
  selectCard: (index: number | null) => void
  completeCoinFlip: () => void
}

function createBattleCard(card: Card): BattleCard {
  // Get attack power from first attack, or 0 if no attacks
  const attackPower = card.attacks && card.attacks.length > 0
    ? card.attacks[0].damage
    : 0

  return {
    ...card,
    instanceId: `${card.id}_${Date.now()}_${Math.random()}`,
    currentHp: card.hp || 0,
    currentAttack: attackPower,
    canAttack: false,
    hasAttackedThisTurn: false
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createPlayer(deckCardIds: string[]): Player {
  const shuffledDeck = shuffleArray(deckCardIds)
  const hand: BattleCard[] = []

  // Draw starting hand (3 cards)
  for (let i = 0; i < 3 && shuffledDeck.length > 0; i++) {
    const cardId = shuffledDeck.shift()!
    const card = getCardById(cardId)
    if (card) {
      hand.push(createBattleCard(card))
    }
  }

  return {
    hp: 30,
    maxHp: 30,
    mana: 1,
    maxMana: 1,
    deck: shuffledDeck,
    hand,
    field: [],
    graveyard: []
  }
}

function createAIDeck(): string[] {
  // Create a simple balanced deck for AI
  const aiCards: string[] = []

  // Add a mix of creatures
  const creatureIds = cards
    .filter(c => c.type === 'creature' && (c.rarity === 'common' || c.rarity === 'uncommon'))
    .map(c => c.id)

  // Add 16 creatures (some duplicates allowed)
  for (let i = 0; i < 16; i++) {
    aiCards.push(creatureIds[Math.floor(Math.random() * creatureIds.length)])
  }

  // Add 4 spells
  const spellIds = cards.filter(c => c.type === 'spell').map(c => c.id)
  for (let i = 0; i < 4; i++) {
    aiCards.push(spellIds[Math.floor(Math.random() * spellIds.length)])
  }

  return aiCards
}

function calculateDamage(attacker: BattleCard, defender: BattleCard): number {
  let damage = attacker.currentAttack

  // Element advantage bonus
  if (elementAdvantages[attacker.element] === defender.element) {
    damage = Math.floor(damage * 1.5)
  }

  return damage
}

export const useBattleStore = create<BattleState>((set, get) => ({
  isInBattle: false,
  player: null,
  enemy: null,
  turn: 'player',
  turnNumber: 1,
  phase: 'main',
  isOver: false,
  winner: null,
  selectedCardIndex: null,
  targetIndex: null,
  battleLog: [],
  showCoinFlip: false,
  coinFlipResult: null,
  coinFlipComplete: false,

  startBattle: (deckCardIds) => {
    const player = createPlayer(deckCardIds)
    const enemy = createPlayer(createAIDeck())

    // 50-50 coin flip to determine who goes first
    const coinFlipResult: 'player' | 'enemy' = Math.random() < 0.5 ? 'player' : 'enemy'

    set({
      isInBattle: true,
      player,
      enemy,
      turn: coinFlipResult,
      turnNumber: 1,
      phase: 'main',
      isOver: false,
      winner: null,
      selectedCardIndex: null,
      battleLog: [],
      showCoinFlip: true,
      coinFlipResult,
      coinFlipComplete: false
    })
  },

  completeCoinFlip: () => {
    const state = get()
    const newLog = [`Coin flip: ${state.coinFlipResult === 'player' ? 'You go' : 'Enemy goes'} first!`]

    // If enemy goes first, run their turn
    if (state.coinFlipResult === 'enemy' && state.player && state.enemy) {
      const newEnemy = { ...state.enemy }

      // Enemy gains mana on their first turn
      newEnemy.mana = 1
      newEnemy.maxMana = 1

      // Enemy enables attacks for creatures (none yet on turn 1)
      newEnemy.field = newEnemy.field.map(c => ({ ...c, canAttack: true }))

      // AI plays a card if possible
      const playableCards = newEnemy.hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => card.cost <= newEnemy.mana && (card.type !== 'creature' || newEnemy.field.length < 5))
        .sort((a, b) => b.card.cost - a.card.cost)

      for (const { card, index } of playableCards) {
        if (card.cost <= newEnemy.mana) {
          newEnemy.mana -= card.cost
          newEnemy.hand = newEnemy.hand.filter((_, i) => i !== index)

          if (card.type === 'creature') {
            newEnemy.field.push({ ...card, canAttack: false })
            newLog.push(`Enemy played ${card.name}`)
          }
          break
        }
      }

      // Now it's player's turn
      const newPlayer = { ...state.player }
      newPlayer.maxMana = Math.min(10, newPlayer.maxMana + 1)
      newPlayer.mana = newPlayer.maxMana

      // Player draws a card
      if (newPlayer.deck.length > 0 && newPlayer.hand.length < 7) {
        const cardId = newPlayer.deck.shift()!
        const card = getCardById(cardId)
        if (card) {
          newPlayer.hand.push(createBattleCard(card))
          newLog.push(`You drew ${card.name}`)
        }
      }

      // Player's creatures can now attack
      newPlayer.field = newPlayer.field.map(c => ({ ...c, canAttack: true }))

      set({
        showCoinFlip: false,
        coinFlipComplete: true,
        player: newPlayer,
        enemy: newEnemy,
        turn: 'player',
        turnNumber: 2,
        battleLog: newLog
      })
    } else {
      // Player goes first - just start normally
      set({
        showCoinFlip: false,
        coinFlipComplete: true,
        battleLog: [...newLog, 'Your turn - play your cards!']
      })
    }
  },

  endBattle: () => {
    set({
      isInBattle: false,
      player: null,
      enemy: null,
      isOver: false,
      winner: null,
      battleLog: [],
      showCoinFlip: false,
      coinFlipResult: null,
      coinFlipComplete: false
    })
  },

  selectCard: (index) => {
    set({ selectedCardIndex: index })
  },

  playCard: (handIndex) => {
    const state = get()
    if (!state.player || state.turn !== 'player' || state.phase !== 'main') return

    const card = state.player.hand[handIndex]
    if (!card || card.cost > state.player.mana) return
    if (card.type === 'creature' && state.player.field.length >= 5) return

    const newPlayer = { ...state.player }
    newPlayer.mana -= card.cost
    newPlayer.hand = newPlayer.hand.filter((_, i) => i !== handIndex)

    const newLog = [...state.battleLog]

    if (card.type === 'creature') {
      const fieldCard = { ...card, canAttack: false }
      newPlayer.field = [...newPlayer.field, fieldCard]
      newLog.push(`You played ${card.name}`)
    } else if (card.type === 'spell') {
      // Handle spell effects (simplified)
      newLog.push(`You cast ${card.name}`)
      newPlayer.graveyard.push(card.id)
    }

    set({ player: newPlayer, battleLog: newLog, selectedCardIndex: null })
  },

  attack: (attackerIndex, targetIndex) => {
    const state = get()
    if (!state.player || !state.enemy || state.turn !== 'player') return

    const attacker = state.player.field[attackerIndex]
    if (!attacker || !attacker.canAttack) return

    const newPlayer = { ...state.player }
    const newEnemy = { ...state.enemy }
    const newLog = [...state.battleLog]

    newPlayer.field = [...newPlayer.field]
    newEnemy.field = [...newEnemy.field]

    if (targetIndex === 'player') {
      // Attack enemy player directly
      newEnemy.hp -= attacker.currentAttack
      newLog.push(`${attacker.name} attacked enemy for ${attacker.currentAttack} damage!`)

      if (newEnemy.hp <= 0) {
        set({
          player: newPlayer,
          enemy: newEnemy,
          isOver: true,
          winner: 'player',
          battleLog: [...newLog, 'You win!']
        })
        return
      }
    } else {
      // Attack enemy creature
      const defender = newEnemy.field[targetIndex]
      if (!defender) return

      const damageToDefender = calculateDamage(attacker, defender)
      const damageToAttacker = defender.currentAttack

      newLog.push(`${attacker.name} attacked ${defender.name}!`)

      // Apply damage
      defender.currentHp -= damageToDefender
      attacker.currentHp -= damageToAttacker

      // Check for deaths
      if (defender.currentHp <= 0) {
        newEnemy.field = newEnemy.field.filter((_, i) => i !== targetIndex)
        newEnemy.graveyard.push(defender.id)
        newLog.push(`${defender.name} was destroyed!`)
      } else {
        newEnemy.field[targetIndex] = defender
      }

      if (attacker.currentHp <= 0) {
        newPlayer.field = newPlayer.field.filter((_, i) => i !== attackerIndex)
        newPlayer.graveyard.push(attacker.id)
        newLog.push(`${attacker.name} was destroyed!`)
      } else {
        newPlayer.field[attackerIndex] = { ...attacker, canAttack: false }
      }
    }

    // Mark attacker as having attacked
    if (attacker.currentHp > 0) {
      newPlayer.field[attackerIndex] = { ...attacker, canAttack: false }
    }

    set({ player: newPlayer, enemy: newEnemy, battleLog: newLog, selectedCardIndex: null })
  },

  endTurn: () => {
    const state = get()
    if (!state.player || !state.enemy) return

    // Start processing turn
    const newPlayer = { ...state.player }

    // AI Turn
    const newEnemy = { ...state.enemy }
    const newLog = [...state.battleLog, "Enemy's turn"]

    // AI: Gain mana
    newEnemy.maxMana = Math.min(10, newEnemy.maxMana + 1)
    newEnemy.mana = newEnemy.maxMana

    // AI: Draw card
    if (newEnemy.deck.length > 0 && newEnemy.hand.length < 7) {
      const cardId = newEnemy.deck.shift()!
      const card = getCardById(cardId)
      if (card) {
        newEnemy.hand.push(createBattleCard(card))
      }
    }

    // AI: Enable attacks for all creatures
    newEnemy.field = newEnemy.field.map(c => ({ ...c, canAttack: true }))

    // AI: Play cards (simple: play highest cost affordable card)
    const playableCards = newEnemy.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => card.cost <= newEnemy.mana && (card.type !== 'creature' || newEnemy.field.length < 5))
      .sort((a, b) => b.card.cost - a.card.cost)

    for (const { card, index } of playableCards) {
      if (card.cost <= newEnemy.mana) {
        newEnemy.mana -= card.cost
        newEnemy.hand = newEnemy.hand.filter((_, i) => i !== index)

        if (card.type === 'creature') {
          newEnemy.field.push({ ...card, canAttack: false })
          newLog.push(`Enemy played ${card.name}`)
        }
        break // Only play one card for simplicity
      }
    }

    // AI: Attack (attack player directly if possible, otherwise attack creatures)
    for (let i = 0; i < newEnemy.field.length; i++) {
      const attacker = newEnemy.field[i]
      if (!attacker.canAttack) continue

      if (newPlayer.field.length === 0) {
        // Attack player directly
        newPlayer.hp -= attacker.currentAttack
        newLog.push(`Enemy's ${attacker.name} attacked you for ${attacker.currentAttack}!`)
        newEnemy.field[i] = { ...attacker, canAttack: false }

        if (newPlayer.hp <= 0) {
          set({
            player: newPlayer,
            enemy: newEnemy,
            isOver: true,
            winner: 'enemy',
            battleLog: [...newLog, 'You lose!']
          })
          return
        }
      } else {
        // Attack weakest creature
        const weakestIndex = newPlayer.field.reduce(
          (minIdx, c, idx, arr) => (c.currentHp < arr[minIdx].currentHp ? idx : minIdx),
          0
        )
        const defender = newPlayer.field[weakestIndex]

        const damageToDefender = calculateDamage(attacker, defender)
        const damageToAttacker = defender.currentAttack

        defender.currentHp -= damageToDefender
        attacker.currentHp -= damageToAttacker

        newLog.push(`Enemy's ${attacker.name} attacked your ${defender.name}!`)

        if (defender.currentHp <= 0) {
          newPlayer.field = newPlayer.field.filter((_, i) => i !== weakestIndex)
          newLog.push(`Your ${defender.name} was destroyed!`)
        }

        if (attacker.currentHp <= 0) {
          newEnemy.field = newEnemy.field.filter((_, i) => i !== i)
          newLog.push(`Enemy's ${attacker.name} was destroyed!`)
        } else {
          newEnemy.field[i] = { ...attacker, canAttack: false }
        }
      }
    }

    // Start player's new turn
    newPlayer.maxMana = Math.min(10, newPlayer.maxMana + 1)
    newPlayer.mana = newPlayer.maxMana

    // Draw card
    if (newPlayer.deck.length > 0 && newPlayer.hand.length < 7) {
      const cardId = newPlayer.deck.shift()!
      const card = getCardById(cardId)
      if (card) {
        newPlayer.hand.push(createBattleCard(card))
        newLog.push(`You drew ${card.name}`)
      }
    }

    // Enable attacks
    newPlayer.field = newPlayer.field.map(c => ({ ...c, canAttack: true }))

    set({
      player: newPlayer,
      enemy: newEnemy,
      turnNumber: state.turnNumber + 1,
      battleLog: newLog
    })
  }
}))
