import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import CollectionPage from './pages/CollectionPage'
import ShopPage from './pages/ShopPage'
import BattlePage from './pages/BattlePage'
import CraftingPage from './pages/CraftingPage'

function App() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/crafting" element={<CraftingPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
