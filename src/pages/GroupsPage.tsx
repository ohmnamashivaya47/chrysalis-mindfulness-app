import { Groups } from '../components/meditation/Groups'
import ErrorBoundary from '../components/ErrorBoundary'

export const GroupsPage = () => {
  return (
    <ErrorBoundary>
      <Groups />
    </ErrorBoundary>
  )
}
