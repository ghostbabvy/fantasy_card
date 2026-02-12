import { useGameStore } from '../stores/gameStore'
import { authApi } from './api'

// Keys that are data (not action functions) in the game store
const STATE_KEYS = [
  'playerName', 'playerBio', 'profilePicture', 'level', 'xp',
  'coins', 'dust', 'collection', 'decks', 'pityCounter',
  'freePackTimer', 'freePacksAvailable', 'lastLoginDate', 'loginStreak',
  'dailyRewards', 'hasClaimedTodayLogin', 'missions', 'lastMissionReset',
  'stats', 'favoriteCards', 'achievements', 'unlockedTitles', 'selectedTitle',
  'challengeProgress', 'unlockedCardBacks', 'selectedCardBack',
  'unlockedArenas', 'selectedArena'
] as const

let unsubscribe: (() => void) | null = null
let saveTimeout: ReturnType<typeof setTimeout> | null = null
let isSaving = false

function getStateData(): Record<string, unknown> {
  const fullState = useGameStore.getState()
  const data: Record<string, unknown> = {}
  for (const key of STATE_KEYS) {
    data[key] = (fullState as any)[key]
  }
  return data
}

async function doSave() {
  if (isSaving || !authApi.isLoggedIn()) return
  isSaving = true
  try {
    const data = getStateData()
    await authApi.saveGameState(data)
  } catch (e) {
    console.error('Auto-save failed:', e)
  } finally {
    isSaving = false
  }
}

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    doSave()
  }, 5000)
}

/** Save immediately (no debounce). Used before logout or tab close. */
export async function saveNow(): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
  await doSave()
}

/** Load game state from server and apply to local store. */
export async function loadServerState(): Promise<void> {
  if (!authApi.isLoggedIn()) return

  try {
    const serverState = await authApi.loadGameState()
    if (!serverState || typeof serverState !== 'object') return

    // Only apply state keys that exist in server data
    const updates: Record<string, unknown> = {}
    for (const key of STATE_KEYS) {
      if (key in serverState) {
        updates[key] = (serverState as any)[key]
      }
    }

    if (Object.keys(updates).length > 0) {
      useGameStore.setState(updates)
    }
  } catch (e) {
    console.error('Failed to load server state:', e)
  }
}

/** Start auto-saving on store changes. */
export function startAutoSave() {
  stopAutoSave()
  unsubscribe = useGameStore.subscribe(() => {
    if (authApi.isLoggedIn()) {
      debouncedSave()
    }
  })
}

/** Stop auto-saving. */
export function stopAutoSave() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
}

/** Fire-and-forget save on tab close (best-effort). */
export function saveOnUnload() {
  if (!authApi.isLoggedIn()) return
  const token = authApi.getToken()
  if (!token) return

  const data = getStateData()
  try {
    fetch('https://fantasycard-production.up.railway.app/api/auth/game-state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
      keepalive: true
    })
  } catch {
    // Best effort — nothing we can do if it fails on unload
  }
}
