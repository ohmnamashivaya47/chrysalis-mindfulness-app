import Friends from '../components/meditation/Friends'
import ErrorBoundary from '../components/ErrorBoundary'

export const FriendsPage = () => {
  return (
    <ErrorBoundary>
      <Friends />
    </ErrorBoundary>
  )
}
