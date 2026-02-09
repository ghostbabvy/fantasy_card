import express from 'express'
import cors from 'cors'
import { initDatabase } from './db/database.js'
import { initUsersDb } from './db/users.js'
import playerRoutes from './routes/player.js'
import shopRoutes from './routes/shop.js'
import authRoutes from './routes/auth.js'
import friendsRoutes from './routes/friends.js'
import leaderboardRoutes from './routes/leaderboard.js'
import giftsRoutes from './routes/gifts.js'
import chatRoutes from './routes/chat.js'
import tradingRoutes from './routes/trading.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '2mb' })) // Increased limit for profile pictures

// Initialize databases
initDatabase()
initUsersDb()

// Routes
app.use('/api/player', playerRoutes)
app.use('/api/shop', shopRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/friends', friendsRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/gifts', giftsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/trading', tradingRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🎮 Fantasy Cards server running on port ${PORT}`)
})
