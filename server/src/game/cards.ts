// Server-side card definitions (simplified version for pack rolling)
export interface Card {
  id: string
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export const cards: Card[] = [
  // Fire
  { id: 'fire_drake', name: 'Fire Drake', rarity: 'common' },
  { id: 'ember_imp', name: 'Ember Imp', rarity: 'common' },
  { id: 'flame_warrior', name: 'Flame Warrior', rarity: 'uncommon' },
  { id: 'inferno_mage', name: 'Inferno Mage', rarity: 'rare' },
  { id: 'ancient_dragon', name: 'Ancient Dragon', rarity: 'legendary' },
  { id: 'fireball', name: 'Fireball', rarity: 'common' },

  // Water
  { id: 'water_sprite', name: 'Water Sprite', rarity: 'common' },
  { id: 'coral_guardian', name: 'Coral Guardian', rarity: 'common' },
  { id: 'tide_caller', name: 'Tide Caller', rarity: 'uncommon' },
  { id: 'sea_serpent', name: 'Sea Serpent', rarity: 'rare' },
  { id: 'leviathan', name: 'Leviathan', rarity: 'legendary' },
  { id: 'healing_rain', name: 'Healing Rain', rarity: 'common' },

  // Nature
  { id: 'forest_wolf', name: 'Forest Wolf', rarity: 'common' },
  { id: 'thornback', name: 'Thornback', rarity: 'common' },
  { id: 'druid', name: 'Druid', rarity: 'uncommon' },
  { id: 'giant_treant', name: 'Giant Treant', rarity: 'rare' },
  { id: 'swamp_hydra', name: 'Swamp Hydra', rarity: 'epic' },
  { id: 'wild_growth', name: 'Wild Growth', rarity: 'uncommon' },

  // Earth
  { id: 'rock_golem', name: 'Rock Golem', rarity: 'common' },
  { id: 'cave_dweller', name: 'Cave Dweller', rarity: 'common' },
  { id: 'stone_golem', name: 'Stone Golem', rarity: 'uncommon' },
  { id: 'earthquake', name: 'Earthquake', rarity: 'rare' },
  { id: 'mountain_titan', name: 'Mountain Titan', rarity: 'epic' },

  // Lightning
  { id: 'spark_elemental', name: 'Spark Elemental', rarity: 'common' },
  { id: 'thunder_hawk', name: 'Thunder Hawk', rarity: 'common' },
  { id: 'storm_elemental', name: 'Storm Elemental', rarity: 'rare' },
  { id: 'lightning_bolt', name: 'Lightning Bolt', rarity: 'uncommon' },
  { id: 'thunder_god', name: 'Thunder God', rarity: 'legendary' },

  // Shadow
  { id: 'shadow_imp', name: 'Shadow Imp', rarity: 'common' },
  { id: 'night_stalker', name: 'Night Stalker', rarity: 'common' },
  { id: 'shadow_assassin', name: 'Shadow Assassin', rarity: 'rare' },
  { id: 'dark_ritual', name: 'Dark Ritual', rarity: 'rare' },
  { id: 'void_lord', name: 'Void Lord', rarity: 'epic' },

  // Light
  { id: 'holy_guardian', name: 'Holy Guardian', rarity: 'common' },
  { id: 'light_bearer', name: 'Light Bearer', rarity: 'common' },
  { id: 'paladin', name: 'Paladin', rarity: 'uncommon' },
  { id: 'holy_smite', name: 'Holy Smite', rarity: 'rare' },
  { id: 'arcane_wizard', name: 'Arcane Wizard', rarity: 'epic' },
  { id: 'celestial_angel', name: 'Celestial Angel', rarity: 'legendary' }
]
