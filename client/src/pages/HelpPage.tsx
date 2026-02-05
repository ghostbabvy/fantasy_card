import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { elementColors, Element, elementAdvantages } from '../types'
import { ElementIcon } from '../components/ElementIcon'

type HelpSection = 'basics' | 'elements' | 'cards' | 'battle' | 'status' | 'challenge' | 'tips'

export default function HelpPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<HelpSection>('basics')

  const sections: { id: HelpSection; title: string; icon: string }[] = [
    { id: 'basics', title: 'Game Basics', icon: '📖' },
    { id: 'elements', title: 'Type Matchups', icon: '⚡' },
    { id: 'cards', title: 'Card Types', icon: '🃏' },
    { id: 'battle', title: 'Battle System', icon: '⚔️' },
    { id: 'status', title: 'Status Effects', icon: '✨' },
    { id: 'challenge', title: 'Challenge Mode', icon: '🏆' },
    { id: 'tips', title: 'Tips & Strategy', icon: '💡' },
  ]

  const elements: Element[] = ['fire', 'water', 'nature', 'earth', 'lightning', 'shadow', 'light', 'ice', 'normal']

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Help & Guide</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map(section => (
          <motion.button
            key={section.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              activeSection === section.id
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <span>{section.icon}</span>
            {section.title}
          </motion.button>
        ))}
      </div>

      {/* Content Area */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 rounded-2xl p-6"
      >
        {/* Game Basics */}
        {activeSection === 'basics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Game Basics</h2>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">🎯 Objective</h3>
                <p className="text-white/80">
                  Knock out your opponent's creatures! The first player to knock out 3 enemy creatures wins the battle.
                  In some boss fights, you need 4 knockouts to win.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">🃏 Building a Deck</h3>
                <p className="text-white/80">
                  Your deck must contain exactly 20 cards. You can have up to 2 copies of the same card.
                  Include a mix of creatures and spells for the best strategy!
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">⚡ Energy System</h3>
                <p className="text-white/80">
                  Energy is used to play cards and use attacks. You gain 1 max energy each turn (up to 10).
                  Your energy fully refills at the start of each turn.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">🏟️ The Battlefield</h3>
                <p className="text-white/80">
                  You have 1 Active slot (the fighting creature) and 3 Bench slots (backup creatures).
                  When your active creature is knocked out, promote one from your bench!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Type Matchups */}
        {activeSection === 'elements' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Type Matchups</h2>

            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-4">
              <p className="text-green-300 font-bold">
                ⚡ Super Effective attacks deal 50% MORE damage!
              </p>
            </div>

            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
              <p className="text-red-300 font-bold">
                ⚠️ Not Very Effective attacks deal 50% LESS damage!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {elements.map(element => {
                const strongAgainst = elementAdvantages[element]
                const weakAgainst = elements.find(e => elementAdvantages[e] === element)
                const color = elementColors[element] || '#888'

                return (
                  <div
                    key={element}
                    className="bg-white/5 rounded-xl p-4 border-l-4"
                    style={{ borderColor: color }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: element === 'fire' ? '#7f1d1d' : element === 'light' ? '#713f12' : element === 'ice' ? '#164e63' : element === 'lightning' ? '#713f12' : color }}
                      >
                        <ElementIcon element={element} size={24} />
                      </div>
                      <span className="font-bold text-lg capitalize">{element}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">Strong vs:</span>
                        <span className="capitalize font-bold" style={{ color: elementColors[strongAgainst] }}>
                          {strongAgainst}
                        </span>
                      </div>
                      {weakAgainst && (
                        <div className="flex items-center gap-2">
                          <span className="text-red-400">Weak vs:</span>
                          <span className="capitalize font-bold" style={{ color: elementColors[weakAgainst] }}>
                            {weakAgainst}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-white/5 rounded-xl p-4 mt-4">
              <h3 className="font-bold text-lg mb-2">Quick Reference</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>🔥 Fire → Nature</div>
                <div>💧 Water → Fire</div>
                <div>🌿 Nature → Earth</div>
                <div>🪨 Earth → Lightning</div>
                <div>⚡ Lightning → Water</div>
                <div>🌑 Shadow ↔ Light</div>
                <div>❄️ Ice → Nature</div>
              </div>
            </div>
          </div>
        )}

        {/* Card Types */}
        {activeSection === 'cards' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Card Types</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                <h3 className="font-bold text-xl mb-3">🐉 Creatures</h3>
                <ul className="space-y-2 text-white/80">
                  <li>• Have HP, attacks, and an element type</li>
                  <li>• Place in Active or Bench slots</li>
                  <li>• Use attacks to damage enemies</li>
                  <li>• Knocked out when HP reaches 0</li>
                  <li>• Can retreat back to hand (costs 2 energy)</li>
                </ul>
              </div>

              <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
                <h3 className="font-bold text-xl mb-3">✨ Spells</h3>
                <ul className="space-y-2 text-white/80">
                  <li>• One-time use effects</li>
                  <li>• Can heal, damage, or buff</li>
                  <li>• Played directly from hand</li>
                  <li>• Goes to graveyard after use</li>
                </ul>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-bold text-lg mb-3">Card Rarities</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="text-center p-2 rounded-lg bg-gray-500/30">
                  <div className="font-bold text-gray-300">Common</div>
                  <div className="text-xs text-white/60">Basic cards</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-500/30">
                  <div className="font-bold text-green-300">Uncommon</div>
                  <div className="text-xs text-white/60">Better stats</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-blue-500/30">
                  <div className="font-bold text-blue-300">Rare</div>
                  <div className="text-xs text-white/60">Strong cards</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-purple-500/30">
                  <div className="font-bold text-purple-300">Epic</div>
                  <div className="text-xs text-white/60">Powerful</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-yellow-500/30">
                  <div className="font-bold text-yellow-300">Legendary</div>
                  <div className="text-xs text-white/60">The best!</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Battle System */}
        {activeSection === 'battle' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Battle System</h2>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">🎲 Coin Flip</h3>
                <p className="text-white/80">
                  Each battle starts with a coin flip to decide who goes first.
                  Going first can be an advantage to set up your strategy!
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">📋 Turn Structure</h3>
                <ol className="list-decimal list-inside space-y-1 text-white/80">
                  <li>Draw a card (tap your deck)</li>
                  <li>Play creatures to Active/Bench</li>
                  <li>Use spells from your hand</li>
                  <li>Attack with your Active creature</li>
                  <li>End your turn</li>
                </ol>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">⚔️ Attacking</h3>
                <p className="text-white/80 mb-2">
                  Each creature has attacks with different damage and energy costs.
                  Some attacks have special effects like status conditions!
                </p>
                <p className="text-yellow-300 text-sm">
                  Tip: Check the type matchup indicator during battle for advantage/disadvantage!
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">🔄 Retreating</h3>
                <p className="text-white/80">
                  Spend 2 energy to retreat your Active creature back to your hand.
                  Then select a creature from your hand to become the new Active.
                  Great for switching to a creature with type advantage!
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">💀 Knockouts</h3>
                <p className="text-white/80">
                  When a creature's HP hits 0, it's knocked out!
                  First player to knock out 3 creatures wins (4 for some bosses).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Effects */}
        {activeSection === 'status' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Status Effects</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚡</span>
                  <h3 className="font-bold text-lg">Stun</h3>
                </div>
                <p className="text-white/80">Target skips their next attack. Very powerful for buying time!</p>
              </div>

              <div className="bg-green-600/20 border border-green-600/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🧪</span>
                  <h3 className="font-bold text-lg">Poison</h3>
                </div>
                <p className="text-white/80">Deals damage at the end of each turn. Stacks up over time!</p>
              </div>

              <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔥</span>
                  <h3 className="font-bold text-lg">Burn</h3>
                </div>
                <p className="text-white/80">Similar to poison - deals fire damage over time.</p>
              </div>

              <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🛡️</span>
                  <h3 className="font-bold text-lg">Shield</h3>
                </div>
                <p className="text-white/80">Blocks a set amount of damage. Great for protection!</p>
              </div>

              <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💔</span>
                  <h3 className="font-bold text-lg">Weaken</h3>
                </div>
                <p className="text-white/80">Reduces the target's damage output. Debuff your enemies!</p>
              </div>

              <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚡</span>
                  <h3 className="font-bold text-lg">Energy Gain</h3>
                </div>
                <p className="text-white/80">Some attacks give you bonus energy. Use it for more plays!</p>
              </div>
            </div>
          </div>
        )}

        {/* Challenge Mode */}
        {activeSection === 'challenge' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Challenge Mode</h2>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-lg mb-2">🏆 50 Levels of Challenge!</h3>
              <p className="text-white/80">
                Progress through 50 increasingly difficult levels with boss fights every 10 levels.
                Earn exclusive rewards and prove your mastery!
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">⭐ Star Ratings</h3>
                <div className="space-y-2 text-white/80">
                  <div className="flex items-center gap-2">
                    <span>⭐⭐⭐</span>
                    <span>3 Stars - Perfect victory (0 cards knocked out)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⭐⭐</span>
                    <span>2 Stars - Good victory (1 card knocked out)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⭐</span>
                    <span>1 Star - Close victory (2+ cards knocked out)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">📊 Difficulty Tiers</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="bg-slate-400/30 p-2 rounded-lg text-center">
                    <div className="font-bold">Beginner</div>
                    <div className="text-xs text-white/60">Levels 1-9</div>
                  </div>
                  <div className="bg-sky-400/30 p-2 rounded-lg text-center">
                    <div className="font-bold">Intermediate</div>
                    <div className="text-xs text-white/60">Levels 11-19</div>
                  </div>
                  <div className="bg-violet-400/30 p-2 rounded-lg text-center">
                    <div className="font-bold">Advanced</div>
                    <div className="text-xs text-white/60">Levels 21-29</div>
                  </div>
                  <div className="bg-rose-400/30 p-2 rounded-lg text-center">
                    <div className="font-bold">Expert</div>
                    <div className="text-xs text-white/60">Levels 31-39</div>
                  </div>
                  <div className="bg-amber-400/30 p-2 rounded-lg text-center">
                    <div className="font-bold">Master</div>
                    <div className="text-xs text-white/60">Levels 41-49</div>
                  </div>
                  <div className="bg-green-700/30 p-2 rounded-lg text-center">
                    <div className="font-bold">Boss Fights</div>
                    <div className="text-xs text-white/60">Every 10 levels</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">🎁 Rewards</h3>
                <ul className="space-y-1 text-white/80">
                  <li>• Coins and XP for every victory</li>
                  <li>• Dust for crafting new cards</li>
                  <li>• Card packs from boss victories</li>
                  <li>• Exclusive boss cards you can't get anywhere else!</li>
                  <li>• Replay levels for 25% rewards</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tips & Strategy */}
        {activeSection === 'tips' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Tips & Strategy</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">✅ Do This</h3>
                <ul className="space-y-2 text-white/80">
                  <li>• Build a balanced deck with different elements</li>
                  <li>• Use type advantages - 50% more damage!</li>
                  <li>• Retreat when at a type disadvantage</li>
                  <li>• Draw cards to find better matchups</li>
                  <li>• Use status effects on tough enemies</li>
                  <li>• Keep bench creatures ready</li>
                </ul>
              </div>

              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-2">❌ Avoid This</h3>
                <ul className="space-y-2 text-white/80">
                  <li>• Don't attack into type disadvantage</li>
                  <li>• Don't forget to draw cards!</li>
                  <li>• Don't waste energy on weak attacks</li>
                  <li>• Don't ignore status effects</li>
                  <li>• Don't put all your best cards in one deck</li>
                </ul>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-bold text-lg mb-2">🧠 Advanced Tips</h3>
              <ul className="space-y-2 text-white/80">
                <li>• <strong>Energy Management:</strong> Don't spend all your energy early - save some for retreating if needed.</li>
                <li>• <strong>Bench Setup:</strong> Keep different element types on your bench to counter any threat.</li>
                <li>• <strong>Status Stacking:</strong> Poison and burn damage adds up - use it on high HP enemies!</li>
                <li>• <strong>Card Advantage:</strong> Drawing more cards gives you more options. Don't skip draws!</li>
                <li>• <strong>Know Your Matchups:</strong> Memorize which elements beat which for quick decisions.</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4">
              <h3 className="font-bold text-lg mb-2">💎 Pro Tip</h3>
              <p className="text-white/80">
                In Challenge Mode, try to get 3 stars by taking no knockouts. This means using type advantages
                and retreating strategically. The star images show your mastery - aim for all happy stars!
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
