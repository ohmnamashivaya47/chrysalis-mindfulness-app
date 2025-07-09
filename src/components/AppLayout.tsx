import { Routes, Route } from 'react-router-dom'
import { Header } from '../components/meditation/Header'
import { Navigation } from '../components/meditation/Navigation'
import { MeditatePage } from '../pages/MeditatePage'
import { LeaderboardPage } from '../pages/LeaderboardPage'
import { GroupsPage } from '../pages/GroupsPage'
import { FriendsPage } from '../pages/FriendsPage'
import { ProfilePage } from '../pages/ProfilePage'

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background-primary">
      <Header />
      
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<MeditatePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </main>

      <Navigation />
    </div>
  )
}
