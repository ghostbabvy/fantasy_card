import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import CollectionPage from './pages/CollectionPage'
import ShopPage from './pages/ShopPage'
import BattlePage from './pages/BattlePage'
import CraftingPage from './pages/CraftingPage'
import DeckBuilderPage from './pages/DeckBuilderPage'
import ChallengePage from './pages/ChallengePage'
import HelpPage from './pages/HelpPage'
import StatsPage from './pages/StatsPage'
import AchievementsPage from './pages/AchievementsPage'
import DailySpinPage from './pages/DailySpinPage'
import BossRushPage from './pages/BossRushPage'
import DraftModePage from './pages/DraftModePage'
import PlayPage from './pages/PlayPage'
import ProfilePage from './pages/ProfilePage'
import SocialPage from './pages/SocialPage'

function App() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/decks" element={<DeckBuilderPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/crafting" element={<CraftingPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/boss-rush" element={<BossRushPage />} />
          <Route path="/draft" element={<DraftModePage />} />
          <Route path="/daily-spin" element={<DailySpinPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
