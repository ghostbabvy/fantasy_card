import express from 'express'
import cors from 'cors'
import { initDatabase } from './db/database.js'
import playerRoutes from './routes/player.js'
import shopRoutes from './routes/shop.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
initDatabase()

// Routes
app.use('/api/player', playerRoutes)
app.use('/api/shop', shopRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🎮 Fantasy Cards server running on port ${PORT}`)
})
