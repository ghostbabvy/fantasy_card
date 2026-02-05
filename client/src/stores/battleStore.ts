import { create } from 'zustand'
import { cards, getCardById } from '../data/cards'
import { BattleCard, Card, elementAdvantages, StatusEffect, Rarity, AttackTarget } from '../types'
import { ChallengeLevel, AIBehavior } from '../data/challengeLevels'
import { useGameStore } from './gameStore'

// New player structure with active card and bench
interface BattlePlayer {
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  deck: string[]
  hand: BattleCard[]
  active: BattleCard | null  // Single active card
  bench: BattleCard[]        // Up to 3 waiting cards
  graveyard: string[]
}

interface BattleState {
  isInBattle: boolean
  player: BattlePlayer | null
  enemy: BattlePlayer | null
  turn: 'player' | 'enemy'
  turnNumber: number
  phase: 'draw' | 'main' | 'attack' | 'end'
  isOver: boolean
  winner: 'player' | 'enemy' | null
  selectedAttackIndex: number | null
  battleLog: string[]

  // Knockout tracking - first to 3 wins
  playerKnockouts: number
  enemyKnockouts: number

  // Coin flip
  showCoinFlip: boolean
  coinFlipResult: 'player' | 'enemy' | null
  coinFlipComplete: boolean

  // When active faints, player must choose replacement
  needsToChooseActive: boolean

  // Bench targeting for attacks
  selectingBenchTarget: boolean
  pendingBenchAttack: { attackIndex: number, target: AttackTarget } | null

  // Challenge mode
  isChallengeBattle: boolean
  challengeLevel: ChallengeLevel | null
  knockoutsToWin: number
  aiDamageModifier: number
  aiBehavior: AIBehavior

  // Star rating (1-3) based on performance
  battleStars: number

  // Actions
  startBattle: (deckCardIds: string[]) => void
  startChallengeBattle: (deckCardIds: string[], level: ChallengeLevel) => void
  endBattle: () => void
  playCardToActive: (handIndex: number) => void
  playCardToBench: (handIndex: number) => void
  swapActive: (benchIndex: number) => void
  promoteFromBench: (benchIndex: number) => void  // Choose replacement when fainted
  attack: (attackIndex: number) => void
  useSpell: (handIndex: number, targetType: 'self' | 'enemy' | 'bench', targetIndex?: number) => void
  endTurn: () => void
  selectAttack: (index: number | null) => void
  completeCoinFlip: () => void
  drawCard: () => void  // Manually draw a card from deck
  retreatActive: (handIndex: number) => void  // Retreat active to hand, play new creature (costs 2 energy)
  attackBenchTarget: (benchIndex: number) => void  // Attack a specific bench card
  cancelBenchTarget: () => void  // Cancel bench targeting mode
}

const MAX_BENCH = 3
const MAX_HAND = 10

// Calculate stars based on knockouts taken
// 3 stars: 0 knockouts (perfect), 2 stars: 1 knockout (good), 1 star: 2+ knockouts (barely won)
function calculateStars(enemyKnockouts: number): number {
  if (enemyKnockouts === 0) return 3
  if (enemyKnockouts === 1) return 2
  return 1
}

function createBattleCard(card: Card, isPlayerCard: boolean = false, hpBonus: number = 0): BattleCard {
  // Get attack power from first attack, or 0 if no attacks
  const attackPower = card.attacks && card.attacks.length > 0
    ? card.attacks[0].damage
    : 0

  // Default player bonus is +20 HP if not specified
  const finalHpBonus = isPlayerCard && hpBonus === 0 ? 20 : hpBonus

  return {
    ...card,
    instanceId: `${card.id}_${Date.now()}_${Math.random()}`,
    currentHp: (card.hp || 0) + finalHpBonus,
    hp: (card.hp || 0) + finalHpBonus,  // Also increase max HP
    currentAttack: attackPower,
    canAttack: false,
    hasAttackedThisTurn: false,
    statusEffects: []
  }
}

// Parse attack effect string to extract status effects
function parseStatusEffect(effect: string, attackName: string): StatusEffect | null {
  const effectLower = effect.toLowerCase()

  // Stun effect
  if (effectLower.includes('stun') || effectLower.includes('skip')) {
    return { type: 'stun', duration: 1, value: 0, source: attackName }
  }

  // Poison effect (X damage per turn)
  const poisonMatch = effectLower.match(/poison[:\s]*(\d+)/)
  if (poisonMatch || effectLower.includes('poison')) {
    const damage = poisonMatch ? parseInt(poisonMatch[1]) : 15
    return { type: 'poison', duration: 3, value: damage, source: attackName }
  }

  // Burn effect (X damage per turn)
  const burnMatch = effectLower.match(/burn[:\s]*(\d+)/)
  if (burnMatch || effectLower.includes('burn') || effectLower.includes('scorch')) {
    const damage = burnMatch ? parseInt(burnMatch[1]) : 10
    return { type: 'burn', duration: 3, value: damage, source: attackName }
  }

  // Shield effect (block X damage)
  const shieldMatch = effectLower.match(/shield[:\s]*(\d+)/) || effectLower.match(/block[:\s]*(\d+)/)
  if (shieldMatch) {
    return { type: 'shield', duration: 2, value: parseInt(shieldMatch[1]), source: attackName }
  }

  // Weaken effect (-30% attack)
  if (effectLower.includes('weaken') || effectLower.includes('-30%')) {
    return { type: 'weaken', duration: 2, value: 30, source: attackName }
  }

  // Energy gain
  const energyMatch = effectLower.match(/\+(\d+)\s*energy/) || effectLower.match(/gain\s*(\d+)\s*energy/)
  if (energyMatch) {
    return { type: 'energyGain', duration: 0, value: parseInt(energyMatch[1]), source: attackName }
  }

  return null
}

// Apply status effect to a card (adds or refreshes)
function applyStatusEffect(card: BattleCard, effect: StatusEffect): void {
  // Check if already has this effect type
  const existing = card.statusEffects.find(e => e.type === effect.type)
  if (existing) {
    // Refresh duration, take higher value
    existing.duration = Math.max(existing.duration, effect.duration)
    existing.value = Math.max(existing.value, effect.value)
  } else {
    card.statusEffects.push({ ...effect })
  }
}

// Process poison/burn damage at turn start/end
function processStatusDamage(card: BattleCard, log: string[]): number {
  let totalDamage = 0

  for (const effect of card.statusEffects) {
    if (effect.type === 'poison' || effect.type === 'burn') {
      totalDamage += effect.value
      const icon = effect.type === 'poison' ? '🧪' : '🔥'
      log.push(`${icon} ${card.name} takes ${effect.value} ${effect.type} damage!`)
    }
  }

  return totalDamage
}

// Tick down effect durations and remove expired
function tickStatusEffects(card: BattleCard): void {
  card.statusEffects = card.statusEffects.filter(effect => {
    effect.duration--
    return effect.duration > 0
  })
}

