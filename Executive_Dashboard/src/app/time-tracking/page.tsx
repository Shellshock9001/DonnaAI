import { LayoutContent } from '@/shared/components/LayoutContent'
import { AuthGuard } from '@/shared/auth'
import { TimeTracking } from '@/features/time-tracking'

export default function TimeTrackingPage(): JSX.Element {
  return (
    <AuthGuard>
      <LayoutContent>
        <TimeTracking />
      </LayoutContent>
    </AuthGuard>
  )
}

