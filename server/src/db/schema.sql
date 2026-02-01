-- Fantasy Cards Database Schema

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Hero',
  coins INTEGER DEFAULT 500,
  dust INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  pity_counter INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Collection (cards owned by players)
CREATE TABLE IF NOT EXISTS collection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  card_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(player_id, card_id)
);

-- Decks
CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  cards TEXT NOT NULL,  -- JSON array of card IDs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Battle history
CREATE TABLE IF NOT EXISTS battles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  opponent_type TEXT DEFAULT 'ai',  -- 'ai' or 'player'
  result TEXT NOT NULL,  -- 'win' or 'loss'
  xp_earned INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(player_id, achievement_id)
);

-- Pack opening history
CREATE TABLE IF NOT EXISTS pack_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  pack_type TEXT NOT NULL,
  cards_received TEXT NOT NULL,  -- JSON array of card IDs
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collection_player ON collection(player_id);
CREATE INDEX IF NOT EXISTS idx_decks_player ON decks(player_id);
CREATE INDEX IF NOT EXISTS idx_battles_player ON battles(player_id);
CREATE INDEX IF NOT EXISTS idx_achievements_player ON achievements(player_id);
