import { Card } from '../types'

// Boss exclusive cards - rewards from challenge mode bosses
export const bossExclusiveCards: Card[] = [
  {
    id: 'boss_iron_guardian',
    name: 'Iron Guardian',
    type: 'creature',
    element: 'earth',
    rarity: 'rare',
    cost: 4,
    hp: 140,
    attacks: [
      { name: 'Fortified Strike', damage: 50, cost: 2, effect: 'Shield: 40 damage blocked' },
      { name: 'Unyielding Slam', damage: 85, cost: 3 }
    ],
    description: 'Reward from defeating the Mountain King. An unbreakable defender.',
    artwork: '/cards/boss_iron_guardian.jpg'
  },
  {
    id: 'boss_shadow_reaper',
    name: 'Shadow Reaper',
    type: 'creature',
    element: 'shadow',
    rarity: 'epic',
    cost: 5,
    hp: 110,
    attacks: [
      { name: 'Soul Rend', damage: 65, cost: 2, effect: 'Poison: 20 damage per turn' },
      { name: 'Death Sentence', damage: 100, cost: 3, effect: 'Weaken: enemy -30% attack' }
    ],
    description: 'Reward from defeating the Void Master. Harvests souls of the fallen.',
    artwork: '/cards/boss_shadow_reaper.jpg'
  },
  {
    id: 'boss_storm_herald',
    name: 'Storm Herald',
    type: 'creature',
    element: 'lightning',
    rarity: 'epic',
    cost: 6,
    hp: 130,
    attacks: [
      { name: 'Thunder Call', damage: 70, cost: 2, effect: '+2 energy gain' },
      { name: 'Tempest Fury', damage: 120, cost: 4, effect: 'Stun: skip attack' }
    ],
    description: 'Reward from defeating the Storm Tyrant. Commands the very heavens.',
    artwork: '/cards/boss_storm_herald.jpg'
  },
  {
    id: 'boss_phoenix_lord',
    name: 'Phoenix Lord',
    type: 'creature',
    element: 'fire',
    rarity: 'legendary',
    cost: 7,
    hp: 150,
    attacks: [
      { name: 'Eternal Flame', damage: 80, cost: 2, effect: 'Burn: 25 damage per turn' },
      { name: 'Rebirth Inferno', damage: 130, cost: 4, effect: 'Heal 50 HP' }
    ],
    description: 'Reward from defeating the Flame Emperor. Death is merely a temporary setback.',
    artwork: '/cards/boss_phoenix_lord.jpg'
  },
  {
    id: 'boss_world_serpent',
    name: 'World Serpent',
    type: 'creature',
    element: 'nature',
    rarity: 'legendary',
    cost: 8,
    hp: 200,
    attacks: [
      { name: 'Coiling Doom', damage: 90, cost: 3, effect: 'Poison: 30 damage per turn' },
      { name: "World's End", damage: 160, cost: 5, effect: 'Stun: skip attack' }
    ],
    description: 'Reward from defeating the Final Champion. The serpent that encircles the world.',
    artwork: '/cards/boss_world_serpent.jpg'
  }
]

