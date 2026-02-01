import { Card } from '../types'

export const cards: Card[] = [
  // ===== FIRE CARDS =====
  {
    id: 'fire_drake',
    name: 'Fire Drake',
    type: 'creature',
    element: 'fire',
    rarity: 'common',
    cost: 2,
    hp: 50,
    attacks: [
      { name: 'Singe', damage: 20, cost: 1 },
      { name: 'Scorching Claw', damage: 40, cost: 2 }
    ],
    description: 'A young dragon breathing its first flames.',
    artwork: '/cards/fire_drake.png'
  },
  {
    id: 'ember_imp',
    name: 'Cinder Imp',
    type: 'creature',
    element: 'fire',
    rarity: 'common',
    cost: 1,
    hp: 40,
    attacks: [
      { name: 'Hot Hands', damage: 10, cost: 1 },
      { name: 'Flame Lob', damage: 30, cost: 2 }
    ],
    description: 'Small but fierce, it loves to cause trouble.',
    artwork: '/cards/ember_imp.png'
  },
  {
    id: 'flame_warrior',
    name: 'Blaze Knight',
    type: 'creature',
    element: 'fire',
    rarity: 'uncommon',
    cost: 3,
    hp: 80,
    attacks: [
      { name: 'Burning Edge', damage: 40, cost: 2 },
      { name: 'Inferno Slash', damage: 70, cost: 3, effect: 'Scorch: 10 damage next turn' }
    ],
    description: 'A knight who channels fire through their blade.',
    artwork: '/cards/flame_warrior.png'
  },
  {
    id: 'inferno_mage',
    name: 'Pyroclast',
    type: 'creature',
    element: 'fire',
    rarity: 'rare',
    cost: 4,
    hp: 70,
    attacks: [
      { name: 'Cinder Shot', damage: 30, cost: 1 },
      { name: 'Molten Rain', damage: 60, cost: 3, effect: 'Splashes all enemies for 20' }
    ],
    description: 'Master of destructive fire magic.',
    artwork: '/cards/inferno_mage.png'
  },
  {
    id: 'ancient_dragon',
    name: 'Elder Wyrm',
    type: 'creature',
    element: 'fire',
    rarity: 'legendary',
    cost: 7,
    hp: 150,
    attacks: [
      { name: 'Rending Talon', damage: 50, cost: 2 },
      { name: 'Apocalypse Breath', damage: 120, cost: 4, effect: 'Scorches all enemies' }
    ],
    description: 'The oldest and most powerful of all dragons.',
    artwork: '/cards/ancient_dragon.png'
  },
  {
    id: 'fireball',
    name: 'Blazing Orb',
    type: 'spell',
    element: 'fire',
    rarity: 'common',
    cost: 3,
    effect: 'Deal 60 damage to one enemy.',
    description: 'A classic spell of destruction.',
    artwork: '/cards/fireball.png'
  },

  // ===== WATER CARDS =====
  {
    id: 'water_sprite',
    name: 'Tidal Sprite',
    type: 'creature',
    element: 'water',
    rarity: 'common',
    cost: 1,
    hp: 50,
    attacks: [
      { name: 'Droplet', damage: 10, cost: 1 },
      { name: 'Aqua Stream', damage: 30, cost: 2 }
    ],
    description: 'A playful spirit of the waters.',
    artwork: '/cards/water_sprite.png'
  },
  {
    id: 'coral_guardian',
    name: 'Reef Warden',
    type: 'creature',
    element: 'water',
    rarity: 'common',
    cost: 2,
    hp: 70,
    attacks: [
      { name: 'Shell Crack', damage: 20, cost: 1 },
      { name: 'Tidal Crush', damage: 40, cost: 2 }
    ],
    description: 'Protector of the reef and its inhabitants.',
    artwork: '/cards/coral_guardian.png'
  },
  {
    id: 'tide_caller',
    name: 'Wave Shaper',
    type: 'creature',
    element: 'water',
    rarity: 'uncommon',
    cost: 3,
    hp: 80,
    attacks: [
      { name: 'Crashing Surf', damage: 30, cost: 2 },
      { name: 'Restorative Waters', damage: 20, cost: 2, effect: 'Heal 30 HP' }
    ],
    description: 'Commands the ebb and flow of the tides.',
    artwork: '/cards/tide_caller.png'
  },
  {
    id: 'sea_serpent',
    name: 'Abyssal Serpent',
    type: 'creature',
    element: 'water',
    rarity: 'rare',
    cost: 5,
    hp: 110,
    attacks: [
      { name: 'Constricting Coil', damage: 50, cost: 2 },
      { name: 'Tidal Surge', damage: 90, cost: 4, effect: 'Hits all enemies' }
    ],
    description: 'Terror of the deep, feared by all sailors.',
    artwork: '/cards/sea_serpent.png'
  },
  {
    id: 'leviathan',
    name: 'Primordial Leviathan',
    type: 'creature',
    element: 'water',
    rarity: 'legendary',
    cost: 8,
    hp: 180,
    attacks: [
      { name: 'Crushing Maw', damage: 70, cost: 3 },
      { name: 'World Flood', damage: 100, cost: 4, effect: 'Heal 50 HP' }
    ],
    description: 'Ancient beast of the primordial ocean.',
    artwork: '/cards/leviathan.png'
  },
  {
    id: 'healing_rain',
    name: 'Mending Mist',
    type: 'spell',
    element: 'water',
    rarity: 'common',
    cost: 2,
    effect: 'Heal 50 HP to one ally.',
    description: 'Blessed waters from the heavens.',
    artwork: '/cards/healing_rain.png'
  },

  // ===== NATURE CARDS =====
  {
    id: 'forest_wolf',
    name: 'Timber Wolf',
    type: 'creature',
    element: 'nature',
    rarity: 'common',
    cost: 2,
    hp: 60,
    attacks: [
      { name: 'Savage Snap', damage: 20, cost: 1 },
      { name: 'Pack Fury', damage: 50, cost: 2, effect: '+10 per ally' }
    ],
    description: 'Swift hunter of the woodland.',
    artwork: '/cards/forest_wolf.png'
  },
  {
    id: 'thornback',
    name: 'Briar Beast',
    type: 'creature',
    element: 'nature',
    rarity: 'common',
    cost: 1,
    hp: 60,
    attacks: [
      { name: 'Needle Poke', damage: 10, cost: 1 },
      { name: 'Thorny Guard', damage: 20, cost: 1, effect: 'Return 10 damage when hit' }
    ],
    description: 'Its thorny hide deters predators.',
    artwork: '/cards/thornback.png'
  },
  {
    id: 'druid',
    name: 'Grove Keeper',
    type: 'creature',
    element: 'nature',
    rarity: 'uncommon',
    cost: 3,
    hp: 70,
    attacks: [
      { name: 'Lashing Vines', damage: 30, cost: 1 },
      { name: 'Wrath of the Wild', damage: 50, cost: 3, effect: 'Draw 1 card' }
    ],
    description: 'Guardian of the ancient forest.',
    artwork: '/cards/druid.png'
  },
  {
    id: 'giant_treant',
    name: 'Ancient Oak',
    type: 'creature',
    element: 'nature',
    rarity: 'rare',
    cost: 5,
    hp: 140,
    attacks: [
      { name: 'Limb Smash', damage: 40, cost: 2 },
      { name: 'Woodland Wrath', damage: 80, cost: 4 }
    ],
    description: 'A living tree awakened to defend the forest.',
    artwork: '/cards/giant_treant.png'
  },
  {
    id: 'swamp_hydra',
    name: 'Marsh Hydra',
    type: 'creature',
    element: 'nature',
    rarity: 'epic',
    cost: 6,
    hp: 130,
    attacks: [
      { name: 'Three-Headed Strike', damage: 60, cost: 2 },
      { name: 'Regrowth', damage: 30, cost: 2, effect: 'Heal 40 HP' }
    ],
    description: 'Cut off one head, two more take its place.',
    artwork: '/cards/swamp_hydra.png'
  },
  {
    id: 'wild_growth',
    name: 'Verdant Surge',
    type: 'spell',
    element: 'nature',
    rarity: 'uncommon',
    cost: 2,
    effect: 'Give an ally +30 HP and +10 damage.',
    description: 'The forest lends its strength.',
    artwork: '/cards/wild_growth.png'
  },

  // ===== EARTH CARDS =====
  {
    id: 'rock_golem',
    name: 'Stone Sentinel',
    type: 'creature',
    element: 'earth',
    rarity: 'common',
    cost: 3,
    hp: 90,
    attacks: [
      { name: 'Rocky Fist', damage: 30, cost: 2 },
      { name: 'Boulder Hurl', damage: 50, cost: 3 }
    ],
    description: 'Slow but incredibly resilient.',
    artwork: '/cards/rock_golem.png'
  },
  {
    id: 'cave_dweller',
    name: 'Cavern Lurker',
    type: 'creature',
    element: 'earth',
    rarity: 'common',
    cost: 2,
    hp: 50,
    attacks: [
      { name: 'Jagged Swipe', damage: 30, cost: 1 },
      { name: 'Tunnel Ambush', damage: 40, cost: 2, effect: 'Cannot be targeted next turn' }
    ],
    description: 'Lives in the darkest mountain caves.',
    artwork: '/cards/cave_dweller.png'
  },
  {
    id: 'stone_golem',
    name: 'Granite Guardian',
    type: 'creature',
    element: 'earth',
    rarity: 'uncommon',
    cost: 4,
    hp: 120,
    attacks: [
      { name: 'Tremor Stomp', damage: 40, cost: 2 },
      { name: 'Avalanche', damage: 70, cost: 3 }
    ],
    description: 'Carved from ancient mountain stone.',
    artwork: '/cards/stone_golem.png'
  },
  {
    id: 'mountain_titan',
    name: 'Peak Colossus',
    type: 'creature',
    element: 'earth',
    rarity: 'epic',
    cost: 7,
    hp: 160,
    attacks: [
      { name: 'Colossal Slam', damage: 60, cost: 3 },
      { name: 'Seismic Devastation', damage: 80, cost: 4, effect: 'Hits all enemies for 40' }
    ],
    description: 'Born from the heart of the mountain.',
    artwork: '/cards/mountain_titan.png'
  },
  {
    id: 'earthquake',
    name: 'Earthshatter',
    type: 'spell',
    element: 'earth',
    rarity: 'rare',
    cost: 5,
    effect: 'Deal 40 damage to ALL creatures.',
    description: 'The ground splits and trembles.',
    artwork: '/cards/earthquake.png'
  },

  // ===== LIGHTNING CARDS =====
  {
    id: 'spark_elemental',
    name: 'Volt Wisp',
    type: 'creature',
    element: 'lightning',
    rarity: 'common',
    cost: 1,
    hp: 30,
    attacks: [
      { name: 'Jolt', damage: 20, cost: 1 },
      { name: 'Paralyzing Pulse', damage: 40, cost: 2, effect: 'Stun: skip attack' }
    ],
    description: 'A tiny but shocking creature.',
    artwork: '/cards/spark_elemental.png'
  },
  {
    id: 'thunder_hawk',
    name: 'Storm Raptor',
    type: 'creature',
    element: 'lightning',
    rarity: 'common',
    cost: 2,
    hp: 50,
    attacks: [
      { name: 'Charged Peck', damage: 20, cost: 1 },
      { name: 'Lightning Swoop', damage: 50, cost: 2 }
    ],
    description: 'Rides the storm clouds hunting prey.',
    artwork: '/cards/thunder_hawk.png'
  },
  {
    id: 'storm_elemental',
    name: 'Tempest Spirit',
    type: 'creature',
    element: 'lightning',
    rarity: 'rare',
    cost: 4,
    hp: 80,
    attacks: [
      { name: 'Crackling Arc', damage: 40, cost: 2 },
      { name: 'Raging Tempest', damage: 70, cost: 3, effect: 'Hits random enemy twice' }
    ],
    description: 'Pure lightning given form.',
    artwork: '/cards/storm_elemental.png'
  },
  {
    id: 'thunder_god',
    name: 'Stormlord',
    type: 'creature',
    element: 'lightning',
    rarity: 'legendary',
    cost: 7,
    hp: 130,
    attacks: [
      { name: 'Divine Spark', damage: 60, cost: 2 },
      { name: 'Cataclysm', damage: 100, cost: 4, effect: 'Chain to all enemies for 30' }
    ],
    description: 'Commands the fury of the storm.',
    artwork: '/cards/thunder_god.png'
  },
  {
    id: 'lightning_bolt',
    name: 'Sky Strike',
    type: 'spell',
    element: 'lightning',
    rarity: 'uncommon',
    cost: 2,
    effect: 'Deal 50 damage instantly.',
    description: 'Strikes before they can react.',
    artwork: '/cards/lightning_bolt.png'
  },

  // ===== SHADOW CARDS =====
  {
    id: 'shadow_imp',
    name: 'Gloom Sprite',
    type: 'creature',
    element: 'shadow',
    rarity: 'common',
    cost: 1,
    hp: 30,
    attacks: [
      { name: 'Shadow Scratch', damage: 20, cost: 1 },
      { name: 'Fade Strike', damage: 40, cost: 2, effect: 'Dodge next attack' }
    ],
    description: 'A mischievous creature of darkness.',
    artwork: '/cards/shadow_imp.png'
  },
  {
    id: 'night_stalker',
    name: 'Dusk Hunter',
    type: 'creature',
    element: 'shadow',
    rarity: 'common',
    cost: 2,
    hp: 50,
    attacks: [
      { name: 'Dark Rend', damage: 30, cost: 1 },
      { name: 'Predator Strike', damage: 60, cost: 2, effect: 'Double if enemy is wounded' }
    ],
    description: 'Hunts only under the cover of darkness.',
    artwork: '/cards/night_stalker.png'
  },
  {
    id: 'shadow_assassin',
    name: 'Phantom Blade',
    type: 'creature',
    element: 'shadow',
    rarity: 'rare',
    cost: 4,
    hp: 60,
    attacks: [
      { name: 'Silent Kill', damage: 50, cost: 2 },
      { name: 'Execution', damage: 90, cost: 3, effect: 'Instant KO if under 30 HP' }
    ],
    description: 'Strikes from the shadows without warning.',
    artwork: '/cards/shadow_assassin.png'
  },
  {
    id: 'void_lord',
    name: 'Abyssal Overlord',
    type: 'creature',
    element: 'shadow',
    rarity: 'epic',
    cost: 6,
    hp: 100,
    attacks: [
      { name: 'Life Drain', damage: 40, cost: 2, effect: 'Steal 20 HP' },
      { name: 'Soul Harvest', damage: 80, cost: 4, effect: 'Draw 2 cards' }
    ],
    description: 'Master of the void between worlds.',
    artwork: '/cards/void_lord.png'
  },
  {
    id: 'dark_ritual',
    name: 'Forbidden Pact',
    type: 'spell',
    element: 'shadow',
    rarity: 'rare',
    cost: 3,
    effect: 'Draw 3 cards. Take 20 damage.',
    description: 'Power comes at a price.',
    artwork: '/cards/dark_ritual.png'
  },

  // ===== LIGHT CARDS =====
  {
    id: 'holy_guardian',
    name: 'Radiant Defender',
    type: 'creature',
    element: 'light',
    rarity: 'common',
    cost: 2,
    hp: 70,
    attacks: [
      { name: 'Shield Slam', damage: 20, cost: 1 },
      { name: 'Blessed Barrier', damage: 30, cost: 2, effect: 'Block 20 damage next turn' }
    ],
    description: 'Protector of the innocent.',
    artwork: '/cards/holy_guardian.png'
  },
  {
    id: 'light_bearer',
    name: 'Dawn Acolyte',
    type: 'creature',
    element: 'light',
    rarity: 'common',
    cost: 1,
    hp: 40,
    attacks: [
      { name: 'Radiant Beam', damage: 20, cost: 1 },
      { name: 'Mending Light', damage: 10, cost: 1, effect: 'Heal ally 20 HP' }
    ],
    description: 'Carries the sacred flame.',
    artwork: '/cards/light_bearer.png'
  },
  {
    id: 'paladin',
    name: 'Crusader',
    type: 'creature',
    element: 'light',
    rarity: 'uncommon',
    cost: 3,
    hp: 90,
    attacks: [
      { name: 'Righteous Blow', damage: 40, cost: 2 },
      { name: 'Purifying Strike', damage: 60, cost: 3, effect: 'Double vs Shadow' }
    ],
    description: 'Holy warrior sworn to protect.',
    artwork: '/cards/paladin.png'
  },
  {
    id: 'arcane_wizard',
    name: 'Mystic Sage',
    type: 'creature',
    element: 'light',
    rarity: 'epic',
    cost: 5,
    hp: 80,
    attacks: [
      { name: 'Arcane Barrage', damage: 30, cost: 1, effect: 'Hit 3 times' },
      { name: 'Mystic Nova', damage: 70, cost: 3, effect: 'Draw 1 card' }
    ],
    description: 'Master of arcane arts and ancient wisdom.',
    artwork: '/cards/arcane_wizard.png'
  },
  {
    id: 'celestial_angel',
    name: 'Seraphim',
    type: 'creature',
    element: 'light',
    rarity: 'legendary',
    cost: 8,
    hp: 140,
    attacks: [
      { name: 'Heavenly Sword', damage: 60, cost: 2 },
      { name: 'Divine Judgment', damage: 100, cost: 4, effect: 'Heal all allies 30 HP' }
    ],
    description: 'A messenger from the heavens above.',
    artwork: '/cards/celestial_angel.png'
  },
  {
    id: 'holy_smite',
    name: 'Banishing Light',
    type: 'spell',
    element: 'light',
    rarity: 'rare',
    cost: 5,
    effect: 'Destroy one enemy creature.',
    description: 'Divine judgment strikes down evil.',
    artwork: '/cards/holy_smite.png'
  },

  // ===== ICE CARDS =====
  {
    id: 'frost_sprite',
    name: 'Frost Sprite',
    type: 'creature',
    element: 'ice',
    rarity: 'common',
    cost: 1,
    hp: 40,
    attacks: [
      { name: 'Ice Shard', damage: 15, cost: 1 },
      { name: 'Chilling Touch', damage: 30, cost: 2, effect: 'Slow: reduce attack by 10' }
    ],
    description: 'A tiny spirit of winter frost.',
    artwork: '/cards/frost_sprite.png'
  },
  {
    id: 'snow_wolf',
    name: 'Arctic Wolf',
    type: 'creature',
    element: 'ice',
    rarity: 'common',
    cost: 2,
    hp: 60,
    attacks: [
      { name: 'Frozen Fangs', damage: 25, cost: 1 },
      { name: 'Blizzard Hunt', damage: 45, cost: 2 }
    ],
    description: 'Hunts silently through the frozen tundra.',
    artwork: '/cards/snow_wolf.png'
  },
  {
    id: 'ice_mage',
    name: 'Frostweaver',
    type: 'creature',
    element: 'ice',
    rarity: 'uncommon',
    cost: 3,
    hp: 70,
    attacks: [
      { name: 'Icicle Barrage', damage: 30, cost: 2 },
      { name: 'Frozen Prison', damage: 40, cost: 2, effect: 'Freeze: skip next attack' }
    ],
    description: 'Master of frost magic and winter storms.',
    artwork: '/cards/ice_mage.png'
  },
  {
    id: 'glacier_giant',
    name: 'Glacier Behemoth',
    type: 'creature',
    element: 'ice',
    rarity: 'rare',
    cost: 5,
    hp: 130,
    attacks: [
      { name: 'Frozen Slam', damage: 50, cost: 2 },
      { name: 'Permafrost Crush', damage: 80, cost: 3, effect: 'Freeze target for 1 turn' }
    ],
    description: 'Born from ancient glaciers, slow but devastating.',
    artwork: '/cards/glacier_giant.png'
  },
  {
    id: 'blizzard_phoenix',
    name: 'Frostfire Phoenix',
    type: 'creature',
    element: 'ice',
    rarity: 'epic',
    cost: 6,
    hp: 100,
    attacks: [
      { name: 'Glacial Wings', damage: 45, cost: 2 },
      { name: 'Absolute Zero', damage: 70, cost: 3, effect: 'Freeze all enemies' }
    ],
    description: 'A mythical bird reborn in eternal ice.',
    artwork: '/cards/blizzard_phoenix.png'
  },
  {
    id: 'ice_queen',
    name: 'Empress of Winter',
    type: 'creature',
    element: 'ice',
    rarity: 'legendary',
    cost: 8,
    hp: 150,
    attacks: [
      { name: 'Frozen Heart', damage: 60, cost: 2, effect: 'Freeze target' },
      { name: 'Eternal Winter', damage: 90, cost: 4, effect: 'Freeze all enemies, +20 to frozen targets' }
    ],
    description: 'Ruler of the frozen realm, her gaze alone can freeze souls.',
    artwork: '/cards/ice_queen.png'
  },
  {
    id: 'flash_freeze',
    name: 'Flash Freeze',
    type: 'spell',
    element: 'ice',
    rarity: 'uncommon',
    cost: 3,
    effect: 'Deal 40 damage and freeze one enemy for 1 turn.',
    description: 'Instantly encases the target in solid ice.',
    artwork: '/cards/flash_freeze.png'
  }
]

// Helper to get card by ID
export const getCardById = (id: string): Card | undefined => {
  return cards.find(card => card.id === id)
}

// Get cards by element
export const getCardsByElement = (element: string): Card[] => {
  return cards.filter(card => card.element === element)
}

// Get cards by rarity
export const getCardsByRarity = (rarity: string): Card[] => {
  return cards.filter(card => card.rarity === rarity)
}