// Check if card is stunned
function isStunned(card: BattleCard): boolean {
  return card.statusEffects.some(e => e.type === 'stun')
}

// Get shield value
function getShieldValue(card: BattleCard): number {
  const shield = card.statusEffects.find(e => e.type === 'shield')
  return shield ? shield.value : 0
}

// Reduce shield after taking damage
function reduceShield(card: BattleCard, damage: number): number {
  const shield = card.statusEffects.find(e => e.type === 'shield')
  if (shield && shield.value > 0) {
    const blocked = Math.min(shield.value, damage)
    shield.value -= blocked
    if (shield.value <= 0) {
      card.statusEffects = card.statusEffects.filter(e => e.type !== 'shield')
    }
    return damage - blocked
  }
  return damage
}

// Get weaken modifier (returns multiplier like 0.7 for -30%)
function getWeakenModifier(card: BattleCard): number {
  const weaken = card.statusEffects.find(e => e.type === 'weaken')
  if (weaken) {
    return 1 - (weaken.value / 100)
  }
  return 1
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createBattlePlayer(deckCardIds: string[], isPlayer: boolean = false): BattlePlayer {
  // Ensure we have a valid array
  const cardIds = Array.isArray(deckCardIds) ? [...deckCardIds] : []

  const shuffledDeck = shuffleArray(cardIds)
  const hand: BattleCard[] = []

  // Player draws 6 cards, AI draws 4 (gives player advantage)
  const drawCount = isPlayer ? 6 : 4
  for (let i = 0; i < drawCount && shuffledDeck.length > 0; i++) {
    const cardId = shuffledDeck.shift()!
    const card = getCardById(cardId)
    if (card) {
      hand.push(createBattleCard(card, isPlayer))  // Player cards get HP bonus
    }
  }

  return {
    hp: 100,
    maxHp: 100,
    energy: isPlayer ? 3 : 2,      // Player starts with 3 energy, AI with 2
    maxEnergy: isPlayer ? 3 : 2,
    deck: shuffledDeck,
    hand,
    active: null,
    bench: [],
    graveyard: []
  }
}

function createAIDeck(): string[] {
  // Create a WEAKER AI deck - mostly common/uncommon, no spells
  // This makes the game easier like Pokemon TCG Pocket
  const aiCards: string[] = []

  // Get card pools - only creatures, no spells!
  const creatures = cards.filter(c => c.type === 'creature')
  const commonCreatures = creatures.filter(c => c.rarity === 'common')
  const uncommonCreatures = creatures.filter(c => c.rarity === 'uncommon')

  // AI deck is mostly commons with a few uncommons - NO rare/epic/legendary
  // Add 4 uncommon creatures
  for (let i = 0; i < 4 && uncommonCreatures.length > 0; i++) {
    aiCards.push(uncommonCreatures[Math.floor(Math.random() * uncommonCreatures.length)].id)
  }

  // Fill rest with common creatures (16 commons)
  while (aiCards.length < 20) {
    aiCards.push(commonCreatures[Math.floor(Math.random() * commonCreatures.length)].id)
  }

  return aiCards.slice(0, 20)
}

// Create AI deck for challenge mode with specific rarities
function createChallengeAIDeck(allowedRarities: Rarity[], useSpells: boolean): string[] {
  const aiCards: string[] = []

  // Get card pools based on allowed rarities
  const creatures = cards.filter(c => c.type === 'creature' && allowedRarities.includes(c.rarity))
  const spells = useSpells
    ? cards.filter(c => c.type === 'spell' && allowedRarities.includes(c.rarity))
    : []

  // Add some spells if enabled (max 4)
  const spellCount = useSpells ? Math.min(4, spells.length) : 0
  for (let i = 0; i < spellCount; i++) {
    aiCards.push(spells[Math.floor(Math.random() * spells.length)].id)
  }

  // Fill rest with creatures
  while (aiCards.length < 20 && creatures.length > 0) {
    aiCards.push(creatures[Math.floor(Math.random() * creatures.length)].id)
  }

  // Shuffle the deck
  return shuffleArray(aiCards).slice(0, 20)
}

// Create battle player for challenge mode with custom HP bonus
function createChallengeBattlePlayer(deckCardIds: string[], isPlayer: boolean, hpBonus: number): BattlePlayer {
  const cardIds = Array.isArray(deckCardIds) ? [...deckCardIds] : []
  const shuffledDeck = shuffleArray(cardIds)
  const hand: BattleCard[] = []

  const drawCount = isPlayer ? 6 : 4
  for (let i = 0; i < drawCount && shuffledDeck.length > 0; i++) {
    const cardId = shuffledDeck.shift()!
    const card = getCardById(cardId)
    if (card) {
      hand.push(createBattleCard(card, isPlayer, isPlayer ? hpBonus : 0))
    }
  }

  return {
    hp: 100,
    maxHp: 100,
    energy: isPlayer ? 3 : 2,
    maxEnergy: isPlayer ? 3 : 2,
    deck: shuffledDeck,
    hand,
    active: null,
    bench: [],
    graveyard: []
  }
}

function calculateDamage(attacker: BattleCard, defender: BattleCard, attackDamage: number, isAIAttacking: boolean = false, aiDamageModifier: number = 0.7): number {
  let damage = attackDamage

  // AI damage modifier (default 70% = 30% less damage)
  if (isAIAttacking) {
    damage = Math.floor(damage * aiDamageModifier)
  }

  // Apply weaken effect if attacker is weakened
  damage = Math.floor(damage * getWeakenModifier(attacker))

  // Element advantage bonus (50% more damage) - SUPER EFFECTIVE!
  if (elementAdvantages[attacker.element] === defender.element) {
    damage = Math.floor(damage * 1.5)
  }

  // Element disadvantage (50% less damage) - NOT VERY EFFECTIVE
  if (elementAdvantages[defender.element] === attacker.element) {
    damage = Math.floor(damage * 0.5)
  }

  return Math.max(1, damage) // Minimum 1 damage
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
  selectedAttackIndex: null,
  battleLog: [],
  playerKnockouts: 0,
  enemyKnockouts: 0,
  showCoinFlip: false,
  coinFlipResult: null,
  coinFlipComplete: false,
  needsToChooseActive: false,

  // Bench targeting defaults
  selectingBenchTarget: false,
  pendingBenchAttack: null,

  // Challenge mode defaults
  isChallengeBattle: false,
  challengeLevel: null,
  knockoutsToWin: 3,
  aiDamageModifier: 0.7,
  aiBehavior: 'weakest' as AIBehavior,
  battleStars: 0,

  startBattle: (deckCardIds) => {
    // Ensure valid deck
    if (!deckCardIds || !Array.isArray(deckCardIds) || deckCardIds.length === 0) {
      console.error('Invalid deck provided to startBattle')
      return
    }

    const player = createBattlePlayer(deckCardIds, true)  // true = isPlayer
    const enemy = createBattlePlayer(createAIDeck(), false)

    // Player goes first 80% of the time (easier like Pokemon TCG Pocket)
    const coinFlipResult: 'player' | 'enemy' = Math.random() < 0.8 ? 'player' : 'enemy'

    set({
      isInBattle: true,
      player,
      enemy,
      turn: coinFlipResult,
      turnNumber: 1,
      phase: 'main',
      isOver: false,
      winner: null,
      selectedAttackIndex: null,
      battleLog: ['First to knock out 3 cards wins!'],
      playerKnockouts: 0,
      enemyKnockouts: 0,
      showCoinFlip: true,
      coinFlipResult,
      coinFlipComplete: false,
      needsToChooseActive: false,
      isChallengeBattle: false,
      challengeLevel: null,
      knockoutsToWin: 3,
      aiDamageModifier: 0.7,
      aiBehavior: 'weakest'
    })
  },

  startChallengeBattle: (deckCardIds, level) => {
    if (!deckCardIds || !Array.isArray(deckCardIds) || deckCardIds.length === 0) {
      console.error('Invalid deck provided to startChallengeBattle')
      return
    }

    // Create player with level-specific HP bonus
    const player = createChallengeBattlePlayer(deckCardIds, true, level.playerHpBonus)

    // Create AI deck based on level config
    const aiDeck = createChallengeAIDeck(level.aiDeckRarities, level.aiUsesSpells)
    const enemy = createChallengeBattlePlayer(aiDeck, false, 0)

    // Challenge mode: player always goes first for fairness
    const coinFlipResult: 'player' | 'enemy' = 'player'

    const battleMessage = level.isBoss
      ? `BOSS BATTLE: ${level.bossName}! First to knock out ${level.knockoutsToWin} cards wins!`
      : `Challenge ${level.level}: First to knock out ${level.knockoutsToWin} cards wins!`

    set({
      isInBattle: true,
      player,
      enemy,
      turn: coinFlipResult,
      turnNumber: 1,
      phase: 'main',
      isOver: false,
      winner: null,
      selectedAttackIndex: null,
      battleLog: [battleMessage],
      playerKnockouts: 0,
      enemyKnockouts: 0,
      showCoinFlip: true,
      coinFlipResult,
      coinFlipComplete: false,
      needsToChooseActive: false,
      isChallengeBattle: true,
      challengeLevel: level,
      knockoutsToWin: level.knockoutsToWin,
      aiDamageModifier: level.aiDamageModifier,
      aiBehavior: level.aiBehavior
    })
  },

  completeCoinFlip: () => {
    const state = get()
    const newLog = [`Coin flip: ${state.coinFlipResult === 'player' ? 'You go' : 'Enemy goes'} first!`]

    if (state.coinFlipResult === 'enemy' && state.player && state.enemy) {
      // Enemy goes first - run their setup turn
      const newEnemy = { ...state.enemy }

      // AI plays a creature to active if possible
      const creatures = newEnemy.hand.filter(c => c.type === 'creature')
      if (creatures.length > 0 && !newEnemy.active) {
        const chosen = creatures[0]
        newEnemy.hand = newEnemy.hand.filter(c => c.instanceId !== chosen.instanceId)
        newEnemy.active = { ...chosen, canAttack: false }
        newLog.push(`Enemy placed ${chosen.name} as active!`)
      }

      // Player's turn setup
      const newPlayer = { ...state.player }
      newPlayer.maxEnergy = Math.min(10, newPlayer.maxEnergy + 1)
      newPlayer.energy = newPlayer.maxEnergy

      // Draw a card
      if (newPlayer.deck.length > 0 && newPlayer.hand.length < MAX_HAND) {
        const cardId = newPlayer.deck.shift()!
        const card = getCardById(cardId)
        if (card) {
          newPlayer.hand.push(createBattleCard(card, true))
          newLog.push(`You drew ${card.name}`)
        }
      }

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
      set({
        showCoinFlip: false,
        coinFlipComplete: true,
        battleLog: [...newLog, 'Place a creature as your active card to begin!']
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
      coinFlipComplete: false,
      isChallengeBattle: false,
      challengeLevel: null,
      knockoutsToWin: 3,
      aiDamageModifier: 0.7,
      aiBehavior: 'weakest'
    })
  },

  selectAttack: (index) => {
    set({ selectedAttackIndex: index })
  },

  playCardToActive: (handIndex) => {
    const state = get()
    if (!state.player || state.turn !== 'player') return

    const card = state.player.hand[handIndex]
    if (!card || card.type !== 'creature') return
    if (state.player.active) return // Already have active

    const newPlayer = { ...state.player }
    newPlayer.hand = newPlayer.hand.filter((_, i) => i !== handIndex)
    // Card CAN attack on the turn it's played (like Pokemon TCG)
    newPlayer.active = { ...card, canAttack: true }

    // Track card usage
    useGameStore.getState().trackCardUsage(card.id)

    set({
      player: newPlayer,
      battleLog: [...state.battleLog, `You placed ${card.name} as your active! It's ready to attack!`]
    })
  },

  playCardToBench: (handIndex) => {
    const state = get()
    if (!state.player || state.turn !== 'player') return

    const card = state.player.hand[handIndex]
    if (!card || card.type !== 'creature') return
    if (state.player.bench.length >= MAX_BENCH) return

    const newPlayer = { ...state.player }
    newPlayer.hand = newPlayer.hand.filter((_, i) => i !== handIndex)
    newPlayer.bench = [...newPlayer.bench, { ...card, canAttack: false }]

    // Track card usage
    useGameStore.getState().trackCardUsage(card.id)

    set({
      player: newPlayer,
      battleLog: [...state.battleLog, `You placed ${card.name} on your bench.`]
    })
  },

  swapActive: (benchIndex) => {
    const state = get()
    if (!state.player || state.turn !== 'player') return
    if (state.needsToChooseActive) return // Use promoteFromBench when fainted
    if (benchIndex >= state.player.bench.length) return

    const newPlayer = { ...state.player }
    const benchCard = newPlayer.bench[benchIndex]

    // Remove the bench card first
    newPlayer.bench = newPlayer.bench.filter((_, i) => i !== benchIndex)

    // If there's an active card, move it to bench (there's always room now since we removed one)
    if (newPlayer.active) {
      newPlayer.bench.push({ ...newPlayer.active, canAttack: false })
    }

    // The swapped-in card can attack immediately (like Pokemon TCG)
    newPlayer.active = { ...benchCard, canAttack: true }

    set({
      player: newPlayer,
      battleLog: [...state.battleLog, `You swapped in ${benchCard.name}!`]
    })
  },

  promoteFromBench: (benchIndex) => {
    const state = get()
    if (!state.player || !state.needsToChooseActive) return
    if (benchIndex >= state.player.bench.length) return

    const newPlayer = { ...state.player }
    const benchCard = newPlayer.bench[benchIndex]

    newPlayer.bench = newPlayer.bench.filter((_, i) => i !== benchIndex)
    // Card CAN attack immediately when promoted (gives player a fighting chance)
    newPlayer.active = { ...benchCard, canAttack: true }

    set({
      player: newPlayer,
      needsToChooseActive: false,
      battleLog: [...state.battleLog, `You sent out ${benchCard.name}! It's ready to attack!`]
    })
  },

  attack: (attackIndex) => {
    const state = get()
    if (!state.player || !state.enemy || state.turn !== 'player') return
    if (!state.player.active || !state.player.active.canAttack) return

    const attacker = state.player.active

    // Check if attacker is stunned
    if (isStunned(attacker)) {
      const newPlayer = { ...state.player }
      const newLog = [...state.battleLog]
      newLog.push(`${attacker.name} is stunned and cannot attack!`)
      // Remove stun after being checked
      attacker.statusEffects = attacker.statusEffects.filter(e => e.type !== 'stun')
      newPlayer.active = { ...attacker, canAttack: false }
      set({ player: newPlayer, battleLog: newLog })
      return
    }

    const attackData = attacker.attacks?.[attackIndex]
    if (!attackData) return
    if (state.player.energy < attackData.cost) return

    const target = attackData.target || 'active'

    // Handle all-bench attack (hits all bench cards at once)
    if (target === 'all-bench' && state.enemy.bench.length > 0) {
      const newPlayer = { ...state.player }
      const newEnemy = { ...state.enemy }
      const newLog = [...state.battleLog]

      newPlayer.energy -= attackData.cost
      newLog.push(`${attacker.name} used ${attackData.name} targeting all bench cards!`)

      // Damage all bench cards
      newEnemy.bench = newEnemy.bench.map(benchCard => {
        const damage = calculateDamage(attacker, benchCard, attackData.damage)
        benchCard.currentHp -= damage
        newLog.push(`${benchCard.name} took ${damage} damage!`)
        return benchCard
      })

      // Remove knocked out bench cards
      const knockedOut = newEnemy.bench.filter(c => c.currentHp <= 0)
      knockedOut.forEach(card => {
        newLog.push(`${card.name} was knocked out from the bench!`)
        newEnemy.graveyard.push(card.id)
      })
      newEnemy.bench = newEnemy.bench.filter(c => c.currentHp > 0)

      // Update knockouts
      const newPlayerKnockouts = state.playerKnockouts + knockedOut.length
      if (newPlayerKnockouts >= state.knockoutsToWin) {
        set({
          player: newPlayer,
          enemy: newEnemy,
          playerKnockouts: newPlayerKnockouts,
          isOver: true,
          winner: 'player',
          battleStars: calculateStars(state.enemyKnockouts),
          battleLog: [...newLog, `You knocked out ${state.knockoutsToWin} cards! You win!`]
        })
        return
      }

      newPlayer.active = { ...attacker, canAttack: false }
      set({
        player: newPlayer,
        enemy: newEnemy,
        playerKnockouts: newPlayerKnockouts,
        battleLog: newLog,
        selectedAttackIndex: null
      })
      return
    }

    // Handle bench-only or any targeting (requires selecting a target)
    if ((target === 'bench' || target === 'any') && state.enemy.bench.length > 0) {
      // Enter bench targeting mode
      set({
        selectingBenchTarget: true,
        pendingBenchAttack: { attackIndex, target },
        battleLog: [...state.battleLog, `Select a target for ${attackData.name}!`]
      })
      return
    }

    // If bench-only attack but no bench targets, can't use it
    if (target === 'bench' && state.enemy.bench.length === 0) {
      set({
        battleLog: [...state.battleLog, `No bench targets available for ${attackData.name}!`]
      })
      return
    }

    const newPlayer = { ...state.player }
    const newEnemy = { ...state.enemy }
    const newLog = [...state.battleLog]

    // Spend energy
    newPlayer.energy -= attackData.cost

    // Parse and apply status effect from attack to self (like shield, energy gain)
    if (attackData.effect) {
      const statusEffect = parseStatusEffect(attackData.effect, attackData.name)
      if (statusEffect) {
        if (statusEffect.type === 'shield') {
          applyStatusEffect(attacker, statusEffect)
          newLog.push(`${attacker.name} gained a shield blocking ${statusEffect.value} damage!`)
        } else if (statusEffect.type === 'energyGain') {
          newPlayer.energy = Math.min(10, newPlayer.energy + statusEffect.value)
          newLog.push(`${attacker.name} gained ${statusEffect.value} energy!`)
        }
      }
    }

    if (newEnemy.active) {
      // Attack enemy's active card
      const defender = newEnemy.active
      let damage = calculateDamage(attacker, defender, attackData.damage)

      // Apply shield reduction
      const shieldBefore = getShieldValue(defender)
      if (shieldBefore > 0) {
        damage = reduceShield(defender, damage)
        const blocked = shieldBefore - getShieldValue(defender)
        if (blocked > 0) {
          newLog.push(`${defender.name}'s shield blocked ${blocked} damage!`)
        }
      }

      newLog.push(`${attacker.name} used ${attackData.name} for ${damage} damage!`)
      defender.currentHp -= damage

      // Handle attack effects on enemy
      const attackEffect = attackData.effect?.toLowerCase() || ''

      // Apply status effects to enemy (stun, poison, burn, weaken)
      if (attackData.effect) {
        const statusEffect = parseStatusEffect(attackData.effect, attackData.name)
        if (statusEffect && ['stun', 'poison', 'burn', 'weaken'].includes(statusEffect.type)) {
          applyStatusEffect(defender, statusEffect)
          const effectIcons: Record<string, string> = {
            stun: '⚡', poison: '🧪', burn: '🔥', weaken: '💔'
          }
          newLog.push(`${effectIcons[statusEffect.type]} ${defender.name} is now ${statusEffect.type}ed!`)
        }
      }

      // Handle healing effects
      if (attackEffect.includes('heal')) {
        const healMatch = attackEffect.match(/heal.*?(\d+)/)
        const healAmount = healMatch ? parseInt(healMatch[1]) : 20
        const newHp = Math.min(attacker.hp || 100, attacker.currentHp + healAmount)
        const actualHeal = newHp - attacker.currentHp
        attacker.currentHp = newHp
        if (actualHeal > 0) {
          newLog.push(`${attacker.name} healed ${actualHeal} HP!`)
        }
      }

      // Handle life steal / drain effects
      if (attackEffect.includes('steal') || attackEffect.includes('drain')) {
        const stealMatch = attackEffect.match(/(\d+)/)
        const stealAmount = stealMatch ? parseInt(stealMatch[1]) : Math.floor(damage / 2)
        const newHp = Math.min(attacker.hp || 100, attacker.currentHp + stealAmount)
        const actualSteal = newHp - attacker.currentHp
        attacker.currentHp = newHp
        if (actualSteal > 0) {
          newLog.push(`${attacker.name} stole ${actualSteal} HP!`)
        }
      }

      // Handle draw card effect
      if (attackEffect.includes('draw')) {
        const drawMatch = attackEffect.match(/draw (\d+)/)
        const drawCount = drawMatch ? parseInt(drawMatch[1]) : 1
        for (let i = 0; i < drawCount && newPlayer.deck.length > 0 && newPlayer.hand.length < MAX_HAND; i++) {
          const cardId = newPlayer.deck.shift()!
          const card = getCardById(cardId)
          if (card) {
            newPlayer.hand.push(createBattleCard(card, true))
            newLog.push(`You drew ${card.name}`)
          }
        }
      }

      if (defender.currentHp <= 0) {
        const newPlayerKnockouts = state.playerKnockouts + 1
        newLog.push(`${defender.name} was knocked out!`)
        newLog.push(`Knockouts: You ${newPlayerKnockouts} - Enemy ${state.enemyKnockouts}`)
        newEnemy.graveyard.push(defender.id)
        newEnemy.active = null

        // Check if player wins
        if (newPlayerKnockouts >= state.knockoutsToWin) {
          set({
            player: newPlayer,
            enemy: newEnemy,
            playerKnockouts: newPlayerKnockouts,
            isOver: true,
            winner: 'player',
            battleStars: calculateStars(state.enemyKnockouts),
            battleLog: [...newLog, `You knocked out ${state.knockoutsToWin} cards! You win!`]
          })
          return
        }

        // Promote from bench if available
        if (newEnemy.bench.length > 0) {
          newEnemy.active = { ...newEnemy.bench[0], canAttack: false }
          newEnemy.bench = newEnemy.bench.slice(1)
          newLog.push(`Enemy sent out ${newEnemy.active.name}!`)
        }

        // Mark as attacked and update knockouts
        newPlayer.active = { ...attacker, canAttack: false }
        set({
          player: newPlayer,
          enemy: newEnemy,
          playerKnockouts: newPlayerKnockouts,
          battleLog: newLog,
          selectedAttackIndex: null
        })
        return
      } else {
        newEnemy.active = defender
      }
    } else {
      // Attack enemy player directly
      const damage = attackData.damage
      newEnemy.hp -= damage
      newLog.push(`${attacker.name} attacked enemy directly for ${damage} damage!`)

      if (newEnemy.hp <= 0) {
        set({
          player: newPlayer,
          enemy: newEnemy,
          isOver: true,
          winner: 'player',
          battleStars: calculateStars(state.enemyKnockouts),
          battleLog: [...newLog, 'You win!']
        })
        return
      }
    }

    // Mark as attacked
    newPlayer.active = { ...attacker, canAttack: false }

    set({
      player: newPlayer,
      enemy: newEnemy,
      battleLog: newLog,
      selectedAttackIndex: null
    })
  },

  useSpell: (handIndex, targetType, targetIndex) => {
    const state = get()
    if (!state.player || !state.enemy || state.turn !== 'player') return

    const spell = state.player.hand[handIndex]
    if (!spell || spell.type !== 'spell') return
    if (state.player.energy < spell.cost) return

    const newPlayer = { ...state.player }
    const newEnemy = { ...state.enemy }
    const newLog = [...state.battleLog]

    // Spend energy and remove spell from hand
    newPlayer.energy -= spell.cost
    newPlayer.hand = newPlayer.hand.filter((_, i) => i !== handIndex)
    newPlayer.graveyard.push(spell.id)

    // Parse spell effect
    const effect = spell.effect?.toLowerCase() || ''
    newLog.push(`You cast ${spell.name}!`)

    // Handle fully heal / max HP
    if (effect.includes('fully heal') || effect.includes('full heal')) {
      if (newPlayer.active) {
        newPlayer.active.currentHp = newPlayer.active.hp || 100
        newLog.push(`${newPlayer.active.name} fully restored to ${newPlayer.active.currentHp} HP!`)
      }
    }
    // Handle heal all creatures
    else if (effect.includes('heal all')) {
      const healMatch = effect.match(/heal all.*?(\d+)/)
      const healAmount = healMatch ? parseInt(healMatch[1]) : 40

      if (newPlayer.active) {
        const beforeHp = newPlayer.active.currentHp
        newPlayer.active.currentHp = Math.min(newPlayer.active.hp || 100, newPlayer.active.currentHp + healAmount)
        newLog.push(`${newPlayer.active.name} healed for ${newPlayer.active.currentHp - beforeHp} HP!`)
      }
      newPlayer.bench.forEach(card => {
        const beforeHp = card.currentHp
        card.currentHp = Math.min(card.hp || 100, card.currentHp + healAmount)
        newLog.push(`${card.name} healed for ${card.currentHp - beforeHp} HP!`)
      })
    }
    // Handle regular heal
    else if (effect.includes('heal')) {
      const healMatch = effect.match(/heal.*?(\d+)/)
      const healAmount = healMatch ? parseInt(healMatch[1]) : 30

      if (targetType === 'self' && newPlayer.active) {
        newPlayer.active.currentHp = Math.min(
          newPlayer.active.hp || 100,
          newPlayer.active.currentHp + healAmount
        )
        newLog.push(`${newPlayer.active.name} healed for ${healAmount} HP!`)
      } else if (targetType === 'bench' && targetIndex !== undefined && newPlayer.bench[targetIndex]) {
        const benchCard = newPlayer.bench[targetIndex]
        benchCard.currentHp = Math.min(benchCard.hp || 100, benchCard.currentHp + healAmount)
        newLog.push(`${benchCard.name} healed for ${healAmount} HP!`)
      } else if (newPlayer.active) {
        // Default to healing active
        newPlayer.active.currentHp = Math.min(
          newPlayer.active.hp || 100,
          newPlayer.active.currentHp + healAmount
        )
        newLog.push(`${newPlayer.active.name} healed for ${healAmount} HP!`)
      }
    }

    // Handle +HP bonus
    if (effect.includes('+') && effect.includes('hp')) {
      const hpMatch = effect.match(/\+(\d+)\s*hp/)
      const hpBonus = hpMatch ? parseInt(hpMatch[1]) : 30

      if (newPlayer.active) {
        newPlayer.active.currentHp += hpBonus
        newPlayer.active.hp = (newPlayer.active.hp || 100) + hpBonus
        newLog.push(`${newPlayer.active.name} gained ${hpBonus} max HP!`)
      }
    }

    // Handle energy gain
    if (effect.includes('gain') && effect.includes('energy')) {
      const energyMatch = effect.match(/gain (\d+).*energy/)
      const energyGain = energyMatch ? parseInt(energyMatch[1]) : 2

      newPlayer.energy = Math.min(10, newPlayer.energy + energyGain)
      newLog.push(`You gained ${energyGain} energy!`)
    }

    // Handle life drain / siphon (damage + heal)
    if (effect.includes('siphon') || effect.includes('drain') || (effect.includes('damage') && effect.includes('heal'))) {
      const damageMatch = effect.match(/deal (\d+)/)
      const damageAmount = damageMatch ? parseInt(damageMatch[1]) : 50

      if (newEnemy.active && newPlayer.active) {
        newEnemy.active.currentHp -= damageAmount
        newPlayer.active.currentHp = Math.min(newPlayer.active.hp || 100, newPlayer.active.currentHp + damageAmount)
        newLog.push(`Drained ${damageAmount} HP from ${newEnemy.active.name} to ${newPlayer.active.name}!`)

        if (newEnemy.active.currentHp <= 0) {
          newLog.push(`${newEnemy.active.name} was knocked out!`)
          newEnemy.graveyard.push(newEnemy.active.id)
          newEnemy.active = null

          if (newEnemy.bench.length > 0) {
            newEnemy.active = { ...newEnemy.bench[0], canAttack: false }
            newEnemy.bench = newEnemy.bench.slice(1)
            newLog.push(`Enemy sent out ${newEnemy.active.name}!`)
          } else if (!newEnemy.active) {
            set({
              player: newPlayer,
              enemy: newEnemy,
              isOver: true,
              winner: 'player',
              battleStars: calculateStars(state.enemyKnockouts),
              battleLog: [...newLog, 'All enemy creatures defeated! You win!']
            })
            return
          }
        }
      }
    }
    // Handle regular damage spell
    else if (effect.includes('damage') || effect.includes('deal')) {
      const damageMatch = effect.match(/(\d+) damage/)
      const damageAmount = damageMatch ? parseInt(damageMatch[1]) : 40

      // Check for "damage to all"
      if (effect.includes('all')) {
        if (newEnemy.active) {
          newEnemy.active.currentHp -= damageAmount
          newLog.push(`${spell.name} dealt ${damageAmount} damage to ${newEnemy.active.name}!`)
        }
        newEnemy.bench.forEach(card => {
          card.currentHp -= damageAmount
          newLog.push(`${spell.name} dealt ${damageAmount} damage to ${card.name}!`)
        })
        // Clean up knocked out creatures
        newEnemy.bench = newEnemy.bench.filter(c => c.currentHp > 0)
      } else if (newEnemy.active) {
        newEnemy.active.currentHp -= damageAmount
        newLog.push(`${spell.name} dealt ${damageAmount} damage to ${newEnemy.active.name}!`)
      }

      // Check if enemy active is knocked out
      if (newEnemy.active && newEnemy.active.currentHp <= 0) {
        newLog.push(`${newEnemy.active.name} was knocked out!`)
        newEnemy.graveyard.push(newEnemy.active.id)
        newEnemy.active = null

        if (newEnemy.bench.length > 0) {
          newEnemy.active = { ...newEnemy.bench[0], canAttack: false }
          newEnemy.bench = newEnemy.bench.slice(1)
          newLog.push(`Enemy sent out ${newEnemy.active.name}!`)
        } else if (!newEnemy.active) {
          set({
            player: newPlayer,
            enemy: newEnemy,
            isOver: true,
            winner: 'player',
            battleStars: calculateStars(state.enemyKnockouts),
            battleLog: [...newLog, 'All enemy creatures defeated! You win!']
          })
          return
        }
      }
    }

    // Handle destroy spell
    if (effect.includes('destroy')) {
      if (newEnemy.active) {
        newLog.push(`${newEnemy.active.name} was destroyed!`)
        newEnemy.graveyard.push(newEnemy.active.id)
        newEnemy.active = null

        if (newEnemy.bench.length > 0) {
          newEnemy.active = { ...newEnemy.bench[0], canAttack: false }
          newEnemy.bench = newEnemy.bench.slice(1)
          newLog.push(`Enemy sent out ${newEnemy.active.name}!`)
        } else {
          set({
            player: newPlayer,
            enemy: newEnemy,
            isOver: true,
            winner: 'player',
            battleStars: calculateStars(state.enemyKnockouts),
            battleLog: [...newLog, 'All enemy creatures defeated! You win!']
          })
          return
        }
      }
    }

    // Handle draw spell
    if (effect.includes('draw')) {
      const drawMatch = effect.match(/draw (\d+)/)
      const drawCount = drawMatch ? parseInt(drawMatch[1]) : 1

      for (let i = 0; i < drawCount && newPlayer.deck.length > 0 && newPlayer.hand.length < MAX_HAND; i++) {
        const cardId = newPlayer.deck.shift()!
        const card = getCardById(cardId)
        if (card) {
          newPlayer.hand.push(createBattleCard(card, true))
          newLog.push(`You drew ${card.name}`)
        }
      }
    }

    // Handle player damage from spell (dark rituals etc)
    if (effect.includes('take') && effect.includes('damage')) {
      const damageMatch = effect.match(/take (\d+)/)
      const selfDamage = damageMatch ? parseInt(damageMatch[1]) : 20
      newPlayer.hp -= selfDamage
      newLog.push(`You took ${selfDamage} damage from the spell!`)

      if (newPlayer.hp <= 0) {
        set({
          player: newPlayer,
          enemy: newEnemy,
          isOver: true,
          winner: 'enemy',
          battleLog: [...newLog, 'You took too much damage! You lose!']
        })
        return
      }
    }

    set({ player: newPlayer, enemy: newEnemy, battleLog: newLog })
  },

  endTurn: () => {
    const state = get()
    if (!state.player || !state.enemy) return

    const newPlayer = { ...state.player }
    const newEnemy = { ...state.enemy }
    const newLog = [...state.battleLog]

    // Process status effects on player's active at end of their turn
    if (newPlayer.active) {
      const poisonBurnDamage = processStatusDamage(newPlayer.active, newLog)
      if (poisonBurnDamage > 0) {
        newPlayer.active.currentHp -= poisonBurnDamage
      }
      tickStatusEffects(newPlayer.active)

      // Check if player's active died from poison/burn
      if (newPlayer.active.currentHp <= 0) {
        const newEnemyKnockouts = state.enemyKnockouts + 1
        newLog.push(`Your ${newPlayer.active.name} was knocked out by status effects!`)
        newPlayer.graveyard.push(newPlayer.active.id)
        newPlayer.active = null

        if (newEnemyKnockouts >= state.knockoutsToWin) {
          set({
            player: newPlayer,
            enemy: newEnemy,
            enemyKnockouts: newEnemyKnockouts,
            isOver: true,
            winner: 'enemy',
            battleLog: [...newLog, `Enemy knocked out ${state.knockoutsToWin} of your cards! You lose!`]
          })
          return
        }

        if (newPlayer.bench.length > 0) {
          newLog.push('Choose a card from your bench!')
          set({
            player: newPlayer,
            enemy: newEnemy,
            enemyKnockouts: newEnemyKnockouts,
            needsToChooseActive: true,
            battleLog: newLog
          })
          return
        }
      }
    }

    newLog.push("--- Enemy's Turn ---")

    // Process status effects on enemy's active at start of their turn
    if (newEnemy.active) {
      const poisonBurnDamage = processStatusDamage(newEnemy.active, newLog)
      if (poisonBurnDamage > 0) {
        newEnemy.active.currentHp -= poisonBurnDamage
      }
      tickStatusEffects(newEnemy.active)

      // Check if enemy's active died from poison/burn
      if (newEnemy.active.currentHp <= 0) {
        const newPlayerKnockouts = state.playerKnockouts + 1
        newLog.push(`Enemy's ${newEnemy.active.name} was knocked out by status effects!`)
        newEnemy.graveyard.push(newEnemy.active.id)
        newEnemy.active = null

        if (newPlayerKnockouts >= state.knockoutsToWin) {
          set({
            player: newPlayer,
            enemy: newEnemy,
            playerKnockouts: newPlayerKnockouts,
            isOver: true,
            winner: 'player',
            battleStars: calculateStars(state.enemyKnockouts),
            battleLog: [...newLog, `You knocked out ${state.knockoutsToWin} cards! You win!`]
          })
          return
        }
      }
    }

    // Enemy turn setup
    newEnemy.maxEnergy = Math.min(10, newEnemy.maxEnergy + 1)
    newEnemy.energy = newEnemy.maxEnergy

    // Enemy draws
    if (newEnemy.deck.length > 0 && newEnemy.hand.length < MAX_HAND) {
      const cardId = newEnemy.deck.shift()!
      const card = getCardById(cardId)
      if (card) {
        newEnemy.hand.push(createBattleCard(card, false))  // false = enemy (no HP bonus)
      }
    }

    // AI: Place active if none
    if (!newEnemy.active) {
      const creatures = newEnemy.hand.filter(c => c.type === 'creature')
      if (creatures.length > 0) {
        const chosen = creatures[0]
        newEnemy.hand = newEnemy.hand.filter(c => c.instanceId !== chosen.instanceId)
        newEnemy.active = { ...chosen, canAttack: true, statusEffects: [] }
        newLog.push(`Enemy placed ${chosen.name} as active!`)
      }
    } else {
      newEnemy.active = { ...newEnemy.active, canAttack: true }
    }

    // AI: Fill bench
    while (newEnemy.bench.length < MAX_BENCH) {
      const creatures = newEnemy.hand.filter(c => c.type === 'creature')
      if (creatures.length === 0) break
      const chosen = creatures[0]
      newEnemy.hand = newEnemy.hand.filter(c => c.instanceId !== chosen.instanceId)
      newEnemy.bench.push({ ...chosen, canAttack: false, statusEffects: [] })
      newLog.push(`Enemy placed ${chosen.name} on bench.`)
    }

    // Check if enemy is stunned
    if (newEnemy.active && isStunned(newEnemy.active)) {
      newLog.push(`Enemy's ${newEnemy.active.name} is stunned and cannot attack!`)
      newEnemy.active.statusEffects = newEnemy.active.statusEffects.filter(e => e.type !== 'stun')
    }
    // AI attack logic - behavior based on challenge level
    else if (newEnemy.active && newEnemy.active.canAttack && newEnemy.active.attacks) {
      const affordableAttacks = newEnemy.active.attacks.filter(a => a.cost <= newEnemy.energy)
      if (affordableAttacks.length > 0) {
        // Select attack based on AI behavior
        let bestAttack
        if (state.aiBehavior === 'weakest') {
          // Use weakest attack - makes game easier
          bestAttack = affordableAttacks.reduce((weakest, a) => a.damage < weakest.damage ? a : weakest)
        } else if (state.aiBehavior === 'strongest') {
          // Use strongest attack
          bestAttack = affordableAttacks.reduce((strongest, a) => a.damage > strongest.damage ? a : strongest)
        } else {
          // 'smart' behavior - choose based on situation
          // Prioritize effects and healing when low HP, otherwise strongest
          const enemyLowHp = newEnemy.active.currentHp < (newEnemy.active.hp || 100) * 0.4
          const hasHealAttack = affordableAttacks.find(a => a.effect?.toLowerCase().includes('heal'))

          if (enemyLowHp && hasHealAttack) {
            bestAttack = hasHealAttack
          } else {
            bestAttack = affordableAttacks.reduce((strongest, a) => a.damage > strongest.damage ? a : strongest)
          }
        }

        newEnemy.energy -= bestAttack.cost

        if (newPlayer.active) {
          const damage = calculateDamage(newEnemy.active, newPlayer.active, bestAttack.damage, true, state.aiDamageModifier)
          newLog.push(`Enemy's ${newEnemy.active.name} used ${bestAttack.name} for ${damage} damage!`)
          newPlayer.active.currentHp -= damage

          // Handle attack healing effect
          if (bestAttack.effect?.toLowerCase().includes('heal')) {
            const healMatch = bestAttack.effect.toLowerCase().match(/heal.*?(\d+)/)
            const healAmount = healMatch ? parseInt(healMatch[1]) : 20
            newEnemy.active.currentHp = Math.min(newEnemy.active.hp || 100, newEnemy.active.currentHp + healAmount)
            newLog.push(`${newEnemy.active.name} healed ${healAmount} HP!`)
          }

          // Handle life steal attack
          if (bestAttack.effect?.toLowerCase().includes('steal') || bestAttack.effect?.toLowerCase().includes('drain')) {
            const stealMatch = bestAttack.effect.toLowerCase().match(/(\d+)/)
            const stealAmount = stealMatch ? parseInt(stealMatch[1]) : damage
            newEnemy.active.currentHp = Math.min(newEnemy.active.hp || 100, newEnemy.active.currentHp + stealAmount)
            newLog.push(`${newEnemy.active.name} stole ${stealAmount} HP!`)
          }

          if (newPlayer.active.currentHp <= 0) {
            const newEnemyKnockouts = state.enemyKnockouts + 1
            newLog.push(`Your ${newPlayer.active.name} was knocked out!`)
            newLog.push(`Knockouts: You ${state.playerKnockouts} - Enemy ${newEnemyKnockouts}`)
            newPlayer.graveyard.push(newPlayer.active.id)
            newPlayer.active = null

            // Check if enemy wins
            if (newEnemyKnockouts >= state.knockoutsToWin) {
              set({
                player: newPlayer,
                enemy: newEnemy,
                enemyKnockouts: newEnemyKnockouts,
                isOver: true,
                winner: 'enemy',
                battleLog: [...newLog, `Enemy knocked out ${state.knockoutsToWin} of your cards! You lose!`]
              })
              return
            }

            if (newPlayer.bench.length > 0) {
              // Let player choose replacement
              newLog.push('Choose a card from your bench!')
              set({
                player: newPlayer,
                enemy: newEnemy,
                enemyKnockouts: newEnemyKnockouts,
                needsToChooseActive: true,
                battleLog: newLog
              })
              return
            } else {
              set({
                player: newPlayer,
                enemy: newEnemy,
                enemyKnockouts: newEnemyKnockouts,
                isOver: true,
                winner: 'enemy',
                battleLog: [...newLog, 'No more cards! You lose!']
              })
              return
            }
          }
        }

        newEnemy.active = { ...newEnemy.active, canAttack: false }
      }
    }

    // Player's turn begins
    newLog.push("--- Your Turn ---")
    newPlayer.maxEnergy = Math.min(10, newPlayer.maxEnergy + 1)
    newPlayer.energy = newPlayer.maxEnergy

    // Draw card
    if (newPlayer.deck.length > 0 && newPlayer.hand.length < MAX_HAND) {
      const cardId = newPlayer.deck.shift()!
      const card = getCardById(cardId)
      if (card) {
        newPlayer.hand.push(createBattleCard(card, true))
        newLog.push(`You drew ${card.name}`)
      }
    }

    // Enable attack for active
    if (newPlayer.active) {
      newPlayer.active = { ...newPlayer.active, canAttack: true }
    }

    set({
      player: newPlayer,
      enemy: newEnemy,
      turnNumber: state.turnNumber + 1,
      battleLog: newLog
    })
  },

  drawCard: () => {
    const state = get()
    if (!state.player || state.turn !== 'player') return
    if (state.player.deck.length === 0) return
    if (state.player.hand.length >= MAX_HAND) return

    const newPlayer = { ...state.player }
    const cardId = newPlayer.deck.shift()!
    const card = getCardById(cardId)

    if (card) {
      newPlayer.hand.push(createBattleCard(card, true))
      set({
        player: newPlayer,
        battleLog: [...state.battleLog, `You drew ${card.name} from your deck!`]
      })
    }
  },

  retreatActive: (handIndex: number) => {
    const state = get()
    if (!state.player || state.turn !== 'player') return
    if (!state.player.active) return

    const RETREAT_COST = 2
    if (state.player.energy < RETREAT_COST) return

    const newCard = state.player.hand[handIndex]
    if (!newCard || newCard.type !== 'creature') return

    const newPlayer = { ...state.player }
    const oldActive = newPlayer.active!

    // Remove new card from hand
    newPlayer.hand = newPlayer.hand.filter((_, i) => i !== handIndex)

    // Add old active back to hand (keeps current HP)
    newPlayer.hand.push(oldActive)

    // Set new active (can't attack this turn)
    newPlayer.active = { ...newCard, canAttack: false }

    // Spend energy
    newPlayer.energy -= RETREAT_COST

    const newLog = [...state.battleLog]
    newLog.push(`${oldActive.name} retreated! ${newCard.name} takes the field!`)

    set({
      player: newPlayer,
      battleLog: newLog
    })
  },

  attackBenchTarget: (benchIndex: number) => {
    const state = get()
    if (!state.player || !state.enemy || !state.selectingBenchTarget || !state.pendingBenchAttack) return
    if (!state.player.active) return

    const { attackIndex, target } = state.pendingBenchAttack
    const attacker = state.player.active
    const attackData = attacker.attacks?.[attackIndex]
    if (!attackData) return

    const newPlayer = { ...state.player }
    const newEnemy = { ...state.enemy }
    const newLog = [...state.battleLog]

    // Get the target - could be bench card or active if 'any' targeting
    let defender: BattleCard | null = null
    let isActiveTarg = false

    if (benchIndex === -1 && target === 'any' && newEnemy.active) {
      // Targeting active card
      defender = newEnemy.active
      isActiveTarg = true
    } else if (benchIndex >= 0 && benchIndex < newEnemy.bench.length) {
      // Targeting bench card
      defender = newEnemy.bench[benchIndex]
    }

    if (!defender) {
      set({ selectingBenchTarget: false, pendingBenchAttack: null })
      return
    }

    // Spend energy
    newPlayer.energy -= attackData.cost

    // Calculate and apply damage
    const damage = calculateDamage(attacker, defender, attackData.damage)
    newLog.push(`${attacker.name} used ${attackData.name} on ${defender.name} for ${damage} damage!`)
    defender.currentHp -= damage

    // Apply status effects
    if (attackData.effect) {
      const statusEffect = parseStatusEffect(attackData.effect, attackData.name)
      if (statusEffect && ['stun', 'poison', 'burn', 'weaken'].includes(statusEffect.type)) {
        applyStatusEffect(defender, statusEffect)
        const effectIcons: Record<string, string> = {
          stun: '⚡', poison: '🧪', burn: '🔥', weaken: '💔'
        }
        newLog.push(`${effectIcons[statusEffect.type]} ${defender.name} is now ${statusEffect.type}ed!`)
      }
    }

    // Check if target is knocked out
    if (defender.currentHp <= 0) {
      const newPlayerKnockouts = state.playerKnockouts + 1
      newLog.push(`${defender.name} was knocked out!`)
      newLog.push(`Knockouts: You ${newPlayerKnockouts} - Enemy ${state.enemyKnockouts}`)
      newEnemy.graveyard.push(defender.id)

      if (isActiveTarg) {
        newEnemy.active = null
        // Promote from bench if available
        if (newEnemy.bench.length > 0) {
          newEnemy.active = { ...newEnemy.bench[0], canAttack: false }
          newEnemy.bench = newEnemy.bench.slice(1)
          newLog.push(`Enemy sent out ${newEnemy.active.name}!`)
        }
      } else {
        // Remove from bench
        newEnemy.bench = newEnemy.bench.filter((_, i) => i !== benchIndex)
      }

      // Check if player wins
      if (newPlayerKnockouts >= state.knockoutsToWin) {
        set({
          player: newPlayer,
          enemy: newEnemy,
          playerKnockouts: newPlayerKnockouts,
          isOver: true,
          winner: 'player',
          battleStars: calculateStars(state.enemyKnockouts),
          selectingBenchTarget: false,
          pendingBenchAttack: null,
          battleLog: [...newLog, `You knocked out ${state.knockoutsToWin} cards! You win!`]
        })
        return
      }

      // Mark as attacked and update knockouts
      newPlayer.active = { ...attacker, canAttack: false }
      set({
        player: newPlayer,
        enemy: newEnemy,
        playerKnockouts: newPlayerKnockouts,
        battleLog: newLog,
        selectedAttackIndex: null,
        selectingBenchTarget: false,
        pendingBenchAttack: null
      })
      return
    }

    // Update the defender in the right place
    if (isActiveTarg) {
      newEnemy.active = defender
    } else {
      newEnemy.bench[benchIndex] = defender
    }

    // Mark as attacked
    newPlayer.active = { ...attacker, canAttack: false }

    set({
      player: newPlayer,
      enemy: newEnemy,
      battleLog: newLog,
      selectedAttackIndex: null,
      selectingBenchTarget: false,
      pendingBenchAttack: null
    })
  },

  cancelBenchTarget: () => {
    set({
      selectingBenchTarget: false,
      pendingBenchAttack: null,
      battleLog: [...get().battleLog, 'Targeting cancelled.']
    })
  }
}))