export const cards: Card[] = [
  // Include boss exclusive cards so they can be used in battles
  ...bossExclusiveCards,
  // ===== FIRE CARDS =====
  {
    id: 'fire_drake',
    name: 'Fire Drake',
    type: 'creature',
    element: 'fire',
    rarity: 'common',
    cost: 2,
    hp: 70,
    attacks: [
      { name: 'Singe', damage: 30, cost: 1, effect: 'Burn: 10 damage per turn' },
      { name: 'Scorching Claw', damage: 60, cost: 2 }
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
    hp: 60,
    attacks: [
      { name: 'Hot Hands', damage: 20, cost: 1, effect: 'Burn: 15 damage per turn' },
      { name: 'Flame Lob', damage: 50, cost: 2 }
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
    hp: 90,
    attacks: [
      { name: 'Burning Edge', damage: 50, cost: 2 },
      { name: 'Inferno Slash', damage: 90, cost: 3, effect: 'Scorch: 20 damage next turn' }
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
    hp: 80,
    attacks: [
      { name: 'Cinder Shot', damage: 40, cost: 1 },
      { name: 'Molten Rain', damage: 50, cost: 3, effect: 'Burns all bench cards', target: 'all-bench' }
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
    hp: 180,
    attacks: [
      { name: 'Rending Talon', damage: 70, cost: 2 },
      { name: 'Apocalypse Breath', damage: 150, cost: 4, effect: 'Scorches all enemies' }
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
    effect: 'Deal 80 damage to one enemy.',
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
    hp: 60,
    attacks: [
      { name: 'Droplet', damage: 20, cost: 1, effect: 'Shield: 20 damage blocked' },
      { name: 'Aqua Stream', damage: 50, cost: 2 }
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
    hp: 90,
    attacks: [
      { name: 'Shell Crack', damage: 30, cost: 1, effect: 'Shield: 30 damage blocked' },
      { name: 'Tidal Crush', damage: 60, cost: 2 }
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
    hp: 90,
    attacks: [
      { name: 'Crashing Surf', damage: 50, cost: 2 },
      { name: 'Restorative Waters', damage: 40, cost: 2, effect: 'Heal 40 HP' }
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
    hp: 130,
    attacks: [
      { name: 'Constricting Coil', damage: 70, cost: 2 },
      { name: 'Deep Strike', damage: 60, cost: 3, effect: 'Target any card', target: 'any' }
    ],
    description: 'Terror of the deep, feared by all sailors.',
    artwork: '/cards/water_dragon.jpg'
  },
  {
    id: 'leviathan',
    name: 'Primordial Leviathan',
    type: 'creature',
    element: 'water',
    rarity: 'legendary',
    cost: 8,
    hp: 200,
    attacks: [
      { name: 'Crushing Maw', damage: 100, cost: 3 },
      { name: 'World Flood', damage: 150, cost: 4, effect: 'Heal 60 HP' }
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
    effect: 'Heal 70 HP to one ally.',
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
    hp: 80,
    attacks: [
      { name: 'Savage Snap', damage: 30, cost: 1, effect: 'Weaken: enemy -30% attack' },
      { name: 'Pack Fury', damage: 60, cost: 2, effect: '+20 per ally' }
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
    hp: 70,
    attacks: [
      { name: 'Needle Poke', damage: 20, cost: 1, effect: 'Poison: 15 damage per turn' },
      { name: 'Thorny Guard', damage: 40, cost: 1, effect: 'Shield: 25 damage blocked' }
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
    hp: 80,
    attacks: [
      { name: 'Lashing Vines', damage: 40, cost: 1 },
      { name: 'Wrath of the Wild', damage: 70, cost: 3, effect: 'Draw 1 card' }
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
    hp: 160,
    attacks: [
      { name: 'Limb Smash', damage: 60, cost: 2 },
      { name: 'Woodland Wrath', damage: 110, cost: 4 }
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
    hp: 150,
    attacks: [
      { name: 'Three-Headed Strike', damage: 80, cost: 2 },
      { name: 'Regrowth', damage: 50, cost: 2, effect: 'Heal 50 HP' }
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
    hp: 120,
    attacks: [
      { name: 'Rocky Fist', damage: 40, cost: 2, effect: 'Shield: 30 damage blocked' },
      { name: 'Boulder Hurl', damage: 70, cost: 3 }
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
    hp: 80,
    attacks: [
      { name: 'Jagged Swipe', damage: 40, cost: 1, effect: 'Weaken: enemy -30% attack' },
      { name: 'Tunnel Ambush', damage: 60, cost: 2, effect: 'Cannot be targeted next turn' }
    ],
    description: 'Lives in the darkest mountain caves.',
    artwork: '/cards/cave_shadow.jpg'
  },
  {
    id: 'stone_golem',
    name: 'Granite Guardian',
    type: 'creature',
    element: 'earth',
    rarity: 'uncommon',
    cost: 4,
    hp: 140,
    attacks: [
      { name: 'Tremor Stomp', damage: 60, cost: 2 },
      { name: 'Avalanche', damage: 100, cost: 3 }
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
    hp: 180,
    attacks: [
      { name: 'Colossal Slam', damage: 90, cost: 3 },
      { name: 'Seismic Devastation', damage: 120, cost: 4, effect: 'Hits all enemies for 60' }
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
    effect: 'Deal 70 damage to ALL creatures.',
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
    hp: 60,
    attacks: [
      { name: 'Jolt', damage: 30, cost: 1, effect: '+1 energy gain' },
      { name: 'Paralyzing Pulse', damage: 50, cost: 2, effect: 'Stun: skip attack' }
    ],
    description: 'A tiny but shocking creature.',
    artwork: '/cards/volt_mouse.jpg'
  },
  {
    id: 'thunder_hawk',
    name: 'Storm Raptor',
    type: 'creature',
    element: 'lightning',
    rarity: 'common',
    cost: 2,
    hp: 80,
    attacks: [
      { name: 'Charged Peck', damage: 30, cost: 1, effect: 'Stun: skip attack' },
      { name: 'Lightning Swoop', damage: 70, cost: 2 }
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
    hp: 100,
    attacks: [
      { name: 'Crackling Arc', damage: 60, cost: 2 },
      { name: 'Chain Lightning', damage: 45, cost: 3, effect: 'Zaps all bench cards', target: 'all-bench' }
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
    hp: 150,
    attacks: [
      { name: 'Divine Spark', damage: 80, cost: 2 },
      { name: 'Cataclysm', damage: 140, cost: 4, effect: 'Chain to all enemies for 50' }
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
    effect: 'Deal 70 damage instantly.',
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
    hp: 60,
    attacks: [
      { name: 'Shadow Scratch', damage: 30, cost: 1, effect: 'Weaken: enemy -30% attack' },
      { name: 'Fade Strike', damage: 50, cost: 2, effect: 'Dodge next attack' }
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
    hp: 80,
    attacks: [
      { name: 'Dark Rend', damage: 40, cost: 1, effect: 'Poison: 15 damage per turn' },
      { name: 'Predator Strike', damage: 80, cost: 2, effect: 'Double if enemy is wounded' }
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
    hp: 70,
    attacks: [
      { name: 'Silent Kill', damage: 70, cost: 2 },
      { name: 'Backstab', damage: 90, cost: 3, effect: 'Sneak attack any target', target: 'any' }
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
    hp: 120,
    attacks: [
      { name: 'Life Drain', damage: 60, cost: 2, effect: 'Steal 30 HP' },
      { name: 'Soul Harvest', damage: 110, cost: 4, effect: 'Draw 2 cards' }
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
    hp: 100,
    attacks: [
      { name: 'Shield Slam', damage: 30, cost: 1, effect: 'Shield: 40 damage blocked' },
      { name: 'Blessed Barrier', damage: 50, cost: 2, effect: 'Shield: 50 damage blocked' }
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
    hp: 70,
    attacks: [
      { name: 'Radiant Beam', damage: 30, cost: 1, effect: '+1 energy gain' },
      { name: 'Mending Light', damage: 20, cost: 1, effect: 'Heal self 30 HP' }
    ],
    description: 'Carries the sacred flame.',
    artwork: '/cards/light_bearer.png'
  },
  {
    id: 'luna_bunny',
    name: 'Luna Bunny',
    type: 'creature',
    element: 'light',
    rarity: 'common',
    cost: 1,
    hp: 60,
    attacks: [
      { name: 'Moonbeam', damage: 20, cost: 1, effect: 'Shield: 25 damage blocked' },
      { name: 'Starlight Hop', damage: 40, cost: 2, effect: 'Dodge next attack' }
    ],
    description: 'A small bunny touched by moonlight. Evolves into Celestial Hare.',
    artwork: '/cards/light_bunny.jpg'
  },
  {
    id: 'celestial_hare',
    name: 'Celestial Hare',
    type: 'creature',
    element: 'light',
    rarity: 'rare',
    cost: 3,
    hp: 110,
    attacks: [
      { name: 'Aurora Dash', damage: 50, cost: 2 },
      { name: 'Lunar Blessing', damage: 70, cost: 3, effect: 'Heal self 40 HP' }
    ],
    description: 'The evolved form of Luna Bunny. Its speed rivals the wind.',
    artwork: '/cards/light_rabbit.jpg'
  },
  {
    id: 'paladin',
    name: 'Crusader',
    type: 'creature',
    element: 'light',
    rarity: 'uncommon',
    cost: 3,
    hp: 100,
    attacks: [
      { name: 'Righteous Blow', damage: 50, cost: 2 },
      { name: 'Purifying Strike', damage: 90, cost: 3, effect: 'Double vs Shadow' }
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
    hp: 100,
    attacks: [
      { name: 'Arcane Barrage', damage: 40, cost: 1, effect: 'Hit 3 times' },
      { name: 'Mystic Nova', damage: 100, cost: 3, effect: 'Draw 1 card' }
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
    hp: 170,
    attacks: [
      { name: 'Heavenly Sword', damage: 80, cost: 2 },
      { name: 'Divine Judgment', damage: 140, cost: 4, effect: 'Heal all allies 50 HP' }
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
    hp: 60,
    attacks: [
      { name: 'Ice Shard', damage: 25, cost: 1, effect: 'Stun: skip attack' },
      { name: 'Chilling Touch', damage: 50, cost: 2, effect: 'Weaken: enemy -30% attack' }
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
    hp: 80,
    attacks: [
      { name: 'Frozen Fangs', damage: 35, cost: 1, effect: 'Stun: skip attack' },
      { name: 'Blizzard Hunt', damage: 70, cost: 2 }
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
    hp: 85,
    attacks: [
      { name: 'Icicle Barrage', damage: 50, cost: 2 },
      { name: 'Frozen Prison', damage: 70, cost: 2, effect: 'Freeze: skip next attack' }
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
    hp: 150,
    attacks: [
      { name: 'Frozen Slam', damage: 70, cost: 2 },
      { name: 'Permafrost Crush', damage: 110, cost: 3, effect: 'Freeze target for 1 turn' }
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
    hp: 120,
    attacks: [
      { name: 'Glacial Wings', damage: 65, cost: 2 },
      { name: 'Absolute Zero', damage: 100, cost: 3, effect: 'Freeze all enemies' }
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
    hp: 170,
    attacks: [
      { name: 'Frozen Heart', damage: 80, cost: 2, effect: 'Freeze target' },
      { name: 'Eternal Winter', damage: 130, cost: 4, effect: 'Freeze all enemies, +30 to frozen targets' }
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
    effect: 'Deal 60 damage and freeze one enemy for 1 turn.',
    description: 'Instantly encases the target in solid ice.',
    artwork: '/cards/flash_freeze.png'
  },

  // ===== HEALING & SUPPORT SPELLS =====
  {
    id: 'greater_heal',
    name: 'Divine Restoration',
    type: 'spell',
    element: 'light',
    rarity: 'uncommon',
    cost: 3,
    effect: 'Heal active creature for 80 HP.',
    description: 'Holy light mends even grievous wounds.',
    artwork: '/cards/greater_heal.png'
  },
  {
    id: 'emergency_heal',
    name: 'Last Resort',
    type: 'spell',
    element: 'light',
    rarity: 'rare',
    cost: 2,
    effect: 'Heal active creature for 50 HP. Draw 1 card.',
    description: 'When all seems lost, hope remains.',
    artwork: '/cards/emergency_heal.png'
  },
  {
    id: 'full_restore',
    name: 'Miracle',
    type: 'spell',
    element: 'light',
    rarity: 'epic',
    cost: 5,
    effect: 'Fully heal active creature to max HP.',
    description: 'A true miracle of divine power.',
    artwork: '/cards/full_restore.png'
  },
  {
    id: 'natures_blessing',
    name: 'Forest Renewal',
    type: 'spell',
    element: 'nature',
    rarity: 'uncommon',
    cost: 2,
    effect: 'Heal active creature for 60 HP.',
    description: 'The forest shares its vitality.',
    artwork: '/cards/natures_blessing.png'
  },
  {
    id: 'regeneration',
    name: 'Vital Growth',
    type: 'spell',
    element: 'nature',
    rarity: 'rare',
    cost: 3,
    effect: 'Heal all your creatures for 40 HP.',
    description: 'Life energy spreads to all allies.',
    artwork: '/cards/regeneration.png'
  },
  {
    id: 'tidal_heal',
    name: 'Ocean\'s Embrace',
    type: 'spell',
    element: 'water',
    rarity: 'rare',
    cost: 4,
    effect: 'Heal active creature for 100 HP.',
    description: 'The sea mother protects her children.',
    artwork: '/cards/tidal_heal.png'
  },
  {
    id: 'ice_barrier',
    name: 'Frozen Shield',
    type: 'spell',
    element: 'ice',
    rarity: 'rare',
    cost: 3,
    effect: 'Heal 40 HP. Block next 30 damage.',
    description: 'A shield of impenetrable ice.',
    artwork: '/cards/ice_barrier.png'
  },
  {
    id: 'life_drain_spell',
    name: 'Soul Siphon',
    type: 'spell',
    element: 'shadow',
    rarity: 'rare',
    cost: 4,
    effect: 'Deal 80 damage. Heal your creature for damage dealt.',
    description: 'Take their life force as your own.',
    artwork: '/cards/life_drain_spell.png'
  },
  {
    id: 'flame_shield',
    name: 'Blazing Armor',
    type: 'spell',
    element: 'fire',
    rarity: 'uncommon',
    cost: 2,
    effect: 'Give active creature +30 HP. Deal 20 damage to attacker.',
    description: 'Fire that protects and punishes.',
    artwork: '/cards/flame_shield.png'
  },
  {
    id: 'stone_skin',
    name: 'Mountain\'s Endurance',
    type: 'spell',
    element: 'earth',
    rarity: 'uncommon',
    cost: 2,
    effect: 'Give active creature +50 HP.',
    description: 'Skin as tough as granite.',
    artwork: '/cards/stone_skin.png'
  },
  {
    id: 'energy_surge',
    name: 'Lightning Infusion',
    type: 'spell',
    element: 'lightning',
    rarity: 'rare',
    cost: 3,
    effect: 'Gain 3 extra energy this turn.',
    description: 'Raw power courses through you.',
    artwork: '/cards/energy_surge.png'
  },

  // ===== ADVANCED STRATEGIC CREATURES =====
  {
    id: 'priest_of_light',
    name: 'High Priest',
    type: 'creature',
    element: 'light',
    rarity: 'rare',
    cost: 4,
    hp: 110,
    attacks: [
      { name: 'Holy Light', damage: 50, cost: 2 },
      { name: 'Mass Heal', damage: 40, cost: 3, effect: 'Heal all allies 60 HP' }
    ],
    description: 'Devoted healer of the sacred order.',
    artwork: '/cards/priest_of_light.png'
  },
  {
    id: 'forest_spirit',
    name: 'Sylvan Guardian',
    type: 'creature',
    element: 'nature',
    rarity: 'rare',
    cost: 4,
    hp: 120,
    attacks: [
      { name: 'Vine Lash', damage: 55, cost: 2 },
      { name: 'Nature\'s Gift', damage: 40, cost: 2, effect: 'Heal self 50 HP' }
    ],
    description: 'Ancient spirit that nurtures all life.',
    artwork: '/cards/forest_deer.jpg'
  },
  {
    id: 'water_healer',
    name: 'Tidecaller Priestess',
    type: 'creature',
    element: 'water',
    rarity: 'uncommon',
    cost: 3,
    hp: 85,
    attacks: [
      { name: 'Water Jet', damage: 40, cost: 1 },
      { name: 'Soothing Waters', damage: 30, cost: 2, effect: 'Heal active 60 HP' }
    ],
    description: 'Channels the healing power of the tides.',
    artwork: '/cards/water_healer.png'
  },
  {
    id: 'iron_fortress',
    name: 'Bastion',
    type: 'creature',
    element: 'earth',
    rarity: 'epic',
    cost: 6,
    hp: 220,
    attacks: [
      { name: 'Shield Wall', damage: 50, cost: 2, effect: 'Reduce damage taken by 30' },
      { name: 'Fortress Slam', damage: 90, cost: 3 }
    ],
    description: 'An immovable wall of living stone.',
    artwork: '/cards/iron_fortress.png'
  },
  {
    id: 'phoenix_rising',
    name: 'Eternal Phoenix',
    type: 'creature',
    element: 'fire',
    rarity: 'legendary',
    cost: 7,
    hp: 140,
    attacks: [
      { name: 'Flame Wing', damage: 70, cost: 2 },
      { name: 'Rebirth Blaze', damage: 120, cost: 4, effect: 'When KO\'d, revive with 80 HP' }
    ],
    description: 'Death is merely a brief inconvenience.',
    artwork: '/cards/phoenix_rising.png'
  },
  {
    id: 'vampire_lord',
    name: 'Blood Emperor',
    type: 'creature',
    element: 'shadow',
    rarity: 'epic',
    cost: 6,
    hp: 130,
    attacks: [
      { name: 'Blood Fang', damage: 65, cost: 2, effect: 'Heal 35 HP' },
      { name: 'Crimson Feast', damage: 100, cost: 3, effect: 'Heal damage dealt' }
    ],
    description: 'Immortal ruler who feeds on the living.',
    artwork: '/cards/vampire_lord.png'
  },
  {
    id: 'ice_healer',
    name: 'Frost Maiden',
    type: 'creature',
    element: 'ice',
    rarity: 'uncommon',
    cost: 3,
    hp: 90,
    attacks: [
      { name: 'Frost Kiss', damage: 40, cost: 1, effect: 'Slow enemy' },
      { name: 'Preservation', damage: 35, cost: 2, effect: 'Heal 55 HP, freeze self 1 turn' }
    ],
    description: 'Her touch is cold but her heart is warm.',
    artwork: '/cards/ice_healer.png'
  },
  {
    id: 'thunder_totem',
    name: 'Storm Pillar',
    type: 'creature',
    element: 'lightning',
    rarity: 'rare',
    cost: 4,
    hp: 120,
    attacks: [
      { name: 'Static Field', damage: 50, cost: 2, effect: 'Damage all enemies 25' },
      { name: 'Overcharge', damage: 90, cost: 3, effect: 'Gain 1 energy' }
    ],
    description: 'A conduit of pure electrical energy.',
    artwork: '/cards/thunder_totem.png'
  },
  {
    id: 'guardian_angel',
    name: 'Divine Protector',
    type: 'creature',
    element: 'light',
    rarity: 'epic',
    cost: 5,
    hp: 130,
    attacks: [
      { name: 'Blessed Strike', damage: 60, cost: 2 },
      { name: 'Sanctuary', damage: 50, cost: 3, effect: 'Heal 80 HP, immune to damage next turn' }
    ],
    description: 'Shields the faithful from all harm.',
    artwork: '/cards/guardian_angel.png'
  },
  {
    id: 'toxic_dragon',
    name: 'Venomwing',
    type: 'creature',
    element: 'nature',
    rarity: 'epic',
    cost: 6,
    hp: 140,
    attacks: [
      { name: 'Poison Breath', damage: 60, cost: 2, effect: 'Poison: 30 damage per turn' },
      { name: 'Toxic Storm', damage: 100, cost: 4, effect: 'Poison all enemies' }
    ],
    description: 'Its very presence withers all life.',
    artwork: '/cards/earth_dragon.png'
  },
  {
    id: 'shield_bearer',
    name: 'Ironclad Defender',
    type: 'creature',
    element: 'earth',
    rarity: 'uncommon',
    cost: 3,
    hp: 130,
    attacks: [
      { name: 'Shield Bash', damage: 40, cost: 1 },
      { name: 'Taunt', damage: 30, cost: 1, effect: 'Force enemy to attack this creature' }
    ],
    description: 'Stands firm when others would flee.',
    artwork: '/cards/shield_bearer.png'
  },
  {
    id: 'fire_dancer',
    name: 'Infernal Dancer',
    type: 'creature',
    element: 'fire',
    rarity: 'rare',
    cost: 4,
    hp: 100,
    attacks: [
      { name: 'Fire Dance', damage: 55, cost: 2, effect: 'Dodge next attack' },
      { name: 'Burning Pirouette', damage: 80, cost: 3, effect: 'Hit all enemies for 40' }
    ],
    description: 'Her graceful movements leave trails of fire.',
    artwork: '/cards/fire_dancer.png'
  },
  {
    id: 'shadow_healer',
    name: 'Dark Mender',
    type: 'creature',
    element: 'shadow',
    rarity: 'rare',
    cost: 4,
    hp: 90,
    attacks: [
      { name: 'Dark Touch', damage: 45, cost: 1 },
      { name: 'Vampiric Link', damage: 60, cost: 2, effect: 'Heal 50 HP from enemy' }
    ],
    description: 'Heals through forbidden blood magic.',
    artwork: '/cards/shadow_healer.png'
  },
  {
    id: 'ocean_titan',
    name: 'Tidal Colossus',
    type: 'creature',
    element: 'water',
    rarity: 'epic',
    cost: 7,
    hp: 190,
    attacks: [
      { name: 'Crushing Wave', damage: 80, cost: 3 },
      { name: 'Tsunami', damage: 130, cost: 4, effect: 'Heal 60 HP' }
    ],
    description: 'The ocean itself given form.',
    artwork: '/cards/ocean_titan.png'
  },
  {
    id: 'frost_guardian',
    name: 'Glacial Sentinel',
    type: 'creature',
    element: 'ice',
    rarity: 'rare',
    cost: 5,
    hp: 160,
    attacks: [
      { name: 'Ice Wall', damage: 50, cost: 2, effect: 'Block 40 damage' },
      { name: 'Shatter', damage: 100, cost: 3, effect: 'Extra 40 damage to frozen enemies' }
    ],
    description: 'An eternal guardian of the frozen wastes.',
    artwork: '/cards/frost_guardian.png'
  },
  {
    id: 'storm_dragon',
    name: 'Tempest Wyrm',
    type: 'creature',
    element: 'lightning',
    rarity: 'legendary',
    cost: 8,
    hp: 180,
    attacks: [
      { name: 'Thunder Claw', damage: 90, cost: 2 },
      { name: 'Lightning Storm', damage: 150, cost: 4, effect: 'Chain 60 damage to bench' }
    ],
    description: 'A dragon that commands the storms themselves.',
    artwork: '/cards/storm_dragon.png'
  },

  // ===== UTILITY DRAW CARDS =====
  {
    id: 'arcane_intellect',
    name: 'Mind Expansion',
    type: 'spell',
    element: 'light',
    rarity: 'common',
    cost: 2,
    effect: 'Draw 2 cards.',
    description: 'Knowledge is the greatest power.',
    artwork: '/cards/arcane_intellect.png'
  },
  {
    id: 'natures_wisdom',
    name: 'Ancient Knowledge',
    type: 'spell',
    element: 'nature',
    rarity: 'uncommon',
    cost: 3,
    effect: 'Draw 3 cards. Heal 20 HP.',
    description: 'The forest shares its ancient secrets.',
    artwork: '/cards/natures_wisdom.png'
  },
  {
    id: 'desperate_gambit',
    name: 'All or Nothing',
    type: 'spell',
    element: 'shadow',
    rarity: 'epic',
    cost: 4,
    effect: 'Draw 4 cards. Take 40 damage to player.',
    description: 'Risk everything to gain everything.',
    artwork: '/cards/desperate_gambit.png'
  },

  // ===== NORMAL CARDS =====
  {
    id: 'fluffpup',
    name: 'Fluffpup',
    type: 'creature',
    element: 'normal',
    rarity: 'common',
    cost: 1,
    hp: 60,
    attacks: [
      { name: 'Playful Tackle', damage: 20, cost: 1, effect: '+1 energy gain' },
      { name: 'Fluffy Headbutt', damage: 40, cost: 2 }
    ],
    description: 'A small fluffy pup with silky fur. Evolves into Floofhound.',
    artwork: '/cards/fluffhound_baby.jpg'
  },
  {
    id: 'floofhound',
    name: 'Floofhound',
    type: 'creature',
    element: 'normal',
    rarity: 'uncommon',
    cost: 3,
    hp: 100,
    attacks: [
      { name: 'Silken Strike', damage: 40, cost: 2 },
      { name: 'Majestic Charge', damage: 70, cost: 3, effect: 'Cannot be targeted next turn' }
    ],
    description: 'The evolved form of Fluffpup. Its flowing fur is said to bring good fortune.',
    artwork: '/cards/fluffhound_evolved.jpg'
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
