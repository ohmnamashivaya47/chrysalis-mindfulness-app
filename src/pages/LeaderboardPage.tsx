import { Leaderboard } from '../components/meditation/Leaderboard'

export const LeaderboardPage = () => {
  return <Leaderboard refreshKey={Date.now()} />
}
